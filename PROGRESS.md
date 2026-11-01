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

User confirms physical Wave and Ripple both work via APEX CONTROL. Static RGB, Wave in one tested direction, and Ripple now have user-reported physical success. Remaining native modes and streaming are not thereby verified.

Remaining-effects host playback prototype: captured Custom255/10/16 path, palette backup history, bounded8-frame2fps hardware test, restore/readback and cancellation.147 tests/lint/build pass. User live test pending; continuous streaming not enabled.

Custom RGB loop now has packet pacing, grouped original-palette recovery, adaptive verified bulk transfer and actualFPS. Native benchmark demonstrates tested path ~3fps; user rejects smoothness. This requirement is not complete. White comparison restored original palette successfully; subjective brightness pending.

## APEX 200 layout and effect status correction — 2026-10-31
User confirms APEX 200 with 82 physical keys. Replaced guessed 84-key/200S geometry with 82 active keys from retained APEX layout data (84 slots, inactive14/15), checked against official APEX200 product photo. Screen is top right; Insert/Delete and PgUp/PgDn below it; light bar and knob beside Up. Bottom legends Fn/Ctrl follow photo; no hardware key bindings changed. W34 alone is capture-confirmed; complete per-key mapping remains unverified. Official source: https://antesports.com/products/apex200-tri-mode-magnetic-keyboard-black . Marketing key count differs from user/photo/active geometry; do not reinstate guessed84-key draft.

Native effects are the default list. Other authored reference previews and low-rate hardware tools remain accessible under experimental controls; they are not working smooth WK68/Wooting equivalents. Added direct user-click pairing from Lighting and explicit hardware connection status; hardware Apply is disabled in mock/disconnected state. Selecting a preview is separate from Apply. No new physical RGB success claimed and no device writes performed for this correction. Existing Static/Wave/Ripple user verification remains valid; extra smooth effects remain unresolved (~2.8fps tested path). 153 tests pass; lint and production build pass.

## Optimized custom RGB — 2026-10-31
Implemented a delta planner for captured10/11: skip unchanged keys, group equal raw colors (54 indices/report), or send only changed contiguous spans (14 records/report), excluding inactive14/15. Every changed frame still receives full palette readback. Preflight now uses60/80ms instead of known-dropping short spacings; playback retains the successful spacing. Stop and failure restore saved records and verify readback.

Color Cycle uses the captured native Static13 path: preserve unknown fields, save exact Static record before mutation, select1 once, update RGB with65ms settling and effect-table17 readback per frame. Stop restores the original Static record and verifies it, then selectsCustom255 without changing its palette. A persistent pending-recovery backup and Restore saved RGB settings control cover interrupted runs; backup failure blocks writes. It does not restore the previously active native mode, which remains unknown.

Real USB tests executing the app engine through a native adapter verified Snake11.5–11.9fps and Color Cycle12.6fps, each for~5seconds with restoration confirmed. Fourteen additional spatial effects completed bounded runs with full frame readback/restoration: most2.6–3.4fps, Flash Away4.6fps. They transmit colors but still do not meet demo smoothness. Native Wave remains the appropriate smooth firmware-driven alternative. No visual smoothness/brightness or browser runtime confirmation is claimed. See research/evidence/custom-rgb-optimized-results.json. Earlier synchronous diagnostic gave7.3fps Snake/10.6fps native cycle;20ms native settling timed out,65ms passed. All hardware handles closed. No unknown opcodes, feature writes, firmware/reset/calibration/SOCD/RT/display operations.

UI exposes Show custom effects and Play custom effect (loop), with native Apply separately. Color painting remains disabled; page-focused reactive/shadow/heatmap behavior is not system-wide. Added planner, native-cycle backup/readback/recovery and adaptive pacing regression tests. 162 automated tests, lint and production build pass. Remaining blocker: smooth full-board high-change effects still require a faster evidenced protocol/firmware capability. User should refresh, reconnect and assess Snake/Color Cycle in browser before any broader success claim.

## Browser visual failure reported after optimized build
User reports Snake lights one row dimly for about2seconds, then returns to the prior APEX static appearance instead of continuing. This supersedes any implication of working browser animation; native-adapter palette readback success is not visible-output proof. Exact UI status is requested and still pending. A2second transaction timeout/automatic recovery is a hypothesis, not an established cause. Rechecked retained stock captures: green color changes use13 alone and isolated W blue uses10 alone; neither adds19 after each color. Do not add speculative activation writes. Improved timeout messages to identify command and page; added a dropped in-loop readback regression that verifies restoration before failure. No new physical writes performed while the user's browser is connected.

