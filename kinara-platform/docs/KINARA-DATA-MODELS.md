# Kinara - Data Models & Schemas

> Standardized data formats for the Kinara platform

---

## Tags
`Database` `API` `Standards` `IoT` `Sensors` `Healthcare`

---

## Overview

Kinara uses a standardized data model designed for:
- **Interoperability**: Works with any sensor/device
- **Efficiency**: Optimized for time-series storage
- **Extensibility**: Easy to add new reading types
- **Compliance**: Healthcare data standards alignment

---

## Core Data Models

### 1. Tenant

```typescript
interface Tenant {
  id: UUID;
  name: string;
  slug: string;                    // URL-safe identifier
  plan: 'starter' | 'growth' | 'enterprise';
  settings: TenantSettings;
  created_at: DateTime;
  updated_at: DateTime;
}

interface TenantSettings {
  default_timezone: string;        // e.g., "Asia/Kolkata"
  data_retention_days: number;     // Default: 730 (2 years)
  features: string[];              // Enabled features
  branding: {
    logo_url?: string;
    primary_color?: string;
  };
  notifications: {
    email: string;
    webhook_url?: string;
  };
}
```

### 2. User

```typescript
interface User {
  id: UUID;
  tenant_id: UUID;
  external_id: string;             // Tenant's user identifier
  email?: string;
  profile: UserProfile;
  preferences: UserPreferences;
  created_at: DateTime;
  updated_at: DateTime;
}

interface UserProfile {
  name?: string;
  age?: number;
  date_of_birth?: Date;
  gender?: 'female' | 'male' | 'other';
  menopause_stage?: MenopauseStage;
  health_conditions?: string[];
  medications?: string[];
  prakriti?: PrakritiType;         // Ayurveda body type
  custom_fields?: Record<string, any>;
}

type MenopauseStage =
  | 'premenopause'
  | 'perimenopause'
  | 'menopause'
  | 'postmenopause';

type PrakritiType =
  | 'vata'
  | 'pitta'
  | 'kapha'
  | 'vata_pitta'
  | 'pitta_kapha'
  | 'vata_kapha'
  | 'tridosha';

interface UserPreferences {
  language: string;                // ISO 639-1 code
  timezone: string;
  notifications: boolean;
  data_sharing: DataSharingPrefs;
  units: UnitPreferences;
}

interface DataSharingPrefs {
  share_with_doctors: boolean;
  share_for_research: boolean;     // Anonymized
  share_with_family: string[];     // User IDs
}

interface UnitPreferences {
  temperature: 'celsius' | 'fahrenheit';
  weight: 'kg' | 'lbs';
  height: 'cm' | 'inches';
}
```

### 3. Device

```typescript
interface Device {
  id: UUID;
  tenant_id: UUID;
  user_id?: UUID;                  // Assigned user
  device_type: DeviceType;
  hardware_id: string;             // MAC address or serial
  name?: string;
  firmware_version?: string;
  last_seen_at?: DateTime;
  metadata: DeviceMetadata;
  created_at: DateTime;
}

type DeviceType =
  | 'wristband'
  | 'patch'
  | 'ring'
  | 'clip'
  | 'thermal_scanner'
  | 'smart_scale'
  | 'third_party_watch'
  | 'third_party_ring'
  | 'mobile_app';

interface DeviceMetadata {
  manufacturer?: string;
  model?: string;
  sensors: SensorCapability[];
  battery_type?: 'rechargeable' | 'replaceable';
  connectivity: ('ble' | 'wifi' | 'cellular')[];
  certifications?: string[];       // e.g., "CE", "FCC"
}

interface SensorCapability {
  type: ReadingType;
  accuracy?: string;               // e.g., "±0.1°C"
  sampling_rate_hz?: number;
}
```

---

## Reading Data Model

### 4. Reading (Time-Series)

```typescript
interface Reading {
  time: DateTime;                  // Primary timestamp (UTC)
  tenant_id: UUID;
  user_id: UUID;
  device_id: UUID;
  reading_type: ReadingType;
  value: number;
  unit: string;
  quality: number;                 // 0.0 - 1.0
  metadata?: ReadingMetadata;
}

type ReadingType =
  // Temperature
  | 'temperature'                  // Skin temperature
  | 'temperature_ambient'          // Room temperature
  | 'temperature_core'             // Core body (estimated)

  // Cardiovascular
  | 'heart_rate'                   // BPM
  | 'hrv_rmssd'                    // HRV: Root mean square
  | 'hrv_sdnn'                     // HRV: Standard deviation
  | 'hrv_lf'                       // HRV: Low frequency power
  | 'hrv_hf'                       // HRV: High frequency power
  | 'hrv_lf_hf_ratio'              // HRV: LF/HF ratio
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'spo2'                         // Blood oxygen %

  // Electrodermal
  | 'gsr'                          // Galvanic skin response
  | 'eda_tonic'                    // Electrodermal: tonic level
  | 'eda_phasic'                   // Electrodermal: phasic level

  // Motion
  | 'steps'                        // Step count
  | 'activity_level'               // 0-10 scale
  | 'calories_burned'

  // Sleep
  | 'sleep_stage'                  // Encoded: 0=wake,1=light,2=deep,3=rem
  | 'sleep_movement'               // Movement intensity
  | 'snoring_level'

  // Respiratory
  | 'respiratory_rate'             // Breaths per minute

  // Other
  | 'weight'
  | 'bmi'
  | 'blood_glucose';

interface ReadingMetadata {
  source?: 'sensor' | 'derived' | 'manual';
  confidence?: number;
  raw_values?: number[];           // For debugging
  sensor_position?: string;        // e.g., "left_wrist"
}
```

