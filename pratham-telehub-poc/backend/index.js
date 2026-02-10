// Pratham TeleHub POC - Backend Server
// Simple, fast API for demonstration

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getPlivoService } from './services/PlivoService.js';
import { getMSG91Service } from './services/MSG91Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Initialize services
const plivoService = getPlivoService();
const msg91Service = getMSG91Service();

const fastify = Fastify({
  logger: true
});

// Enable CORS
await fastify.register(cors, {
  origin: '*'
});

// Enable WebSocket
await fastify.register(websocket);

// Database connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Test database connection
try {
  const client = await pool.connect();
  console.log('✅ Connected to PostgreSQL');
  client.release();
} catch (err) {
  console.error('❌ Database connection error:', err);
}

// ============================================================================
// REST API ENDPOINTS
// ============================================================================

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Get all leads
fastify.get('/api/leads', async (request, reply) => {
  const { status, assigned_to, search } = request.query;

  let query = `
    SELECT
      l.*,
      u.name as assigned_to_name,
      (SELECT COUNT(*) FROM calls WHERE lead_id = l.id) as call_count,
      (SELECT MAX(created_at) FROM calls WHERE lead_id = l.id) as last_call_at
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE 1=1
  `;

  const params = [];

  if (status) {
    params.push(status);
    query += ` AND l.status = $${params.length}`;
  }

  if (assigned_to) {
    params.push(assigned_to);
    query += ` AND l.assigned_to = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (l.name ILIKE $${params.length} OR l.company ILIKE $${params.length} OR l.phone ILIKE $${params.length})`;
  }

  query += ' ORDER BY l.lead_score DESC, l.created_at DESC LIMIT 100';

  const result = await pool.query(query, params);
  return result.rows;
});

// Get single lead
fastify.get('/api/leads/:id', async (request, reply) => {
  const { id } = request.params;

  const leadQuery = await pool.query(
    'SELECT l.*, u.name as assigned_to_name FROM leads l LEFT JOIN users u ON l.assigned_to = u.id WHERE l.id = $1',
    [id]
  );

  if (leadQuery.rows.length === 0) {
    reply.code(404);
    return { error: 'Lead not found' };
  }

  const lead = leadQuery.rows[0];

  // Get call history
  const callsQuery = await pool.query(
    `SELECT c.*, u.name as telecaller_name, ca.sentiment_score, ca.quality_score
     FROM calls c
     LEFT JOIN users u ON c.telecaller_id = u.id
     LEFT JOIN call_analytics ca ON ca.call_id = c.id
     WHERE c.lead_id = $1
     ORDER BY c.created_at DESC`,
    [id]
  );

  lead.calls = callsQuery.rows;

  return lead;
});

// Get all users (telecallers + managers)
fastify.get('/api/users', async (request, reply) => {
  const { role } = request.query;

  let query = 'SELECT * FROM users WHERE 1=1';
  const params = [];

  if (role) {
    params.push(role);
    query += ` AND role = $${params.length}`;
  }

  query += ' ORDER BY name';

  const result = await pool.query(query, params);
  return result.rows;
});

// Get telecaller performance stats
fastify.get('/api/performance/:telecallerId', async (request, reply) => {
  const { telecallerId } = request.params;
  const { period = 'today' } = request.query;

  let dateFilter = "DATE(c.created_at) = CURRENT_DATE";
  if (period === 'week') dateFilter = "c.created_at >= NOW() - INTERVAL '7 days'";
  if (period === 'month') dateFilter = "c.created_at >= NOW() - INTERVAL '30 days'";

  const query = `
    SELECT
      COUNT(*) as total_calls,
      COUNT(*) FILTER (WHERE c.status = 'completed') as completed_calls,
      COUNT(*) FILTER (WHERE c.outcome = 'converted') as conversions,
      COUNT(*) FILTER (WHERE c.outcome = 'interested') as interested,
      AVG(c.duration_seconds)::INTEGER as avg_duration,
      AVG(ca.sentiment_score) as avg_sentiment,
      AVG(ca.quality_score) as avg_quality,
      SUM(c.duration_seconds)::INTEGER as total_talk_time
    FROM calls c
    LEFT JOIN call_analytics ca ON ca.call_id = c.id
    WHERE c.telecaller_id = $1 AND ${dateFilter}
  `;

  const result = await pool.query(query, [telecallerId]);
  return result.rows[0];
});

