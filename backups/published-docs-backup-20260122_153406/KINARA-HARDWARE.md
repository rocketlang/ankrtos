# Kinara - Hardware Reference Designs

> Open reference designs for Kinara-compatible wearables

---

## Tags
`Hardware` `IoT` `Sensors` `Embedded` `BLE` `Wearables`

---

## Overview

Kinara provides open reference designs for hardware partners to build compatible devices. These designs are:

- **Open Source**: Schematics and firmware available
- **Certified**: Test suite for Kinara compatibility
- **Flexible**: Adapt to your manufacturing capabilities
- **Cost-Optimized**: Designed for India market pricing

---

## Reference Designs

### Design Matrix

| Design | Sensors | BOM Cost | Target Retail | Complexity |
|--------|---------|----------|---------------|------------|
| KB-100 Basic | Temp | ~₹600 | ₹2,999 | Low |
| KB-200 Standard | Temp + HR/HRV | ~₹1,200 | ₹5,999 | Medium |
| KB-300 Advanced | Temp + HR + GSR + IMU | ~₹1,800 | ₹8,999 | Medium |
| KB-400 Cooling | KB-300 + Peltier | ~₹2,800 | ₹14,999 | High |

---

## KB-100: Basic Temperature Band

### Overview
Simple, affordable temperature monitoring band for entry-level tracking.

```
┌─────────────────────────────────────────────────────────────┐
│                    KB-100 BASIC BAND                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   BLOCK DIAGRAM                      │   │
│  │                                                      │   │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐         │   │
│  │   │  TEMP   │    │  MCU    │    │   BLE   │         │   │
│  │   │ MAX30205│───▶│ ESP32-C3│───▶│ Antenna │         │   │
│  │   │         │    │         │    │         │         │   │
│  │   └─────────┘    └────┬────┘    └─────────┘         │   │
│  │                       │                              │   │
│  │                  ┌────┴────┐                         │   │
│  │                  │ POWER   │                         │   │
│  │                  │ LiPo    │                         │   │
│  │                  │ 150mAh  │                         │   │
│  │                  └─────────┘                         │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SPECIFICATIONS:                                            │
│  • Temperature accuracy: ±0.1°C                             │
│  • Sampling rate: 1 Hz                                      │
│  • Battery life: 7-10 days                                  │
│  • Connectivity: BLE 5.0                                    │
│  • Water resistance: IP54                                   │
│  • Weight: 18g                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Bill of Materials

| Component | Part Number | Quantity | Unit Cost | Total |
|-----------|-------------|----------|-----------|-------|
| MCU | ESP32-C3-MINI-1 | 1 | ₹180 | ₹180 |
| Temp Sensor | MAX30205 | 1 | ₹150 | ₹150 |
| LiPo Battery | 150mAh 3.7V | 1 | ₹80 | ₹80 |
| Charge IC | TP4056 | 1 | ₹15 | ₹15 |
| LDO | ME6211 3.3V | 1 | ₹10 | ₹10 |
| Crystal | 32.768kHz | 1 | ₹15 | ₹15 |
| Antenna | Chip antenna | 1 | ₹20 | ₹20 |
| Passives | Caps, resistors | Set | ₹30 | ₹30 |
| PCB | 2-layer, 20x25mm | 1 | ₹25 | ₹25 |
| Enclosure | Silicone band | 1 | ₹50 | ₹50 |
| USB-C Connector | - | 1 | ₹15 | ₹15 |
| **Total BOM** | | | | **₹590** |

### Schematic (Simplified)

```
                          VCC 3.3V
                             │
                             │
    ┌────────────────────────┼────────────────────────┐
    │                        │                        │
    │  ┌─────────────────────┴─────────────────────┐  │
    │  │              ESP32-C3-MINI                │  │
    │  │                                           │  │
    │  │  GPIO2 ─────────────────── MAX30205 SDA   │  │
    │  │  GPIO3 ─────────────────── MAX30205 SCL   │  │
    │  │                                           │  │
    │  │  GPIO18 ────────────────── LED (Status)   │  │
    │  │  GPIO19 ────────────────── Button         │  │
    │  │                                           │  │
    │  │  ADC1_0 ────────────────── VBAT/2         │  │
    │  │                                           │  │
    │  └───────────────────────────────────────────┘  │
    │                                                 │
    │                                                 │
    │  ┌───────────┐    ┌───────────┐               │
    │  │  TP4056   │    │  ME6211   │               │
    │  │  Charger  │───▶│  LDO 3.3V │───▶ VCC       │
    │  └─────┬─────┘    └───────────┘               │
    │        │                                       │
    │   ┌────┴────┐                                  │
    │   │  LiPo   │                                  │
    │   │ 150mAh  │                                  │
    │   └─────────┘                                  │
    │                                                │
    └────────────────────────────────────────────────┘
