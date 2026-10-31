## Current continuation status (2026-10-31)

- Discovery: observed identity `314B:1026 / FF02:0002`; descriptor sizing and disconnect behavior software-tested with fake HID devices. No new physical pairing verification in this continuation.
- Offline codecs: static-evidence RGB report encoder / raw trigger decoder, software-tested; hardware writes remain locked.
- Display Studio: local image and manual stat card preview, browser save/restore; hardware display support unknown. No live CPU/GPU/FPS provider.
- Original eight sections preserved. Historical candidate VID/PID below are superseded. Profile import/export stubs remain stubs; editor drafts are not device backups.
- **Pre-Codex branches completed:** protocol, reliability, frontend, display — all tested, linted, built, with handoffs.

# Feature Matrix

| Feature | Status | Evidence / Notes |
|---|---|---|
| **USB HID Discovery** | `software-tested` | Implemented `DeviceManager` and `HidTransport` abstraction with WebHID and Mock support. Uses observed VID `314B` PID `1026` (USB-CAPS-002). Unit tested in `tests/hid-transport.test.js` + `tests/reliability.test.js`. Hardware pairing pending physical device. |
| **Interactive Keyboard Visualizer** | `software-tested` | 84-key physical 75% layout modeled with rotary encoder. Multi-select and RGB previews verified in `tests/layout.test.js`. |
| **RGB Lighting Studio** | `implemented` | 10 effect selectors, RGB color picker with sliders/swatches, speed/brightness, live keyboard preview. Offline codec for opcodes 0x10/0x11/0x16 complete in `src/lib/protocol/apex.ts`. Hardware opcodes `investigating` (pending USB capture). Hardware writes locked. |
| **Per-key RGB** | `investigating` | UI selection matrix implemented. Hardware storage vs host-streaming capability unverified. |
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