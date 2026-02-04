---
name: ankr-wowtruck
description: WowTruck TMS (Transport Management System) operations. Use for fleet management, trip planning, driver assignment, and logistics. Triggers on "truck", "fleet", "driver", "trip", "transport", "logistics", "TMS".
metadata:
  author: ankr
  version: "1.0.0"
---

# WowTruck

Transport Management System (TMS) for fleet and logistics operations.

## Service Info

- **Port**: 4000
- **URL**: http://localhost:4000
- **API Base**: http://localhost:4000/api/v1

## Core Operations

### Fleet Management
```bash
# List vehicles
bash /mnt/skills/user/ankr-wowtruck/scripts/fleet.sh list [--status "active"]

# Get vehicle
bash /mnt/skills/user/ankr-wowtruck/scripts/fleet.sh get <vehicle-id>

# Update vehicle status
bash /mnt/skills/user/ankr-wowtruck/scripts/fleet.sh status <vehicle-id> "available"
```

### Trip Management
```bash
# Create trip
bash /mnt/skills/user/ankr-wowtruck/scripts/trip.sh create \
  --origin "Chennai" --destination "Bangalore" \
  --vehicle "TN01AB1234" --driver "DRV001"

# Get trip status
bash /mnt/skills/user/ankr-wowtruck/scripts/trip.sh status <trip-id>

# Update trip
bash /mnt/skills/user/ankr-wowtruck/scripts/trip.sh update <trip-id> --status "in_transit"
```

### Driver Management
```bash
# List drivers
bash /mnt/skills/user/ankr-wowtruck/scripts/driver.sh list [--available]

# Assign driver
bash /mnt/skills/user/ankr-wowtruck/scripts/driver.sh assign <driver-id> <trip-id>

# Get driver location
bash /mnt/skills/user/ankr-wowtruck/scripts/driver.sh location <driver-id>
```

### Route Planning
```bash
# Plan route
bash /mnt/skills/user/ankr-wowtruck/scripts/route.sh plan \
  --origin "13.0827,80.2707" --destination "12.9716,77.5946" \
  --waypoints "12.5,78.0"

# Optimize routes
bash /mnt/skills/user/ankr-wowtruck/scripts/route.sh optimize --trips "TRIP001,TRIP002,TRIP003"
```

## MCP Tools

```typescript
// Create trip
await mcp__wowtruck__trip_create({
  origin: "Chennai",
  destination: "Bangalore",
  vehicleId: "TN01AB1234",
  driverId: "DRV001"
});

// Track vehicle
await mcp__wowtruck__vehicle_track({
  vehicleId: "TN01AB1234"
});

// Assign driver
await mcp__wowtruck__driver_assign({
  driverId: "DRV001",
  tripId: "TRIP001"
});
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/vehicles` | GET/POST | Fleet operations |
| `/trips` | GET/POST | Trip management |
| `/drivers` | GET/POST | Driver management |
| `/routes/plan` | POST | Route planning |
| `/routes/optimize` | POST | Route optimization |

## Data Model

```
Vehicle {
  id: string
  registrationNumber: string
  type: "truck" | "trailer" | "container"
  capacity: number
  status: "available" | "in_transit" | "maintenance"
  currentLocation: GeoPoint
}

Trip {
  id: string
  origin: Location
  destination: Location
  vehicle: Vehicle
  driver: Driver
  status: "planned" | "in_transit" | "completed"
  eta: timestamp
}

Driver {
  id: string
  name: string
  license: string
  status: "available" | "on_trip" | "off_duty"
  currentLocation: GeoPoint
}
```

## Best Practices

1. **Check availability** - Verify vehicle/driver before assignment
2. **Track in real-time** - Use GPS tracking for live updates
3. **Optimize routes** - Batch nearby deliveries
4. **Handle delays** - Update ETA proactively
5. **Document handoffs** - Record pickup/delivery proof