```

### Firmware Features

```c
// KB-100 Firmware capabilities
- Temperature sampling at 1 Hz
- BLE advertising with Kinara service UUID
- GATT characteristics for:
  - Temperature reading (notify)
  - Device info (read)
  - Battery level (read/notify)
- Deep sleep between samples (~10µA)
- OTA firmware update support
- Factory reset via long button press
```

---

## KB-200: Standard Health Band

### Overview
Temperature + Heart Rate + HRV monitoring for comprehensive health tracking.

```
┌─────────────────────────────────────────────────────────────┐
│                  KB-200 STANDARD BAND                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   BLOCK DIAGRAM                      │   │
│  │                                                      │   │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐         │   │
│  │   │  TEMP   │    │         │    │         │         │   │
│  │   │ MAX30205│───▶│         │    │         │         │   │
│  │   └─────────┘    │         │    │   BLE   │         │   │
│  │                  │  nRF52  │───▶│ Antenna │         │   │
│  │   ┌─────────┐    │  840    │    │         │         │   │
│  │   │   PPG   │───▶│         │    │         │         │   │
│  │   │ MAX30102│    │         │    └─────────┘         │   │
│  │   └─────────┘    └────┬────┘                         │   │
│  │                       │                              │   │
│  │                  ┌────┴────┐                         │   │
│  │                  │ POWER   │                         │   │
│  │                  │ LiPo    │                         │   │
│  │                  │ 180mAh  │                         │   │
│  │                  └─────────┘                         │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SPECIFICATIONS:                                            │
│  • Temperature: ±0.1°C                                      │
│  • Heart rate: ±2 BPM                                       │
│  • HRV: RMSSD, SDNN                                         │
│  • Sampling: Temp 1Hz, PPG 25Hz                             │
│  • Battery life: 5-7 days                                   │
│  • Connectivity: BLE 5.0                                    │
│  • Water resistance: IP67                                   │
│  • Weight: 22g                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Bill of Materials

| Component | Part Number | Quantity | Unit Cost | Total |
|-----------|-------------|----------|-----------|-------|
| MCU | nRF52840 (module) | 1 | ₹450 | ₹450 |
| Temp Sensor | MAX30205 | 1 | ₹150 | ₹150 |
| PPG Sensor | MAX30102 | 1 | ₹180 | ₹180 |
| LiPo Battery | 180mAh 3.7V | 1 | ₹100 | ₹100 |
| Charge IC | BQ24072 | 1 | ₹40 | ₹40 |
| LDO | TLV713 | 1 | ₹15 | ₹15 |
| LED (PPG) | Green + Red | 2 | ₹10 | ₹20 |
| Photodiode | Integrated | 0 | ₹0 | ₹0 |
| Passives | Caps, resistors | Set | ₹40 | ₹40 |
| PCB | 4-layer, 22x28mm | 1 | ₹60 | ₹60 |
| Enclosure | Medical silicone | 1 | ₹100 | ₹100 |
| USB-C + Magnetic | - | 1 | ₹45 | ₹45 |
| **Total BOM** | | | | **₹1,200** |

### Firmware Features

