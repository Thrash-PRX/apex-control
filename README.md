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

**Current release:** local configuration previews and device diagnostics. Hardware writes are locked until verified readback/backup and protocol integration are complete. Display Studio supports local images and manual stat cards; OLED upload and live system telemetry are not yet supported.

Read [HANDOFF.md](HANDOFF.md), [PROGRESS.md](PROGRESS.md) and [docs/HID_PROTOCOL.md](docs/HID_PROTOCOL.md) for evidence, checks and blockers. No manufacturer binaries or private device identifiers are included.
