# Kinara - SDK Documentation

> Integration guides for Kinara SDKs

---

## Tags
`SDK` `Mobile` `Embedded` `Integration` `API` `Documentation`

---

## SDK Overview

Kinara provides SDKs for multiple platforms:

| SDK | Platform | Package | Status |
|-----|----------|---------|--------|
| Core SDK | JavaScript/TypeScript | `@kinara/sdk-core` | Planned |
| React Native SDK | iOS/Android | `@kinara/react-native-sdk` | Planned |
| Swift SDK | iOS Native | `KinaraSDK` | Future |
| Kotlin SDK | Android Native | `com.kinara.sdk` | Future |
| Python SDK | Backend/ML | `kinara-python` | Planned |
| Embedded SDK | C/Zephyr | `kinara-embedded` | Planned |

---

## Core SDK (@kinara/sdk-core)

### Installation

```bash
npm install @kinara/sdk-core
# or
yarn add @kinara/sdk-core
# or
pnpm add @kinara/sdk-core
```

### Quick Start

```typescript
import { KinaraClient } from '@kinara/sdk-core';

// Initialize client
const kinara = new KinaraClient({
  apiKey: 'kn_live_your_api_key',
  baseUrl: 'https://api.kinara.health', // optional, defaults to production
});

// Ingest readings
await kinara.ingest.readings({
  deviceId: 'device_123',
  readings: [
    {
      timestamp: new Date().toISOString(),
      type: 'temperature',
      value: 36.8,
      unit: 'celsius',
      quality: 0.95,
    },
  ],
});

// Get prediction
const prediction = await kinara.predictions.hotFlash({
  userId: 'user_123',
  currentReadings: {
    temperature: 36.8,
    heartRate: 72,
    hrvRmssd: 45,
  },
});

console.log(`Hot flash probability: ${prediction.probability}`);
```

### Configuration

```typescript
interface KinaraConfig {
  apiKey: string;                    // Required: Your API key
  baseUrl?: string;                  // Optional: API base URL
  timeout?: number;                  // Optional: Request timeout (ms)
  retries?: number;                  // Optional: Max retries (default: 3)
  debug?: boolean;                   // Optional: Enable debug logging
}

const kinara = new KinaraClient({
  apiKey: process.env.KINARA_API_KEY!,
  timeout: 10000,
  retries: 3,
  debug: process.env.NODE_ENV === 'development',
});
```

### API Reference

#### Ingestion

```typescript
// Ingest readings batch
await kinara.ingest.readings({
  deviceId: string,
  readings: Array<{
    timestamp: string;      // ISO 8601
    type: ReadingType;      // 'temperature', 'heart_rate', etc.
    value: number;
    unit: string;
    quality?: number;       // 0-1
    metadata?: object;
  }>,
});

// Ingest single event
await kinara.ingest.event({
  userId: string,
  eventType: string,
  timestamp: string,
  data?: object,
});
```

#### Readings

```typescript
// Query readings
const readings = await kinara.readings.query({
  userId: string,
  type?: ReadingType,
  start: string,            // ISO 8601
  end: string,              // ISO 8601
  resolution?: 'raw' | '1m' | '5m' | '1h' | '1d',
  limit?: number,
});

// Get latest readings
const latest = await kinara.readings.latest({
  userId: string,
});
```

#### Predictions

```typescript
// Hot flash prediction
const prediction = await kinara.predictions.hotFlash({
  userId: string,
  currentReadings: {
    temperature: number,
    heartRate: number,
    hrvRmssd?: number,
    gsr?: number,
  },
});

// Returns:
{
  probability: number,      // 0-1
  confidence: number,       // 0-1
  etaSeconds: number,       // Estimated time to onset
  severityEstimate: 'mild' | 'moderate' | 'severe',
  recommendations: Array<{
    action: string,
    description: string,
  }>,
}
```

#### Insights

```typescript
// Get user insights
const insights = await kinara.insights.get({
  userId: string,
  period: '7d' | '30d' | '90d',
});

// Returns hot flash patterns, triggers, recommendations
```

#### Users

```typescript
// Create user
const user = await kinara.users.create({
  externalId: string,       // Your user ID
  email?: string,
  profile?: {
    name?: string,
    age?: number,
    menopauseStage?: string,
  },
});

// Get user
const user = await kinara.users.get(userId);

// Update user
await kinara.users.update(userId, { profile: {...} });

// Delete user (GDPR)
await kinara.users.delete(userId);
```

