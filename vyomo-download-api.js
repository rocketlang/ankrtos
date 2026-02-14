#!/usr/bin/env bun

/**
 * Vyomo Blackbox API - Secure Download Service
 * Hosts code on vyomo.in with authentication
 *
 * © 2026 ANKR Labs - PROPRIETARY
 */

const Fastify = require('fastify')
const jwt = require('@fastify/jwt')
const cors = require('@fastify/cors')
const { createReadStream, statSync } = require('fs')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

const server = Fastify({ logger: true })

// JWT Authentication
server.register(jwt, {
  secret: process.env.JWT_SECRET || 'CHANGE-THIS-IN-PRODUCTION-USE-ENV-VAR'
})

// CORS
server.register(cors, {
  origin: true,
  credentials: true
})

// ==========================================
// API KEYS - MANAGE CLIENT ACCESS
// ==========================================

const DOWNLOAD_KEYS = new Map([
  // Format: ['api-key', { name: 'Client Name', active: true }]
  ['vyomo-demo', { name: 'Demo Access', active: true }],
  ['vyomo-client-alpha', { name: 'Alpha Client', active: true }],
  ['vyomo-client-beta', { name: 'Beta Client', active: true }],

  // Add more clients here
  // ['vyomo-client-gamma', { name: 'Gamma Client', active: true }],
])

// ==========================================
// ROUTES
// ==========================================

/**
 * Health Check
 */
server.get('/health', async () => {
  return {
    status: 'ok',
    service: 'vyomo-download-api',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  }
})

/**
 * Authenticate and Get Download Token
 * POST /api/auth
 */
server.post('/api/auth', async (request, reply) => {
  const { apiKey } = request.body

  if (!apiKey) {
    reply.code(400).send({ error: 'API key required', field: 'apiKey' })
    return
  }

  if (!DOWNLOAD_KEYS.has(apiKey)) {
    server.log.warn({ apiKey }, 'Invalid API key attempt')
    reply.code(401).send({ error: 'Invalid API key' })
    return
  }

  const client = DOWNLOAD_KEYS.get(apiKey)

  if (!client.active) {
    server.log.warn({ apiKey, client: client.name }, 'Revoked API key attempt')
    reply.code(403).send({ error: 'API key has been revoked' })
    return
  }

  // Generate JWT token (valid for 1 hour)
  const token = server.jwt.sign(
    { apiKey, name: client.name },
    { expiresIn: '1h' }
  )

  server.log.info({ client: client.name }, 'Token issued')

  return {
    token,
    expiresIn: 3600,
    client: client.name,
    message: 'Use this token in Authorization header as: Bearer TOKEN'
  }
})

/**
 * Download Vyomo Blackbox API Archive
 * GET /api/download/vyomo-blackbox
 * Requires: Authorization: Bearer TOKEN
 */
server.get('/api/download/vyomo-blackbox', {
  onRequest: async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({ error: 'Invalid or expired token. Get a new token from /api/auth' })
    }
  }
}, async (request, reply) => {
  const archivePath = '/tmp/vyomo-blackbox.tar.gz'

  server.log.info({ client: request.user.name }, 'Creating archive...')

  // Create fresh archive (exclude node_modules and .git)
  try {
    await execAsync(
      `tar -czf ${archivePath} -C /root vyomo-algo-blackbox ` +
      `--exclude=node_modules --exclude=.git --exclude=bun.lock`
    )
  } catch (err) {
    server.log.error({ err }, 'Failed to create archive')
    reply.code(500).send({ error: 'Failed to create archive' })
    return
  }

  // Log download
  server.log.info({
    client: request.user.name,
    apiKey: request.user.apiKey,
    ip: request.ip
  }, 'Download initiated')

  // Send file
  const stat = statSync(archivePath)
  const stream = createReadStream(archivePath)

  reply
    .header('Content-Type', 'application/gzip')
    .header('Content-Disposition', 'attachment; filename="vyomo-blackbox.tar.gz"')
    .header('Content-Length', stat.size)
    .send(stream)
})

/**
 * One-Liner Install Script
 * GET /install/:apiKey
 * Returns bash script that can be piped to bash
 */
