# APEX CONTROL

React/TypeScript keyboard configurator continued from the existing application in `project/apex-control-app`.

```powershell
cd project/apex-control-app
npm ci --ignore-scripts
npm test
npm run lint
npm run build
npm run dev -- --host 127.0.0.1
```

Open the local URL printed by Vite. Use Chrome/Edge with WebHID for device discovery; mock mode is clearly labelled. Production files are generated in `dist/` and need HTTPS when hosted.

**Current release:** captured native RGB Apply plus host-driven per-key custom effects, with backups, acknowledgements and readback. Native Static/Wave/Ripple and update4 timed Snake have user-reported physical success. Update5 extends timed playback to17 spatial effects; USB readback/restore tests passed, while their new browser appearance remains to be assessed. Generic output/feature writes and other hardware configuration remain locked. Display Studio supports local images and manual stat cards; OLED upload and live system telemetry are not yet supported.

Read [HANDOFF.md](HANDOFF.md), [PROGRESS.md](PROGRESS.md) and [docs/HID_PROTOCOL.md](docs/HID_PROTOCOL.md) for evidence, checks and blockers. No manufacturer binaries or private device identifiers are included.