## Per-key timed Snake and confirmed browser timeout — 2026-10-31
User supplied the old-build message: Custom RGB timeout; reconnect and restore exported colours. This establishes a response timeout, but not the failed command/page. User requests individual key timing instead of layer frames.

Reworked Snake into explicit per-key ON/hold/OFF deadlines along an82-key serpentine physical route. Each head key advances exactly once; slow transport does not skip head positions to catch up. Keys hold their full configured color rather than using the prior dim fading frame shader. Main preview uses the same route/colors/hold model; actual hardware timing remains USB-limited. Snake sends captured10 grouped selected-index commands only, with no11 bulk frames or full-frame probe. Clear-at-start, browser backup, Stop, restoration and readback are retained. No new physical test was performed while the user's browser was connected; visible correctness remains pending.

Also increased bulk settling35→100ms; consolidated response matching to ignore delayed replies for another page; allows one retry only for captured read-only getters16/17 after timeout. Writes are never retried. Errors identify command/page. Added timeout/recovery, write-no-retry, settling, independent deadlines, no-skipped-keys, route, matching-preview and no-bulk Snake tests. UI identifies Playback update4. Earlier11.9fps Snake benchmark was for the previous engine and must not be attributed to this timed path. No unsupported commands/features were enabled.

Verification for per-key timed Snake:173 tests passed, lint clean and production build successful. No new live keyboard test claimed.

## User video verifies update4 timed Snake — 2026-10-31
Inspected a user-supplied14.334-second30fps clip. A colored trail changes physical position across keys over the clip. User explicitly confirms Playback update4 and that it kept running without timeout. This is the first user-confirmed sustained visible test of the per-key timed Snake path, implementation3fda57cd268106565a5b0c76d81f910acbd1d691. It does not establish all82 key-index mappings, full-cycle/long-duration reliability, Stop restoration in this recording, measured luminance, smoothness parity or other custom effects. Camera exposure/glare limit brightness assessment. Earlier native-adapter FPS figures are not measurements of this timed path. Video SHA256:7CFA11763D624959599C548037CD4415951BF1C780C7615317FEC44F308D97CC. Video and analysis frames remain outside Git. No new code/device writes; prior173-test/lint/build result remains the implementation checkpoint.

## Playback update5 — remaining effects on per-key timers, 2026-11-01
User requested fixing the remaining effects and confirmed Stop/Disconnect before USB tests. Extended the acknowledged selected-index10 path to all17 custom spatial effects (Snake, Rainbow, Gradient, Flash Away, Rain, Wheel, Twinkle, Shadow, Neon Stream, Sine Wave, Scanner, Windmill, Waterfall, Blossom, Storm, Fireworks, Heatmap). Color Cycle retains the captured native Static13 engine. These are authored hardware-friendly interpretations, not copies of WK68/Wooting firmware algorithms. Persistent Rainbow/Gradient paint keys individually; pulse effects schedule individual key holds/off deadlines. Snake and other trails pause their deadlines for slow USB transactions to prevent expiry gaps. Timed playback rejects0x11 bulk frames and has no full-frame transfer probe.

Changed-page readback verifies every record on touched pages, including unchanged neighbors. Full palette audits run after5seconds of changed playback; full readback and exact original active-palette comparison remain part of Stop/recovery. New tests cover touched-page request counts, neighbor corruption, invalid colors, all custom-effect coverage, per-key event ranges, preview parity, input-hit expiry and six-key Snake continuity under slow transactions. Existing generic HID/feature writes remain locked; no reset/calibration/flashing/SOCD/RT/display operations.

Real USB native-adapter checks ran all18 engines for about5seconds each: all completed readback/restoration, with timed spatial paths mostly5.5–6.3 verified key-update batches/s; Shadow4.4 and Heatmap2.7 depended on synthetic page-local hit frequency; Color Cycle12.6fps. Additional20second loop/Stop tests: Snake115 updates and Wheel118 updates, both restored/read back original colors. All native handles closed. Evidence: research/evidence/timed-custom-rgb-results.json. Key-update rate is not whole-board video FPS. New per-key patterns, sustained brightness, browser timing and subjective smoothness are not thereby human-verified; prior update4 video remains the visible checkpoint. Full82-key naming still lacks isolated verification beyond W34.

