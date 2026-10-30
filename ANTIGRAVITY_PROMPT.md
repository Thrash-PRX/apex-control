# APEX CONTROL — TEMPORARY ANTIGRAVITY CONTINUATION

You are temporarily continuing an existing reverse-engineering and control-software project for the **Ant Esports APEX 200S magnetic gaming keyboard**.

**Codex is the PRIMARY development environment. Antigravity is temporary until Codex's usage limit resets. DO NOT migrate, restart, or replace the project.**

## Begin with inspection
1. Inspect the project under `project/` and its Git history, README, AGENTS.md, scripts, tests, and architecture.
2. Read `PROGRESS.md`, `HANDOFF.md`, `DECISIONS.md`, `docs/HID_PROTOCOL.md`, and `docs/FEATURE_MATRIX.md`.
3. Inspect only files actually supplied in `original-software/` and `research/`.
4. Never assume that vendor commands, USB VID/PID, device features, or prior implementation work have been verified without evidence.
5. Record the actual starting state and blockers.

## Priorities
1. Fix broken builds and failing tests in the existing application.
2. Continue safe static analysis of official software (`GameKeyboard.exe`, `hidapi.dll`, etc.).
3. Identify device HID interfaces/report types and document findings with evidence.
4. Build or improve read-only device discovery/diagnostic tooling.
5. Implement **verified** hardware communication, then verified RGB commands.
6. Investigate actuation, Rapid Trigger, SOCD, profiles, and calibration, with genuine device capability checks.
7. Improve UI only where it materially improves real UX; maintain existing functionality and design direction.

### Safety
Treat vendor executables as untrusted. Use an isolated analysis environment.
Do not guess HID bytes or send unverified reports to the keyboard.
Require explicit approval for risky writes, calibration, factory reset, or firmware flashing.
Clearly distinguish mock-mode behavior from hardware-tested behavior.

## Source control
Use this GitHub repository: `https://github.com/Thrash-PRX/apex-control`.
Create a temporary branch: `antigravity/apex-control-continuation`.
Do not force-push, modify existing history, or overwrite another developer's work.
Do not publish manufacturer binaries or sensitive captures.
Commit only meaningful tested work. Push only when authenticated and permitted.

## Feature targets (not promises)
Real HID discovery and communication; custom RGB/per-key effects where supported;
Hall-effect actuation; Rapid Trigger; SOCD; key mapping; device profiles;
calibration and diagnostics; premium accessible responsive interface.

## Maintain handoff
Update `PROGRESS.md` with tested changes, blockers, and next steps.
Update `HANDOFF.md` with current branch, latest commit, changed files, commands
to build/test, discovered protocol behavior, hardware verification status, and
exact instructions for Codex to resume.
Update `docs/HID_PROTOCOL.md` and `docs/FEATURE_MATRIX.md` as evidence emerges.

**Execute changes, run tests, and document results; do not stop at a plan.**
Start by auditing the actual workspace and implementing the next safe, testable task.