#### Devices

```typescript
// Register device
const device = await kinara.devices.register({
  deviceType: 'wristband' | 'patch' | 'third_party',
  hardwareId: string,       // MAC or serial
  name?: string,
  firmwareVersion?: string,
});

// Assign to user
await kinara.devices.assign(deviceId, userId);

// Get device status
const status = await kinara.devices.status(deviceId);
```

### Error Handling

```typescript
import { KinaraError, RateLimitError, AuthError } from '@kinara/sdk-core';

try {
  await kinara.predictions.hotFlash({...});
} catch (error) {
  if (error instanceof RateLimitError) {
    // Wait and retry
    const retryAfter = error.retryAfter;
    await sleep(retryAfter * 1000);
  } else if (error instanceof AuthError) {
    // Invalid API key
    console.error('Authentication failed');
  } else if (error instanceof KinaraError) {
    // Other API error
    console.error(`API Error: ${error.code} - ${error.message}`);
  } else {
    throw error;
  }
}
```

### Offline Support

```typescript
import { KinaraClient, OfflineBuffer } from '@kinara/sdk-core';

const buffer = new OfflineBuffer({
  maxSize: 10000,           // Max readings to buffer
  storageKey: 'kinara_buffer',
});

const kinara = new KinaraClient({
  apiKey: 'kn_live_...',
  offlineBuffer: buffer,
});

// Readings are automatically buffered when offline
// and synced when connection is restored

// Manual sync
await kinara.sync();

// Check buffer status
const pending = buffer.getPendingCount();
```

---

## React Native SDK (@kinara/react-native-sdk)

### Installation

```bash
npm install @kinara/react-native-sdk

# iOS
cd ios && pod install

# Required peer dependencies
npm install react-native-ble-plx @react-native-async-storage/async-storage
```

### Quick Start

```typescript
import { KinaraProvider, useKinara, useSensor } from '@kinara/react-native-sdk';

// Wrap your app
function App() {
  return (
    <KinaraProvider apiKey="kn_live_...">
      <MainScreen />
    </KinaraProvider>
  );
}

// Use hooks in components
function MainScreen() {
  const { user, isConnected } = useKinara();
  const {
    device,
    readings,
    connect,
    disconnect,
    isScanning,
  } = useSensor();

  return (
    <View>
      <Text>Connected: {isConnected ? 'Yes' : 'No'}</Text>
      <Text>Temperature: {readings.temperature?.value}°C</Text>

      <Button
        title="Scan for devices"
        onPress={() => startScan()}
      />
    </View>
  );
}
```

### BLE Device Management

```typescript
import { useBLE } from '@kinara/react-native-sdk';

function DeviceScanner() {
  const {
    devices,           // Discovered devices
    isScanning,        // Scan status
    startScan,         // Start scanning
    stopScan,          // Stop scanning
    connect,           // Connect to device
    connectedDevice,   // Currently connected
    disconnect,        // Disconnect
  } = useBLE();

  const handleConnect = async (device) => {
    try {
      await connect(device.id);
      console.log('Connected to', device.name);
    } catch (error) {
      console.error('Connection failed', error);
    }
  };

  return (
    <FlatList
      data={devices}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => handleConnect(item)}>
          <Text>{item.name || 'Unknown'}</Text>
          <Text>Signal: {item.rssi} dBm</Text>
        </TouchableOpacity>
      )}
    />
  );
}
```

### Real-time Readings

```typescript
import { useReadings } from '@kinara/react-native-sdk';

function VitalsDisplay() {
  const readings = useReadings({
    types: ['temperature', 'heart_rate', 'hrv_rmssd'],
    interval: 1000,     // Update interval (ms)
  });

  return (
    <View>
      <VitalCard
        label="Temperature"
        value={readings.temperature?.value}
        unit="°C"
      />
      <VitalCard
        label="Heart Rate"
        value={readings.heart_rate?.value}
        unit="BPM"
      />
      <VitalCard
        label="HRV"
        value={readings.hrv_rmssd?.value}
        unit="ms"
      />
    </View>
  );
}
```

### Hot Flash Prediction

