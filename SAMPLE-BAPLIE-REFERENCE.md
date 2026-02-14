# Sample BAPLIE File Reference

**File:** `/root/sample-baplie-test.edi`
**Format:** EDIFACT BAPLIE (Bay Plan/Stowage Plan)
**Version:** SMDG 2.0 (UN/EDIFACT D95B)

## Vessel Information

- **Vessel Name:** OCEAN VOYAGER
- **Voyage Number:** VOYAGE2024
- **IMO Number:** 9IMO1234567
- **Carrier:** MAERSK LINE
- **Port of Loading:** INJNP (Jawaharlal Nehru Port, India)
- **Next Port:** SGSIN (Singapore)

## Container Summary

**Total Containers:** 25

### Breakdown by Size
- **20ft containers (22G1/22R1):** 14 containers
- **40ft containers (42G1/42R1):** 11 containers

### Breakdown by Type
- **Dry containers (G1):** 20 containers
- **Reefer containers (R1):** 5 containers (temperature controlled)

### Breakdown by Status
- **Full containers:** 21 containers (weights 12,700 - 29,400 kg)
- **Empty containers:** 4 containers (weights 6,800 - 8,500 kg)

## Container Details

| # | Container No. | Size | Type | Weight (kg) | Bay | Row | Tier | POL | POD | Temp |
|---|---------------|------|------|-------------|-----|-----|------|-----|-----|------|
| 1 | MSCU1234567 | 20ft | Dry | 28,500 | 01 | 04 | 02 | INJNP | SGSIN | - |
| 2 | MSCU2345678 | 20ft | Dry | 25,600 | 01 | 06 | 04 | INJNP | USLAX | - |
| 3 | MSCU3456789 | 40ft | Dry | 18,900 | 03 | 02 | 02 | SGSIN | AEDXB | - |
| 4 | MSCU4567890 | 40ft | Dry | 22,300 | 03 | 04 | 04 | INJNP | NLRTM | - |
| 5 | MSCU5678901 | 20ft | **Reefer** | 27,800 | 05 | 02 | 02 | INJNP | USNYC | **-18°C** |
| 6 | MSCU6789012 | 20ft | **Reefer** | 26,500 | 05 | 04 | 04 | SGSIN | GBSOU | **-20°C** |
| 7 | MSCU7890123 | 40ft | Dry | 15,200 | 07 | 02 | 02 | INJNP | BEZEE | - |
| 8 | MSCU8901234 | 20ft | Dry | 29,400 | 07 | 04 | 04 | INJNP | FRLEH | - |
| 9 | MSCU9012345 | 40ft | Dry | 12,700 | 09 | 02 | 02 | SGSIN | DEHAM | - |
| 10 | MSCU0123456 | 20ft | Dry | 24,800 | 09 | 04 | 04 | INJNP | ESBCN | - |
| 11 | MSCU1122334 | 40ft | **Reefer** | 26,900 | 11 | 02 | 02 | INJNP | ITGOA | **-25°C** |
| 12 | MSCU2233445 | 20ft | Dry | **8,500** | 11 | 04 | 04 | SGSIN | MAPTM | - |
| 13 | MSCU3344556 | 40ft | Dry | 19,800 | 01 | 02 | 06 | INJNP | TRIST | - |
| 14 | MSCU4455667 | 20ft | Dry | 27,200 | 03 | 02 | 06 | INJNP | USNYC | - |
| 15 | MSCU5566778 | 40ft | Dry | 21,500 | 05 | 02 | 06 | SGSIN | USLAX | - |
| 16 | MSCU6677889 | 20ft | **Reefer** | 28,100 | 07 | 02 | 06 | INJNP | AEDXB | **-22°C** |
| 17 | MSCU7788990 | 40ft | Dry | 16,400 | 09 | 02 | 06 | INJNP | NLRTM | - |
| 18 | MSCU8899001 | 20ft | Dry | **6,800** | 11 | 02 | 06 | SGSIN | GBSOU | - |
| 19 | MSCU9900112 | 40ft | Dry | 23,400 | 01 | 04 | 08 | INJNP | BEZEE | - |
| 20 | MSCU0011223 | 20ft | Dry | 26,700 | 03 | 04 | 08 | INJNP | FRLEH | - |
| 21 | MSCU1234000 | 40ft | **Reefer** | 27,600 | 05 | 04 | 08 | SGSIN | DEHAM | **-18°C** |
| 22 | MSCU2345111 | 20ft | Dry | 25,100 | 07 | 04 | 08 | INJNP | ESBCN | - |
| 23 | MSCU3456222 | 40ft | Dry | 20,300 | 09 | 04 | 08 | INJNP | ITGOA | - |
| 24 | MSCU4567333 | 20ft | Dry | **7,200** | 11 | 04 | 08 | SGSIN | MAPTM | - |
| 25 | MSCU5678444 | 40ft | Dry | 18,600 | 01 | 02 | 10 | INJNP | TRIST | - |

