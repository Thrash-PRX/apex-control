/** Offline, static-evidence codecs only. Never connected to a transport.
 * See research/evidence/PROTOCOL.md. No display or firmware commands. */

function byte(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 255) throw new RangeError('Expected byte');
  return value;
}

function word(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff) throw new RangeError('Expected 16-bit word');
  return value;
}

/** Opcode 0x10 payload. Leading parameter and physical key mapping remain raw. */
export function encodeCustomRgbPayload(
  rawParameter: number,
  rgb: readonly [number, number, number],
  keyIndices: readonly number[]
): Uint8Array {
  if (rgb.length !== 3 || keyIndices.length < 1 || keyIndices.length > 54) {
    throw new RangeError('Invalid RGB payload size');
  }
  if (new Set(keyIndices).size !== keyIndices.length) {
    throw new RangeError('Duplicate key index');
  }
  return Uint8Array.from([rawParameter, ...rgb, ...keyIndices].map(byte));
}

/** Candidate 64-byte output wrapper (not capture-verified); WebHID payload excludes the HIDAPI report-ID prefix.
 * Format: [FA, opcode, frameIndex, totalFrames, 0, payloadLength, payload..., padding] */
export function encodeCustomRgbReport(
  rawParameter: number,
  rgb: readonly [number, number, number],
  keyIndices: readonly number[]
): Uint8Array {
  const payload = encodeCustomRgbPayload(rawParameter, rgb, keyIndices);
  const report = new Uint8Array(64);
  report.set([0xfa, 0x10, 1, 1, 0, payload.length]);
  report.set(payload, 6);
  return report;
}

/** Opcode 0x11 bulk custom lighting payload.
 * Format: [startIndex, ...N records of 4 bytes each] */
export function encodeBulkCustomRgbPayload(
  startIndex: number,
  records: readonly (readonly [number, number, number, number])[]
): Uint8Array {
  if (records.length === 0 || records.length > 14) {
    throw new RangeError('Invalid bulk record count');
  }
  if (startIndex < 0 || startIndex + records.length > 256) {
    throw new RangeError('Bulk record index overflow');
  }
  const payload = new Uint8Array(1 + records.length * 4);
  payload[0] = byte(startIndex);
  for (let i = 0; i < records.length; i++) {
    const [b0, b1, b2, b3] = records[i].map(byte);
    payload.set([b0, b1, b2, b3], 1 + i * 4);
  }
  return payload;
}

export function encodeBulkCustomRgbReport(
  startIndex: number,
  records: readonly (readonly [number, number, number, number])[]
): Uint8Array {
  const payload = encodeBulkCustomRgbPayload(startIndex, records);
  const report = new Uint8Array(64);
  report.set([0xfa, 0x11, 1, 1, 0, payload.length]);
  report.set(payload, 6);
  return report;
}

/** @deprecated Unverified legacy start/count reconstruction. Physical capture uses a zero-length request and host-driven header pagination; see APEX-RGB-CAPTURE.md. Offline only. */
export function encodeCustomRgbReadbackRequest(startIndex: number, count: number): Uint8Array {
  if (count <= 0 || count > 60) throw new RangeError('Invalid readback count');
  if (startIndex < 0 || startIndex + count > 256) throw new RangeError('Readback index overflow');
  const payload = new Uint8Array([byte(startIndex), byte(count)]);
  const report = new Uint8Array(64);
  report.set([0xfa, 0x16, 1, 1, 0, payload.length]);
  report.set(payload, 6);
  return report;
}

/** Response frame structure (input report from device).
 * Format: [FA, command, frameIndex, totalFrames, field4, payloadLength, payload..., padding] */
export interface ResponseFrame {
  magic: number;           // Expected 0xFA
  command: number;         // Raw response opcode; captured responses use request | 0x80
  frameIndex: number;      // 1-based
  totalFrames: number;     // Total frames in this transaction
  field4: number;          // Unknown purpose (checksum? flags?)
  payloadLength: number;   // Length of payload following this header
  payload: Uint8Array;     // Actual payload data
  isComplete: boolean;     // frameIndex === totalFrames
  isFirst: boolean;        // frameIndex === 1
}