During playback the visualizer mirrors last verified colors, including Color Cycle, rather than a faster independent demo. Outside playback it uses shared authored timed patterns. Shadow/Heatmap accept page-focused key events only. Other modes and UI preserved; native Apply stays separate. README/feature matrix stale RGB write-lock/key-count claims corrected. Final validation:181 automated tests, clean lint, successful production build. Refresh update5 and assess new patterns on device; do not claim exact vendor parity or60fps.

User confirms update5 running/Stop restoration, but rejects dim/sparse appearance. Preserve this functional checkpoint while tuning colors and coverage.

## Playback update6 — brighter/fuller software styling, 2026-11-01
After user confirmed update5 functional playback and Stop restoration, they reported dim, unappealing effects. Preserve the working protocol path; raw custom leading parameter stays100 and RGB bytes remain0–255. No unverified brightness range or new device command was introduced. The per-key capture's raw value80 was rechecked; no inferred scale above100 is used.

Added a22% default ambient RGB glow (adjustable0–40% for pulse effects), lifted low foreground color channels with an18% white component, widened beams/rings and increased pulse coverage/hold durations. Snake now holds12 accent keys over the background rather than6 over black. Rainbow/Gradient start filled with four coordinated color zones before their per-key evolution, avoiding the slow monochrome startup. Local preview and hardware share these colors/holds; live mirror remains readback-driven.

Added Vivid preset (brightness100/glow28/blue-violet colors), stopped silently overriding brightness on Play, and made default brightness100. Glow affects software RGB values only. Recovery ignores invalid optional editor glow so backups remain restorable. Tests cover valid limits/zero brightness, black/zero-glow behavior, full background coverage,12-key continuity, filled startup, shared preview parity and recovery. This is RGB styling, not a measured physical luminance fix; user visual assessment remains necessary. No agent-triggered hardware writes were performed during this styling change while the user's browser may be connected. Update5 USB results remain the underlying transport checkpoint.

Update6 verification:185 tests passed; lint clean; production build passed. Package refreshed; live aesthetic assessment pending.

## Playback update7 — measured pacing and full-board color fields, 2026-11-01
User again reported dimness and poor motion. They confirmed Stop/Disconnect for a controlled white comparison. Ran native Static white100 for5seconds then Custom raw100/RGB255 white for5seconds; Custom readback matched all82 and original palette restore was verified. Human brightness comparison is requested and still pending. Do not infer that custom/native white are equal or that raw parameter scaling is solved.

New bounded acknowledged0x10 timing test:16 distinct key writes with50ms gaps all persisted,16.15commands/s;25ms caused an ACK timeout and the original palette was restored/read back. W34 changed-page tests:65/50/35ms post-ACK settling passed12 frames each;35ms achieved16.15verified updates/s,max63ms/frame.20ms produced roughly2second stalls repeatedly (read-only retry recovered), not a clean fast path. No writes were retried. Retained RGB UI assembly has slider ranges0..100 and1..100 at140033985/14003399c; this is not proof of every raw custom parameter's semantics. No values above100 were sent as the leading parameter.

Use50ms inter-write pacing,35ms read settling for<=16 changed keys,65ms otherwise; original audits/backup/restoration remain. Vivid preset speed85 and requested speed floor65ms allow the proven path to advance faster. Wheel/Windmill/Storm/NeonStream now start with coordinated full-board spectra and retain key colors between updates instead of extinguishing sectors. Each stage changes selected physical keys via10 only. Ambient control is disabled for these filled modes. This targets sparse appearance without inventing a hardware brightness boost.

Actual app-engine USB checks: Wheel9.52,Windmill9.73,Storm9.69,NeonStream9.73,Snake9.98verified update batches/s; each completed readback and restoration. Additional20second Wheel loop203updates,10.15updates/s, Stop restoration verified. Handles closed. Sanitized evidence: research/evidence/selected-key-pacing-results.json. Human visual assessment of update7 and white-comparison answer remain outstanding; no photometric/smoothness equivalence claim.186 tests pass, lint clean, production build passes.

## White comparison clarified and stock-software reference pending
User explicitly reports BOTH native Static white100 and Custom raw100/RGB255 white looked dim. Thus no custom-only brightness deficit has been established. Original palette restoration was verified. Requested stock MKeyboard Static white100 comparison before changing any unknown/global setting or raw range.