### Reading Units Reference

| Reading Type | Standard Unit | Alternatives | Range |
|--------------|---------------|--------------|-------|
| temperature | celsius | fahrenheit | 30.0 - 45.0 |
| heart_rate | bpm | - | 30 - 250 |
| hrv_rmssd | ms | - | 0 - 200 |
| hrv_sdnn | ms | - | 0 - 300 |
| spo2 | percent | - | 70 - 100 |
| gsr | microsiemens | - | 0 - 100 |
| steps | count | - | 0 - 100000 |
| blood_pressure_* | mmHg | - | 60 - 250 |
| respiratory_rate | brpm | - | 5 - 60 |
| weight | kg | lbs | 20 - 300 |
| blood_glucose | mg/dL | mmol/L | 20 - 600 |

---

## Event Data Model

### 5. Event

```typescript
interface Event {
  id: UUID;
  time: DateTime;
  tenant_id: UUID;
  user_id: UUID;
  device_id?: UUID;
  event_type: EventType;
  severity?: EventSeverity;
  confidence?: number;             // 0.0 - 1.0 (for detected events)
  data: EventData;
  acknowledged_at?: DateTime;
  created_at: DateTime;
}

type EventType =
  // Detected (ML/Algorithm)
  | 'hot_flash_detected'
  | 'hot_flash_predicted'
  | 'sleep_disruption_detected'
  | 'stress_spike_detected'
  | 'anomaly_detected'

  // User Reported
  | 'hot_flash_reported'
  | 'symptom_logged'
  | 'mood_logged'
  | 'medication_taken'
  | 'meal_logged'
  | 'exercise_logged'

  // System
  | 'device_connected'
  | 'device_disconnected'
  | 'device_battery_low'
  | 'sync_completed'
  | 'prediction_generated'

  // Actions
  | 'cooling_activated'
  | 'notification_sent'
  | 'intervention_triggered';

type EventSeverity = 'low' | 'mild' | 'moderate' | 'severe';

interface EventData {
  // Hot Flash Events
  duration_seconds?: number;
  peak_temp_delta?: number;
  triggered_action?: string;

  // Symptom Logging
  symptom?: SymptomType;
  severity_rating?: number;        // 1-10
  notes?: string;

  // Mood Logging
  mood?: MoodType;
  energy_level?: number;           // 1-10

  // Medication
  medication_name?: string;
  dosage?: string;

  // Generic
  [key: string]: any;
}

type SymptomType =
  | 'hot_flash'
  | 'night_sweat'
  | 'mood_swing'
  | 'anxiety'
  | 'irritability'
  | 'fatigue'
  | 'insomnia'
  | 'brain_fog'
  | 'joint_pain'
  | 'headache'
  | 'palpitations'
  | 'vaginal_dryness'
  | 'low_libido'
  | 'weight_gain'
  | 'other';

type MoodType =
  | 'happy'
  | 'calm'
  | 'anxious'
  | 'sad'
  | 'irritable'
  | 'energetic'
  | 'tired'
  | 'stressed'
  | 'neutral';
```

---

## Prediction Data Model

### 6. Prediction

```typescript
interface Prediction {
  id: UUID;
  time: DateTime;
  tenant_id: UUID;
  user_id: UUID;
  prediction_type: PredictionType;
  result: PredictionResult;
  input_features: Record<string, number>;
  model_info: ModelInfo;
  created_at: DateTime;
}

type PredictionType =
  | 'hot_flash'
  | 'sleep_quality'
  | 'symptom_severity'
  | 'trigger_likelihood';

interface PredictionResult {
  // Hot Flash Prediction
  probability?: number;            // 0.0 - 1.0
  eta_seconds?: number;            // Estimated time to event
  severity_estimate?: EventSeverity;

  // Sleep Prediction
  sleep_score?: number;            // 0 - 100
  predicted_stages?: SleepStageDistribution;

  // Generic
  confidence: number;
  recommendations?: Recommendation[];
}

interface SleepStageDistribution {
  wake_percent: number;
  light_percent: number;
  deep_percent: number;
  rem_percent: number;
}

interface Recommendation {
  action: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

interface ModelInfo {
  name: string;
  version: string;
  inference_time_ms: number;
}
```

