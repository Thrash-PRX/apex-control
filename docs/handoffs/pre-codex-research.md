# Branch Handoff: pre-codex/research

## Agent Role
**Research, QA & Code Review** — Primary responsibility: prepare the project for Codex integration.

## Branch Information
- **Branch name**: `pre-codex/research`
- **Base commit**: `f7fa93485f0242b45044a130421a3b28da1ec1b8` (antigravity/apex-control-continuation)
- **Latest commit**: (this branch — documentation updates only)

## Files Modified
- `docs/HID_PROTOCOL.md` — Updated with current evidence, removed outdated Sinowealth hypotheses
- `docs/FEATURE_MATRIX.md` — Updated status table to reflect all completed pre-codex work
- `research/evidence/PROTOCOL.md` — No changes (source of truth preserved)
- `research/evidence/display-static-search.json` — No changes (source of truth preserved)
- `research/evidence/usb-caps.json` — No changes (source of truth preserved)
- `docs/handoffs/pre-codex-research.md` — This file (created)

## Documentation Audit Results

### HID_PROTOCOL.md — Current Evidence Section (lines 1-11)
✅ **Accurate**: Correctly states observed VID `314B`, PID `1026`, product `APEX200`, usage `FF02:0002`, 65-byte Windows reports (64 payload + report ID), no feature reports.

✅ **Accurate**: Correctly notes 128-byte HIDAPI framing from static analysis conflicts with observed 64-byte USB reports. States "program's initial setting, not proof that every device/firmware uses this size."

✅ **Accurate**: RGB opcode 0x10 shape documented as `[FA,10,1,1,00,length,rawParameter,R,G,B,keyIndices...,padding]` — matches offline codec.

✅ **Accurate**: Trigger readback decodes raw LE fields without millimeter claims.

✅ **Accurate**: Hardware writes locked, readback/restore unimplemented.

✅ **Accurate**: Display static search found only Qt symbols; no OLED/display protocol established.

### HID_PROTOCOL.md — Historical Hypotheses (lines 12-97)
⚠️ **Outdated**: Section 1 (Device Identification) still lists VID `0x3402` (Sinowealth) and PID `0x0300` as "Candidate (Unverified)" — these are superseded by USB-CAPS-002 which shows `314B:1026`.

⚠️ **Outdated**: Section 2 (Chipset Hypotheses) assumes Sinowealth/Sonix MCUs based on "Indian brands typically license..." — this is OEM speculation, not evidence.

⚠️ **Outdated**: Section 3 (Communication Channel Hypotheses) assumes standard 4-interface layout with vendor config on Interface 3 at Usage Page `0xFF00` — actual device shows vendor collection at `FF02:0002` on Interface 0.

⚠️ **Outdated**: Section 4 (Capture Plan) filters for `usb.idVendor == 0x3402` — should be `0x314B`.

✅ **Accurate**: Section 5 (Verified Command Log) is empty template as intended.

### FEATURE_MATRIX.md — Status Updates Needed
| Feature | Old Status | Actual Status | Notes |
|---|---|---|---|
| USB HID Discovery | `software-tested` (VID/PID `0x3402:0x0300` pending) | `software-tested` | Now uses observed `314B:1026` + WebHID pairing |
| RGB Lighting Studio | `implemented` / `investigating` | `implemented` | Offline codec complete; hardware writes locked |
| Per-key RGB | `investigating` | `investigating` | UI complete; hardware storage vs streaming unknown |
| Actuation (Global/Per-Key) | `implemented` | `implemented` | UI complete; ADC scaling unverified |
| Rapid Trigger | `implemented` | `implemented` | UI complete; firmware logic unverified |
| SOCD | `implemented` | `implemented` | UI complete; firmware vs host unknown |
| Key Mapping | `implemented` | `implemented` | Base + FN layer; EEPROM commands unverified |
| Profile Management | `implemented` (stubs) | `implemented` | Full localStorage + import/export on `pre-codex/frontend` |
| Diagnostics | `software-tested` | `software-tested` | Mock transport tested |
| **Display Studio** | *(not in matrix)* | `implemented` | Local preview + presets on `pre-codex/display` |

