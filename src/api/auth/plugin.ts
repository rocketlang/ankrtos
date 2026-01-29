/**
 * Fastify Auth Plugin — JWT extraction and request decoration
 *
 * Register with: app.register(authPlugin, { authConfig: { ... } })
 */

import type { FastifyInstance, FastifyRequest, FastifyPluginAsync } from 'fastify';
import type { AuthConfig, AuthContext } from './types';
import { verifyJWT } from './jwt';

declare module 'fastify' {
  interface FastifyRequest {
    authContext?: AuthContext;
  }
}

const authPlugin: FastifyPluginAsync<{ authConfig: AuthConfig }> = async (
  app: FastifyInstance,
  opts,
) => {
  const config = opts.authConfig;

  app.decorateRequest('authContext', undefined);

  app.addHook('preHandler', async (request: FastifyRequest) => {
    if (!config.enabled) {
      request.authContext = {
        user: undefined,
        tenantId: (request.headers['x-tenant-id'] as string) ?? 'default',
        isAuthenticated: false,
      };
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      request.authContext = {
        user: undefined,
        tenantId: (request.headers['x-tenant-id'] as string) ?? 'default',
        isAuthenticated: false,
      };
      return;
    }

    const token = authHeader.slice(7);
    const user = verifyJWT(token, config);

    request.authContext = {
      user: user ?? undefined,
      tenantId: user?.tenantId ?? (request.headers['x-tenant-id'] as string) ?? 'default',
      isAuthenticated: !!user,
    };
  });
};

export default authPlugin;