---

## Aggregated Data Models

### 7. Hourly Aggregates

```typescript
interface ReadingAggregate {
  bucket: DateTime;                // Hour start time
  tenant_id: UUID;
  user_id: UUID;
  reading_type: ReadingType;

  // Statistics
  avg_value: number;
  min_value: number;
  max_value: number;
  stddev_value: number;
  count: number;

  // Quality
  avg_quality: number;
  data_completeness: number;       // % of expected readings
}
```

### 8. Daily Summary

```typescript
interface DailySummary {
  date: Date;
  tenant_id: UUID;
  user_id: UUID;

  // Hot Flashes
  hot_flash_count: number;
  hot_flash_severity_avg: number;
  hot_flash_duration_total_sec: number;

  // Sleep
  sleep_duration_minutes: number;
  sleep_efficiency: number;
  sleep_score: number;
  awakenings: number;

  // Vitals
  temperature_avg: number;
  temperature_min: number;
  temperature_max: number;
  heart_rate_avg: number;
  heart_rate_resting: number;
  hrv_avg: number;

  // Activity
  steps: number;
  active_minutes: number;

  // Symptoms Logged
  symptoms_logged: SymptomSummary[];
  mood_avg: number;

  // Predictions
  prediction_accuracy: number;     // For previous predictions
}

interface SymptomSummary {
  symptom: SymptomType;
  count: number;
  severity_avg: number;
}
```

---

## Insight Data Models

### 9. Insights

```typescript
interface UserInsights {
  user_id: UUID;
  period: DateRange;
  generated_at: DateTime;

  hot_flash_insights: HotFlashInsights;
  sleep_insights: SleepInsights;
  trigger_insights: TriggerInsights;
  recommendations: string[];
}

interface HotFlashInsights {
  total_count: number;
  daily_average: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trend_percent: number;

  by_severity: Record<EventSeverity, number>;
  by_hour: number[];               // 24 values, one per hour
  by_day_of_week: number[];        // 7 values

  peak_hours: number[];            // Top 3 hours
  avg_duration_seconds: number;
  prediction_accuracy: number;
}

interface SleepInsights {
  avg_duration_minutes: number;
  avg_efficiency: number;
  avg_score: number;

  trend: 'improving' | 'declining' | 'stable';
  nights_with_disruption: number;
  avg_awakenings: number;

  stage_distribution: SleepStageDistribution;
  best_sleep_conditions: string[];
}

interface TriggerInsights {
  identified_triggers: TriggerCorrelation[];
  protective_factors: TriggerCorrelation[];
}

interface TriggerCorrelation {
  factor: string;
  correlation: number;             // -1 to 1
  confidence: number;
  occurrences: number;
  recommendation?: string;
}

interface DateRange {
  start: Date;
  end: Date;
}
```

---

## Data Interchange Formats

### Sensor Data Protocol (BLE)