/** Parse a raw input report (64 bytes from WebHID) into a ResponseFrame.
 * Returns null if the frame is malformed or doesn't match expected magic. */
export function parseResponseFrame(data: Uint8Array): ResponseFrame | null {
  if (data.length !== 64) return null; // Minimum: magic + cmd + frame + total + field4 + len + 1 byte payload
  if (data[0] !== 0xfa) return null; // Magic mismatch

  const command = data[1];
  const frameIndex = data[2];
  const totalFrames = data[3];
  const field4 = data[4];
  const payloadLength = data[5];

  // Validate frame index
  if (frameIndex === 0 || frameIndex > totalFrames) return null;

  // Check payload fits
  if (6 + payloadLength > data.length) return null;

  const payload = data.subarray(6, 6 + payloadLength);

  return {
    magic: 0xfa,
    command,
    frameIndex,
    totalFrames,
    field4,
    payloadLength,
    payload,
    isComplete: frameIndex === totalFrames,
    isFirst: frameIndex === 1,
  };
}

/** Assemble paginated response frames into a complete payload.
 * Frames must be provided in order (frameIndex 1, 2, ..., totalFrames).
 * Returns concatenated payload or throws on sequence errors. */
export function assemblePaginatedResponse(frames: ResponseFrame[]): Uint8Array {
  if (frames.length === 0) throw new RangeError('No frames to assemble');

  // Sort by frameIndex to be safe
  const sorted = [...frames].sort((a, b) => a.frameIndex - b.frameIndex);

  // Validate sequence
  const totalFrames = sorted[0].totalFrames;
  if (sorted.length !== totalFrames) {
    throw new RangeError(`Frame count mismatch: got ${sorted.length}, expected ${totalFrames}`);
  }
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].frameIndex !== i + 1) {
      throw new RangeError(`Missing frame ${i + 1}`);
    }
    if (sorted[i].totalFrames !== totalFrames) {
      throw new RangeError('Inconsistent totalFrames across frames');
    }
    if (sorted[i].command !== sorted[0].command) {
      throw new RangeError('Command mismatch across frames');
    }
  }

  // Concatenate payloads
  let totalLength = 0;
  for (const frame of sorted) totalLength += frame.payloadLength;
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const frame of sorted) {
    result.set(frame.payload, offset);
    offset += frame.payloadLength;
  }
  return result;
}

/** Decode trigger readback payload (opcode 0x2C response).
 * Payload format: [startIndex, record1..., record2..., ...]
 * Each record is 8 bytes: threshold(LE16), field4(bool), field5(bool), field6(LE16), field8(LE16) */
export interface RawTriggerRecord {
  index: number;
  threshold: number;    // Little-endian 16-bit, raw units (not millimetres)
  field4: boolean;      // Unknown semantics
  field5: boolean;      // Unknown semantics
  field6: number;       // Little-endian 16-bit, raw units
  field8: number;       // Little-endian 16-bit, raw units
}

/** Getter payload only: raw units, not millimetres or named RT modes. */
export function decodeTriggerPayload(payload: Uint8Array): RawTriggerRecord[] {
  if (payload.length < 9 || (payload.length - 1) % 8 !== 0 || payload[0] + (payload.length - 1) / 8 > 256) {
    throw new RangeError('Invalid trigger payload');
  }
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  return Array.from({ length: (payload.length - 1) / 8 }, (_, i) => {
    const at = 1 + i * 8;
    return {
      index: payload[0] + i,
      threshold: view.getUint16(at, true),
      field4: payload[at + 2] !== 0,
      field5: payload[at + 3] !== 0,
      field6: view.getUint16(at + 4, true),
      field8: view.getUint16(at + 6, true),
    };
  });
}

/** Opcode 0x26 trigger settings payload: [threshold_lo, threshold_hi, keyIndex1, keyIndex2, ...] */
export function encodeTriggerSettingsPayload(
  threshold: number,
  keyIndices: readonly number[]
): Uint8Array {
  if (keyIndices.length < 1 || keyIndices.length > 54) {
    throw new RangeError('Invalid key index count for trigger settings');
  }
  if (new Set(keyIndices).size !== keyIndices.length) {
    throw new RangeError('Duplicate key index');
  }
  const payload = new Uint8Array(2 + keyIndices.length);
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  view.setUint16(0, word(threshold), true); // Little-endian
  for (let i = 0; i < keyIndices.length; i++) {
    payload[2 + i] = byte(keyIndices[i]);
  }
  return payload;
}

