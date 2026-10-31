# Current evidence — 2026-10-31

The historical hypotheses below are superseded where they conflict with this section.
Observed device: VID `314B`, PID `1026`, product `APEX200`, vendor collection `FF02:0002`, interface 0 in Windows enumeration. Retained metadata: [USB-CAPS-002](../research/evidence/usb-caps.json). Windows input/output lengths are 65 including report-ID byte; WebHID uses report ID 0 separately with 64 payload bytes. No feature reports were declared. This does not establish the MCU vendor, firmware version or display type.

[Retained static analysis](../research/evidence/PROTOCOL.md) documents GameKeyboard.exe SHA-256 and instruction locations. Its 128-byte default is not the connected device size. The new offline RGB codec uses the observed 64-byte shape `[FA,10,1,1,00,length,rawParameter,R,G,B,keyIndices...,padding]`. Raw parameter semantics and physical key mapping are unresolved; tests are synthetic instruction-derived fixtures, not captures. Trigger readback payloads decode raw little-endian fields without claiming millimetres or RT mode meanings.

No codecs are connected to transport writes. All real output/feature writes are locked. Readback transactions and restore remain unimplemented. No firmware/reset/calibration operations exist in this change.

Display investigation: [static search](../research/evidence/display-static-search.json) matches irrelevant Qt symbols only. No command, resolution, OLED panel technology, pixel format or streaming support is established. UI drafts are local only. Original binaries remain outside Git.

---

# HID Protocol Documentation — Ant Esports APEX 200S

> **Status:** Preliminary Reverse-Engineering Hypotheses (Awaiting Physical Device / Binary Capture)  
> **Confidence Level:** Unverified (Literature & OEM comparison basis)

---

## 1. Device Identification

| Parameter | Hypothesized Value | Status | Verification Method |
|---|---|---|---|
| **Vendor ID (VID)** | `0x314B` (observed in USB-CAPS-002) | Observed | Check Windows Device Manager: `HID\VID_314B&PID_1026` |
| **Product ID (PID)** | `0x1026` (observed in USB-CAPS-002) | Observed | USB Enumeration check |
| **Manufacturer String** | "Ant Esports" or OEM default | Unverified | USB String Descriptor 0x01 |
| **Product String** | "APEX200" (observed) | Observed | USB String Descriptor 0x02 |
| **USB Class** | 0x03 (Human Interface Device) | Expected | USB Standard Descriptor |
| **Config Interface** | Usage Page `0xFF02`, Usage `0x0002` (observed) | Observed | Vendor-specific collection on Interface 0 |

> **Note:** Historical Sinowealth VID `0x3402` / PID `0x0300` hypothesis is superseded by USB-CAPS-002. The observed `314B:1026` identity should be used for discovery.

---

## 2. Chipset & Firmware Architecture

**MCU Vendor:** Unconfirmed. Static analysis of GameKeyboard.exe shows Sinowealth-related strings but the connected device reports VID `314B` (not `3402`). OEM platform may differ from static analysis assumptions.

**Switch Technology:** Haimu Linear Hall-Effect (contactless magnetic flux). Actuation depth claimed 0.1mm–3.6mm; ADC scaling unverified.

---

## 3. Communication Channel

### USB Interface Mapping (Observed)
- **Interface 0:** Vendor collection `FF02:0002` — 64-byte Input/Output reports, 0 Feature reports. Target for APEX CONTROL.

> **Note:** Standard Boot Keyboard, Consumer, and Mouse interfaces were not observed in USB-CAPS-002 enumeration. The vendor configuration channel appears on Interface 0, not Interface 3 as commonly assumed for Sinowealth.

### Report Framing Discrepancy (Critical)
| Source | Frame Size | Details |
|---|---|---|
| Static analysis (GameKeyboard.exe) | 129 bytes HIDAPI (1 report ID + 128 payload) | Global at VA `0x140194990` initialized to 128; HIDAPI `hid_write` called with 129 bytes |
| Observed USB device (USB-CAPS-002) | 65 bytes Windows (1 report ID + 64 payload) | WebHID uses 64-byte payload with separate report ID |
| Offline codec (this repo) | 64 bytes WebHID payload | Magic `0xFA`, opcode, frame, total, field4, length, payload, padding |

**Resolution pending:** Physical device captures needed to determine if firmware supports both framings or if 128-byte setting is a default not used by this firmware version.

---

## 4. Reverse-Engineering Capture Plan

When physical keyboard or official software (`GameKeyboard.exe`) is available:

### Step 1: Static Binary Analysis
- Inspect `original-software/GameKeyboard.exe` using PEStudio / Detect It Easy / Ghidra.
- Search for HIDAPI usage: `hid_open`, `hid_write`, `hid_send_feature_report`, `hid_get_feature_report`.
- Extract VID/PID constants passed into `hid_open(vendor_id, product_id, serial)`.
- Extract command opcode tables from dispatcher switch statements.

### Step 2: Dynamic USB Traffic Capture (USBPcap + Wireshark)
1. Install Wireshark with USBPcap on Windows.
2. Filter for device USB bus: `usb.idVendor == 0x314B`.
3. Perform isolated single-variable changes:
   - **Baseline:** Record idle traffic.
   - **Static RGB Color Change:** Change static color from Red (`#FF0000`) to Green (`#00FF00`). Diff packet payloads to isolate RGB byte offsets.
   - **Actuation Point Change:** Change global actuation from 2.0mm to 1.0mm. Diff packets to isolate actuation scaling factor.
   - **Rapid Trigger Toggle:** Enable/disable Rapid Trigger.
   - **SOCD Mode Change:** Switch between Neutral and Last-Input.
4. Record exact report IDs, opcode bytes, checksum algorithm (XOR/CRC8/None), and payload schemas below.

---

## 5. Verified Command Log

*(Entries will be populated once confirmed with packet captures)*

```
[Template]
Command: <Name>
Direction: Host -> Device (Output Report / Feature Report)
Report ID: 0x??
Payload Length: 64 bytes (WebHID) / 128 bytes (HIDAPI)
Opcode: 0x??
Data Bytes: [Offset 0: Magic 0xFA] [Offset 1: Opcode] [Offset 2: Frame] [Offset 3: Total] [Offset 4: Field4] [Offset 5: Length] [Offset 6+: Payload]
Expected Device Response: 0x?? ACK
```