```
┌─────────────────────────────────────────────────────────────┐
│              BLE SENSOR DATA PACKET                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GATT Service: 0x1234 (Kinara Health Service)               │
│                                                             │
│  Characteristics:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  0x1235 - Temperature Reading                        │   │
│  │  Format: [timestamp:4][value:2][quality:1]           │   │
│  │  - timestamp: Unix seconds (uint32, little-endian)   │   │
│  │  - value: °C * 100 (int16, little-endian)            │   │
│  │  - quality: 0-100 (uint8)                            │   │
│  │  Example: 0x78563412 0xE80E 0x5F                     │   │
│  │           = timestamp:305419896, 38.00°C, quality:95 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  0x1236 - Heart Rate Reading                         │   │
│  │  Format: [timestamp:4][hr:1][rr_count:1][rr:2*n]     │   │
│  │  - timestamp: Unix seconds (uint32)                  │   │
│  │  - hr: BPM (uint8)                                   │   │
│  │  - rr_count: Number of RR intervals (uint8)          │   │
│  │  - rr: RR intervals in ms (uint16 array)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  0x1237 - Multi-Sensor Reading (Batched)             │   │
│  │  Format: [timestamp:4][reading_count:1][readings:*]  │   │
│  │  Reading: [type:1][value:4][quality:1]               │   │
│  │  - type: ReadingType enum (uint8)                    │   │
│  │  - value: float32 (IEEE 754)                         │   │
│  │  - quality: 0-100 (uint8)                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### API Ingestion Format (JSON)

```json
{
  "$schema": "https://kinara.health/schemas/readings-batch-v1.json",
  "device_id": "770e8400-e29b-41d4-a716-446655440002",
  "batch_id": "batch_20250119_103000_001",
  "readings": [
    {
      "timestamp": "2025-01-19T10:30:00.000Z",
      "type": "temperature",
      "value": 36.8,
      "unit": "celsius",
      "quality": 0.95,
      "metadata": {
        "source": "sensor",
        "sensor_position": "left_wrist"
      }
    },
    {
      "timestamp": "2025-01-19T10:30:00.000Z",
      "type": "heart_rate",
      "value": 72,
      "unit": "bpm",
      "quality": 0.98
    }
  ]
}
```

### FHIR Mapping (Future)

```json
{
  "resourceType": "Observation",
  "status": "final",
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/observation-category",
      "code": "vital-signs"
    }]
  }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "8310-5",
      "display": "Body temperature"
    }]
  },
  "subject": {
    "reference": "Patient/kinara-user-660e8400"
  },
  "effectiveDateTime": "2025-01-19T10:30:00Z",
  "valueQuantity": {
    "value": 36.8,
    "unit": "Cel",
    "system": "http://unitsofmeasure.org",
    "code": "Cel"
  }
}
```

---

## Data Quality

### Quality Score Calculation

```typescript
function calculateQuality(reading: RawReading): number {
  let quality = 1.0;

  // Sensor confidence
  if (reading.sensor_confidence) {
    quality *= reading.sensor_confidence;
  }

  // Range validation
  const range = READING_RANGES[reading.type];
  if (reading.value < range.min || reading.value > range.max) {
    quality *= 0.5;  // Out of range penalty
  }

  // Motion artifact (for PPG/temp)
  if (reading.motion_level > 0.7) {
    quality *= 0.7;  // High motion penalty
  }

  // Signal quality
  if (reading.signal_quality) {
    quality *= reading.signal_quality;
  }

  return Math.max(0, Math.min(1, quality));
}
```

### Data Completeness

```sql
-- Calculate data completeness for a day
WITH expected AS (
  SELECT
    user_id,
    reading_type,
    -- Expect 1 reading per minute for continuous sensors
    1440 as expected_count
  FROM users
  CROSS JOIN (VALUES ('temperature'), ('heart_rate')) AS types(reading_type)
),
actual AS (
  SELECT
    user_id,
    reading_type,
    COUNT(*) as actual_count
  FROM readings
  WHERE time >= '2025-01-19' AND time < '2025-01-20'
  GROUP BY user_id, reading_type
)
SELECT
  e.user_id,
  e.reading_type,
  COALESCE(a.actual_count, 0) as actual,
  e.expected_count as expected,
  ROUND(COALESCE(a.actual_count, 0)::numeric / e.expected_count * 100, 2) as completeness_pct
FROM expected e
LEFT JOIN actual a ON e.user_id = a.user_id AND e.reading_type = a.reading_type;
```

---

## Schema Evolution

### Versioning Strategy

1. **Additive Changes**: New fields are optional, old clients ignore them
2. **Breaking Changes**: New API version (v1 → v2)
3. **Deprecation**: 6-month warning before removal

### Migration Example

```sql
-- Adding new reading type
ALTER TABLE readings
ADD CONSTRAINT valid_reading_type
CHECK (reading_type IN (
  'temperature', 'heart_rate', 'hrv_rmssd', 'spo2',
  'blood_glucose'  -- New type added
));

-- Adding new field
ALTER TABLE users
ADD COLUMN prakriti VARCHAR(20);
```

---

## Data Privacy

### PII Fields

| Model | PII Fields | Handling |
|-------|------------|----------|
| User | email, name, date_of_birth | Encrypted at rest |
| Device | hardware_id | Hashed for lookup |
| Event | notes | Encrypted at rest |

### Data Retention

| Data Type | Retention | After Expiry |
|-----------|-----------|--------------|
| Raw readings | 2 years | Deleted |
| Hourly aggregates | 5 years | Deleted |
| Daily summaries | Indefinite | Anonymized after 5 years |
| Events | 2 years | Deleted |
| Predictions | 1 year | Deleted |

### Export Format (DPDP Compliance)

```json
{
  "export_type": "full_user_data",
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "exported_at": "2025-01-19T10:30:00Z",
  "data": {
    "profile": {...},
    "devices": [...],
    "readings": [...],
    "events": [...],
    "predictions": [...],
    "insights": [...]
  }
}
```

---

## References

- [FHIR R4 Vital Signs](https://hl7.org/fhir/R4/vitalsigns.html)
- [IEEE 11073 Health Devices](https://standards.ieee.org/industry-connections/ec/ieee-11073-standards-committee/)
- [Open mHealth Schemas](https://www.openmhealth.org/documentation/)