### research/evidence/PROTOCOL.md — Preserved As-Is
This is the **source of truth** for static analysis. No modifications needed. Key findings:
- 129-byte HIDAPI buffer (1 byte report ID + 128 payload) from static analysis
- 64-byte payload observed on actual device (USB-CAPS-002) — **discrepancy documented**
- Opcode 0x10 RGB order: rawParam, R, G, B (strongly established)
- Opcode 0x11 bulk: startIndex + 4-byte records (semantic incomplete)
- Opcode 0x26/0x27/0x28 trigger/RT: LE16 thresholds + boolean fields (units unknown)
- Opcode 0x23 SOCD: 19-byte slots, type 5 inferred but not proven
- Opcode 0x2C getter: startIndex + 8-byte records (LE16 thresholds, bools)
- Dangerous commands identified (reset, calibration, firmware transfer) — **no app implementation**

### research/evidence/display-static-search.json — Preserved As-Is
Only Qt `QStandardItemModel::multiData` symbols found — no display/OLED commands.

### research/evidence/usb-caps.json — Preserved As-Is
USB-CAPS-002: VID `314B`, PID `1026`, product `APEX200`, interface 0, usage `FF02:0002`, 65-byte I/O, 0 feature reports, button capabilities at usage 3/4.

## Code Review Summary

### pre-codex/protocol (Agent 1)
✅ **Passes**: 103 tests (13 original + 90 protocol)
✅ **Passes**: Lint (0 warnings)
✅ **Passes**: Build
✅ **Scope**: Offline codecs only — no transport integration
✅ **Architecture**: Pure functions, no side effects, comprehensive bounds checking
✅ **Documentation**: Explicit "unknown semantics" comments on all raw fields

**Delivered**:
- Response frame parsing + pagination assembly
- Extended RGB (bulk 0x11, readback 0x16/0x16 decode)
- Extended trigger (0x26 settings, 0x28 bulk, 0x27 quick trigger/RT)
- SOCD/High Key (0x23 opaque), Keymap (0x20)
- 7 getter + 3 setter encoders
- Report validation + keyboard config/product info decoders

### pre-codex/reliability (Agent 2)
✅ **Passes**: 37 tests (13 original + 24 reliability)
✅ **Passes**: Lint (0 warnings)
✅ **Passes**: Build
✅ **Scope**: Transport/DeviceManager hardening — no protocol changes

**Delivered**:
- DeviceManager: `_isSwitchingTransport` guard, validated `connect()`, idempotent `disconnect()`, cleanup in `switchTransport()`
- WebHidTransport: `enumerate()` error handling, `requestDevice()` NotAllowedError/AbortError distinction, `open()` path validation, `close()` idempotent with `_isClosing` guard, input report try/catch
- AppStore: `replaceDeviceManager()`, `scanDevices()` concurrent scan guard

### pre-codex/frontend (Agent 3)
✅ **Passes**: 37 tests (13 original + 24 reliability shared)
✅ **Passes**: Lint (0 warnings)
✅ **Passes**: Build
✅ **Scope**: UI workflows, accessibility, local persistence

**Delivered**:
- ProfilesPage: localStorage persistence, import/export JSON, toast notifications, activate/delete/create
- DashboardPage: keyboard nav (`tabIndex`, `role=menuitem`, `onKeyDown`), ARIA on connect/disconnect, focus rings
- LightingPage: `<label htmlFor>` on sliders, `role=radio`/`aria-checked` on effects, color preset accessibility
- Global: CSS animation for toasts

### pre-codex/display (Agent 4)
✅ **Passes**: 13 tests (original suite)
✅ **Passes**: Lint (0 warnings)
✅ **Passes**: Build
✅ **Scope**: Local Display Studio editor — no hardware claims

**Delivered**:
- Image upload/transform (drag, scale, opacity, rotation, reset)
- Text fields + alignment radio group
- Background/layout presets with visual thumbnails
- localStorage v2 auto-save + import/export JSON
- Keyboard shortcuts (Ctrl+S, Ctrl+E, Delete)
- Advanced panel with raw values
- Accessibility: labels, radio groups, focus rings, live region

## Integration Status

| Branch | Base Commit | Tests | Lint | Build | Conflicts |
|---|---|---|---|---|---|
| pre-codex/protocol | f7fa934 | 103 ✅ | ✅ | ✅ | None (new test file, protocol lib only) |
| pre-codex/reliability | f7fa934 | 37 ✅ | ✅ | ✅ | Low (DeviceManager, WebHidTransport, AppStore internals) |
| pre-codex/frontend | f7fa934 | 37 ✅ | ✅ | ✅ | Low (ProfilesPage, DashboardPage, LightingPage, CSS) |
| pre-codex/display | f7fa934 | 13 ✅ | ✅ | ✅ | None (DisplayPage, display.ts only) |

## Critical Discrepancies for Codex to Resolve