export function encodeTriggerSettingsReport(
  threshold: number,
  keyIndices: readonly number[]
): Uint8Array {
  const payload = encodeTriggerSettingsPayload(threshold, keyIndices);
  const report = new Uint8Array(64);
  report.set([0xfa, 0x26, 1, 1, 0, payload.length]);
  report.set(payload, 6);
  return report;
}

/** Opcode 0x28 bulk trigger settings payload: [startIndex, count, record1(8b), record2(8b), ...]
 * Each record: [threshold_lo, threshold_hi, field4, field5, field6_lo, field6_hi, field8_lo, field8_hi] */
export interface BulkTriggerRecord {
  threshold: number;
  field4: number;
  field5: number;
  field6: number;
  field8: number;
}

export function encodeBulkTriggerSettingsPayload(
  startIndex: number,
  records: readonly BulkTriggerRecord[]
): Uint8Array {
  if (records.length === 0 || records.length > 7) throw new RangeError('Invalid bulk trigger record count');
  if (startIndex < 0 || startIndex + records.length > 256) throw new RangeError('Bulk trigger index overflow');
  const payload = new Uint8Array(2 + records.length * 8);
  payload[0] = byte(startIndex);
  payload[1] = byte(records.length);
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const base = 2 + i * 8;
    const view = new DataView(payload.buffer, payload.byteOffset + base, 8);
    view.setUint16(0, word(r.threshold), true);
    payload[base + 2] = byte(r.field4);
    payload[base + 3] = byte(r.field5);
    view.setUint16(4, word(r.field6), true);
    view.setUint16(6, word(r.field8), true);
  }
  return payload;
}

export function encodeBulkTriggerSettingsReport(
  startIndex: number,
  records: readonly BulkTriggerRecord[]
): Uint8Array {
  const payload = encodeBulkTriggerSettingsPayload(startIndex, records);
  const report = new Uint8Array(64);
  report.set([0xfa, 0x28, 1, 1, 0, payload.length]);
  report.set(payload, 6);
  return report;
}

/** Opcode 0x27 quick trigger (rapid trigger) config payload: N x 8-byte records
 * [keyIndex, 0, field4, field5, field6_lo, field6_hi, field8_lo, field8_hi] */
export interface QuickTriggerRecord {
  keyIndex: number;
  field4: number;
  field5: number;
  field6: number;
  field8: number;
}

export function encodeQuickTriggerPayload(records: readonly QuickTriggerRecord[]): Uint8Array {
  if (records.length === 0 || records.length > 7) throw new RangeError('Invalid quick trigger record count');
  const payload = new Uint8Array(records.length * 8);
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const base = i * 8;
    const view = new DataView(payload.buffer, payload.byteOffset + base, 8);
    payload[base] = byte(r.keyIndex);
    payload[base + 1] = 0; // Reserved/zero per static analysis
    payload[base + 2] = byte(r.field4);
    payload[base + 3] = byte(r.field5);
    view.setUint16(4, word(r.field6), true);
    view.setUint16(6, word(r.field8), true);
  }
  return payload;
}

export function encodeQuickTriggerReport(records: readonly QuickTriggerRecord[]): Uint8Array {
  const payload = encodeQuickTriggerPayload(records);
  const report = new Uint8Array(64);
  report.set([0xfa, 0x27, 1, 1, 0, payload.length]);
  report.set(payload, 6);
  return report;
}

/** Opcode 0x23 SOCD/high key payload: 19-byte fixed slots.
 * Format varies by type. Types 0-5 observed. Type 5 appears SOCD-related (two keys + mode).
 * We accept opaque 19-byte records without interpreting type/mode semantics. */
