# Codex ↔ Antigravity Handoff

**Primary:** Codex. **Temporary agent:** Antigravity.

## Repository
- **URL:** `https://github.com/Thrash-PRX/apex-control`
- **Base branch:** `main`
- **Antigravity working branch:** `antigravity/apex-control-continuation`
- **Latest commit hash:** Recorded upon git commit below

## Work Completed by Antigravity
1. **Audited initial repository scaffold:** Confirmed all initial docs were placeholders and directories (`project/`, `original-software/`, `research/`) contained only `.gitkeep`.
2. **Reverse engineering & hardware research:**
   - Identified Ant Esports APEX 200S hardware profile: 75% compact (84 keys + physical rotary knob + display screen), Haimu Linear Hall-Effect magnetic switches, tri-mode connectivity.
   - Identified likely OEM microcontroller platform: Sinowealth (Vendor ID `0x3402`, PID candidate `0x0300`), commonly configuring via HID Feature Reports on vendor Usage Page `0xFF00`.
3. **Engineered frontend & application architecture:**
   - Initialized React 19 + TypeScript + Vite + Tailwind CSS v4 in `project/apex-control-app/`.
   - Built custom dark charcoal & electric-blue UI design language.
   - Enforced modern TypeScript typing without enums (`erasableSyntaxOnly` compliant).
4. **Developed typed HID communication layer:**
   - `src/lib/hid/transport.ts`: `HidTransport` abstraction for pluggable backends.
   - `src/lib/hid/mock-transport.ts`: Realistic mock device with simulated packet latency, report logging, and explicit mock identification.
   - `src/lib/hid/webhid-transport.ts`: Direct browser USB HID communication via Chromium WebHID API.
   - `src/lib/hid/device-manager.ts`: Connection state machine, device discovery, reconnection, and typed report dispatch.
5. **Constructed interactive keyboard model:**
   - `src/lib/keyboard-layout.ts`: Detailed 84-key physical layout matrix + volume rotary knob.
   - `src/components/keyboard/KeyboardVisualizer.tsx`: Interactive SVG/CSS key map supporting single/multi-selection (Shift+Click), per-key RGB coloring, and actuation value overlays.
6. **Built complete 8-section configurator UI:**
   - `Dashboard`: Connection manager, device info, quick stats, navigation shortcuts.
   - `Lighting Studio`: 10 effect modes, RGB color picker, sliders, live visual preview (flagged as Unverified).
   - `Actuation`: 0.1mm–3.6mm global slider, reset slider, per-key overrides.
   - `Rapid Trigger`: Global toggle, downstroke/upstroke sensitivity sliders, tournament warnings.
   - `SOCD`: Horizontal & Vertical axis modes (Neutral, Last-Input/Snap Tap, First-Input, Disabled) with compliance notices.
   - `Key Mapping`: Base & FN layer remapping matrix.
   - `Profiles`: Local preset manager with import/export JSON stubs.
   - `Settings & Diagnostics`: Device identity table, live HID event log console, mock/WebHID mode switcher.
7. **Created automated test suite:**
   - `tests/layout.test.js`: Validates 84-key layout boundaries, unique IDs, rotary knob, metadata.
   - `tests/hid-transport.test.js`: Validates mock transport lifecycle, report transmission, device manager states, and safety constraints.
   - 7 of 7 tests passing. Clean build (`vite build`) and lint (`oxlint` with 0 warnings).

## Files Changed & Created
- `PROGRESS.md`: Updated with full session progress and findings.
- `HANDOFF.md`: Detailed continuation notes for Codex.
- `DECISIONS.md`: Architectural decisions and rationale.
- `docs/HID_PROTOCOL.md`: Protocol research, packet hypotheses, and capture plan.
- `docs/FEATURE_MATRIX.md`: Updated feature status table.
- `project/apex-control-app/`: Complete application codebase:
  - `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`
  - `src/types/`: `device.ts`, `lighting.ts`, `keyboard.ts`, `webhid.d.ts`, `index.ts`
  - `src/lib/hid/`: `transport.ts`, `mock-transport.ts`, `webhid-transport.ts`, `device-manager.ts`, `index.ts`
  - `src/lib/keyboard-layout.ts`
  - `src/stores/app-store.ts`
  - `src/components/layout/`: `Sidebar.tsx`, `Header.tsx`, `AppLayout.tsx`, `index.ts`
  - `src/components/dashboard/`: `DashboardPage.tsx`, `index.ts`
  - `src/components/keyboard/`: `KeyboardVisualizer.tsx`, `index.ts`
  - `src/components/lighting/`: `LightingPage.tsx`, `index.ts`
  - `src/components/actuation/`: `ActuationPage.tsx`, `index.ts`
  - `src/components/rapid-trigger/`: `RapidTriggerPage.tsx`, `index.ts`
  - `src/components/socd/`: `SocdPage.tsx`, `index.ts`
  - `src/components/key-mapping/`: `KeyMappingPage.tsx`, `index.ts`
  - `src/components/profiles/`: `ProfilesPage.tsx`, `index.ts`
  - `src/components/settings/`: `SettingsPage.tsx`, `index.ts`
  - `src/App.tsx`, `src/index.css`, `src/main.tsx`
  - `tests/`: `layout.test.js`, `tests/hid-transport.test.js`

## Build & Test Commands
From `project/apex-control-app`:
- **Build production bundle:** `npm run build`
- **Run automated test suite:** `npm test`
- **Run linter:** `npm run lint`
- **Start dev server:** `npm run dev`

## Hardware Verification Status
- **Physical Verification:** Not yet performed (requires physical APEX 200S connected to USB or binary captures).
- **Mock Mode:** Fully verified in automated tests and functional in UI.
- **Protocol Status:** Candidate VID `0x3402`, candidate PID `0x0300`, candidate Usage Page `0xFF00`. All features in UI remain explicitly labeled `Unverified` until byte captures are confirmed.

## Next Steps for Codex
1. **Supply vendor software binaries:** When `GameKeyboard.exe` or `hidapi.dll` is provided in `original-software/`, run static string extraction and disassembly (Ghidra/PE tools) to identify exact opcode bytes for lighting, actuation, and rapid trigger.
2. **Confirm USB enumeration:** Connect physical APEX 200S and verify VID/PID in Windows Device Manager (`HID\VID_XXXX&PID_YYYY`).
3. **Capture dynamic HID traffic:** Use USBPcap + Wireshark while changing lighting and actuation settings in the vendor software to record exact report IDs and payload bytes in `docs/HID_PROTOCOL.md`.
4. **Implement verified encoders/decoders:** Wire verified byte arrays into `src/lib/protocol/` and connect them to `DeviceManager.sendFeatureReport()`.
5. **Optionally wrap in Tauri:** If desktop binary with low-level kernel driver bypass is desired, wrap `project/apex-control-app` with Tauri v2 (`cargo tauri init`) without modifying the React frontend.