```c
// KB-200 Firmware capabilities
- All KB-100 features plus:
- PPG sampling at 25 Hz
- Real-time heart rate calculation
- HRV computation (RMSSD, SDNN)
- RR interval extraction
- Motion artifact rejection (using acc if present)
- Edge ML inference hooks
- Configurable sampling rates
- Data buffering for offline sync (up to 24h)
```

---

## KB-300: Advanced Multi-Sensor

### Overview
Full-featured health monitoring with GSR and motion sensing.

```
┌─────────────────────────────────────────────────────────────┐
│                   KB-300 ADVANCED BAND                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SENSORS:                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │   │
│  │  │  TEMP   │  │   PPG   │  │   IMU   │  │  GSR   │ │   │
│  │  │MAX30205 │  │MAX30102 │  │LSM6DSO  │  │AD8232  │ │   │
│  │  │         │  │         │  │         │  │        │ │   │
│  │  │ ±0.1°C  │  │ HR+SpO2 │  │ 6-axis  │  │  EDA   │ │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └────────┘ │   │
│  │       │            │            │            │      │   │
│  │       └────────────┴────────────┴────────────┘      │   │
│  │                          │                          │   │
│  │                    ┌─────┴─────┐                    │   │
│  │                    │  nRF52840 │                    │   │
│  │                    │  + Edge ML│                    │   │
│  │                    └───────────┘                    │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SPECIFICATIONS:                                            │
│  • All KB-200 features plus:                                │
│  • 6-axis motion (accelerometer + gyroscope)                │
│  • GSR/EDA measurement                                      │
│  • SpO2 estimation                                          │
│  • On-device ML inference                                   │
│  • Battery: 200mAh, 4-5 days                                │
│  • Edge hot flash prediction                                │
│                                                             │
│  BOM: ~₹1,800 | Retail: ₹8,999                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Bill of Materials

| Component | Part Number | Quantity | Unit Cost | Total |
|-----------|-------------|----------|-----------|-------|
| MCU | nRF52840 (module) | 1 | ₹450 | ₹450 |
| Temp Sensor | MAX30205 | 1 | ₹150 | ₹150 |
| PPG Sensor | MAX30102 | 1 | ₹180 | ₹180 |
| IMU | LSM6DSO | 1 | ₹120 | ₹120 |
| GSR AFE | AD8232 | 1 | ₹100 | ₹100 |
| GSR Electrodes | Dry electrodes | 2 | ₹30 | ₹60 |
| LiPo Battery | 200mAh 3.7V | 1 | ₹120 | ₹120 |
| Charge IC | BQ24072 | 1 | ₹40 | ₹40 |
| Haptic Motor | LRA | 1 | ₹50 | ₹50 |
| Haptic Driver | DRV2605L | 1 | ₹80 | ₹80 |
| Passives | - | Set | ₹60 | ₹60 |
| PCB | 4-layer, 25x30mm | 1 | ₹80 | ₹80 |
| Enclosure | Medical silicone | 1 | ₹150 | ₹150 |
| Strap | Adjustable | 1 | ₹60 | ₹60 |
| **Total BOM** | | | | **₹1,800** |

---

## KB-400: Active Cooling Band

### Overview
Advanced band with Peltier-based active cooling for hot flash relief.

```
┌─────────────────────────────────────────────────────────────┐
│                   KB-400 COOLING BAND                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │         ┌─────────────────────────────────┐         │   │
│  │         │      COOLING MODULE             │         │   │
│  │         │                                 │         │   │
│  │         │  ┌─────────┐    ┌─────────┐    │         │   │
│  │         │  │ PELTIER │    │  HEAT   │    │         │   │
│  │         │  │   TEC   │───▶│  SINK   │    │         │   │
│  │         │  │  (5W)   │    │ (Mini)  │    │         │   │
│  │         │  └─────────┘    └─────────┘    │         │   │
│  │         │                                 │         │   │
│  │         │  Cold side contacts skin        │         │   │
│  │         │  Can cool 5-8°C below ambient   │         │   │
│  │         │  Duration: Up to 3 min/event    │         │   │
│  │         │                                 │         │   │
│  │         └─────────────────────────────────┘         │   │
│  │                          │                          │   │
│  │    ┌─────────────────────┴─────────────────────┐   │   │
│  │    │           KB-300 SENSOR SUITE              │   │   │
│  │    │  Temp + PPG + IMU + GSR + Edge ML          │   │   │
│  │    └────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SPECIFICATIONS:                                            │
│  • All KB-300 features plus:                                │
│  • Active Peltier cooling (5W max)                          │
│  • Cooling delta: 5-8°C below skin temp                     │
│  • Cooling duration: 3 min max per activation               │
│  • Battery: 500mAh (2-3 days with moderate use)             │
│  • Auto-trigger on prediction or manual                     │
│                                                             │
│  BOM: ~₹2,800 | Retail: ₹14,999                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cooling System Design

