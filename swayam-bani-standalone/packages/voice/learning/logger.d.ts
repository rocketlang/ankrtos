/**
 * SWAYAM Learning Logger
 * Logs interactions, tool usage, and patterns to PostgreSQL for self-evolution
 */
import { Pool } from 'pg';
declare const pool: Pool;
export interface LearningEventInput {
    type: string;
    source: string;
    persona?: string;
    sessionId?: string;
    userId?: string;
    data: Record<string, any>;
    outcome?: 'success' | 'failure' | 'pending';
    durationMs?: number;
    metadata?: Record<string, any>;
}
export interface ToolUsageInput {
    toolName: string;
    persona?: string;
    sessionId?: string;
    params: Record<string, any>;
    result?: any;
    success: boolean;
    durationMs?: number;
    errorMessage?: string;
}
/**
 * Log a learning event
 */
export declare function logLearningEvent(event: LearningEventInput): Promise<string | null>;
/**
 * Log tool usage
 */
export declare function logToolUsage(usage: ToolUsageInput): Promise<number | null>;
/**
 * Update or create a learning pattern
 */
export declare function updatePattern(name: string, description: string, outcome: any, conditions?: any[]): Promise<void>;
/**
 * Get analytics for a date range
 */
export declare function getAnalytics(startDate?: Date, endDate?: Date): Promise<any>;
/**
 * Get top patterns by confidence
 */
export declare function getTopPatterns(limit?: number): Promise<any[]>;
/**
 * Run daily analytics aggregation
 */
export declare function runDailyAggregation(): Promise<void>;
export { pool };
//# sourceMappingURL=logger.d.ts.map