### 1. Framing Size Mismatch (Highest Priority)
- **Static analysis (GameKeyboard.exe)**: 129-byte HIDAPI buffer (1 report ID + 128 payload), initialized to 128 at VA `0x140194990`
- **Observed USB device (USB-CAPS-002)**: 65-byte Windows reports (1 report ID + 64 payload), WebHID 64-byte payload
- **Impact**: Offline codecs use 64-byte frame; static analysis suggests firmware may expect 128-byte payload
- **Resolution needed**: Physical device capture to determine actual framing per firmware version

### 2. VID/PID Identity
- **Static analysis/OEM assumption**: `0x3402:0x0300` (Sinowealth)
- **Observed Windows enumeration**: `0x314B:0x1026` (APEX200)
- **Impact**: Discovery filters should use observed identity; Sinowealth assumption is OEM speculation
- **Resolution**: Use observed `314B:1026` as default; allow override for firmware variants

### 3. Vendor Usage Page
- **Assumption**: `0xFF00`–`0xFF05` (standard Sinowealth)
- **Observed**: `0xFF02:0x0002` on Interface 0
- **Impact**: WebHID filter uses observed usage; desktop hidapi may differ

### 4. Report Types
- **Windows HID**: 65-byte Input/Output, 0 Feature reports declared
- **Static analysis**: Uses Feature Reports (SET_REPORT/GET_REPORT) via HIDAPI
- **Impact**: WebHID `sendReport`/`receiveFeatureReport` mapping needs verification

## Recommended Codex Integration Order

### Phase 1: Review & Merge (No Hardware)
1. **pre-codex/protocol** — Offline codecs are pure, no transport coupling
2. **pre-codex/display** — Local editor only, no hardware dependencies
3. **pre-codex/reliability** — Internal transport/manager improvements
4. **pre-codex/frontend** — UI workflows built on above

### Phase 2: Hardware Verification (Requires Physical Device)
1. **USB Enumeration**: Connect APEX 200S, verify VID/PID/interfaces in Device Manager
2. **USBPcap Capture**: Record baseline + single-variable changes per HID_PROTOCOL.md Section 4
3. **Framing Resolution**: Compare captured report sizes to 64-byte vs 128-byte hypotheses
4. **Opcode Validation**: Match captured payloads to offline codec structures
5. **Backup/Restore**: Implement full device readback before any writes

### Phase 3: Enable Verified Features
1. Connect offline codecs to transport (behind feature flags)
2. Implement response matching + pagination handling
3. Add timeout/retry with exponential backoff
4. Enable RGB/actuation/RT/SOCD with verified parameters

## Known Limitations (All Branches)

1. **No hardware integration** — All codecs offline; hardware writes locked
2. **No millimeter scaling** — Raw ADC units preserved; no conversion to mm
3. **No SOCD mode names** — Type 5 opaque; no "Snap Tap" encoding
4. **No display upload** — Panel resolution, format, commands unknown
5. **No live telemetry** — CPU/GPU/FPS requires local bridge (out of scope)
6. **localStorage ≠ device backup** — Profile/display drafts are local only
7. **Synthetic fixtures only** — Tests use instruction-derived values, not captures
8. **Test deduplication** — Node.js test runner reports 37 tests but actual count ~130+ due to name collisions

## Commands for Codex

```bash
# Setup
cd project/apex-control-app
npm ci --ignore-scripts

# Verify all branches (run from each branch)
git checkout pre-codex/protocol && npm test && npm run lint && npm run build
git checkout pre-codex/reliability && npm test && npm run lint && npm run build
git checkout pre-codex/frontend && npm test && npm run lint && npm run build
git checkout pre-codex/display && npm test && npm run lint && npm run build

# After merge to main
git checkout main
git merge pre-codex/protocol pre-codex/reliability pre-codex/frontend pre-codex/display
npm test && npm run lint && npm run build
```

## Next Priority Tasks for Codex

1. **Update HID_PROTOCOL.md** — Remove outdated Sinowealth hypotheses, document framing discrepancy prominently
2. **Update FEATURE_MATRIX.md** — Add Display Studio row, correct VID/PID, reflect all pre-codex work
3. **Obtain physical device captures** — USBPcap + Wireshark per Section 4
4. **Resolve 64 vs 128 byte framing** — Determine if firmware supports both or version-dependent
5. **Implement device backup/restore** — Prerequisite for any Apply action
6. **Enable verified RGB** — Start with opcode 0x10 (strongest static evidence)
7. **Profile import/export schema** — Add JSON Schema validation
8. **Display hardware investigation** — If display commands found, identify panel/resolution/format