```
┌─────────────────────────────────────────────────────────────┐
│                  PELTIER COOLING SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  COMPONENTS:                                                │
│                                                             │
│  1. Peltier TEC Module                                      │
│     • Part: TEC1-01705 (5W, 15x15mm)                        │
│     • Max ΔT: 67°C                                          │
│     • Current: 1.5A @ 5V                                    │
│                                                             │
│  2. Heat Sink                                               │
│     • Mini aluminum fins                                    │
│     • Thermal paste interface                               │
│                                                             │
│  3. Driver Circuit                                          │
│     • H-bridge for direction control                        │
│     • PWM for power control                                 │
│     • Current limiting (safety)                             │
│                                                             │
│  4. Thermal Management                                      │
│     • Cold side thermistor (feedback)                       │
│     • Skin contact detection                                │
│     • Auto-shutoff on overheat                              │
│                                                             │
│  OPERATION:                                                 │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Prediction → Trigger → Ramp Up → Maintain → Ramp Down  │
│  │     │            │          │          │          │     │
│  │   -90s          0s        +5s      +180s      +200s     │
│  │                                                         │
│  │  Power:  0%   →  100%  →  60%   →   0%                  │
│  │  Temp Δ: 0°C  →  -8°C  → -5°C  →   0°C                  │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Sensor Integration Guide

### I2C Bus Configuration

```
┌─────────────────────────────────────────────────────────────┐
│                  I2C BUS LAYOUT                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MCU I2C Master (400kHz)                                    │
│       │                                                     │
│       ├─── MAX30205 (Temp)    Address: 0x48                 │
│       │                                                     │
│       ├─── MAX30102 (PPG)     Address: 0x57                 │
│       │                                                     │
│       ├─── LSM6DSO (IMU)      Address: 0x6A                 │
│       │                                                     │
│       └─── DRV2605L (Haptic)  Address: 0x5A                 │
│                                                             │
│  Pull-ups: 4.7kΩ to VCC                                     │
│  Bus capacitance: Keep under 400pF                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Power Management

```c
// Power states for KB-200/300

typedef enum {
    POWER_STATE_ACTIVE,      // Full operation, ~15mA
    POWER_STATE_SAMPLING,    // Periodic sampling, ~5mA avg
    POWER_STATE_IDLE,        // BLE advertising only, ~100µA
    POWER_STATE_SLEEP,       // Deep sleep, ~10µA
    POWER_STATE_SHIPPING     // Ultra-low, ~1µA
} power_state_t;

// Typical duty cycle (KB-200):
// - 1 sec active sampling every 60 sec
// - BLE connected for sync 5 min/day
// - Average current: ~0.8mA
// - Battery life: 180mAh / 0.8mA = ~225 hours = ~9 days
```

---

## Manufacturing Guidelines

### PCB Specifications

| Parameter | KB-100 | KB-200/300 | KB-400 |
|-----------|--------|------------|--------|
| Layers | 2 | 4 | 4 |
| Thickness | 0.8mm | 1.0mm | 1.2mm |
| Min trace | 0.15mm | 0.1mm | 0.1mm |
| Min via | 0.3mm | 0.2mm | 0.2mm |
| Finish | ENIG | ENIG | ENIG |
| Impedance | No | 50Ω RF | 50Ω RF |