A device-filtered descriptor capture revalidated USBPcap2/address3 as314B:1026. USBPcapCMD spawned an elevated child; stopping the launching parent did not stop it, and Windows denied this session's termination of childPID181916. Requested user stop through Task Manager; subsequently verified no USBPcapCMD processes remained and the file was closed/parsable. Capture contained valid APEX descriptor and is private; no raw input capture is committed. No stock RGB change was requested while that helper was active. Do not restart an elevated capture without a reliable stop path. Stock brightness comparison is the current missing evidence; update7 motion is already coded,186-test/lint/build checked and USB-tested10.15updates/s over20seconds with restoration.

## Stock reference differs; read-only checkpoint not white
User reports MKeyboard is much brighter and confirms the elevated capture worker was stopped. Asked them to close MKeyboard while retaining bright Static white and report whether it stays bright; that confirmation remains pending. OS process check found no GameKeyboard/USBPcapCMD processes. Ran the new captured-getter-only read-native-rgb.mjs:12 effect records and84 palette slots, zero configuration mutations. Stored Static record did not match the earlier white target; custom palette had0 all-white active keys. This snapshot therefore cannot establish the claimed bright-white state or identify a missing master setting. Raw snapshot remains private. Do not guess global brightness fields or raise raw ranges. Next evidence: confirm correct bright state survives MKeyboard closure, then compare/capture the actual stock setting with a reliable user-owned capture stop path.

## Bright stock state persists — 2026-11-02
User confirms MKeyboard Static white100 stays bright after closing the software. Getter-only snapshot returned12 effect records/84 palette slots, zero mutations. Stored Static remained [1,100,50,0,13,255,228,0], not white;82 custom records changed relative to prior snapshot, with sampled records [100,250,220,25]. This discrepancy does not establish active mode or brightness semantics. No configuration writes were performed. Need passive capture of the actual stock selection/brightness sequence.

Added capture-stock-rgb.ps1: user-run Administrator PowerShell, refuses non-admin/existing captures, device-filtered USBPcap2/address3, private unique output outside Git, bounded60-second timer (15–120 bounds), finally terminates and waits only its owned worker. No self-elevation or HID writes. This addresses the prior inability to stop the elevated child from the agent session. PowerShell parser validation passed; live capture execution remains user-operated/pending. Asked user to capture Static white50→100, wait STOPPED and close MKeyboard. Previous app186-test/lint/build checkpoint unchanged. No brightness fix claimed.

## Capture retry and USB address correction — 2026-11-02
Non-admin direct retry refused safely. User asked agent to retry; launched the bounded script through Windows RunAs with a hidden Administrator PowerShell and private log. It completed and stopped its owned worker successfully. Address3 now describes048D:C999, not APEX, and contained no configuration reports; user brightness changes cannot be attributed to that capture. No-argument USBPcap inventory attempt produced an empty file and was bounded/stopped. Descriptor-only address2 probe verified314B:1026 (174 packets, untruncated), stopped automatically. Added validated DeviceAddress parameter to avoid assuming a stable USB address. Started a new120-second bounded capture on verifiedUSBPcap2/address2 and requested one repeat of stock Static white50→100; result pending. All captures remain outside Git. No lighting writes by agent, no brightness fix claimed. Script PowerShell parser validation passes; application unchanged.

## Confirmed stock white capture and controlled repeat — 2026-11-02
Verified address2 capture stopped automatically; no USBPcap worker remains. User confirms white50→100 performed and MKeyboard closed. Capture562 packets, untruncated, contains native19 selection and13 writes, plus stock startup getters. Final Static record [1,100,58,0,13,255,255,255] subsequently matched getter readback with zero mutations. This establishes white100 stock state, not a new brightness scale. Sequence also changes Ripple record third byte17→100; do not relabel established speed/brightness bytes based on ambiguous user actions. No unknown opcodes replayed.

From that confirmed baseline ran existing native/custom white comparison with exact Static prefix preserved (speed58), full private backup, Custom raw100/RGB255 readback all82, original palette restored/read back and captured active Static1 reselected. Added --restore-confirmed-static to bounded white benchmark to restore known active mode when explicitly established, instead of leaving Custom selected. Node syntax check and actual USB run passed. Human phase comparison pending. Sanitized captured RGB writes/hash and result: research/evidence/stock-white-20261102.json; raw capture/backups remain private. No app behavior change or brightness fix claimed. Previous186-test/lint/build app checkpoint unchanged.
