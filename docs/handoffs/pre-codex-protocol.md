# Branch Handoff: pre-codex/protocol

## Agent Role
**HID Protocol Engineering** — Primary responsibility: protocol correctness and offline reverse engineering.

## Branch Information
- **Branch name**: `pre-codex/protocol`
- **Base commit**: `f7fa93485f0242b45044a130421a3b28da1ec1b8` (antigravity/apex-control-continuation)
- **Latest commit**: `6214963` — "protocol: add comprehensive offline codec tests and response frame parsing"

## Files Modified
- `project/apex-control-app/src/lib/protocol/apex.ts` — Extended offline protocol codecs
- `project/apex-control-app/tests/protocol.test.js` — New comprehensive test suite (created)

## Implemented Features

### 1. Response Frame Parsing
- `parseResponseFrame(data: Uint8Array): ResponseFrame | null` — Parses 64-byte input reports from device
- Validates magic byte (0xFA), frame index, total frames, payload length
- Returns structured `ResponseFrame` with `isComplete` and `isFirst` flags
- Handles malformed, truncated, and unexpected responses gracefully (returns null)

### 2. Pagination Assembly
- `assemblePaginatedResponse(frames: ResponseFrame[]): Uint8Array` — Reassembles multi-frame responses
- Validates frame sequence, frame count consistency, totalFrames consistency, command consistency
- Throws descriptive errors for: missing frames, frame count mismatch, inconsistent totalFrames, command mismatch

### 3. Extended RGB Encoding (Opcode 0x10, 0x11, 0x16)
- `encodeBulkCustomRgbPayload/Report` — Opcode 0x11 bulk custom lighting with start-index addressing
- `encodeCustomRgbReadbackRequest` — Opcode 0x16 readback request with count validation
- `decodeBulkRgbReadback` — Decodes bulk RGB readback response (4 bytes per record: rawParam, R, G, B)

### 4. Extended Trigger Encoding (Opcode 0x26, 0x27, 0x28)
- `encodeTriggerSettingsPayload/Report` — Opcode 0x26 per-key threshold settings (LE16 threshold + key indices)
- `encodeBulkTriggerSettingsPayload/Report` — Opcode 0x28 bulk trigger settings (8 bytes/record: threshold, field4, field5, field6, field8)
- `encodeQuickTriggerPayload/Report` — Opcode 0x27 rapid trigger config (8 bytes/record: keyIndex, reserved, field4, field5, field6, field8)

### 5. SOCD / High Key Encoding (Opcode 0x23)
- `encodeHighKeyPayload/Report` — 19-byte opaque records (types 0-5 observed, type 5 inferred SOCD)

### 6. Keymap Encoding (Opcode 0x20)
- `encodeKeymapPayload/Report` — Base layer remapping (layer, keyCount, index/code pairs)

### 7. Getter Request Encoding
- Opcode 0x62: `encodeProductInfoRequest` — 7-byte date/time payload (WARNING: firmware side effects unknown)
- Opcode 0x2A: `encodeKeyboardConfigRequest`
- Opcode 0x17: `encodeEffectNameRequest`
- Opcode 0x57: `encodeConfigGetRequest`
- Opcode 0x5E: `encodeWholeParametersRequest`
- Opcode 0x2B: `encodeHighKeyGetRequest`
- Opcode 0x42: `encodeMacroGetRequest`

### 8. Setter Payload Encoding
- Opcode 0x50: `encodeWholeParametersSetPayload`
- Opcode 0x56: `encodeConfigInfoSetPayload`
- Opcode 0x13: `encodeEffectSetPayload`

### 9. Report Validation
- `validateReportStructure(data, expectedCommand?)` — Validates 64-byte report structure (magic, command, frame index, payload length)

### 10. Response Decoders
- `decodeKeyboardConfig` — Raw decoder for opcode 0x2A (two LE16 words, flags, string data)
- `decodeProductInfo` — Raw decoder for opcode 0x62 (two LE16 words, flags, data) — field meanings require further tracing

## Tests Added (90 tests in tests/protocol.test.js)

