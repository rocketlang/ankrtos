"use strict";
/**
 * SWAYAM Learning Logger
 * Logs interactions, tool usage, and patterns to PostgreSQL for self-evolution
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.logLearningEvent = logLearningEvent;
exports.logToolUsage = logToolUsage;
exports.updatePattern = updatePattern;
exports.getAnalytics = getAnalytics;
exports.getTopPatterns = getTopPatterns;
exports.runDailyAggregation = runDailyAggregation;
const pg_1 = require("pg");
// Database connection
const pool = new pg_1.Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'ankr',
    password: process.env.PGPASSWORD || 'indrA@0612',
    database: process.env.PGDATABASE || 'ankr_eon',
    max: 5,
});
exports.pool = pool;
/**
 * Log a learning event
 */
async function logLearningEvent(event) {
    try {
        const result = await pool.query(`INSERT INTO learning_events
       (event_type, source, persona, session_id, user_id, data, outcome, duration_ms, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`, [
            event.type,
            event.source,
            event.persona || null,
            event.sessionId || null,
            event.userId || null,
            JSON.stringify(event.data),
            event.outcome || 'pending',
            event.durationMs || null,
            JSON.stringify(event.metadata || {}),
        ]);
        return result.rows[0]?.id || null;
    }
    catch (error) {
        console.error('Learning event log error:', error);
        return null;
    }
}
/**
 * Log tool usage
 */
async function logToolUsage(usage) {
    try {
        const result = await pool.query(`INSERT INTO tool_usage
       (tool_name, persona, session_id, params, result, success, duration_ms, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`, [
            usage.toolName,
            usage.persona || null,
            usage.sessionId || null,
            JSON.stringify(usage.params),
            usage.result ? JSON.stringify(usage.result) : null,
            usage.success,
            usage.durationMs || null,
            usage.errorMessage || null,
        ]);
        return result.rows[0]?.id || null;
    }
    catch (error) {
        console.error('Tool usage log error:', error);
        return null;
    }
}
/**
 * Update or create a learning pattern
 */
async function updatePattern(name, description, outcome, conditions = []) {
    try {
        await pool.query(`INSERT INTO learning_patterns (name, description, outcome, conditions, occurrences, confidence, last_seen)
       VALUES ($1, $2, $3, $4, 1, 0.5, NOW())
       ON CONFLICT (name) DO UPDATE SET
         occurrences = learning_patterns.occurrences + 1,
         confidence = LEAST(1.0, learning_patterns.confidence + 0.02),
         last_seen = NOW(),
         conditions = CASE
           WHEN jsonb_array_length(learning_patterns.conditions) < 10
           THEN learning_patterns.conditions || $4::jsonb
           ELSE learning_patterns.conditions
         END`, [name, description, JSON.stringify(outcome), JSON.stringify(conditions)]);
    }
    catch (error) {
        console.error('Pattern update error:', error);
    }
}
/**
 * Get analytics for a date range
 */
async function getAnalytics(startDate, endDate) {
    try {
        const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate || new Date();
        const [events, tools, patterns] = await Promise.all([
            pool.query(`SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE outcome = 'success') as successful,
           COUNT(DISTINCT session_id) as sessions,
           COUNT(DISTINCT persona) as personas
         FROM learning_events
         WHERE created_at BETWEEN $1 AND $2`, [start, end]),
            pool.query(`SELECT
           tool_name,
           COUNT(*) as calls,
           COUNT(*) FILTER (WHERE success = true) as successful,
           AVG(duration_ms) as avg_duration
         FROM tool_usage
         WHERE created_at BETWEEN $1 AND $2
         GROUP BY tool_name
         ORDER BY calls DESC
         LIMIT 10`, [start, end]),
            pool.query(`SELECT
           COUNT(*) as total,
           AVG(confidence) as avg_confidence,
           SUM(occurrences) as total_occurrences
         FROM learning_patterns`),
        ]);
        return {
            period: { start, end },
            events: events.rows[0],
            topTools: tools.rows,
            patterns: patterns.rows[0],
        };
    }
    catch (error) {
        console.error('Analytics error:', error);
        return null;
    }
}
/**
 * Get top patterns by confidence
 */
async function getTopPatterns(limit = 10) {
    try {
        const result = await pool.query(`SELECT name, description, confidence, occurrences, last_seen
       FROM learning_patterns
       ORDER BY confidence DESC, occurrences DESC
       LIMIT $1`, [limit]);
        return result.rows;
    }
    catch (error) {
        console.error('Get patterns error:', error);
        return [];
    }
}
/**
 * Run daily analytics aggregation
 */
async function runDailyAggregation() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Aggregate events
        const eventStats = await pool.query(`SELECT
         COUNT(*) as total_events,
         COUNT(DISTINCT session_id) as total_interactions
       FROM learning_events
       WHERE created_at >= $1 AND created_at < $2`, [today, tomorrow]);
        // Aggregate tool usage
        const toolStats = await pool.query(`SELECT
         COUNT(*) as tool_calls,
         COUNT(*) FILTER (WHERE success = true) as successful_tools,
         json_agg(json_build_object('tool', tool_name, 'calls', cnt) ORDER BY cnt DESC) as top_tools
       FROM (
         SELECT tool_name, COUNT(*) as cnt
         FROM tool_usage
         WHERE created_at >= $1 AND created_at < $2
         GROUP BY tool_name
         ORDER BY cnt DESC
         LIMIT 5
       ) t`, [today, tomorrow]);
        // Aggregate patterns
        const patternStats = await pool.query(`SELECT COUNT(*) as patterns_discovered, AVG(confidence) as avg_confidence
       FROM learning_patterns
       WHERE last_seen >= $1`, [today]);
        // Top personas
        const personaStats = await pool.query(`SELECT json_agg(json_build_object('persona', persona, 'count', cnt) ORDER BY cnt DESC) as top_personas
       FROM (
         SELECT persona, COUNT(*) as cnt
         FROM learning_events
         WHERE created_at >= $1 AND created_at < $2 AND persona IS NOT NULL
         GROUP BY persona
         ORDER BY cnt DESC
         LIMIT 5
       ) t`, [today, tomorrow]);
        // Upsert daily analytics
        await pool.query(`INSERT INTO learning_analytics
       (date, total_events, total_interactions, tool_calls, successful_tools,
        patterns_discovered, avg_confidence, top_tools, top_personas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (date) DO UPDATE SET
         total_events = EXCLUDED.total_events,
         total_interactions = EXCLUDED.total_interactions,
         tool_calls = EXCLUDED.tool_calls,
         successful_tools = EXCLUDED.successful_tools,
         patterns_discovered = EXCLUDED.patterns_discovered,
         avg_confidence = EXCLUDED.avg_confidence,
         top_tools = EXCLUDED.top_tools,
         top_personas = EXCLUDED.top_personas`, [
            today,
            eventStats.rows[0]?.total_events || 0,
            eventStats.rows[0]?.total_interactions || 0,
            toolStats.rows[0]?.tool_calls || 0,
            toolStats.rows[0]?.successful_tools || 0,
            patternStats.rows[0]?.patterns_discovered || 0,
            patternStats.rows[0]?.avg_confidence || 0,
            toolStats.rows[0]?.top_tools || '[]',
            personaStats.rows[0]?.top_personas || '[]',
        ]);
        console.log(`📊 Daily analytics aggregated for ${today.toISOString().split('T')[0]}`);
    }
    catch (error) {
        console.error('Daily aggregation error:', error);
    }
}
//# sourceMappingURL=logger.js.map