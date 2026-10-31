## Codex continuation — 2026-10-31

Continued branch `antigravity/apex-control-continuation` from `c3d6e1a9`; main untouched.

- Corrected default discovery to observed `314B:1026`, vendor usage `FF02:0002`. Evidence: `research/evidence/usb-caps.json` from the earlier local Windows metadata inspection, not a new hardware session. Old Sinowealth guesses below are superseded.
- WebHID derives payload sizes from nested report descriptors, handles unplug events, avoids duplicate input listeners on repeated open, cleans up on close failure, and preserves connected state during a scan. Unknown manufacturer/interface are no longer fabricated.
- Physical output/feature writes are explicitly locked pending verified protocol/backup integration. Mock reports remain functional. Undeclared feature reads fail before device I/O.
- Added pure typed offline RGB encoder and raw trigger decoder with bounds checks. Byte layouts follow retained static analysis; they are not imported by the hardware transport or UI. No millimetre scaling, SOCD mode, display command or firmware command was guessed.
- Added Display Studio as a ninth section: local image preview (PNG/JPEG/WebP up to 2 MB), custom text/stat cards, validated browser draft storage. Values are manual; no CPU/GPU/FPS telemetry is claimed. Hardware upload is disabled. Panel type, pixel dimensions, image packing, transfer protocol and persistence remain unknown.
- Rehashed installed GameKeyboard.exe: SHA-256 matches the retained static report. Focused static string search found only irrelevant Qt symbol matches; no usable OLED command evidence. No manufacturer binary or DLL was executed or committed.
- Verification: baseline 8 tests passed; final 13 tests passed; `npm run lint` and `npm run build` passed. Browser check verified navigation, editing, saving and restoring a display draft after reload. Image decode uses browser APIs; physical image upload was not tested.

### Resume / deployment

From `project/apex-control-app`: `npm ci --ignore-scripts`, `npm test`, `npm run lint`, `npm run build`; local preview `npm run dev -- --host 127.0.0.1`.
Deploy only `dist/` over HTTPS (or use localhost) in a WebHID-capable browser. This is a preview/diagnostics release, not a working replacement hardware driver. No public deployment was performed.

Before hardware Apply: verify response matching/pagination and complete device backup/restore; resolve raw parameter units and physical key mapping; validate captures against the connected firmware. For display support, identify the actual panel and trace display serializer/receiver routines before implementing any transfer. Live system stats additionally need an explicitly scoped local bridge; a browser cannot supply general CPU/GPU temperature or game FPS.

This section supersedes conflicting historical identity/hardware claims below. Latest commit: use `git log -1 --oneline` (this update is included in the continuation commit).

# Progress

## Verified at repository initialization
- Objective established: independent control interface for Ant Esports APEX 200S.
- Stock software file names identified by user, but binaries are **not included** in this repository.
- No HID protocol discovery, build, or physical hardware test is confirmed in this repository.

## Antigravity Session Updates (Milestone 1, 2, 3, 4 Foundation Complete)

### 1. Hardware & Ecosystem Research (`research/`)
- **OEM & MCU Platform:** Ant Esports is an Indian gaming peripheral brand rebranding OEM platforms. The hardware most likely utilizes a **Sinowealth (Sino Wealth)** microcontroller (Vendor ID `0x3402`), commonly paired with budget Hall-effect gaming keyboards (e.g. DrunkDeer A75, NuPhy, MonsGeek, MCHOSE).
- **Physical Layout:** Confirmed 75% compact form factor with **84 mechanical keys**, dedicated top-right rotary volume/multimedia encoder, and integrated status/OLED display screen.
- **Switch Hardware:** Haimu Linear Hall-Effect magnetic switches (contactless magnetic flux sensing).
- **Claimed Specs:** 0.1mm – 3.6mm (or up to 3.99mm) actuation range, dynamic Rapid Trigger, 1000Hz polling rate, tri-mode (USB-C wired, 2.4GHz wireless, Bluetooth 5.4).