### Packet Framing & Validation (12 tests)
- Valid single-frame and multi-frame responses
- Invalid magic byte (non-0xFA)
- Too short data (< 7 bytes)
- Invalid frame index (0 or > totalFrames)
- Payload exceeding buffer capacity
- Field4 handling (unknown purpose preserved)

### Pagination Assembly (8 tests)
- Single frame assembly
- Three frames in order
- Unordered frame handling (auto-sorted)
- Missing frame detection
- Frame count mismatch
- Inconsistent totalFrames across frames
- Command mismatch across frames
- Empty array rejection

### RGB Color Serialization (10 tests)
- Single key, multiple keys, max keys (54)
- Empty keyIndices rejection
- Too many keys (55) rejection
- Duplicate key indices rejection
- Invalid RGB value bounds (byte range)
- Bulk custom RGB encoding/decoding
- Readback request validation
- Boundary key indices (0, 255)

### Trigger Parsing (7 tests)
- Single record decoding (LE16 threshold, boolean fields, two LE16 fields)
- Multiple records with startIndex
- Too short payload rejection
- Invalid record alignment ((length-1) % 8 !== 0)
- Index overflow (startIndex + count > 256)
- Sliced DataView handling (correct offset/byteLength)

### Trigger Settings Encoding (6 tests)
- Opcode 0x26 single/multiple keys
- Empty/too many/duplicate key indices
- Threshold bounds (0, 65535)

### Bulk Trigger Settings (4 tests)
- Valid records with all fields
- Empty/too many records
- Index overflow

### Quick Trigger / SOCD / Keymap (5 tests)
- Opcode 0x27 quick trigger encoding
- Opcode 0x23 19-byte SOCD records
- Opcode 0x20 keymap pairs validation

### Getter/Setter Requests (10 tests)
- All getter request opcodes (0x62, 0x2A, 0x17, 0x57, 0x5E, 0x2B, 0x42)
- Setter payload size validation (0x50, 0x56, 0x13)

### Report Structure Validation (6 tests)
- Valid report
- Invalid length (≠ 64)
- Invalid magic
- Command mismatch
- Invalid frame index (0, > totalFrames)
- Payload length exceeds capacity

### Response Decoders (4 tests)
- Bulk RGB readback decoding
- Keyboard config raw decode
- Product info raw decode

### Synthetic Fixtures & Edge Cases (8 tests)
- Request/response round-trip documentation
- Multi-frame readback simulation
- Boundary key indices
- Threshold/field bounds

## Tests Executed
- **All 103 tests pass** (13 existing + 90 new)
- `npm test` — PASS
- `npm run lint` — PASS (0 warnings, 0 errors)
- `npm run build` — PASS (production build successful)

## Known Limitations
1. **No hardware integration** — All codecs are offline-only, never connected to transport writes
2. **Raw units only** — No millimetre scaling, no SOCD mode names, no RT mode semantics
3. **Unknown fields preserved** — field4, field5, field6, field8 in trigger records kept as raw values with explicit "unknown semantics" comments
4. **Product info (0x62) not harmless** — Documented as potentially having firmware side effects
5. **Pagination error order** — Frame count mismatch checked before missing frame detection (implementation choice)
6. **Synthetic fixtures only** — Tests use instruction-derived values, not captured hardware traffic

## Hardware Verification Requirements
Before enabling device Apply:
1. Confirm firmware identity and exact report descriptor
2. Resolve RGB leading-parameter semantics and bulk-record physical key mapping
3. Prove actuation/RT raw-unit scaling, boolean semantics, valid ranges
4. Prove getter pagination, response matching, timeout/retry rules
5. Implement and validate complete device readback backup/restore
6. Compare encoded fixtures to authorized captures

## Potential Merge Conflicts
- Low risk — only adds to `src/lib/protocol/apex.ts` and creates new test file
- No changes to transport, device manager, UI, or store layers

## Commands for Codex to Continue
```bash
cd project/apex-control-app
npm ci --ignore-scripts
npm test
npm run lint
npm run build
```

## Next Priority Tasks for This Branch
1. Add checksum validation if evidence emerges (currently no checksum observed in static analysis)
2. Implement response matching logic (correlate requests to responses by command/frame)
3. Add timeout/retry utilities for paginated transactions
4. Document firmware version detection strategy