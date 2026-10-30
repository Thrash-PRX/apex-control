## Current continuation status (2026-10-31)

- Discovery: observed identity `314B:1026 / FF02:0002`; descriptor sizing and disconnect behavior software-tested with fake HID devices. No new physical pairing verification in this continuation.
- Offline codecs: static-evidence RGB report encoder / raw trigger decoder, software-tested; hardware writes remain locked.
- Display Studio: local image and manual stat card preview, browser save/restore; hardware display support unknown. No live CPU/GPU/FPS provider.
- Original eight sections preserved. Historical candidate VID/PID below are superseded. Profile import/export stubs remain stubs; editor drafts are not device backups.

# Feature Matrix

| Feature | Status | Evidence / Notes |
|---|---|---|
| **USB HID Discovery** | `software-tested` | Implemented `DeviceManager` and `HidTransport` abstraction with WebHID and Mock support. Unit tested in `tests/hid-transport.test.js`. Hardware VID/PID candidate `0x3402:0x0300` pending physical USB check. |
| **Interactive Keyboard Visualizer** | `software-tested` | 84-key physical 75% layout modeled with rotary encoder. Multi-select and RGB previews verified in `tests/layout.test.js`. |
| **RGB Lighting Studio** | `implemented` | 10 effect selectors, RGB slider controls, speed/brightness adjustments, and live keyboard rendering in UI. Exact HID opcodes `investigating` (pending USB capture). |
| **Per-key RGB** | `investigating` | UI selection matrix implemented. Hardware storage vs host-streaming capability unverified. |
| **Hall-Effect Actuation (Global)** | `implemented` | Global slider (0.1mm–3.6mm, 0.1 step) and reset point controls implemented in UI and store. Sensor ADC scaling unverified. |
| **Hall-Effect Actuation (Per-Key)** | `implemented` | Multi-key selection with individual actuation overrides and presets in UI. Firmware memory map unverified. |
| **Rapid Trigger** | `implemented` | Dynamic press/release sensitivity controls (0.1mm–3.6mm) in UI. Firmware execution logic unverified. |
| **SOCD Resolution** | `implemented` | Horizontal (A+D) & Vertical (W+S) modes (Neutral, Last-Input, First-Input, Disabled) configured in UI. Firmware vs host execution location unverified. |
| **Key Remapping & Layers** | `implemented` | Base layer and FN layer matrix implemented in UI. Hardware EEPROM write commands unverified. |
| **Profile Management** | `implemented` | Profile creation, activation, and JSON import/export stubs implemented in UI. Onboard vs host storage unverified. |
| **Diagnostics & HID Logging** | `software-tested` | Live HID console with level filtering, transport switcher, and hardware info table implemented. Tested with MockHidTransport. |
| **Sensor Calibration** | `uninvestigated` | Requires physical device Hall sensor baseline measurement. Unsafe to test without official firmware protocol knowledge. |

*Allowed status values: uninvestigated, investigating, implemented, software-tested, hardware-verified, unsupported.*