```typescript
import { usePrediction } from '@kinara/react-native-sdk';

function HotFlashAlert() {
  const {
    prediction,        // Current prediction
    isLoading,         // Loading state
    refresh,           // Manual refresh
  } = usePrediction('hot_flash', {
    autoRefresh: true,
    interval: 30000,   // Check every 30 seconds
  });

  if (prediction?.probability > 0.7) {
    return (
      <Alert
        title="Hot Flash Warning"
        message={`Likely in ${prediction.etaSeconds} seconds`}
        onDismiss={() => {}}
      />
    );
  }

  return null;
}
```

### Apple HealthKit Integration

```typescript
import { useHealthKit } from '@kinara/react-native-sdk';

function HealthKitSync() {
  const {
    isAuthorized,
    requestAuthorization,
    syncData,
    lastSyncTime,
  } = useHealthKit({
    types: ['heart_rate', 'sleep_analysis', 'body_temperature'],
  });

  useEffect(() => {
    if (isAuthorized) {
      syncData();
    }
  }, [isAuthorized]);

  if (!isAuthorized) {
    return (
      <Button
        title="Connect Apple Health"
        onPress={requestAuthorization}
      />
    );
  }

  return <Text>Last synced: {lastSyncTime}</Text>;
}
```

### Offline Mode

```typescript
import { useOffline } from '@kinara/react-native-sdk';

function OfflineIndicator() {
  const {
    isOnline,
    pendingReadings,
    pendingEvents,
    sync,
    clearPending,
  } = useOffline();

  return (
    <View>
      {!isOnline && (
        <Banner type="warning">
          Offline - {pendingReadings} readings pending
        </Banner>
      )}
    </View>
  );
}
```

---

## Python SDK (kinara-python)

### Installation

```bash
pip install kinara
```

### Quick Start

```python
from kinara import KinaraClient

# Initialize
client = KinaraClient(api_key="kn_live_...")

# Ingest readings
client.ingest.readings(
    device_id="device_123",
    readings=[
        {
            "timestamp": "2025-01-19T10:30:00Z",
            "type": "temperature",
            "value": 36.8,
            "unit": "celsius",
        }
    ]
)

# Get prediction
prediction = client.predictions.hot_flash(
    user_id="user_123",
    current_readings={
        "temperature": 36.8,
        "heart_rate": 72,
    }
)

print(f"Probability: {prediction.probability}")
```

### Async Support

```python
import asyncio
from kinara import AsyncKinaraClient

async def main():
    client = AsyncKinaraClient(api_key="kn_live_...")

    # Parallel requests
    readings, prediction = await asyncio.gather(
        client.readings.query(user_id="user_123", period="24h"),
        client.predictions.hot_flash(user_id="user_123", ...)
    )

asyncio.run(main())
```

### Pandas Integration

```python
import pandas as pd
from kinara import KinaraClient

client = KinaraClient(api_key="kn_live_...")

# Get readings as DataFrame
df = client.readings.to_dataframe(
    user_id="user_123",
    start="2025-01-01",
    end="2025-01-19",
    types=["temperature", "heart_rate"]
)

# Analyze
print(df.describe())
print(df.groupby("type")["value"].mean())
```

---

## Embedded SDK (kinara-embedded)

### Overview

C SDK for embedded devices (nRF52840, ESP32, etc.) running Zephyr RTOS or bare metal.

### Installation

```bash
# Add to your Zephyr project's west.yml
manifest:
  projects:
    - name: kinara-embedded
      url: https://github.com/kinara-health/kinara-embedded-sdk
      revision: v1.0.0
```

### Quick Start

```c
#include <kinara/kinara.h>

// Initialize
kinara_config_t config = {
    .device_id = "AA:BB:CC:DD:EE:FF",
    .api_key = "kn_device_...",
};

kinara_init(&config);

// Register sensor callback
void on_temperature_reading(float value, uint8_t quality) {
    kinara_reading_t reading = {
        .type = KINARA_READING_TEMPERATURE,
        .value = value,
        .quality = quality,
        .timestamp = k_uptime_get(),
    };

    kinara_push_reading(&reading);
}

// Start BLE advertising
kinara_ble_start();

// Main loop
void main(void) {
    kinara_init(&config);

    while (1) {
        // Read sensors
        float temp = read_temperature_sensor();
        on_temperature_reading(temp, 95);

        // Process pending operations
        kinara_process();

        // Sleep
        k_sleep(K_MSEC(1000));
    }
}
```

### BLE Services