## Bay Plan Layout

```
Max Bay: 11 (bays 01, 03, 05, 07, 09, 11)
Max Row: 06 (rows 02, 04, 06)
Max Tier: 10 (tiers 02, 04, 06, 08, 10)
```

### Stacking Pattern

**Tier 02 (Bottom):**
- Bay 01: MSCU1234567 (20ft, 28.5t), MSCU3344556 (40ft, 19.8t)
- Bay 03: MSCU3456789 (40ft, 18.9t), MSCU4455667 (20ft, 27.2t)
- Bay 05: MSCU5678901 (20ft REEFER, 27.8t), MSCU5566778 (40ft, 21.5t)
- Bay 07: MSCU7890123 (40ft, 15.2t), MSCU6677889 (20ft REEFER, 28.1t)
- Bay 09: MSCU9012345 (40ft, 12.7t), MSCU7788990 (40ft, 16.4t)
- Bay 11: MSCU1122334 (40ft REEFER, 26.9t), MSCU8899001 (20ft, 6.8t - EMPTY)

**Tier 04:**
- Bay 01: MSCU2345678 (20ft, 25.6t), MSCU9900112 (40ft, 23.4t)
- Bay 03: MSCU4567890 (40ft, 22.3t), MSCU0011223 (20ft, 26.7t)
- Bay 05: MSCU6789012 (20ft REEFER, 26.5t), MSCU1234000 (40ft REEFER, 27.6t)
- Bay 07: MSCU8901234 (20ft, 29.4t - HEAVIEST), MSCU2345111 (20ft, 25.1t)
- Bay 09: MSCU0123456 (20ft, 24.8t), MSCU3456222 (40ft, 20.3t)
- Bay 11: MSCU2233445 (20ft, 8.5t - EMPTY), MSCU4567333 (20ft, 7.2t - EMPTY)

**Tier 10 (Top):**
- Bay 01: MSCU5678444 (40ft, 18.6t)

## Weight Distribution

### Heavy Containers (>25,000 kg) - RED in heat map
- MSCU8901234: 29,400 kg **(HEAVIEST)**
- MSCU1234567: 28,500 kg
- MSCU6677889: 28,100 kg
- MSCU5678901: 27,800 kg
- MSCU1234000: 27,600 kg
- MSCU4455667: 27,200 kg
- MSCU1122334: 26,900 kg
- MSCU0011223: 26,700 kg
- MSCU6789012: 26,500 kg
- MSCU2345678: 25,600 kg
- MSCU2345111: 25,100 kg

### Medium Containers (15,000 - 25,000 kg) - ORANGE/YELLOW in heat map
- MSCU0123456: 24,800 kg
- MSCU9900112: 23,400 kg
- MSCU4567890: 22,300 kg
- MSCU5566778: 21,500 kg
- MSCU3456222: 20,300 kg
- MSCU3344556: 19,800 kg
- MSCU3456789: 18,900 kg
- MSCU5678444: 18,600 kg
- MSCU7788990: 16,400 kg
- MSCU7890123: 15,200 kg

### Light Containers (12,000 - 15,000 kg) - LIGHT YELLOW in heat map
- MSCU9012345: 12,700 kg **(LIGHTEST FULL)**

### Empty Containers (<10,000 kg) - GRAY
- MSCU2233445: 8,500 kg
- MSCU4567333: 7,200 kg
- MSCU8899001: 6,800 kg **(LIGHTEST)**

## Reefer Containers (Temperature Controlled)

All shown in **BLUE** color:

1. **MSCU5678901** - Bay 05, Row 02, Tier 02 - 27,800 kg @ -18°C
2. **MSCU6789012** - Bay 05, Row 04, Tier 04 - 26,500 kg @ -20°C
3. **MSCU1122334** - Bay 11, Row 02, Tier 02 - 26,900 kg @ -25°C (coldest)
4. **MSCU6677889** - Bay 07, Row 02, Tier 06 - 28,100 kg @ -22°C
5. **MSCU1234000** - Bay 05, Row 04, Tier 08 - 27,600 kg @ -18°C

## Port Destinations