export function encodeHighKeyPayload(records: readonly Uint8Array[]): Uint8Array {
  for (const rec of records) {
    if (rec.length !== 19) throw new RangeError('SOCD/high key record must be 19 bytes');
  }
  const payload = new Uint8Array(records.length * 19);
  for (let i = 0; i < records.length; i++) {
    payload.set(records[i], i * 19);
  }
  return payload;
}

export function encodeHighKeyReport(records: readonly Uint8Array[]): Uint8Array {
  const payload = encodeHighKeyPayload(records);
  const report = new Uint8Array(64);
  report.set([0xfa, 0x23, 1, 1, 0, payload.length]);
  report.set(payload, 6);
  return report;
}

/** Opcode 0x20 keymap payload (base layer) */
export function encodeKeymapPayload(layer: number, mappings: readonly number[]): Uint8Array {
  // Format per static analysis: [layer, keyCount, keyIndex1, newCode1, keyIndex2, newCode2, ...]
  // This is a best-effort reconstruction; exact format needs hardware verification.
  if (mappings.length % 2 !== 0) throw new RangeError('Keymap mappings must be pairs of index+code');
  const payload = new Uint8Array(2 + mappings.length);
  payload[0] = byte(layer);
  payload[1] = byte(mappings.length / 2);
  payload.set(mappings.map(byte), 2);
  return payload;
}

export function encodeKeymapReport(layer: number, mappings: readonly number[]): Uint8Array {
  const payload = encodeKeymapPayload(layer, mappings);
  const report = new Uint8Array(64);
  report.set([0xfa, 0x20, 1, 1, 0, payload.length]);
  report.set(payload, 6);
  return report;
}

/** Opcode 0x62 product info request (sends date/time, receives info).
 * WARNING: Do not treat as harmless read. Firmware side effects unknown. */
export function encodeProductInfoRequest(): Uint8Array {
  const payload = new Uint8Array([0, 0, 0, 0, 0, 0, 0]); // Date/time placeholder
  const report = new Uint8Array(64);
  report.set([0xfa, 0x62, 1, 1, 0, payload.length]);
  report.set(payload, 6);
  return report;
}

/** Opcode 0x2A keyboard config getter */
export function encodeKeyboardConfigRequest(): Uint8Array {
  const report = new Uint8Array(64);
  report.set([0xfa, 0x2a, 1, 1, 0, 0]);
  return report;
}

/** Legacy name: physical capture establishes 0x17 as effect-settings readback. Parameter 0xff requests the full table. Effect names use 0x18. Offline only. */
export function encodeEffectNameRequest(effectIndex: number): Uint8Array {
  const payload = new Uint8Array([byte(effectIndex)]);
  const report = new Uint8Array(64);
  report.set([0xfa, 0x17, 1, 1, 0, payload.length]);
  report.set(payload, 6);
  return report;
}

/** Opcode 0x57 config getter */
export function encodeConfigGetRequest(): Uint8Array {
  const report = new Uint8Array(64);
  report.set([0xfa, 0x57, 1, 1, 0, 0]);
  return report;
}

/** Opcode 0x5E whole parameters getter */
export function encodeWholeParametersRequest(): Uint8Array {
  const report = new Uint8Array(64);
  report.set([0xfa, 0x5e, 1, 1, 0, 0]);
  return report;
}

/** Opcode 0x2B high key getter */
export function encodeHighKeyGetRequest(): Uint8Array {
  const report = new Uint8Array(64);
  report.set([0xfa, 0x2b, 1, 1, 0, 0]);
  return report;
}

/** Opcode 0x42 macro getter */
export function encodeMacroGetRequest(): Uint8Array {
  const report = new Uint8Array(64);
  report.set([0xfa, 0x42, 1, 1, 0, 0]);
  return report;
}

/** Opcode 0x50 whole parameters setter */
export function encodeWholeParametersSetPayload(data: Uint8Array): Uint8Array {
  if (data.length > 54) throw new RangeError('Whole parameters payload too large');
  const report = new Uint8Array(64);
  report.set([0xfa, 0x50, 1, 1, 0, data.length]);
  report.set(data, 6);
  return report;
}