### 2. Application Scaffolding & Architecture (`project/apex-control-app/`)
- Created modern React 19 + TypeScript + Vite + Tailwind CSS v4 application in `project/apex-control-app/`.
- Designed and implemented clean gaming-peripheral dark theme (#1a1a2e base, #16162a sidebar, #252540 cards, #0096ff electric blue accents).
- Strictly enforced `erasableSyntaxOnly` compatibility and zero-warning TypeScript compilation.

### 3. Layered HID Communication Architecture (`src/lib/hid/`)
- Defined transport abstraction `HidTransport`:
  - `WebHidTransport`: Native browser USB HID communication via Chromium WebHID API targeting vendor-defined usage pages (Usage Page `0xFF00`).
  - `MockHidTransport`: Comprehensive simulated HID transport with simulated latency, report echo, and explicit mock labeling for development without attached hardware.
- Implemented `DeviceManager` coordinating lifecycle, scanning, connection state, error handling, and typed report dispatch.
- Clean separation between Mock Mode and real hardware communication in UI and store.

### 4. Interactive Physical Keyboard Model (`src/lib/keyboard-layout.ts` & `src/components/keyboard/`)
- Modeled the physical 75% APEX 200S layout (84 standard keys + rotary volume knob).
- Created `KeyboardVisualizer`: interactive canvas supporting multi-key selection (click, Shift+Click), per-key color previews, and actuation depth subtitles.

### 5. UI Control Suite (8 Complete Sections)
- **Dashboard:** Device connection status, identity display, quick stats, mock mode banner, and section navigation.
- **Lighting Studio:** 10 lighting presets (`LIGHTING_EFFECTS`), RGB color picker with quick swatches and RGB sliders, brightness, speed, direction, and live keyboard preview. Clearly labeled with `Protocol Unverified` status.
- **Actuation:** Global slider (0.1mm – 3.6mm), release reset slider, per-key override configuration with multi-key selection and quick presets.
- **Rapid Trigger:** Global toggle, downstroke press sensitivity (0.1mm – 3.6mm), upstroke release sensitivity, and esports tournament notice.
- **SOCD (Simultaneous Opposing Cardinal Directions):** Horizontal (A+D) and Vertical (W+S) resolution modes: Neutral Priority, Last-Input Priority (Snap Tap), First-Input Priority, and Disabled. Includes explicit Valve/CS2 tournament compliance warning.
- **Key Mapping:** Base layer and FN layer configuration matrix.
- **Profiles:** Local profile manager with quick activation, preset switching, JSON import/export stubs.
- **Diagnostics & Settings:** Device hardware info, live HID event log with level filtering, and Mock/WebHID transport toggling.

### 6. Testing & Quality Verification
- **Automated Tests:** Implemented unit test suite in `tests/` using Node.js native test runner:
  - `tests/layout.test.js`: Verifies 84-key count, rotary knob existence, unique key IDs, non-negative coordinates, and unverified verification flags.
  - `tests/hid-transport.test.js`: Verifies mock transport lifecycle, report sending/receiving, device manager state transitions, and boundary constraints.
  - **Result: 7 of 7 tests passing.**
- **Build & Lint:** `npm run build` succeeds cleanly producing production assets in `dist/`. `npm run lint` completes with **0 errors and 0 warnings**.

## Current Blockers & Next Steps for Physical Reverse Engineering
- Obtain physical keyboard connection or capture logs (Wireshark/USBPcap) to confirm exact VID/PID (test `0x3402:0x0300` vs actual USB enumeration).
- Place stock Windows binaries (`GameKeyboard.exe`, `hidapi.dll`) under `original-software/` for disassembly and opcode extraction.
- Sniff USB HID Feature Reports when changing RGB effects and actuation values to document exact packet byte offsets in `docs/HID_PROTOCOL.md`.

## Codex continuation: browser HID discovery hardening

- Reviewed Antigravity's source at baseline commit `3f09c79`.
- Found first-time real keyboard pairing was blocked because the dashboard only called `getDevices()`, which lists previously granted devices.
- Added direct user-gesture HID permission pairing, distinct paths for multiple devices with identical VID/PID, correct DataView slice handling, and removed unverified VID/PID constraints from hardware discovery.
- Added a regression test for browser pairing and report view offsets plus CI workflow to run tests, lint, and production build.
- **No physical hardware commands or reverse-engineered opcodes were introduced.**
- Build/test results from this continuation depend on CI; do not confuse Antigravity's earlier 7/7 pass with a verified run of these changes.

## 2026-10-31 integration

Merged five pre-codex heads on integration/pre-codex-20261031 in a separate worktree. Source tests independently run: protocol 103 pass; reliability 36 pass / 1 fail (broken fixture); frontend 37 pass; display and research 13 pass each. Every source lint/build passed. Fixed reliability fixture and integration defects in device identity, frame bounds, profile persistence and display draft compatibility. See HANDOFF.md and docs/INTEGRATION-CAPTURE.md. Main and source branches unchanged; all hardware writes blocked.

Final integration validation: 130 tests passed, 0 failed; lint and production build passed.

## WK68 RGB investigation

Unpacked WK68 and retained resource/configuration hashes and mode labels. Added independent local lighting animation and regression tests. No vendor application or HID command executed. See docs/WK68-REFERENCE.md; reference algorithms are still unverified.

Release preview packaged and browser checked. USBPcap 1.5.4.0 installed with user approval; driver stopped pending user restart. Hardware functionality remains unverified and writes locked. See HANDOFF.md for exact next capture step.

Physical RGB capture obtained: red and green confirmed by user in stock MKeyboard; matching64-byte command13 packets and response93 observed. Added capture-backed offline fixtures/code and section export. All app writes still blocked; see docs/APEX-RGB-CAPTURE.md.

Further captures establish brightness and speed bytes independently; user confirms final Breath100/80/green. Physical fixtures retained without full private captures. Hardware write lock remains.

RGB hardware Apply implemented at user request for captured Static/Breath modes: pre-change RGB backup, acknowledgements, mode selection and readback verification. Generic writes stay locked.142 tests/lint/build pass; live user test pending.

User verified real RGB Apply: keyboard color changed and app readback confirmed. First physical end-to-end APEX CONTROL RGB success. Other hardware features remain unverified/locked.

Expanded native RGB support to the12 captured IDs and added reference previews/overlays with hardware distinction. Verified isolated stock-software W blue capture establishes index34. Streaming remains unavailable. Tests145 pass; lint/build pass before final label-only refinements.
