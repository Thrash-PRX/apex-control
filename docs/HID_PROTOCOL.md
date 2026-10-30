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
| **Vendor ID (VID)** | `0x3402` (Sinowealth / Sino Wealth Electronic) | Candidate (Unverified) | Check Windows Device Manager: `HID\VID_XXXX&PID_YYYY` |
| **Product ID (PID)** | `0x0300` | Candidate (Unverified) | USB Enumeration check |
| **Manufacturer String** | "Ant Esports" or OEM default ("Gaming Keyboard") | Unverified | USB String Descriptor 0x01 |
| **Product String** | "APEX 200S" | Unverified | USB String Descriptor 0x02 |
| **USB Class** | 0x03 (Human Interface Device) | Expected | USB Standard Descriptor |
| **Config Interface** | Usage Page `0xFF00`, Usage `0x01` | Expected | Standard OEM Sinowealth configuration channel |

---

## 2. Chipset & Firmware Architecture Hypotheses

1. **OEM Microcontroller:**
   - Budget magnetic Hall-effect keyboards from Indian brands (Ant Esports, Cosmic Byte, Kreo) typically license white-label OEM boards manufactured with **Sinowealth (SH68F90 / SH68F83 / 32-bit ARM Cortex-M variants)** or **Sonix** MCUs.
   - Reference open-source projects for similar Sinowealth architectures:
     - `sinowealth-kb-tool` / `sinowisp`
     - OpenRGB Sinowealth keyboard controller
2. **Switch Technology:**
   - **Haimu Linear Hall-Effect Switches:** Contactless magnetic flux measurement.
   - Actuation sensitivity is calculated by ADC readings of magnetic flux density as the stem magnet approaches the PCB Hall sensor.
   - Actuation depth range: 0.1mm to 3.6mm (claimed).

---

## 3. Communication Channel Hypotheses

### USB Interface Mapping
Gaming keyboards with configuration software typically present 2–4 USB HID interfaces:
- **Interface 0:** Standard Boot Keyboard (Usage Page `0x01`, Usage `0x06` - 8-byte Input Report for BIOS/OS keystrokes).
- **Interface 1:** Consumer / Media Keys (Usage Page `0x0C`, Usage `0x01`).
- **Interface 2:** Mouse / System Keys (Usage Page `0x01`, Usage `0x02`).
- **Interface 3:** **Vendor Configuration Channel (Usage Page `0xFF00`–`0xFF05`):**
  - Uses **HID Feature Reports** (64 bytes) or **Interrupt OUT/IN endpoints** (64 bytes).
  - This is the target interface for `APEX CONTROL`.

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
2. Filter for device USB bus: `usb.idVendor == 0x3402 || usb.transfer_type == 0x01 || usb.transfer_type == 0x02`.
3. Perform isolated single-variable changes:
   - **Baseline:** Record idle traffic.
   - **Static RGB Color Change:** Change static color from Red (`#FF0000`) to Green (`#00FF00`). Diff packet payloads to isolate RGB byte offsets.
   - **Actuation Point Change:** Change global actuation from 2.0mm to 1.0mm. Diff packets to isolate actuation scaling factor (e.g. `1.0mm = 0x0A` or raw 0–255 ADC value).
   - **Rapid Trigger Toggle:** Enable/disable Rapid Trigger.
   - **SOCD Mode Change:** Switch between Neutral and Last-Input.
4. Record exact report IDs, opcode bytes, checksum algorithm (XOR/CRC8/None), and payload schemas below.

---

## 5. Verified Command Log

*(Entries will be populated once confirmed with packet captures)*

```
[Template]
Command: <Name>
Direction: Host -> Device (Feature Report / Output Report)
Report ID: 0x??
Payload Length: 64 bytes
Opcode: 0x??
Data Bytes: [Offset 0: Opcode] [Offset 1: Subcommand] [Offset 2..N: Parameters] [Offset 63: Checksum]
Expected Device Response: 0x?? ACK
```
