/**
 * ANKR-EON Agent Dashboard API
 * Provides endpoints for agent monitoring, memory inspection, and note exploration
 * Integrates with ankr-pulse frontend
 */

import { PrismaClient } from '@prisma/client';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import websocket from '@fastify/websocket';

const prisma = new PrismaClient();

// Types
interface AgentStats {
  domain: string;
  totalSessions: number;
  totalScopes: number;
  totalArtifacts: number;
  successRate: number;
  avgCompletionTime: number;
  hindsightCount: number;
  resolvedCount: number;
}

interface LiveEvent {
  timestamp: string;
  agent: string;
  action: string;
  status: 'success' | 'error' | 'pending';
  details?: any;
}

// Store active WebSocket connections
const wsClients: Set<any> = new Set();

/**
 * Broadcast event to all connected clients
 */
export function broadcastAgentEvent(event: LiveEvent) {
  const message = JSON.stringify(event);
  wsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

/**
 * Register all agent dashboard routes
 */
export async function registerAgentDashboardRoutes(app: FastifyInstance) {
  
  // Register WebSocket support
  await app.register(websocket);

  // ============================================================================
  // AGENT CONFIGURATION ENDPOINTS
  // ============================================================================

  /**
   * GET /api/agents - List all agent configurations
   */
  app.get('/api/agents', async (req: FastifyRequest, reply: FastifyReply) => {
    const agents = await prisma.agentConfig.findMany({
      orderBy: [{ active: 'desc' }, { score: 'desc' }, { createdAt: 'desc' }]
    });

    // Group by domain
    const byDomain = agents.reduce((acc, agent) => {
      if (!acc[agent.domain]) acc[agent.domain] = [];
      acc[agent.domain].push(agent);
      return acc;
    }, {} as Record<string, typeof agents>);

    return {
      total: agents.length,
      active: agents.filter(a => a.active).length,
      byDomain,
      agents
    };
  });

  /**
   * GET /api/agents/:domain - Get agent config for a domain
   */
  app.get('/api/agents/:domain', async (req: FastifyRequest, reply: FastifyReply) => {
    const { domain } = req.params as { domain: string };
    
    const activeConfig = await prisma.agentConfig.findFirst({
      where: { domain, active: true }
    });

    const allConfigs = await prisma.agentConfig.findMany({
      where: { domain },
      orderBy: { generation: 'desc' },
      take: 10
    });

    return {
      active: activeConfig,
      history: allConfigs,
      domain
    };
  });

  /**
   * GET /api/agents/:domain/stats - Get performance stats for a domain
   */
  app.get('/api/agents/:domain/stats', async (req: FastifyRequest, reply: FastifyReply) => {
    const { domain } = req.params as { domain: string };

    // Get active config
    const config = await prisma.agentConfig.findFirst({
      where: { domain, active: true }
    });

    // Count scopes for this domain (from sessions)
    const scopeCount = await prisma.memoryScope.count();
    
    // Count artifacts
    const artifactCount = await prisma.scopeArtifact.count();

    // Count hindsight notes for this domain
    const hindsightStats = await prisma.hindsightNote.groupBy({
      by: ['resolutionStatus'],
      where: { domain },
      _count: true
    });

    // Count notes for this domain
    const noteCount = await prisma.note.count({
      where: { domain }
    });

    // Calculate stats
    const hindsightTotal = hindsightStats.reduce((sum, s) => sum + s._count, 0);
    const resolvedCount = hindsightStats.find(s => s.resolutionStatus === 'resolved')?._count || 0;

    const stats: AgentStats = {
      domain,
      totalSessions: scopeCount, // Approximate
      totalScopes: scopeCount,
      totalArtifacts: artifactCount,
      successRate: hindsightTotal > 0 ? (resolvedCount / hindsightTotal) * 100 : 100,
      avgCompletionTime: 0, // Would need to track this
      hindsightCount: hindsightTotal,
      resolvedCount
    };

    return {
      config,
      stats,
      noteCount
    };
  });

  /**
   * POST /api/agents - Create new agent config
   */
  app.post('/api/agents', async (req: FastifyRequest, reply: FastifyReply) => {
    const { name, version, domain, config, active } = req.body as any;

    // If setting as active, deactivate others in same domain
    if (active) {
      await prisma.agentConfig.updateMany({
        where: { domain, active: true },
        data: { active: false }
      });
    }

    const newConfig = await prisma.agentConfig.create({
      data: {
        name,
        version,
        domain,
        config,
        active: active || false,
        generation: 0
      }
    });

    broadcastAgentEvent({
      timestamp: new Date().toISOString(),
      agent: domain,
      action: `New config created: ${name} v${version}`,
      status: 'success'
    });

    return newConfig;
  });

  /**
   * PUT /api/agents/:id/activate - Activate a config
   */
  app.put('/api/agents/:id/activate', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };

    const config = await prisma.agentConfig.findUnique({ where: { id } });
    if (!config) {
      return reply.status(404).send({ error: 'Config not found' });
    }

    // Deactivate others in same domain
    await prisma.agentConfig.updateMany({
      where: { domain: config.domain, active: true },
      data: { active: false }
    });

    // Activate this one
    const updated = await prisma.agentConfig.update({
      where: { id },
      data: { active: true }
    });

    broadcastAgentEvent({
      timestamp: new Date().toISOString(),
      agent: config.domain,
      action: `Activated config: ${config.name}`,
      status: 'success'
    });

    return updated;
  });

  // ============================================================================
  // MEMORY INSPECTION ENDPOINTS
  // ============================================================================

  /**
   * GET /api/memory/sessions - List recent sessions
   */
  app.get('/api/memory/sessions', async (req: FastifyRequest, reply: FastifyReply) => {
    const { limit = 20 } = req.query as { limit?: number };

    const sessions = await prisma.memoryScope.findMany({
      where: { scopeType: 'session' },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      include: {
        _count: {
          select: { children: true, artifacts: true }
        }
      }
    });

    return {
      total: sessions.length,
      sessions: sessions.map(s => ({
        ...s,
        taskCount: s._count.children,
        artifactCount: s._count.artifacts
      }))
    };
  });

  /**
   * GET /api/memory/:sessionId - Get full memory tree for a session
   */
  app.get('/api/memory/:sessionId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { sessionId } = req.params as { sessionId: string };

    // Get all scopes for this session
    const scopes = await prisma.memoryScope.findMany({
      where: { sessionId },
      include: {
        artifacts: {
          orderBy: { importanceScore: 'desc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Build tree structure
    const scopeMap = new Map(scopes.map(s => [s.id, { ...s, children: [] as any[] }]));
    const roots: any[] = [];

    scopes.forEach(scope => {
      const node = scopeMap.get(scope.id)!;
      if (scope.parentScopeId && scopeMap.has(scope.parentScopeId)) {
        scopeMap.get(scope.parentScopeId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Calculate stats
    const totalTokens = 0; // Would need to track
    const compressedCount = scopes.filter(s => s.compressed).length;

    return {
      sessionId,
      tree: roots,
      stats: {
        totalScopes: scopes.length,
        compressedScopes: compressedCount,
        compressionRate: scopes.length > 0 ? (compressedCount / scopes.length) * 100 : 0,
        totalArtifacts: scopes.reduce((sum, s) => sum + s.artifacts.length, 0)
      }
    };
  });

  /**
   * GET /api/memory/:sessionId/artifacts - Get artifacts for a session
   */
  app.get('/api/memory/:sessionId/artifacts', async (req: FastifyRequest, reply: FastifyReply) => {
    const { sessionId } = req.params as { sessionId: string };
    const { type } = req.query as { type?: string };

    const scopes = await prisma.memoryScope.findMany({
      where: { sessionId },
      select: { id: true }
    });

    const scopeIds = scopes.map(s => s.id);

    const artifacts = await prisma.scopeArtifact.findMany({
      where: {
        scopeId: { in: scopeIds },
        ...(type && { artifactType: type })
      },
      orderBy: [{ importanceScore: 'desc' }, { createdAt: 'desc' }],
      include: {
        scope: {
          select: { scopeType: true, summary: true }
        }
      }
    });

    // Group by type
    const byType = artifacts.reduce((acc, a) => {
      if (!acc[a.artifactType]) acc[a.artifactType] = [];
      acc[a.artifactType].push(a);
      return acc;
    }, {} as Record<string, typeof artifacts>);

    return {
      total: artifacts.length,
      byType,
      artifacts
    };
  });

  // ============================================================================
  // NOTE EXPLORATION ENDPOINTS
  // ============================================================================

  /**
   * GET /api/notes - List all notes
   */
  app.get('/api/notes', async (req: FastifyRequest, reply: FastifyReply) => {
    const { domain, tag, limit = 50 } = req.query as any;

    const notes = await prisma.note.findMany({
      where: {
        ...(domain && { domain }),
        ...(tag && { tags: { has: tag } })
      },
      orderBy: { updatedAt: 'desc' },
      take: Number(limit)
    });

    // Get all unique tags
    const allNotes = await prisma.note.findMany({ select: { tags: true } });
    const allTags = [...new Set(allNotes.flatMap(n => n.tags))];

    // Get all domains
    const domains = await prisma.note.groupBy({
      by: ['domain'],
      _count: true
    });

    return {
      total: notes.length,
      notes,
      filters: {
        tags: allTags,
        domains: domains.filter(d => d.domain).map(d => ({ domain: d.domain, count: d._count }))
      }
    };
  });

  /**
   * GET /api/notes/hindsight - List hindsight (failure) notes
   */
  app.get('/api/notes/hindsight', async (req: FastifyRequest, reply: FastifyReply) => {
    const { domain, errorType, status, limit = 50 } = req.query as any;

    const notes = await prisma.hindsightNote.findMany({
      where: {
        ...(domain && { domain }),
        ...(errorType && { errorType }),
        ...(status && { resolutionStatus: status })
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    // Get error type stats
    const errorStats = await prisma.hindsightNote.groupBy({
      by: ['errorType'],
      _count: true,
      orderBy: { _count: { errorType: 'desc' } }
    });

    // Get resolution stats
    const resolutionStats = await prisma.hindsightNote.groupBy({
      by: ['resolutionStatus'],
      _count: true
    });

    return {
      total: notes.length,
      notes,
      stats: {
        byErrorType: errorStats.map(e => ({ type: e.errorType, count: e._count })),
        byStatus: resolutionStats.map(r => ({ status: r.resolutionStatus, count: r._count }))
      }
    };
  });

  /**
   * GET /api/notes/:id - Get a specific note
   */
  app.get('/api/notes/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };

    // Try regular note first
    let note = await prisma.note.findUnique({ where: { id } });
    if (note) return { type: 'note', note };

    // Try hindsight note
    const hindsight = await prisma.hindsightNote.findUnique({ where: { id } });
    if (hindsight) return { type: 'hindsight', note: hindsight };

    return reply.status(404).send({ error: 'Note not found' });
  });

  /**
   * POST /api/notes - Create a new note
   */
  app.post('/api/notes', async (req: FastifyRequest, reply: FastifyReply) => {
    const { path, title, content, tags, domain } = req.body as any;

    const note = await prisma.note.create({
      data: {
        path,
        title,
        content,
        tags: tags || [],
        domain
      }
    });

    return note;
  });

  /**
   * POST /api/notes/hindsight - Create a hindsight note
   */
  app.post('/api/notes/hindsight', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as any;

    const note = await prisma.hindsightNote.create({
      data: {
        path: body.path,
        title: body.title,
        content: body.content,
        tags: body.tags || [],
        domain: body.domain,
        errorType: body.errorType,
        errorMessage: body.errorMessage,
        stackTrace: body.stackTrace,
        affectedComponents: body.affectedComponents || [],
        resolution: body.resolution,
        resolutionStatus: body.resolutionStatus || 'unknown'
      }
    });

    broadcastAgentEvent({
      timestamp: new Date().toISOString(),
      agent: body.domain || 'system',
      action: `Hindsight note created: ${body.errorType}`,
      status: 'error'
    });

    return note;
  });

  // ============================================================================
  // DASHBOARD SUMMARY ENDPOINTS
  // ============================================================================

  /**
   * GET /api/dashboard/summary - Get overall dashboard summary
   */
  app.get('/api/dashboard/summary', async (req: FastifyRequest, reply: FastifyReply) => {
    const [
      agentCount,
      activeAgents,
      scopeCount,
      artifactCount,
      noteCount,
      hindsightCount,
      recentHindsight
    ] = await Promise.all([
      prisma.agentConfig.count(),
      prisma.agentConfig.count({ where: { active: true } }),
      prisma.memoryScope.count(),
      prisma.scopeArtifact.count(),
      prisma.note.count(),
      prisma.hindsightNote.count(),
      prisma.hindsightNote.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, errorType: true, domain: true, createdAt: true }
      })
    ]);

    // Get domain breakdown
    const domainStats = await prisma.agentConfig.groupBy({
      by: ['domain'],
      _count: true
    });

    return {
      agents: {
        total: agentCount,
        active: activeAgents,
        byDomain: domainStats.map(d => ({ domain: d.domain, count: d._count }))
      },
      memory: {
        totalScopes: scopeCount,
        totalArtifacts: artifactCount
      },
      knowledge: {
        notes: noteCount,
        hindsight: hindsightCount,
        recentFailures: recentHindsight
      },
      health: {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    };
  });

  // ============================================================================
  // WEBSOCKET FOR LIVE UPDATES
  // ============================================================================

  /**
   * WS /ws/agents - Real-time agent activity stream
   */
  app.get('/ws/agents', { websocket: true }, (connection, req) => {
    wsClients.add(connection.socket);
    
    console.log('[WS] Client connected to agent stream');
    
    // Send welcome message
    connection.socket.send(JSON.stringify({
      type: 'connected',
      timestamp: new Date().toISOString(),
      message: 'Connected to ANKR-EON Agent Stream'
    }));

    connection.socket.on('close', () => {
      wsClients.delete(connection.socket);
      console.log('[WS] Client disconnected from agent stream');
    });
  });

  console.log('✅ Agent Dashboard API routes registered');
}

export default registerAgentDashboardRoutes;