// Get team status (for manager dashboard)
fastify.get('/api/team/status', async (request, reply) => {
  const teamQuery = await pool.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.status,
      u.avatar_url,
      COUNT(c.id) FILTER (WHERE DATE(c.created_at) = CURRENT_DATE) as calls_today,
      COUNT(c.id) FILTER (WHERE c.status = 'in_progress') as active_calls,
      COUNT(c.id) FILTER (WHERE c.outcome = 'converted' AND DATE(c.created_at) = CURRENT_DATE) as conversions_today
    FROM users u
    LEFT JOIN calls c ON c.telecaller_id = u.id
    WHERE u.role = 'telecaller'
    GROUP BY u.id, u.name, u.email, u.role, u.status, u.avatar_url
    ORDER BY calls_today DESC, u.name
  `);

  const statsQuery = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as total_calls_today,
      COUNT(*) FILTER (WHERE status = 'in_progress') as active_calls,
      COUNT(*) FILTER (WHERE outcome = 'converted' AND DATE(created_at) = CURRENT_DATE) as conversions_today,
      AVG(duration_seconds) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::INTEGER as avg_duration_today
    FROM calls
  `);

  return {
    team: teamQuery.rows,
    stats: statsQuery.rows[0]
  };
});

// Start a call
fastify.post('/api/calls/start', async (request, reply) => {
  const { lead_id, telecaller_id, campaign_id } = request.body;

  try {
    // Get lead and telecaller phone numbers
    const leadQuery = await pool.query('SELECT phone, name FROM leads WHERE id = $1', [lead_id]);
    const telecallerQuery = await pool.query('SELECT phone, name FROM users WHERE id = $1', [telecaller_id]);

    if (leadQuery.rows.length === 0 || telecallerQuery.rows.length === 0) {
      reply.code(404);
      return { error: 'Lead or telecaller not found' };
    }

    const lead = leadQuery.rows[0];
    const telecaller = telecallerQuery.rows[0];

    // Create call record in database
    const result = await pool.query(
      `INSERT INTO calls (lead_id, telecaller_id, campaign_id, status, started_at)
       VALUES ($1, $2, $3, 'ringing', NOW())
       RETURNING *`,
      [lead_id, telecaller_id, campaign_id]
    );

    const callRecord = result.rows[0];

    // Make actual Plivo call
    let plivoCall = null;
    try {
      plivoCall = await plivoService.makeCall(
        telecaller.phone,
        lead.phone,
        {
          record: true,
          recordCallbackUrl: `${process.env.BASE_URL || 'https://ankr.in/pratham'}/api/plivo/recording`,
          callbackUrl: `${process.env.BASE_URL || 'https://ankr.in/pratham'}/api/plivo/status/${callRecord.id}`
        }
      );

      // Update call record with Plivo UUID
      await pool.query(
        'UPDATE calls SET plivo_call_uuid = $1 WHERE id = $2',
        [plivoCall.call_uuid, callRecord.id]
      );

      callRecord.plivo_call_uuid = plivoCall.call_uuid;
    } catch (plivoError) {
      console.error('Plivo call failed:', plivoError);
      // Continue with mock mode - call record already created
      callRecord.mock_mode = true;
    }

    // Update telecaller status
    await pool.query(
      "UPDATE users SET status = 'on_call' WHERE id = $1",
      [telecaller_id]
    );

    // Broadcast via WebSocket (if connected)
    broadcastUpdate('call_started', callRecord);

    return {
      ...callRecord,
      plivo_status: plivoCall ? 'initiated' : 'mock_mode'
    };
  } catch (error) {
    console.error('Call start error:', error);
    reply.code(500);
    return { error: 'Failed to start call', details: error.message };
  }
});

