# Agent instructions for APEX CONTROL

- **Codex is the primary development environment.** Antigravity is only a temporary continuation until usage resets.
- Before editing, read `README.md`, `PROGRESS.md`, `HANDOFF.md`, `DECISIONS.md`, and `ANTIGRAVITY_PROMPT.md`.
- Inspect existing implementation first; preserve functionality, routes, integration contracts, and protocol evidence.
- Never invent VID/PID, report bytes, firmware features, or hardware test outcomes.
- Begin hardware investigation read-only; do not issue unknown HID writes, resets, or firmware operations.
- Keep mock-mode and physical hardware behavior clearly distinguishable.
- Work in a separate branch for temporary development and update `HANDOFF.md` before returning to Codex.
- Do not commit proprietary binaries, private captures, credentials, or machine identifiers.