### Assembly Notes

1. **PPG Sensor Placement**
   - Direct skin contact required
   - Optical window must be clean
   - LED and photodiode alignment critical

2. **Temperature Sensor**
   - Thermal interface to skin
   - Isolate from heat-generating components
   - Calibration at 25°C and 37°C

3. **Antenna**
   - Keep-out zone around antenna
   - No ground pour under antenna
   - Test with body phantom

4. **Waterproofing**
   - Conformal coating on PCB
   - Gasket on enclosure
   - IP67 testing required

### Testing Requirements

```
┌─────────────────────────────────────────────────────────────┐
│                  QA TEST CHECKLIST                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ELECTRICAL TESTS                                           │
│  □ Power consumption (active, idle, sleep)                  │
│  □ Battery charging (rate, termination)                     │
│  □ BLE range (10m minimum)                                  │
│  □ Sensor accuracy verification                             │
│                                                             │
│  FUNCTIONAL TESTS                                           │
│  □ Sensor readings within spec                              │
│  □ BLE pairing and data transfer                            │
│  □ Firmware update (OTA)                                    │
│  □ Factory reset                                            │
│  □ Button/LED functionality                                 │
│                                                             │
│  ENVIRONMENTAL TESTS                                        │
│  □ Temperature cycling (-10°C to +50°C)                     │
│  □ Water resistance (IP67)                                  │
│  □ Drop test (1m onto concrete)                             │
│  □ Strap durability (10,000 cycles)                         │
│                                                             │
│  SAFETY TESTS                                               │
│  □ Battery protection (overcharge, overdischarge)           │
│  □ Thermal limits (skin contact <43°C)                      │
│  □ EMC pre-compliance                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Certification Path

### India (BIS)

| Certification | Requirement | Timeline |
|---------------|-------------|----------|
| BIS (CRS) | Mandatory for electronics | 4-6 weeks |
| WPC | For BLE/wireless | 2-4 weeks |
| LMPC | If contains lithium battery | 2-3 weeks |

### International (Optional)

| Certification | Market | Cost Estimate |
|---------------|--------|---------------|
| CE | Europe | ₹2-3L |
| FCC | USA | ₹1.5-2L |
| RoHS | EU compliance | Included in CE |

---

## Supplier Recommendations

### Components (India)

| Type | Supplier | Notes |
|------|----------|-------|
| MCU/Sensors | Robu.in, Element14 | Good stock |
| PCB | PCBWay, JLCPCB | China, fast turnaround |
| Batteries | Local (Lipo.in) | Certified cells |
| Enclosures | Local injection molding | MOQ 500+ |

### ODM Partners

| Partner | Capability | MOQ |
|---------|------------|-----|
| Sahasra Electronics | Full ODM | 1,000 |
| Dixon Technologies | Large scale | 10,000 |
| Optiemus Infracom | IoT devices | 5,000 |

---

## Kinara Certification

### "Powered by Kinara" Requirements

1. **Hardware Compatibility**
   - Pass Kinara hardware test suite
   - Meet sensor accuracy specs
   - Implement required BLE services

2. **Firmware Compliance**
   - Use Kinara embedded SDK
   - Support OTA updates
   - Implement security requirements

3. **Documentation**
   - Provide integration guide
   - Submit test reports
   - Maintain firmware changelog

### Certification Process

```
Application → Technical Review → Testing → Certification
    │              │                │            │
  Week 1        Week 2-3         Week 4       Week 5

Cost: ₹50,000 (one-time) + ₹10,000/year
```

---

## Resources

- **Schematics**: `/hardware/schematics/`
- **Gerbers**: `/hardware/gerbers/`
- **BOM**: `/hardware/bom/`
- **Firmware**: `/firmware/`
- **3D Models**: `/hardware/enclosures/`
- **Test Fixtures**: `/hardware/test/`

---

## Changelog

### v1.0 (2025-01-19)
- Initial reference designs
- KB-100, KB-200, KB-300, KB-400

---

*Open hardware for better health*