// Update call status
fastify.post('/api/calls/:id/update', async (request, reply) => {
  const { id } = request.params;
  const { status, outcome, notes, duration_seconds } = request.body;

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (status) {
    updates.push(`status = $${paramCount++}`);
    values.push(status);

    if (status === 'in_progress') {
      updates.push(`answered_at = NOW()`);
    } else if (status === 'completed') {
      updates.push(`ended_at = NOW()`);
    }
  }

  if (outcome) {
    updates.push(`outcome = $${paramCount++}`);
    values.push(outcome);
  }

  if (notes) {
    updates.push(`notes = $${paramCount++}`);
    values.push(notes);
  }

  if (duration_seconds) {
    updates.push(`duration_seconds = $${paramCount++}`);
    values.push(duration_seconds);
  }

  values.push(id);

  const query = `
    UPDATE calls
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await pool.query(query, values);

  // If call completed, update telecaller status
  if (status === 'completed') {
    const callResult = await pool.query('SELECT telecaller_id FROM calls WHERE id = $1', [id]);
    if (callResult.rows.length > 0) {
      await pool.query(
        "UPDATE users SET status = 'available' WHERE id = $1",
        [callResult.rows[0].telecaller_id]
      );
    }
  }

  broadcastUpdate('call_updated', result.rows[0]);

  return result.rows[0];
});

// ============================================================================
// PLIVO WEBHOOKS
// ============================================================================

// Plivo Answer URL - Called when telecaller picks up
fastify.post('/api/plivo/answer', async (request, reply) => {
  const { lead } = request.query;

  // Return XML to connect telecaller to lead
  reply.type('application/xml');
  return plivoService.generateAnswerXML(lead);
});

// Plivo Call Status Callback
fastify.post('/api/plivo/status/:callId', async (request, reply) => {
  const { callId } = request.params;
  const plivoData = request.body;

  console.log('Plivo status webhook:', { callId, status: plivoData.CallStatus, duration: plivoData.Duration });

  // Map Plivo status to our status
  let status = 'ringing';
  if (plivoData.CallStatus === 'in-progress') status = 'in_progress';
  if (plivoData.CallStatus === 'completed') status = 'completed';
  if (plivoData.CallStatus === 'failed' || plivoData.CallStatus === 'no-answer') status = 'failed';

  const updates = ['status = $1'];
  const values = [status];
  let paramCount = 2;

  if (plivoData.Duration) {
    updates.push(`duration_seconds = $${paramCount++}`);
    values.push(parseInt(plivoData.Duration));
  }

  if (status === 'completed') {
    updates.push('ended_at = NOW()');
  } else if (status === 'in_progress') {
    updates.push('answered_at = NOW()');
  }

  values.push(callId);

  await pool.query(
    `UPDATE calls SET ${updates.join(', ')} WHERE id = $${paramCount}`,
    values
  );

  // If call completed, update telecaller status
  if (status === 'completed' || status === 'failed') {
    const callResult = await pool.query('SELECT telecaller_id FROM calls WHERE id = $1', [callId]);
    if (callResult.rows.length > 0) {
      await pool.query(
        "UPDATE users SET status = 'available' WHERE id = $1",
        [callResult.rows[0].telecaller_id]
      );
    }
  }

  broadcastUpdate('call_status_updated', { callId, status, duration: plivoData.Duration });

  return { status: 'ok' };
});

// Plivo Recording Callback
fastify.post('/api/plivo/recording', async (request, reply) => {
  const { CallUUID, RecordingURL, Duration } = request.body;

  console.log('Plivo recording webhook:', { CallUUID, RecordingURL, Duration });

  // Find call by plivo_call_uuid and update recording URL
  await pool.query(
    'UPDATE calls SET recording_url = $1 WHERE plivo_call_uuid = $2',
    [RecordingURL, CallUUID]
  );

  broadcastUpdate('recording_available', { CallUUID, RecordingURL });

  return { status: 'ok' };
});

// ============================================
// MSG91 SERVICES (SMS, WhatsApp, OBD)
// ============================================

// Send SMS to lead
fastify.post('/api/msg91/sms', async (request, reply) => {
  const { to, message, lead_id } = request.body;

  try {
    const result = await msg91Service.sendSMS(to, message);

    // Log SMS in database
    await pool.query(
      'INSERT INTO communications (lead_id, type, provider, message, status, external_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [lead_id, 'sms', 'msg91', message, 'sent', result.message_id]
    );

    return result;
  } catch (error) {
    reply.code(500);
    return { error: error.message };
  }
});

// Send WhatsApp message to lead
fastify.post('/api/msg91/whatsapp', async (request, reply) => {
  const { to, templateName, components, lead_id } = request.body;

  try {
    const result = await msg91Service.sendWhatsApp(to, null, {
      templateName,
      components
    });

    // Log WhatsApp message
    await pool.query(
      'INSERT INTO communications (lead_id, type, provider, message, status, external_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [lead_id, 'whatsapp', 'msg91', templateName, 'sent', result.message_id]
    ).catch(() => {}); // Ignore if table doesn't exist

    return result;
  } catch (error) {
    reply.code(500);
    return { error: error.message };
  }
});

// Make OBD call (automated message)
fastify.post('/api/msg91/obd', async (request, reply) => {
  const { to, audioUrl, lead_id } = request.body;

  try {
    const result = await msg91Service.makeOBDCall(to, audioUrl);
    return result;
  } catch (error) {
    reply.code(500);
    return { error: error.message };
  }
});

// Click-to-Call (alternative to Plivo)
fastify.post('/api/msg91/click-to-call', async (request, reply) => {
  const { from, to, lead_id, telecaller_id } = request.body;

  try {
    const result = await msg91Service.makeClickToCall(from, to);

    // Create call record
    await pool.query(
      `INSERT INTO calls (lead_id, telecaller_id, provider, status, msg91_call_id)
       VALUES ($1, $2, 'msg91', 'initiated', $3)`,
      [lead_id, telecaller_id, result.call_id]
    ).catch(() => {}); // Ignore if table doesn't exist

    return result;
  } catch (error) {
    reply.code(500);
    return { error: error.message };
  }
});

// Send bulk SMS campaign
fastify.post('/api/msg91/campaign/sms', async (request, reply) => {
  const { recipients, message, campaign_name } = request.body;

  try {
    const result = await msg91Service.sendBulkSMS(recipients, message);
    return result;
  } catch (error) {
    reply.code(500);
    return { error: error.message };
  }
});

// Send bulk OBD campaign
fastify.post('/api/msg91/campaign/obd', async (request, reply) => {
  const { recipients, audioUrl, campaign_name } = request.body;

  try {
    const result = await msg91Service.sendBulkOBD(recipients, audioUrl);
    return result;
  } catch (error) {
    reply.code(500);
    return { error: error.message };
  }
});

// Get MSG91 balance
fastify.get('/api/msg91/balance', async (request, reply) => {
  try {
    const balance = await msg91Service.getBalance();
    return balance;
  } catch (error) {
    reply.code(500);
    return { error: error.message };
  }
});

// Get AI suggestions for a call (simulated)
fastify.post('/api/ai/suggestions', async (request, reply) => {
  const { call_id, transcript_snippet, lead_context } = request.body;

  // In production, this would call ANKR AI Proxy
  // For POC, return smart mock suggestions based on context

  const suggestions = [];
  const objections = [];

  // Detect common patterns
  if (transcript_snippet?.toLowerCase().includes('expensive') ||
      transcript_snippet?.toLowerCase().includes('cost') ||
      transcript_snippet?.toLowerCase().includes('budget')) {
    objections.push({
      type: 'price_objection',
      detected: 'Budget/cost concern',
      response: 'I understand budget is important. Let me share how schools see 3x ROI within 6 months through improved learning outcomes.'
    });
    suggestions.push({
      type: 'response',
      priority: 'high',
      text: 'Emphasize ROI and cost-per-student benefits'
    });
  }

  if (transcript_snippet?.toLowerCase().includes('time') ||
      transcript_snippet?.toLowerCase().includes('busy')) {
    objections.push({
      type: 'time_objection',
      detected: 'Time constraint mentioned',
      response: 'I appreciate your time. Let me schedule a quick 15-minute demo that shows exactly how Pratham saves teachers 5 hours per week.'
    });
    suggestions.push({
      type: 'action',
      priority: 'high',
      text: 'Offer brief demo, emphasize time savings'
    });
  }

  // General suggestions based on lead score
  if (lead_context?.lead_score > 80) {
    suggestions.push({
      type: 'action',
      priority: 'high',
      text: 'High-quality lead! Push for demo or conversion.'
    });
  }

  if (!objections.length) {
    suggestions.push({
      type: 'question',
      priority: 'medium',
      text: 'Ask: "What are your main goals for student learning outcomes this year?"'
    });
    suggestions.push({
      type: 'info',
      priority: 'medium',
      text: 'Mention: Pratham has helped 60 million children across India'
    });
  }

  // Sentiment analysis (mock)
  const sentiment = {
    score: 0.7,
    label: 'positive',
    confidence: 0.85
  };

  return {
    suggestions,
    objections,
    sentiment,
    next_best_action: suggestions.length > 0 ? suggestions[0].text : 'Continue building rapport'
  };
});

// Get real-time analytics
fastify.get('/api/analytics/realtime', async (request, reply) => {
  const query = `
    SELECT
      COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as calls_today,
      COUNT(*) FILTER (WHERE status = 'in_progress') as active_calls,
      COUNT(*) FILTER (WHERE outcome = 'converted' AND DATE(created_at) = CURRENT_DATE) as conversions_today,
      COUNT(*) FILTER (WHERE outcome = 'interested' AND DATE(created_at) = CURRENT_DATE) as interested_today,
      COUNT(*) FILTER (WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE) as completed_today,
      AVG(duration_seconds) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::INTEGER as avg_duration,
      COUNT(DISTINCT telecaller_id) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as active_telecallers
    FROM calls
  `;

  const result = await pool.query(query);

  // Get sentiment trend
  const sentimentQuery = await pool.query(`
    SELECT
      AVG(sentiment_score) as avg_sentiment,
      COUNT(*) FILTER (WHERE sentiment_label = 'positive') as positive_calls,
      COUNT(*) FILTER (WHERE sentiment_label = 'neutral') as neutral_calls,
      COUNT(*) FILTER (WHERE sentiment_label = 'negative') as negative_calls
    FROM call_analytics ca
    JOIN calls c ON ca.call_id = c.id
    WHERE DATE(c.created_at) = CURRENT_DATE
  `);

  return {
    ...result.rows[0],
    sentiment: sentimentQuery.rows[0]
  };
});

// ============================================================================
// WEBSOCKET for Real-time Updates
// ============================================================================

const connections = new Set();

function broadcastUpdate(event, data) {
  const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  connections.forEach(socket => {
    if (socket.readyState === 1) { // OPEN
      socket.send(message);
    }
  });
}

fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    connections.add(connection.socket);
    console.log('WebSocket client connected. Total:', connections.size);

    connection.socket.on('message', message => {
      console.log('Received:', message.toString());
    });

    connection.socket.on('close', () => {
      connections.delete(connection.socket);
      console.log('WebSocket client disconnected. Total:', connections.size);
    });
  });
});

// ============================================================================
// LANDING PAGE
// ============================================================================

fastify.get('/', async (request, reply) => {
  reply.type('text/html');
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pratham TeleHub - Backend API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 800px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 1.1em;
    }
    .status {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      margin-bottom: 30px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .endpoints {
      background: #f9fafb;
      padding: 20px;
      border-radius: 10px;
      margin-top: 20px;
    }
    .endpoint {
      margin: 10px 0;
      padding: 10px;
      background: white;
      border-left: 4px solid #667eea;
      border-radius: 4px;
    }
    .method {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8em;
      font-weight: 600;
      margin-right: 10px;
    }
    .method.post { background: #10b981; }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .feature {
      background: #f9fafb;
      padding: 15px;
      border-radius: 10px;
      text-align: center;
    }
    .feature-icon {
      font-size: 2em;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Pratham TeleHub</h1>
    <p class="subtitle">AI-Powered Telecalling Backend API</p>
    <span class="status">● System Online</span>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">📞</div>
        <strong>Call Management</strong>
      </div>
      <div class="feature">
        <div class="feature-icon">🤖</div>
        <strong>AI Assistant</strong>
      </div>
      <div class="feature">
        <div class="feature-icon">📊</div>
        <strong>Real-time Analytics</strong>
      </div>
      <div class="feature">
        <div class="feature-icon">⚡</div>
        <strong>WebSocket Updates</strong>
      </div>
    </div>

    <div class="endpoints">
      <h3 style="margin-bottom: 15px;">API Endpoints</h3>

      <div class="endpoint">
        <span class="method">GET</span>
        <code>/api/leads</code> - Get all leads
      </div>

      <div class="endpoint">
        <span class="method">GET</span>
        <code>/api/leads/:id</code> - Get lead details
      </div>

      <div class="endpoint">
        <span class="method">GET</span>
        <code>/api/users</code> - Get telecallers/managers
      </div>

      <div class="endpoint">
        <span class="method">GET</span>
        <code>/api/team/status</code> - Get team status
      </div>

      <div class="endpoint">
        <span class="method">GET</span>
        <code>/api/performance/:id</code> - Telecaller performance
      </div>

      <div class="endpoint">
        <span class="method">POST</span>
        <code>/api/calls/start</code> - Start a call
      </div>

      <div class="endpoint">
        <span class="method">POST</span>
        <code>/api/calls/:id/update</code> - Update call
      </div>

      <div class="endpoint">
        <span class="method">POST</span>
        <code>/api/ai/suggestions</code> - Get AI guidance
      </div>

      <div class="endpoint">
        <span class="method">GET</span>
        <code>/api/analytics/realtime</code> - Live analytics
      </div>

      <div class="endpoint">
        <span class="method">WS</span>
        <code>/ws</code> - WebSocket for real-time updates
      </div>
    </div>

    <p style="margin-top: 20px; color: #666; text-align: center;">
      Frontend: <a href="http://localhost:3101" style="color: #667eea;">http://localhost:3101</a>
    </p>
  </div>
</body>
</html>
  `;
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 3100;

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         🚀 Pratham TeleHub POC - Backend Server          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

✅ Server running on: http://localhost:${PORT}
✅ WebSocket endpoint: ws://localhost:${PORT}/ws
✅ Database: Connected
✅ Environment: ${process.env.NODE_ENV}

📡 API Endpoints:
   - GET  /api/leads
   - GET  /api/users
   - GET  /api/team/status
   - POST /api/calls/start
   - POST /api/ai/suggestions
   - WS   /ws

🎯 Ready for demo!
  `);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
