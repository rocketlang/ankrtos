---
name: ankr-ports
description: Get service ports and URLs for ANKR ecosystem services. Use when needing port numbers, service URLs, or configuring connections. Triggers on "get port", "what port", "service URL", "connect to".
metadata:
  author: ankr
  version: "1.0.0"
---

# ANKR Ports

Discover and manage service ports across the ANKR ecosystem. Never hardcode ports - always use this skill or `ankr5` CLI.

## Core Services

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| AI Proxy | 4444 | http://localhost:4444 | LLM gateway |
| EON Memory | 4005 | http://localhost:4005 | Knowledge graph |
| FreightBox | 4003 | http://localhost:4003 | NVOCC platform |
| WowTruck | 4000 | http://localhost:4000 | TMS platform |

## Usage

```bash
# Get port for a service
bash /mnt/skills/user/ankr-ports/scripts/get-port.sh <service-name>

# Get full URL for a service
bash /mnt/skills/user/ankr-ports/scripts/get-url.sh <service-name>

# List all services
bash /mnt/skills/user/ankr-ports/scripts/list-services.sh
```

**Examples:**

```bash
# Get FreightBox port
bash /mnt/skills/user/ankr-ports/scripts/get-port.sh freightbox
# Output: 4003

# Get EON Memory URL
bash /mnt/skills/user/ankr-ports/scripts/get-url.sh eon
# Output: http://localhost:4005
```

## CLI Alternative

If `ankr5` CLI is available:

```bash
ankr5 ports get freightbox    # Returns: 4003
ankr5 ports url freightbox    # Returns: http://localhost:4003
ankr5 ports list              # Lists all services
```

## Best Practices

1. **NEVER hardcode ports** - Always use this skill or ankr5 CLI
2. **Use environment variables** - Export PORT_* variables when needed
3. **Health checks** - Verify service is running before connecting
4. **Fallback handling** - Handle connection failures gracefully