server.get('/install/:apiKey', async (request, reply) => {
  const { apiKey } = request.params

  if (!DOWNLOAD_KEYS.has(apiKey)) {
    reply.code(401).send('#!/bin/bash\necho "Error: Invalid API key"\nexit 1\n')
    return
  }

  const client = DOWNLOAD_KEYS.get(apiKey)

  if (!client.active) {
    reply.code(403).send('#!/bin/bash\necho "Error: API key has been revoked"\nexit 1\n')
    return
  }

  // Generate temporary token (5 minutes)
  const token = server.jwt.sign({ apiKey, name: client.name }, { expiresIn: '5m' })

  server.log.info({ client: client.name, ip: request.ip }, 'One-liner install requested')

  const baseUrl = process.env.BASE_URL || 'https://vyomo.in'

  const script = `#!/bin/bash

#############################################
# Vyomo Blackbox API - Secure Installer
# Client: ${client.name}
#############################################

set -e

GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

echo ""
echo -e "\${BLUE}🚀 Vyomo Blackbox API - Secure Installer\${NC}"
echo -e "Client: ${client.name}"
echo ""

TOKEN="${token}"
DOWNLOAD_URL="${baseUrl}/api/download/vyomo-blackbox"
INSTALL_DIR="\${1:-\$HOME/vyomo-blackbox}"

echo -e "\${GREEN}📦 Downloading Vyomo Blackbox API...\${NC}"

# Download archive
curl -f -H "Authorization: Bearer \$TOKEN" \\
  -o /tmp/vyomo-blackbox.tar.gz \\
  "\$DOWNLOAD_URL" || {
    echo "Error: Download failed. Token may have expired."
    exit 1
  }

echo -e "\${GREEN}📂 Extracting to \$INSTALL_DIR...\${NC}"

# Create directory and extract
mkdir -p "\$INSTALL_DIR"
tar -xzf /tmp/vyomo-blackbox.tar.gz -C "\$INSTALL_DIR"
rm /tmp/vyomo-blackbox.tar.gz

cd "\$INSTALL_DIR/vyomo-algo-blackbox"

echo ""
echo -e "\${GREEN}✅ Download complete!\${NC}"
echo ""
echo "📍 Installation directory: \$INSTALL_DIR/vyomo-algo-blackbox"
echo ""
echo "Next steps:"
echo "  1. cd \$INSTALL_DIR/vyomo-algo-blackbox"
echo "  2. ./setup-wizard.sh"
echo ""
echo "Or run quick demo:"
echo "  ./quick-start.sh"
echo ""

# Ask if user wants to run setup wizard now
read -p "Run setup wizard now? [Y/n]: " RUN_WIZARD
if [[ ! "\$RUN_WIZARD" =~ ^[Nn]$ ]]; then
    chmod +x setup-wizard.sh
    ./setup-wizard.sh
fi
`

  reply
    .header('Content-Type', 'text/x-shellscript')
    .header('Content-Disposition', 'inline; filename="install-vyomo.sh"')
    .send(script)
})

/**
 * List Available Versions (Future feature)
 * GET /api/versions
 */
server.get('/api/versions', async () => {
  return {
    versions: [
      {
        version: '1.0.0',
        date: '2026-02-14',
        current: true,
        features: [
          '13-algorithm trading system',
          'Blackbox IP protection',
          'ANKR system integration',
          'Automated setup wizards',
          'Remote deployment support'
        ]
      }
    ]
  }
})

/**
 * Usage Statistics (for admins)
 * GET /api/stats
 */
server.get('/api/stats', async (request, reply) => {
  // Simple admin check - enhance this in production
  const adminToken = request.headers['x-admin-token']

  if (adminToken !== process.env.ADMIN_TOKEN) {
    reply.code(401).send({ error: 'Unauthorized' })
    return
  }

  return {
    totalClients: DOWNLOAD_KEYS.size,
    activeClients: Array.from(DOWNLOAD_KEYS.values()).filter(c => c.active).length,
    clients: Array.from(DOWNLOAD_KEYS.entries()).map(([key, data]) => ({
      name: data.name,
      active: data.active,
      keyPrefix: key.substring(0, 10) + '...'
    }))
  }
})

// ==========================================
// START SERVER
// ==========================================

const PORT = parseInt(process.env.PORT || '5000')
const HOST = process.env.HOST || '0.0.0.0'

server.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔐 Vyomo Blackbox API - Secure Download Service')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📡 Server: http://${HOST}:${PORT}`)
  console.log(`🔗 One-liner: curl -fsSL https://vyomo.in/install/{API_KEY} | bash`)
  console.log(`📊 Health: http://${HOST}:${PORT}/health`)
  console.log('')
  console.log('Active Clients:')
  DOWNLOAD_KEYS.forEach((client, key) => {
    const status = client.active ? '✅' : '❌'
    console.log(`  ${status} ${client.name} (${key})`)
  })
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
})