/** Opcode 0x56 config info setter */
export function encodeConfigInfoSetPayload(data: Uint8Array): Uint8Array {
  if (data.length > 54) throw new RangeError('Config info payload too large');
  const report = new Uint8Array(64);
  report.set([0xfa, 0x56, 1, 1, 0, data.length]);
  report.set(data, 6);
  return report;
}

/** Opcode 0x13/0x14 effect setter */
export function encodeEffectSetPayload(effectId: number, params: Uint8Array): Uint8Array {
  if (params.length > 53) throw new RangeError('Effect params too large');
  const payload = new Uint8Array(1 + params.length);
  payload[0] = byte(effectId);
  payload.set(params, 1);
  const report = new Uint8Array(64);
  report.set([0xfa, 0x13, 1, 1, 0, payload.length]);
  report.set(payload, 6);
  return report;
}

/** Validate report structure (magic, opcode, frame index, payload length) */
export function validateReportStructure(data: Uint8Array, expectedCommand?: number): { valid: boolean; error?: string } {
  if (data.length !== 64) {
    return { valid: false, error: `Expected 64-byte report, got ${data.length}` };
  }
  if (data[0] !== 0xfa) {
    return { valid: false, error: `Invalid magic byte: 0x${data[0].toString(16).padStart(2, '0')}, expected 0xfa` };
  }
  if (expectedCommand !== undefined && data[1] !== expectedCommand) {
    return { valid: false, error: `Command mismatch: expected 0x${expectedCommand.toString(16)}, got 0x${data[1].toString(16)}` };
  }
  const frameIndex = data[2];
  const totalFrames = data[3];
  if (frameIndex === 0 || frameIndex > totalFrames) {
    return { valid: false, error: `Invalid frame index: ${frameIndex}/${totalFrames}` };
  }
  const payloadLength = data[5];
  if (6 + payloadLength > 64) {
    return { valid: false, error: `Payload length ${payloadLength} exceeds report capacity` };
  }
  return { valid: true };
}

/** Decode bulk custom RGB readback response (opcode 0x16)
 * Payload: [startIndex, record1(4b), record2(4b), ...]
 * Record bytes: [rawParam, R, G, B] per static analysis */
export interface BulkRgbRecord {
  index: number;
  rawParameter: number;
  r: number;
  g: number;
  b: number;
}

export function decodeBulkRgbReadback(payload: Uint8Array): BulkRgbRecord[] {
  if (payload.length < 5 || (payload.length - 1) % 4 !== 0) {
    throw new RangeError('Invalid bulk RGB readback payload');
  }
  const startIndex = payload[0];
  const recordCount = (payload.length - 1) / 4;
  if (startIndex + recordCount > 256) throw new RangeError('RGB readback index overflow');
  return Array.from({ length: recordCount }, (_, i) => {
    const base = 1 + i * 4;
    return {
      index: startIndex + i,
      rawParameter: payload[base],
      r: payload[base + 1],
      g: payload[base + 2],
      b: payload[base + 3],
    };
  });
}

/** Decode keyboard config response (opcode 0x2A)
 * Per static analysis: reads two LE16 values and bit flags at payload+4, then strings.
 * Exact field meanings unknown - return raw parsed structure. */
export interface KeyboardConfigRaw {
  word0: number;
  word1: number;
  flags: number;
  strings: Uint8Array;
}

export function decodeKeyboardConfig(payload: Uint8Array): KeyboardConfigRaw {
  if (payload.length < 6) throw new RangeError('Keyboard config payload too short');
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  return {
    word0: view.getUint16(0, true),
    word1: view.getUint16(2, true),
    flags: payload[4],
    strings: payload.subarray(5),
  };
}

/** Decode product info response (opcode 0x62)
 * Per static analysis: two LE16 values, bit flags at offset 4, then strings at varying offsets.
 * Field meanings require further tracing - return raw structure. */
export interface ProductInfoRaw {
  word0: number;
  word1: number;
  flags: number;
  data: Uint8Array;
}

export function decodeProductInfo(payload: Uint8Array): ProductInfoRaw {
  if (payload.length < 6) throw new RangeError('Product info payload too short');
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  return {
    word0: view.getUint16(0, true),
    word1: view.getUint16(2, true),
    flags: payload[4],
    data: payload.subarray(5),
  };
}