- **SGSIN** (Singapore): 7 containers
- **INJNP** (India): 13 containers
- **USLAX** (Los Angeles): 2 containers
- **USNYC** (New York): 2 containers
- **AEDXB** (Dubai): 2 containers
- **NLRTM** (Rotterdam): 2 containers
- **GBSOU** (Southampton): 2 containers
- **BEZEE** (Zeebrugge): 2 containers
- **FRLEH** (Le Havre): 2 containers
- **DEHAM** (Hamburg): 2 containers
- **ESBCN** (Barcelona): 2 containers
- **ITGOA** (Genoa): 2 containers
- **MAPTM** (Port Tangier): 2 containers
- **TRIST** (Istanbul): 2 containers

## BAPLIE Structure Explanation

### Key Segments

**UNB** - Interchange Header
- Sender: TERMINALCODE
- Receiver: SHIPPINGLINE
- Date/Time: 2026-02-14 14:30

**UNH** - Message Header
- Message Type: BAPLIE (Bay Plan Occupied and Empty)
- Version: D95B, SMDG 2.0

**BGM** - Beginning of Message
- Document Type: 85 (Bay Plan)
- Document Number: BAPLIE001

**TDT** - Transport Details
- Vessel: OCEAN VOYAGER
- IMO: 9IMO1234567

**LOC** - Locations
- LOC+5: Port of Loading (INJNP)
- LOC+61: Port of Discharge (SGSIN)

**EQD** - Equipment Details (for each container)
- Equipment ID: Container Number
- Size/Type: 22G1 (20ft dry), 42G1 (40ft dry), 22R1 (20ft reefer), 42R1 (40ft reefer)
- Status: Full/Empty (2=Full, 4=Empty, 5=Full, 6=Full+Reefer)

**MEA** - Measurements
- VGM (Verified Gross Mass) in kilograms

**TMP** - Temperature (for reefers only)
- Temperature setting in Celsius

**LOC+147** - Stowage Position
- Format: BBRRTTSS (Bay, Row, Tier, Slot)
- Example: 01040282 = Bay 01, Row 04, Tier 02, Slot 82

**LOC+11** - Port of Loading
**LOC+7** - Port of Discharge

## Testing Scenarios

### What to Test

1. **Upload & Parse**
   - ✅ File should upload without errors
   - ✅ Parser should extract 25 containers
   - ✅ Vessel info: OCEAN VOYAGER, VOYAGE2024
   - ✅ Max Bay: 11, Max Row: 6, Max Tier: 10

2. **2D View**
   - ✅ Grid layout showing all bays and rows
   - ✅ Heat map: RED (heavy) → YELLOW (light) → GRAY (empty)
   - ✅ Blue containers for 5 reefers
   - ✅ Gray containers for 4 empties
   - ✅ Hover shows container number and weight
   - ✅ Click shows detail modal

3. **3D View**
   - ✅ Realistic ship deck with containers
   - ✅ 20ft containers smaller than 40ft
   - ✅ Stacking visible (tiers 02, 04, 06, 08, 10)
   - ✅ Color coding same as 2D
   - ✅ Rotate/pan/zoom controls work
   - ✅ Hover shows labels
   - ✅ Click shows detail modal

4. **Container Detail Modal**
   - ✅ Position: Bay/Row/Tier displayed correctly
   - ✅ Weight in tonnes and kg
   - ✅ Full/Empty badge
   - ✅ Reefer badge for 5 containers
   - ✅ Container type (20ft/40ft)

5. **View Toggle**
   - ✅ Switch between 2D and 3D smoothly
   - ✅ Active view highlighted

6. **Edge Cases**
   - ✅ Heaviest: MSCU8901234 (29,400 kg) - should be RED
   - ✅ Lightest full: MSCU9012345 (12,700 kg) - should be LIGHT YELLOW
   - ✅ Lightest empty: MSCU8899001 (6,800 kg) - should be GRAY
   - ✅ Highest tier: Bay 01, Tier 10 - should show in 3D
   - ✅ Reefer coldest: MSCU1122334 (-25°C)

## Expected Visualization

### 2D Heat Map Colors
```
RED    : 25,000+ kg (11 containers)
ORANGE : 20,000-25,000 kg (6 containers)
YELLOW : 15,000-20,000 kg (4 containers)
LIGHT  : 12,000-15,000 kg (1 container - MSCU9012345)
GRAY   : <10,000 kg (4 containers - empties)
BLUE   : Reefers (5 containers - override weight color)
```

### 3D Stacking
- **Bottom layer (Tier 02):** 12 containers
- **Middle layer (Tier 04):** 12 containers
- **Top layer (Tier 10):** 1 container
- Clear height differences visible

---

**File Location:** `/root/sample-baplie-test.edi`
**Ready to upload at:** http://localhost:3080/
