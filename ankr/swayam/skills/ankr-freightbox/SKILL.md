---
name: ankr-freightbox
description: FreightBox NVOCC platform operations. Use for shipping, booking, container tracking, BL management, and freight operations. Triggers on "shipping", "freight", "container", "BL", "booking", "NVOCC".
metadata:
  author: ankr
  version: "1.0.0"
---

# FreightBox

NVOCC (Non-Vessel Operating Common Carrier) platform for freight and shipping operations.

## Service Info

- **Port**: 4003
- **URL**: http://localhost:4003
- **API Base**: http://localhost:4003/api/v1

## Core Operations

### Bookings
```bash
# Create booking
bash /mnt/skills/user/ankr-freightbox/scripts/booking.sh create \
  --origin "INMAA" --destination "USLAX" \
  --cargo-type "FCL" --containers 2

# Get booking
bash /mnt/skills/user/ankr-freightbox/scripts/booking.sh get <booking-id>

# List bookings
bash /mnt/skills/user/ankr-freightbox/scripts/booking.sh list --status "confirmed"
```

### Container Tracking
```bash
# Track container
bash /mnt/skills/user/ankr-freightbox/scripts/container.sh track <container-number>

# Get container history
bash /mnt/skills/user/ankr-freightbox/scripts/container.sh history <container-number>
```

### Bill of Lading (BL)
```bash
# Generate BL
bash /mnt/skills/user/ankr-freightbox/scripts/bl.sh generate <booking-id>

# Get BL
bash /mnt/skills/user/ankr-freightbox/scripts/bl.sh get <bl-number>

# Release BL
bash /mnt/skills/user/ankr-freightbox/scripts/bl.sh release <bl-number>
```

### Rates & Quotes
```bash
# Get rate
bash /mnt/skills/user/ankr-freightbox/scripts/rates.sh get \
  --origin "INMAA" --destination "USLAX" --cargo-type "FCL"

# Create quote
bash /mnt/skills/user/ankr-freightbox/scripts/rates.sh quote \
  --customer "CUST001" --validity 30
```

## MCP Tools

```typescript
// Track shipment
await mcp__freightbox__shipment_track({
  shipmentId: "SHP001"
});

// Create booking
await mcp__freightbox__booking_create({
  origin: "INMAA",
  destination: "USLAX",
  cargoType: "FCL",
  containers: 2
});

// Get rates
await mcp__freightbox__rates_get({
  origin: "INMAA",
  destination: "USLAX"
});
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/bookings` | POST | Create booking |
| `/bookings/:id` | GET | Get booking |
| `/containers/:number/track` | GET | Track container |
| `/bl/:number` | GET | Get BL |
| `/rates` | POST | Get rates |

## Port Codes

Common port codes used in FreightBox:

| Code | Port |
|------|------|
| INMAA | Chennai, India |
| INBOM | Mumbai, India |
| USLAX | Los Angeles, USA |
| SGSIN | Singapore |
| CNSHA | Shanghai, China |

## Best Practices

1. **Validate port codes** - Use UNLOCODE format
2. **Check container format** - Must match ISO 6346
3. **Handle async operations** - Tracking updates are async
4. **Use webhooks** - Subscribe to status updates
