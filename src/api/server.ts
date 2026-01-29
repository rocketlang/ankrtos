// =============================================================================
// ankrICD - Fastify + Mercurius GraphQL Server
// =============================================================================
// Creates and configures the Fastify server with:
// - Mercurius GraphQL (queries, mutations, subscriptions)
// - CORS for cross-origin requests
// - WebSocket support for real-time subscriptions
// - Health check endpoint
// - Tenant context injection
// =============================================================================

import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import mercurius from 'mercurius';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';

import { typeDefs } from './schema/typeDefs';
import { resolvers } from './resolvers';
import { VERSION } from '../index';

// -----------------------------------------------------------------------------
// Server Configuration
// -----------------------------------------------------------------------------

export interface ICDServerOptions {
  port?: number;
  host?: string;
  logger?: boolean;
  cors?: {
    origin?: string | string[] | boolean;
    credentials?: boolean;
  };
  graphqlPath?: string;
  subscriptions?: boolean;
  /** Extract tenantId from request (header, JWT, etc.) */
  tenantExtractor?: (req: FastifyRequest) => string;
}

const DEFAULT_OPTIONS: Required<ICDServerOptions> = {
  port: 4070,
  host: '0.0.0.0',
  logger: true,
  cors: {
    origin: true,
    credentials: true,
  },
  graphqlPath: '/graphql',
  subscriptions: true,
  tenantExtractor: (req: FastifyRequest) => {
    // Default: extract from x-tenant-id header or fallback to 'default'
    const header = req.headers['x-tenant-id'];
    if (typeof header === 'string' && header.length > 0) return header;
    return 'default';
  },
};

// -----------------------------------------------------------------------------
// Build Server
// -----------------------------------------------------------------------------

export async function buildICDServer(
  opts: ICDServerOptions = {},
): Promise<FastifyInstance> {
  const options = { ...DEFAULT_OPTIONS, ...opts };

  const app = Fastify({
    logger: options.logger,
  });

  // -- CORS --
  await app.register(cors, {
    origin: options.cors?.origin ?? true,
    credentials: options.cors?.credentials ?? true,
  });

  // -- WebSocket (required for subscriptions) --
  if (options.subscriptions) {
    await app.register(websocket);
  }

  // -- Mercurius GraphQL --
  await app.register(mercurius, {
    schema: typeDefs,
    resolvers: resolvers as any,
    graphiql: true,
    path: options.graphqlPath,
    subscription: options.subscriptions
      ? {
          onConnect: () => ({ tenantId: 'default' }),
        }
      : false,
    context: (req: FastifyRequest) => ({
      tenantId: options.tenantExtractor(req),
    }),
  });

  // -- Health Check (REST) --
  app.get('/health', async () => ({
    status: 'healthy',
    version: VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // -- Ready Check (REST) --
  app.get('/ready', async () => ({
    ready: true,
    version: VERSION,
  }));

  // -- System Info (REST) --
  app.get('/info', async () => ({
    name: '@ankr/dodd-icd',
    version: VERSION,
    graphql: options.graphqlPath,
    graphiql: `${options.graphqlPath}/graphiql`,
    subscriptions: options.subscriptions,
    engines: [
      'facilities',
      'containers',
      'yard',
      'gate',
      'rail',
      'road',
      'waterfront',
      'equipment',
      'billing',
      'customs',
      'analytics',
    ],
  }));

  return app;
}

// -----------------------------------------------------------------------------
// Start Server (standalone)
// -----------------------------------------------------------------------------

export async function startICDServer(opts: ICDServerOptions = {}): Promise<FastifyInstance> {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const app = await buildICDServer(options);

  await app.listen({ port: options.port, host: options.host });
  app.log.info(`ankrICD GraphQL API running at http://${options.host}:${options.port}${options.graphqlPath}`);
  app.log.info(`GraphiQL IDE at http://${options.host}:${options.port}${options.graphqlPath}/graphiql`);
  if (options.subscriptions) {
    app.log.info(`WebSocket subscriptions at ws://${options.host}:${options.port}${options.graphqlPath}`);
  }

  return app;
}

// -- Run standalone when executed directly --
const isMainModule =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('/server.ts') || process.argv[1].endsWith('/server.js'));

if (isMainModule) {
  const port = parseInt(process.env.PORT ?? '4070', 10);
  const host = process.env.HOST ?? '0.0.0.0';

  startICDServer({ port, host }).catch((err) => {
    console.error('Failed to start ankrICD server:', err);
    process.exit(1);
  });
}
