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

# Codex ↔ Antigravity Handoff

**Primary:** Codex. **Temporary agent:** Antigravity.

## Repository
- **URL:** `https://github.com/Thrash-PRX/apex-control`
- **Base branch:** `main`
- **Antigravity working branch:** `antigravity/apex-control-continuation`
- **Antigravity handoff baseline:** `3f09c79` (use `git rev-parse HEAD` for the latest branch commit)

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

## Codex continuation after Antigravity (browser pairing)

- Real-device discovery no longer relies on the unverified candidate VID/PID; a browser-native HID permission dialog is reachable from the Dashboard's **Pair & Connect Keyboard** button.
- Device paths are unique per WebHID device object (even with matching VID/PID).
- HID input and feature reports respect DataView offsets.
- Added WebHID pairing regression coverage and a GitHub Actions npm test/lint/build workflow.
- No keyboard packet writes, calibration or firmware operations were performed.
- **Verify CI status for the continuation commit before claiming tests pass.** Physical USB verification remains outstanding.

## Integration verification — 2026-10-31

Branch: integration/pre-codex-20261031, separate worktree ../integration. Source heads: protocol ca24bc064cd34ddb0a6b57d8671f9e25b949ee0b; reliability f47a09f19983b88f76e5bea6cc1164a80002a952; frontend bb5558ee95dc327658762878a8d85f8ee1a29797; display 84bae55aba62aa40b5c9d96fad0335b1ff1f616b; research e83a544bbf299e6b0b082a4c6f861bb6698db228.

All five merged without modifying main, continuation, or source branches. Frontend carried overlapping reliability changes; retained the reliability branch's stronger concurrent-switch regression test. Fixed its undefined mock fixture reference. Source branch checks: protocol 103/103, frontend 37/37, display 13/13, research 13/13; reliability 36/37 (undefined mockHidDevice). All five lint and build checks passed. These are actual runs, superseding source handoff claims.

Integration fixes: compare transport paths for repeated connect; prevent close re-entry; enforce 14-record RGB limit for 64-byte candidate frames, exact response length and RGB index bounds; persist profile creation/deletion; reject empty profile imports; migrate v1 display drafts; normalize nonfinite image transforms; keep Delete in text fields from deleting the preview image. Added integration regressions for connection identity, packet bounds and draft migration.

Physical writes remain locked. No physical reads/writes, reset, calibration or flashing occurred. Read docs/INTEGRATION-CAPTURE.md for capture/readback/backup gates and unresolved candidate protocol assumptions. No complete device backup/restore exists. Original checkout's uncommitted readback/research files remain untouched and uncommitted. UI functionality is retained; browser visual verification was not performed in this integration session. Final validation and SHA: see git log and the integration validation entry below.

Final integration validation: 130/130 tests passed; npm run lint passed; npm run build passed. Exact resulting commit: git rev-parse HEAD (this entry is included in that commit).

## User priority order — 2026-10-31

1. RGB modes and application workflow referenced from Weikav WK68 software.
2. SOCD and Rapid Trigger workflow referenced from Wooting software.
3. Our own OLED screen customizer.

Reference applications guide UX only until APEX-specific protocol evidence establishes compatibility. Never reuse another keyboard's USB commands without validation. Reference installers/URLs and captures are not present in this checkout. Existing local UI remains available; physical writes stay locked.

## RGB continuation — 2026-10-31

Extracted supplied WK68 installer without executing its application. Saved hashed RGB resource/configuration findings in docs/WK68-REFERENCE.md and research/evidence/wk68-rgb-reference.json. Identified different target USB IDs; no WK68 device values are reused for APEX. Added authored local animated previews for existing APEX lighting effects, brightness/speed/direction controls and reduced-motion handling. Reactive/ripple are explicitly demonstrations from selected keys. Remaining WK68 mode algorithm/mask mappings and APEX capture/readback remain unresolved; hardware writes locked.

RGB continuation validation: 133/133 tests pass; lint and production build pass. No browser visual check or physical-device test claimed.

## Release and capture setup — 2026-10-31

User confirms APEX is connected by USB and stock MKeyboard RGB works. Read-only Windows PnP enumeration finds 314B:1026 interfaces present/OK. Earlier local research at the original Codex workspace contains additional APEX/WK68 analysis but explicitly records no physical configuration test. Do not infer a working device protocol from it.

User authorized official USBPcap installation and confirmed the license step. Installed official 1.5.4.0 from github.com/desowin/usbpcap/releases/download/1.5.4.0/USBPcapSetup-1.5.4.0.exe. Authenticode valid (Tomasz Mon); SHA-256 87a7edf9bbbcf07b5f4373d9a192a6770d2ff3add7aa1e276e82e38582ccb622. Files installed under C:/Program Files/USBPcap, driver registered as USBPcap. sc query reports STOPPED, exit 1077; restart pending. No capture, HID request, configuration write, reset, calibration or flashing performed. Do not restart automatically.

NEXT after user restarts: enumerate USBPcap hubs, identify APEX address, capture only the selected device (not all devices). Have user perform one reversible RGB change in MKeyboard while observing; record baseline and exact before/after settings. Keep private captures outside Git. Validate framing, report ID, request/response mapping, index mapping and backup sections before unlocking any app write. User installation authorization is not authorization for arbitrary keyboard writes.

