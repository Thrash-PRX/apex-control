# Engineering Decisions

## Core Continuity & Safety Rules
- Keep Codex as the primary development environment.
- Use Antigravity only temporarily until Codex usage resets.
- Preserve existing architecture, routes, integrations, behavior, and working features.
- Strictly separate confirmed hardware features from hypotheses and UI mocks.
- Avoid arbitrary HID commands or unsafe firmware operations (never send random byte writes to MCU).
- Store manufacturer's original binaries outside Git history (`.gitignore` enforced).

## Architectural & Technical Decisions

### 1. Technology Stack: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Rationale:** Vite provides instantaneous HMR, fast builds, and clean static asset generation. React 19 + TypeScript provides type safety across protocol messages.
- **Portability:** The Vite frontend can run standalone in any modern Chromium browser (via WebHID) or be wrapped in Tauri v2 (Rust backend) without code modifications.

### 2. Transport Abstraction Layer (`HidTransport`)
- **Decision:** All HID communication flows through a unified interface (`HidTransport`) rather than hardcoding WebHID or node-hid.
- **Rationale:** Enables seamless runtime switching between `WebHidTransport` (browser USB), future `TauriTransport` (native Rust hidapi), and `MockHidTransport` (offline simulation).
- **Mock Separation:** Mock mode is treated as a first-class citizen with clear visual indicators, simulated response delays, and logging. It never masquerades as a physical keyboard connection.

### 3. TypeScript `erasableSyntaxOnly` Compliance
- **Decision:** Avoid TypeScript `enum` declarations; use `const ... as const` objects with derived union types (e.g. `ConnectionState`, `ReportType`, `LightingEffect`, `SocdMode`).
- **Rationale:** Adheres to modern ECMAScript type-stripping proposals, allows tests to run directly in Node 24 without transpilation, and produces clean JavaScript.

### 4. Interactive 75% Physical Layout Engine
- **Decision:** Build a custom key-unit grid layout (`src/lib/keyboard-layout.ts`) representing the physical APEX 200S (84 standard keys + rotary volume knob + status screen placeholder).
- **Rationale:** Generic AI grids fail to represent real keyboard layouts. The custom model allows pixel-accurate positioning, Shift+Click multi-key selection, per-key RGB coloring, and per-key actuation depth display.

### 5. Clear Feature Status Labeling
- **Decision:** Features whose exact HID opcode is unverified are clearly flagged in the UI with an amber "⚠ Protocol Unverified" or "⚠ Sensor Limits Unverified" badge.
- **Rationale:** Adheres to the prompt requirement: "Do not implement fake hardware functionality. A feature must only be described as working when its command structure, supported capabilities, and behavior have been verified."
