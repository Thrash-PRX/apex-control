## Current RGB checkpoint (2026-11-01)

Native RGB Apply and timed custom playback supersede the earlier RGB-only write lock. See HANDOFF and research/evidence/timed-custom-rgb-results.json. Hardware controls unrelated to RGB remain disabled.

## Historical continuation status (2026-10-31)

- Discovery: observed identity `314B:1026 / FF02:0002`; descriptor sizing and disconnect behavior software-tested with fake HID devices. No new physical pairing verification in this continuation.
- Offline codecs: static-evidence RGB report encoder / raw trigger decoder, software-tested; hardware writes remain locked.
- Display Studio: local image and manual stat card preview, browser save/restore; hardware display support unknown. No live CPU/GPU/FPS provider.
- Original eight sections preserved. Historical candidate VID/PID below are superseded. Profile import/export stubs remain stubs; editor drafts are not device backups.
- **Pre-Codex branches completed:** protocol, reliability, frontend, display — all tested, linted, built, with handoffs.

# Feature Matrix

| Feature | Status | Evidence / Notes |
|---|---|---|
| **USB HID Discovery** | `software-tested` | Implemented `DeviceManager` and `HidTransport` abstraction with WebHID and Mock support. Uses observed VID `314B` PID `1026` (USB-CAPS-002). Unit tested in `tests/hid-transport.test.js` + `tests/reliability.test.js`. Hardware pairing confirmed by the user during native RGB and timed Snake tests. |
| **Interactive Keyboard Visualizer** | `software-tested` | User-confirmed APEX20082-key geometry with rotary encoder and screen; full key-index mapping remains partially verified. Multi-select and RGB previews verified in `tests/layout.test.js`. |
| **RGB Lighting Studio** | `implemented` | Captured native modes0–11 with backup/apply/readback; Static, Wave and Ripple user-verified.17 authored spatial effects now use acknowledged per-key timers; Color Cycle uses captured native Static RGB. New visual appearance is pending user assessment; transfer/readback/recovery tested. |
| **Per-key RGB** | `investigating` | Timed Snake user video verified on update4. Update5 uses selected-index10 writes only with changed-page readback, full audits and restoration. Other timed effects USB-tested; no smoothness equivalence or full82-key naming verification claimed. Manual color painting remains disabled. |
| **Hall-Effect Actuation (Global)** | `implemented` | Global slider (0.1mm–3.6mm, 0.1 step) and reset point controls in UI and store. Offline codec for opcode 0x26/0x28 complete. Sensor ADC scaling unverified. |
| **Hall-Effect Actuation (Per-Key)** | `implemented` | Multi-key selection with individual actuation overrides and presets in UI. Offline codec for opcode 0x26 complete. Firmware memory map unverified. |
| **Rapid Trigger** | `implemented` | Dynamic press/release sensitivity controls (0.1mm–3.6mm) in UI. Offline codec for opcode 0x27 complete. Firmware execution logic unverified. |
| **SOCD Resolution** | `implemented` | Horizontal (A+D) & Vertical (W+S) modes (Neutral, Last-Input, First-Input, Disabled) in UI. Offline codec for opcode 0x23 (opaque 19-byte slots) complete. Firmware vs host execution location unverified. |
| **Key Remapping & Layers** | `implemented` | Base layer and FN layer matrix in UI. Offline codec for opcode 0x20 complete. Hardware EEPROM write commands unverified. |
| **Profile Management** | `implemented` | Profile creation, activation, localStorage persistence, JSON import/export with validation in `src/components/profiles/ProfilesPage.tsx`. Onboard vs host storage unverified. Editor drafts are not device backups. |
| **Diagnostics & HID Logging** | `software-tested` | Live HID console with level filtering, transport switcher, hardware info table. Tested with MockHidTransport in `tests/hid-transport.test.js` + `tests/reliability.test.js`. |
| **Sensor Calibration** | `uninvestigated` | Requires physical device Hall sensor baseline measurement. Unsafe to test without official firmware protocol knowledge. |
| **Display Studio** | `implemented` | Local image preview (PNG/JPEG/WebP ≤2MB, ≤16MP), drag-to-reposition, scale/opacity/rotation controls, text fields (title/label/value ≤64 chars), text alignment, 5 background presets, 6 layout presets, localStorage v2 auto-save, JSON import/export. Hardware display support unknown. No live CPU/GPU/FPS telemetry. Offline editor only — hardware upload disabled. |

*Allowed status values: uninvestigated, investigating, implemented, software-tested, hardware-verified, unsupported.*
## Actuation checkpoint (2026-11-02; supersedes earlier actuation/RGB-only write-lock claims)
Captured26/A6, full84-slot2C backup/readback, Apply and Restore are connected through a dedicated operation-locked WebHID workflow. Approved stock and APEX-engine W2.40→2.41→2.40 tests passed and restored all trigger bytes. Matching vendor product range10..359 and native slider/100 formatting establish0.10–3.59mm actuation display. Other key names remain vendor-derived, browser/power-cycle validation pending. RT/SOCD/keymap/OLED writes remain locked; their existing editors are local drafts. Evidence: research/evidence/actuation-verified.json.201 tests/lint/build pass.