Built ../outputs/APEX-CONTROL-preview.zip with static production assets, localhost-only server and Start-APEX.cmd. Node.js required. Server uses localhost port 5175; only app index/assets served, POST rejected 405, unknown files 404, foreign Host rejected 403. Browser verified production app loads, mock connects, RGB Wave selects, new profile persists across reload, display text saves. Fixed misleading Applied to Keyboard label and added visible local-only notice. Profiles remain local summaries, not complete app configuration snapshots or device backups. 133 automated tests, lint and production build passed. Package is a preview, not a working replacement driver. Restart will stop running local servers; launcher restarts the preview.

## After restart: physical RGB evidence
USBPcap running; correct capture address3 on USBPcap2 established via hub descriptor (port2 differs from address). User performed red and green changes in MKeyboard. Both correct captures identify314B:1026; 64-byte command13 payload8 ends RGB; response93 declares only1 payload byte. Added offline parser, matched captured-section exporter, typed captured RGB encoder and regression tests. Private section export has19 complete transactions; it is not a full restorable backup. No APEX CONTROL writes. See docs/APEX-RGB-CAPTURE.md. Next: brightness/speed/mode differential captures, backup completeness and restore validation.

Capture continuation: user confirmed red, green,100→50 brightness dimming, then corrected final Breath brightness to100 with speed80/green. Captured byte mappings: opcode13 payload8 = mode-associated byte, brightness byte, speed byte, two still-raw fields, RGB. Solid prefix1/100/50/0/13; Breath prefix3/100/80/0/15. Do not extrapolate unknown options across modes. Captured endpoints OUT04/IN84. All correct sessions stopped; raw captures/private19-section export remain outside Git. No app writes enabled.


Final capture continuation verification:140/140 tests passed; lint and production build passed. Exact SHA is the following commit (git rev-parse HEAD). All four correctly scoped captures stopped. Native RGB settings encoder remains offline; physical write lock unchanged.

## RGB Apply enabled at user request — 2026-10-31

User explicitly requested real app RGB control after the physical captures. This supersedes the prior blanket write lock ONLY for the dedicated captured RGB workflow. Generic sendOutputReport and all feature writes remain locked. SOCD, RT, display, reset/calibration/flashing remain disabled.

Dedicated WebHID workflow requires314B:1026,64-byte output report0 and Static1 or Breath3. Reads effect table17→97 with FF selector and host pagination; saves exact raw records to browser storage before mutation (storage failure blocks mutation); changes brightness/speed/RGB while preserving unknown fields; sends captured13→93; selects captured mode19→99; rereads17 and compares exact settings. Sequential acknowledgements, timeouts, response bounds and per-transport concurrency guard included. Failures explicitly warn settings may have changed; no automatic retry or unverified rollback. Backup is RGB-table-only, not full device backup. Export RGB backup button provided.

142 automated tests pass, including fake-device full transaction/readback and backup-failure fail-closed coverage. Lint and production build pass. No agent-triggered physical RGB Apply performed; awaiting user browser test. Close stock MKeyboard first; Chrome/Edge → localhost5175 → disable Mock Mode → Dashboard Pair & Connect → Lighting Studio Static/Breath → Apply RGB. WebHID chooser is user-owned. Source changes do not imply physical runtime success.

## User hardware verification — 2026-10-31
User completed the live Chrome/Edge pairing and RGB Apply test and reported: RGB changed and readback confirmed. This is user-observed physical RGB success for the tested workflow, not an agent-observed test. Static/Breath implementation remains limited to captured RGB controls; no inference of testing every mode, brightness/speed boundary, reconnect, persistence after power cycle, backup restore, SOCD, RT or display support. Implementation commit f2f2532c564cd8250a5e8fdc69529941f2b97216.

## Expanded RGB effects
Added full captured native IDs0–11 through existing backed-up/acknowledged/readback-verified RGB workflow. Wave direction maps5–8. Other WK68-inspired effects and Wootility-style Reactive/Ripple overlays are explicit browser previews; overlay disables hardware Apply. Layer2 is not custom255. All preserved native mode records are covered by fake-device regression tests; only earlier Static is user-verified in-app. New per-key capture confirms physical W→34 with blue [FA,10,1,1,0,5,80,0,0,255,34]; no streaming or per-key hardware editor enabled because persistence/full mapping remains unverified. See docs/EXPANDED-RGB.md.

## Expanded native RGB user verification — 2026-10-31
User completed the requested Wave and Ripple hardware test and reported both work. This confirms physical Wave in the tested direction and Ripple key-press behavior through APEX CONTROL; the prompt also requested readback confirmation, but the short reply does not independently specify the status text. Do not infer all four Flow directions or all native modes were individually tested. Reference animations/overlays remain preview-only; streaming remains unverified. Implementation commit200a9720000ac9dd17feb6f7d79001844dda40b6.

## Remaining-effects experiment
Added a dedicated bounded Custom255 playback test using captured10/16/19 commands. Full palette readback/backup history precedes mutation;8 frames at2fps then acknowledged restore and readback; Stop and unmount cancellation; generic writes locked. Database-derived82 active positions, physical W34 confirmed, other spatial mappings not individually verified. No continuous playback claim yet.147 tests/lint/build pass; user has been asked to run Rainbow wheel test and report animation/restoration. See docs/CUSTOM-RGB-PLAYBACK.md.