```c
// Kinara BLE Service UUID: 0x1234
// Characteristics:
// - 0x1235: Temperature (notify)
// - 0x1236: Heart Rate (notify)
// - 0x1237: Multi-sensor batch (notify)
// - 0x1238: Device Info (read)
// - 0x1239: Command (write)

// Custom advertising data
kinara_ble_set_advertising_data(
    KINARA_ADV_FLAG_TEMPERATURE | KINARA_ADV_FLAG_HEART_RATE,
    device_name,
    battery_level
);
```

### Edge ML (Optional)

```c
#include <kinara/kinara_ml.h>

// Load model (stored in flash)
kinara_ml_load_model(hot_flash_model_data, hot_flash_model_size);

// Run prediction
kinara_feature_vector_t features = {
    .temperature = 37.2,
    .heart_rate = 85,
    .hrv_rmssd = 35,
    .gsr = 3.5,
};

kinara_prediction_t prediction;
kinara_ml_predict(&features, &prediction);

if (prediction.probability > 0.7) {
    // Trigger local alert
    kinara_trigger_haptic();
    kinara_notify_app(&prediction);
}
```

### Power Management

```c
// Power modes
kinara_set_power_mode(KINARA_POWER_ACTIVE);      // Full operation
kinara_set_power_mode(KINARA_POWER_SAMPLING);    // Periodic sampling
kinara_set_power_mode(KINARA_POWER_IDLE);        // BLE only
kinara_set_power_mode(KINARA_POWER_SLEEP);       // Deep sleep

// Typical current consumption:
// ACTIVE:   ~15mA
// SAMPLING: ~5mA average
// IDLE:     ~100µA
// SLEEP:    ~10µA
```

---

## WebSocket Client

### JavaScript

```typescript
import { KinaraWebSocket } from '@kinara/sdk-core';

const ws = new KinaraWebSocket({
  url: 'wss://api.kinara.health/ws',
  token: 'your_jwt_token',
});

// Subscribe to user readings
ws.subscribe('readings', { userId: 'user_123' });

// Listen for events
ws.on('reading', (data) => {
  console.log('New reading:', data);
});

ws.on('prediction', (data) => {
  if (data.probability > 0.7) {
    showAlert('Hot flash likely!');
  }
});

ws.on('disconnect', () => {
  console.log('Disconnected, reconnecting...');
});

// Clean up
ws.unsubscribe('readings');
ws.close();
```

---

## Best Practices

### 1. API Key Security

```typescript
// DO: Use environment variables
const kinara = new KinaraClient({
  apiKey: process.env.KINARA_API_KEY,
});

// DON'T: Hardcode in source
const kinara = new KinaraClient({
  apiKey: 'kn_live_abc123', // Never do this!
});
```

### 2. Batch Readings

```typescript
// DO: Batch readings
await kinara.ingest.readings({
  deviceId: 'device_123',
  readings: last100Readings, // Send in batches
});

// DON'T: Send one at a time
for (const reading of readings) {
  await kinara.ingest.readings({ readings: [reading] }); // Slow!
}
```

### 3. Handle Offline Gracefully

```typescript
// DO: Buffer when offline
const buffer = new OfflineBuffer();
try {
  await kinara.ingest.readings(data);
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    buffer.add(data);
  }
}

// DON'T: Lose data
try {
  await kinara.ingest.readings(data);
} catch (error) {
  // Data lost!
}
```

### 4. Respect Rate Limits

```typescript
// DO: Implement backoff
const backoff = new ExponentialBackoff();
while (retries < maxRetries) {
  try {
    await kinara.predictions.hotFlash(data);
    break;
  } catch (error) {
    if (error instanceof RateLimitError) {
      await backoff.wait();
      retries++;
    }
  }
}

// DON'T: Hammer the API
while (true) {
  await kinara.predictions.hotFlash(data); // Will get rate limited
}
```

---

## Migration Guides

### From v0.x to v1.0

```typescript
// Old (v0.x)
import Kinara from 'kinara-sdk';
const client = Kinara.init({ key: '...' });
client.sendReading({ temp: 36.8 });

// New (v1.0)
import { KinaraClient } from '@kinara/sdk-core';
const client = new KinaraClient({ apiKey: '...' });
await client.ingest.readings({
  deviceId: '...',
  readings: [{ type: 'temperature', value: 36.8 }],
});
```

---

## Support

- **Documentation**: https://docs.kinara.health/sdk
- **GitHub Issues**: https://github.com/kinara-health/sdk/issues
- **Email**: sdk-support@kinara.health
- **Discord**: Coming soon

---

*Build with Kinara, improve women's lives*
