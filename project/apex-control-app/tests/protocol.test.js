import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeCustomRgbPayload,
  encodeCustomRgbReport,
  encodeBulkCustomRgbPayload,
  encodeBulkCustomRgbReport,
  encodeCustomRgbReadbackRequest,
  parseResponseFrame,
  assemblePaginatedResponse,
  decodeTriggerPayload,
  encodeTriggerSettingsPayload,
  encodeTriggerSettingsReport,
  encodeBulkTriggerSettingsPayload,
  encodeQuickTriggerPayload,
  encodeHighKeyPayload,
  encodeKeymapPayload,
  encodeProductInfoRequest,
  encodeKeyboardConfigRequest,
  encodeEffectNameRequest,
  encodeConfigGetRequest,
  encodeWholeParametersRequest,
  encodeHighKeyGetRequest,
  encodeMacroGetRequest,
  encodeWholeParametersSetPayload,
  encodeConfigInfoSetPayload,
  encodeEffectSetPayload,
  validateReportStructure,
  decodeBulkRgbReadback,
  decodeKeyboardConfig,
  decodeProductInfo,
} from '../src/lib/protocol/apex.ts';

// ─── Custom RGB Encoding Tests ────────────────────────────────────────────────

test('encodeCustomRgbPayload — valid single key', () => {
  const payload = encodeCustomRgbPayload(50, [255, 17, 0], [34]);
  assert.deepEqual([...payload], [50, 255, 17, 0, 34]);
});

test('encodeCustomRgbPayload — multiple keys', () => {
  const payload = encodeCustomRgbPayload(50, [255, 17, 0], [34, 49, 12]);
  assert.deepEqual([...payload], [50, 255, 17, 0, 34, 49, 12]);
});

test('encodeCustomRgbPayload — max keys (54)', () => {
  const keys = Array.from({ length: 54 }, (_, i) => i);
  const payload = encodeCustomRgbPayload(100, [10, 20, 30], keys);
  assert.equal(payload.length, 1 + 3 + 54);
  assert.equal(payload[0], 100);
});

test('encodeCustomRgbPayload — throws on empty keyIndices', () => {
  assert.throws(() => encodeCustomRgbPayload(50, [255, 0, 0], []), /Invalid RGB payload size/);
});

test('encodeCustomRgbPayload — throws on too many keys (55)', () => {
  const keys = Array.from({ length: 55 }, (_, i) => i);
  assert.throws(() => encodeCustomRgbPayload(50, [255, 0, 0], keys), /Invalid RGB payload size/);
});

test('encodeCustomRgbPayload — throws on duplicate key indices', () => {
  assert.throws(() => encodeCustomRgbPayload(50, [255, 0, 0], [1, 2, 2]), /Duplicate key index/);
});

test('encodeCustomRgbPayload — throws on invalid RGB values', () => {
  assert.throws(() => encodeCustomRgbPayload(50, [256, 0, 0], [1]), /Expected byte/);
  assert.throws(() => encodeCustomRgbPayload(50, [-1, 0, 0], [1]), /Expected byte/);
  assert.throws(() => encodeCustomRgbPayload(256, [0, 0, 0], [1]), /Expected byte/);
});

test('encodeCustomRgbReport — correct frame structure', () => {
  const report = encodeCustomRgbReport(50, [255, 17, 0], [34, 49]);
  assert.equal(report.length, 64);
  assert.deepEqual([...report.slice(0, 12)], [0xfa, 0x10, 1, 1, 0, 6, 50, 255, 17, 0, 34, 49]);
  // Rest should be zero padding
  assert.ok(report.slice(12).every(x => x === 0));
});

// ─── Bulk Custom RGB Tests ───────────────────────────────────────────────────

test('encodeBulkCustomRgbPayload — valid records', () => {
  const records = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
  ];
  const payload = encodeBulkCustomRgbPayload(10, records);
  assert.equal(payload[0], 10);
  assert.deepEqual([...payload.slice(1)], [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('encodeBulkCustomRgbPayload — throws on empty records', () => {
  assert.throws(() => encodeBulkCustomRgbPayload(0, []), /Invalid bulk record count/);
});

test('encodeBulkCustomRgbPayload — throws on too many records', () => {
  const records = Array.from({ length: 55 }, (_, i) => [i, i, i, i]);
  assert.throws(() => encodeBulkCustomRgbPayload(0, records), /Invalid bulk record count/);
});

test('encodeBulkCustomRgbPayload — throws on index overflow', () => {
  const records = [[1, 2, 3, 4]];
  // startIndex 256 is invalid (max is 255)
  assert.throws(() => encodeBulkCustomRgbPayload(256, records), /Bulk record index overflow/);
});

test('encodeBulkCustomRgbReport — correct frame structure', () => {
  const records = [[10, 20, 30, 40]];
  const report = encodeBulkCustomRgbReport(5, records);
  assert.equal(report.length, 64);
  assert.equal(report[0], 0xfa);
  assert.equal(report[1], 0x11);
  assert.equal(report[5], 5); // payload length = 1 + 4
});

// ─── Custom RGB Readback Request Tests ────────────────────────────────────────

test('encodeCustomRgbReadbackRequest — valid', () => {
  const report = encodeCustomRgbReadbackRequest(10, 5);
  assert.equal(report.length, 64);
  assert.equal(report[1], 0x16);
  assert.equal(report[6], 10); // startIndex
  assert.equal(report[7], 5);  // count
});

test('encodeCustomRgbReadbackRequest — throws on invalid count', () => {
  assert.throws(() => encodeCustomRgbReadbackRequest(0, 0), /Invalid readback count/);
  assert.throws(() => encodeCustomRgbReadbackRequest(0, 61), /Invalid readback count/);
});

test('encodeCustomRgbReadbackRequest — throws on index overflow', () => {
  assert.throws(() => encodeCustomRgbReadbackRequest(250, 10), /Readback index overflow/);
});

// ─── Response Frame Parsing Tests ────────────────────────────────────────────

test('parseResponseFrame — valid single-frame response', () => {
  const data = new Uint8Array(64);
  data.set([0xfa, 0x10, 1, 1, 0x00, 4, 0x11, 0x22, 0x33, 0x44]);
  const frame = parseResponseFrame(data);
  assert.ok(frame !== null);
  if (frame) {
    assert.equal(frame.magic, 0xfa);
    assert.equal(frame.command, 0x10);
    assert.equal(frame.frameIndex, 1);
    assert.equal(frame.totalFrames, 1);
    assert.equal(frame.field4, 0);
    assert.equal(frame.payloadLength, 4);
    assert.deepEqual([...frame.payload], [0x11, 0x22, 0x33, 0x44]);
    assert.equal(frame.isComplete, true);
    assert.equal(frame.isFirst, true);
  }
});

test('parseResponseFrame — valid multi-frame response (frame 1 of 3)', () => {
  const data = new Uint8Array(64);
  data.set([0xfa, 0x11, 1, 3, 0x00, 10, ...new Uint8Array(10).fill(0xaa)]);
  const frame = parseResponseFrame(data);
  assert.ok(frame !== null);
  if (frame) {
    assert.equal(frame.frameIndex, 1);
    assert.equal(frame.totalFrames, 3);
    assert.equal(frame.isComplete, false);
    assert.equal(frame.isFirst, true);
  }
});

test('parseResponseFrame — valid multi-frame response (frame 2 of 3)', () => {
  const data = new Uint8Array(64);
  data.set([0xfa, 0x11, 2, 3, 0x00, 10, ...new Uint8Array(10).fill(0xbb)]);
  const frame = parseResponseFrame(data);
  assert.ok(frame !== null);
  if (frame) {
    assert.equal(frame.frameIndex, 2);
    assert.equal(frame.isComplete, false);
    assert.equal(frame.isFirst, false);
  }
});

test('parseResponseFrame — valid last frame (frame 3 of 3)', () => {
  const data = new Uint8Array(64);
  data.set([0xfa, 0x11, 3, 3, 0x00, 5, 1, 2, 3, 4, 5]);
  const frame = parseResponseFrame(data);
  assert.ok(frame !== null);
  if (frame) {
    assert.equal(frame.frameIndex, 3);
    assert.equal(frame.isComplete, true);
    assert.equal(frame.isFirst, false);
  }
});

test('parseResponseFrame — returns null on invalid magic', () => {
  const data = new Uint8Array([0xfb, 0x10, 1, 1, 0, 0]);
  assert.equal(parseResponseFrame(data), null);
});

test('parseResponseFrame — returns null on too short data', () => {
  const data = new Uint8Array([0xfa, 0x10]);
  assert.equal(parseResponseFrame(data), null);
});

test('parseResponseFrame — returns null on invalid frame index', () => {
  const data = new Uint8Array(64);
  data.set([0xfa, 0x10, 0, 1, 0, 0]); // frameIndex = 0
  assert.equal(parseResponseFrame(data), null);

  data[2] = 2; // frameIndex > totalFrames
  assert.equal(parseResponseFrame(data), null);
});

test('parseResponseFrame — returns null when payload exceeds buffer', () => {
  const data = new Uint8Array(64);
  data.set([0xfa, 0x10, 1, 1, 0, 60]); // payloadLength 60, but only 58 bytes available
  assert.equal(parseResponseFrame(data), null);
});

test('parseResponseFrame — handles field4 (unknown purpose)', () => {
  const data = new Uint8Array(64);
  data.set([0xfa, 0x10, 1, 1, 0x42, 0]); // field4 = 0x42
  const frame = parseResponseFrame(data);
  assert.ok(frame !== null);
  if (frame) {
    assert.equal(frame.field4, 0x42);
  }
});

// ─── Pagination Assembly Tests ────────────────────────────────────────────────

test('assemblePaginatedResponse — single frame', () => {
  const frames = [{
    magic: 0xfa, command: 0x10, frameIndex: 1, totalFrames: 1, field4: 0,
    payloadLength: 4, payload: new Uint8Array([1, 2, 3, 4]), isComplete: true, isFirst: true
  }];
  const result = assemblePaginatedResponse(frames);
  assert.deepEqual([...result], [1, 2, 3, 4]);
});

test('assemblePaginatedResponse — three frames in order', () => {
  const frames = [
    { magic: 0xfa, command: 0x11, frameIndex: 1, totalFrames: 3, field4: 0, payloadLength: 3, payload: new Uint8Array([1, 2, 3]), isComplete: false, isFirst: true },
    { magic: 0xfa, command: 0x11, frameIndex: 2, totalFrames: 3, field4: 0, payloadLength: 3, payload: new Uint8Array([4, 5, 6]), isComplete: false, isFirst: false },
    { magic: 0xfa, command: 0x11, frameIndex: 3, totalFrames: 3, field4: 0, payloadLength: 2, payload: new Uint8Array([7, 8]), isComplete: true, isFirst: false },
  ];
  const result = assemblePaginatedResponse(frames);
  assert.deepEqual([...result], [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('assemblePaginatedResponse — handles unordered frames', () => {
  const frames = [
    { magic: 0xfa, command: 0x11, frameIndex: 3, totalFrames: 3, field4: 0, payloadLength: 1, payload: new Uint8Array([3]), isComplete: true, isFirst: false },
    { magic: 0xfa, command: 0x11, frameIndex: 1, totalFrames: 3, field4: 0, payloadLength: 1, payload: new Uint8Array([1]), isComplete: false, isFirst: true },
    { magic: 0xfa, command: 0x11, frameIndex: 2, totalFrames: 3, field4: 0, payloadLength: 1, payload: new Uint8Array([2]), isComplete: false, isFirst: false },
  ];
  const result = assemblePaginatedResponse(frames);
  assert.deepEqual([...result], [1, 2, 3]);
});

test('assemblePaginatedResponse — throws on missing frame', () => {
  const frames = [
    { magic: 0xfa, command: 0x11, frameIndex: 1, totalFrames: 3, field4: 0, payloadLength: 1, payload: new Uint8Array([1]), isComplete: false, isFirst: true },
    { magic: 0xfa, command: 0x11, frameIndex: 3, totalFrames: 3, field4: 0, payloadLength: 1, payload: new Uint8Array([3]), isComplete: true, isFirst: false },
  ];
  // The implementation checks frame count first, so we get "Frame count mismatch"
  assert.throws(() => assemblePaginatedResponse(frames), /Frame count mismatch/);
});

test('assemblePaginatedResponse — throws on frame count mismatch', () => {
  const frames = [
    { magic: 0xfa, command: 0x11, frameIndex: 1, totalFrames: 3, field4: 0, payloadLength: 1, payload: new Uint8Array([1]), isComplete: false, isFirst: true },
    { magic: 0xfa, command: 0x11, frameIndex: 2, totalFrames: 3, field4: 0, payloadLength: 1, payload: new Uint8Array([2]), isComplete: false, isFirst: false },
  ];
  assert.throws(() => assemblePaginatedResponse(frames), /Frame count mismatch/);
});

test('assemblePaginatedResponse — throws on inconsistent totalFrames', () => {
  const frames = [
    { magic: 0xfa, command: 0x11, frameIndex: 1, totalFrames: 3, field4: 0, payloadLength: 1, payload: new Uint8Array([1]), isComplete: false, isFirst: true },
    { magic: 0xfa, command: 0x11, frameIndex: 2, totalFrames: 2, field4: 0, payloadLength: 1, payload: new Uint8Array([2]), isComplete: true, isFirst: false },
  ];
  // The implementation checks frame count first (2 != 3), so we get "Frame count mismatch"
  assert.throws(() => assemblePaginatedResponse(frames), /Frame count mismatch/);
});

test('assemblePaginatedResponse — throws on command mismatch', () => {
  const frames = [
    { magic: 0xfa, command: 0x11, frameIndex: 1, totalFrames: 2, field4: 0, payloadLength: 1, payload: new Uint8Array([1]), isComplete: false, isFirst: true },
    { magic: 0xfa, command: 0x10, frameIndex: 2, totalFrames: 2, field4: 0, payloadLength: 1, payload: new Uint8Array([2]), isComplete: true, isFirst: false },
  ];
  assert.throws(() => assemblePaginatedResponse(frames), /Command mismatch/);
});

test('assemblePaginatedResponse — throws on empty array', () => {
  assert.throws(() => assemblePaginatedResponse([]), /No frames to assemble/);
});

// ─── Trigger Decoding Tests ──────────────────────────────────────────────────

test('decodeTriggerPayload — single record', () => {
  // payload: [startIndex=34, threshold=0x1234, field4=1, field5=0, field6=0x0102, field8=0x0304]
  const payload = new Uint8Array([34, 0x34, 0x12, 1, 0, 0x02, 0x01, 0x04, 0x03]);
  const result = decodeTriggerPayload(payload);
  assert.equal(result.length, 1);
  assert.equal(result[0].index, 34);
  assert.equal(result[0].threshold, 0x1234);
  assert.equal(result[0].field4, true);
  assert.equal(result[0].field5, false);
  assert.equal(result[0].field6, 0x0102);
  assert.equal(result[0].field8, 0x0304);
});

test('decodeTriggerPayload — multiple records', () => {
  // startIndex=10, 3 records
  const payload = new Uint8Array([
    10,
    0x00, 0x01, 1, 0, 0x00, 0x00, 0x00, 0x00,  // record 0
    0x00, 0x02, 0, 1, 0x00, 0x00, 0x00, 0x00,  // record 1
    0x00, 0x03, 1, 1, 0x00, 0x00, 0x00, 0x00,  // record 2
  ]);
  const result = decodeTriggerPayload(payload);
  assert.equal(result.length, 3);
  assert.equal(result[0].index, 10);
  assert.equal(result[1].index, 11);
  assert.equal(result[2].index, 12);
  assert.equal(result[0].threshold, 0x0100);
  assert.equal(result[1].threshold, 0x0200);
  assert.equal(result[2].threshold, 0x0300);
});

test('decodeTriggerPayload — throws on too short payload', () => {
  const payload = new Uint8Array([10, 0x00, 0x01]); // Only 3 bytes, need at least 9
  assert.throws(() => decodeTriggerPayload(payload), /Invalid trigger payload/);
});

test('decodeTriggerPayload — throws on invalid record alignment', () => {
  const payload = new Uint8Array([10, 0x00, 0x01, 0, 0, 0x00, 0x00, 0x00]); // 8 bytes = 1 + 7 (not multiple of 8)
  assert.throws(() => decodeTriggerPayload(payload), /Invalid trigger payload/);
});

test('decodeTriggerPayload — throws on index overflow', () => {
  const payload = new Uint8Array(17);
  payload[0] = 255; // startIndex 255 + 2 records > 256
  assert.throws(() => decodeTriggerPayload(payload), /Invalid trigger payload/);
});

test('decodeTriggerPayload — handles sliced views correctly', () => {
  // Create a larger buffer and slice
  const buffer = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0x34, 0x12, 1, 0, 0x02, 0x01, 0x04, 0x03, 0, 0]);
  const result = decodeTriggerPayload(buffer.subarray(10, 19));
  assert.equal(result[0].index, 10);
  assert.equal(result[0].threshold, 0x1234);
});

// ─── Trigger Settings (Opcode 0x26) Tests ─────────────────────────────────────

test('encodeTriggerSettingsPayload — single key', () => {
  const payload = encodeTriggerSettingsPayload(0x1234, [42]);
  assert.deepEqual([...payload], [0x34, 0x12, 42]);
});

test('encodeTriggerSettingsPayload — multiple keys', () => {
  const payload = encodeTriggerSettingsPayload(0x00ff, [1, 2, 3]);
  assert.deepEqual([...payload], [0xff, 0x00, 1, 2, 3]);
});

test('encodeTriggerSettingsPayload — throws on empty keyIndices', () => {
  assert.throws(() => encodeTriggerSettingsPayload(100, []), /Invalid key index count/);
});

test('encodeTriggerSettingsPayload — throws on too many keys', () => {
  const keys = Array.from({ length: 55 }, (_, i) => i);
  assert.throws(() => encodeTriggerSettingsPayload(100, keys), /Invalid key index count/);
});

test('encodeTriggerSettingsPayload — throws on duplicate key indices', () => {
  assert.throws(() => encodeTriggerSettingsPayload(100, [1, 2, 2]), /Duplicate key index/);
});

test('encodeTriggerSettingsReport — correct frame structure', () => {
  const report = encodeTriggerSettingsReport(0x1234, [42]);
  assert.equal(report.length, 64);
  assert.equal(report[0], 0xfa);
  assert.equal(report[1], 0x26);
  assert.equal(report[5], 3); // payload length
  assert.equal(report[6], 0x34);
  assert.equal(report[7], 0x12);
  assert.equal(report[8], 42);
});

// ─── Bulk Trigger Settings (Opcode 0x28) Tests ────────────────────────────────

test('encodeBulkTriggerSettingsPayload — valid records', () => {
  const records = [
    { threshold: 0x1234, field4: 1, field5: 0, field6: 0x0102, field8: 0x0304 },
    { threshold: 0x5678, field4: 0, field5: 1, field6: 0x0506, field8: 0x0708 },
  ];
  const payload = encodeBulkTriggerSettingsPayload(20, records);
  assert.equal(payload[0], 20);
  assert.equal(payload[1], 2);
  // Record 0
  assert.equal(payload[2], 0x34);
  assert.equal(payload[3], 0x12);
  assert.equal(payload[4], 1);
  assert.equal(payload[5], 0);
  assert.equal(payload[6], 0x02);
  assert.equal(payload[7], 0x01);
  assert.equal(payload[8], 0x04);
  assert.equal(payload[9], 0x03);
});

test('encodeBulkTriggerSettingsPayload — throws on empty records', () => {
  assert.throws(() => encodeBulkTriggerSettingsPayload(0, []), /Invalid bulk trigger record count/);
});

test('encodeBulkTriggerSettingsPayload — throws on too many records', () => {
  const records = Array.from({ length: 8 }, (_, i) => ({
    threshold: i, field4: 0, field5: 0, field6: 0, field8: 0
  }));
  assert.throws(() => encodeBulkTriggerSettingsPayload(0, records), /Invalid bulk trigger record count/);
});

test('encodeBulkTriggerSettingsPayload — throws on index overflow', () => {
  const records = [{ threshold: 0, field4: 0, field5: 0, field6: 0, field8: 0 }];
  // startIndex 256 is invalid (max is 255)
  assert.throws(() => encodeBulkTriggerSettingsPayload(256, records), /Bulk trigger index overflow/);
});

// ─── Quick Trigger (Opcode 0x27) Tests ────────────────────────────────────────

test('encodeQuickTriggerPayload — valid records', () => {
  const records = [
    { keyIndex: 10, field4: 1, field5: 0, field6: 0x0102, field8: 0x0304 },
    { keyIndex: 11, field4: 0, field5: 1, field6: 0x0506, field8: 0x0708 },
  ];
  const payload = encodeQuickTriggerPayload(records);
  assert.equal(payload.length, 16);
  // Record 0
  assert.equal(payload[0], 10);
  assert.equal(payload[1], 0);
  assert.equal(payload[2], 1);
  assert.equal(payload[3], 0);
  assert.equal(payload[4], 0x02);
  assert.equal(payload[5], 0x01);
  assert.equal(payload[6], 0x04);
  assert.equal(payload[7], 0x03);
});

test('encodeQuickTriggerPayload — throws on empty records', () => {
  assert.throws(() => encodeQuickTriggerPayload([]), /Invalid quick trigger record count/);
});

test('encodeQuickTriggerPayload — throws on too many records', () => {
  const records = Array.from({ length: 8 }, (_, i) => ({
    keyIndex: i, field4: 0, field5: 0, field6: 0, field8: 0
  }));
  assert.throws(() => encodeQuickTriggerPayload(records), /Invalid quick trigger record count/);
});

// ─── SOCD / High Key (Opcode 0x23) Tests ──────────────────────────────────────

test('encodeHighKeyPayload — valid 19-byte records', () => {
  const rec1 = new Uint8Array(19).fill(0xaa);
  const rec2 = new Uint8Array(19).fill(0xbb);
  const payload = encodeHighKeyPayload([rec1, rec2]);
  assert.equal(payload.length, 38);
  assert.ok(payload.slice(0, 19).every(x => x === 0xaa));
  assert.ok(payload.slice(19).every(x => x === 0xbb));
});

test('encodeHighKeyPayload — throws on wrong record size', () => {
  const rec = new Uint8Array(18);
  assert.throws(() => encodeHighKeyPayload([rec]), /SOCD\/high key record must be 19 bytes/);
});

// ─── Keymap (Opcode 0x20) Tests ───────────────────────────────────────────────

test('encodeKeymapPayload — valid pairs', () => {
  const payload = encodeKeymapPayload(0, [10, 0x1c, 11, 0x1d]); // A->B, S->C
  assert.equal(payload[0], 0);     // layer
  assert.equal(payload[1], 2);     // keyCount
  assert.equal(payload[2], 10);
  assert.equal(payload[3], 0x1c);
  assert.equal(payload[4], 11);
  assert.equal(payload[5], 0x1d);
});

test('encodeKeymapPayload — throws on odd mappings length', () => {
  assert.throws(() => encodeKeymapPayload(0, [1, 2, 3]), /Keymap mappings must be pairs/);
});

// ─── Getter Request Tests ────────────────────────────────────────────────────

test('encodeProductInfoRequest — correct structure', () => {
  const report = encodeProductInfoRequest();
  assert.equal(report.length, 64);
  assert.equal(report[1], 0x62);
  assert.equal(report[5], 7); // 7-byte date/time payload
});

test('encodeKeyboardConfigRequest — correct structure', () => {
  const report = encodeKeyboardConfigRequest();
  assert.equal(report[1], 0x2a);
  assert.equal(report[5], 0);
});

test('encodeEffectNameRequest — correct structure', () => {
  const report = encodeEffectNameRequest(5);
  assert.equal(report[1], 0x17);
  assert.equal(report[6], 5);
});

test('encodeConfigGetRequest — correct structure', () => {
  const report = encodeConfigGetRequest();
  assert.equal(report[1], 0x57);
});

test('encodeWholeParametersRequest — correct structure', () => {
  const report = encodeWholeParametersRequest();
  assert.equal(report[1], 0x5e);
});

test('encodeHighKeyGetRequest — correct structure', () => {
  const report = encodeHighKeyGetRequest();
  assert.equal(report[1], 0x2b);
});

test('encodeMacroGetRequest — correct structure', () => {
  const report = encodeMacroGetRequest();
  assert.equal(report[1], 0x42);
});

// ─── Setter Payload Tests ────────────────────────────────────────────────────

test('encodeWholeParametersSetPayload — valid', () => {
  const data = new Uint8Array([1, 2, 3, 4, 5]);
  const report = encodeWholeParametersSetPayload(data);
  assert.equal(report[1], 0x50);
  assert.equal(report[5], 5);
  assert.deepEqual([...report.slice(6, 11)], [1, 2, 3, 4, 5]);
});

test('encodeWholeParametersSetPayload — throws on too large', () => {
  const data = new Uint8Array(55);
  assert.throws(() => encodeWholeParametersSetPayload(data), /Whole parameters payload too large/);
});

test('encodeConfigInfoSetPayload — valid', () => {
  const data = new Uint8Array([10, 20, 30]);
  const report = encodeConfigInfoSetPayload(data);
  assert.equal(report[1], 0x56);
  assert.equal(report[5], 3);
});

test('encodeConfigInfoSetPayload — throws on too large', () => {
  const data = new Uint8Array(55);
  assert.throws(() => encodeConfigInfoSetPayload(data), /Config info payload too large/);
});

test('encodeEffectSetPayload — valid', () => {
  const params = new Uint8Array([100, 200, 50]);
  const report = encodeEffectSetPayload(3, params);
  assert.equal(report[1], 0x13);
  assert.equal(report[6], 3); // effectId
  assert.deepEqual([...report.slice(7, 10)], [100, 200, 50]);
});

test('encodeEffectSetPayload — throws on too large params', () => {
  const params = new Uint8Array(54);
  assert.throws(() => encodeEffectSetPayload(0, params), /Effect params too large/);
});

// ─── Report Structure Validation Tests ────────────────────────────────────────

test('validateReportStructure — valid report', () => {
  const report = new Uint8Array(64);
  report.set([0xfa, 0x10, 1, 1, 0, 4, 1, 2, 3, 4]);
  const result = validateReportStructure(report, 0x10);
  assert.equal(result.valid, true);
});

test('validateReportStructure — invalid length', () => {
  const report = new Uint8Array(63);
  const result = validateReportStructure(report);
  assert.equal(result.valid, false);
  if (result.error) {
    assert.ok(result.error.includes('64-byte'));
  }
});

test('validateReportStructure — invalid magic', () => {
  const report = new Uint8Array(64);
  report[0] = 0xfb;
  const result = validateReportStructure(report);
  assert.equal(result.valid, false);
  if (result.error) {
    assert.ok(result.error.includes('magic'));
  }
});

test('validateReportStructure — command mismatch', () => {
  const report = new Uint8Array(64);
  report.set([0xfa, 0x11, 1, 1, 0, 0]);
  const result = validateReportStructure(report, 0x10);
  assert.equal(result.valid, false);
  if (result.error) {
    assert.ok(result.error.includes('Command mismatch'));
  }
});

test('validateReportStructure — invalid frame index', () => {
  const report = new Uint8Array(64);
  report.set([0xfa, 0x10, 0, 1, 0, 0]); // frameIndex = 0
  const result = validateReportStructure(report);
  assert.equal(result.valid, false);
  if (result.error) {
    assert.ok(result.error.includes('frame index'));
  }
});

test('validateReportStructure — frame index exceeds total', () => {
  const report = new Uint8Array(64);
  report.set([0xfa, 0x10, 2, 1, 0, 0]); // frameIndex > totalFrames
  const result = validateReportStructure(report);
  assert.equal(result.valid, false);
  if (result.error) {
    assert.ok(result.error.includes('frame index'));
  }
});

test('validateReportStructure — payload length exceeds capacity', () => {
  const report = new Uint8Array(64);
  report.set([0xfa, 0x10, 1, 1, 0, 60]); // 6 + 60 > 64
  const result = validateReportStructure(report);
  assert.equal(result.valid, false);
  if (result.error) {
    assert.ok(result.error.includes('exceeds report capacity'));
  }
});

// ─── Bulk RGB Readback Decoding Tests ────────────────────────────────────────

test('decodeBulkRgbReadback — valid payload', () => {
  // startIndex=10, two records: [param=50, R=255, G=0, B=0], [param=60, R=0, G=255, B=0]
  const payload = new Uint8Array([10, 50, 255, 0, 0, 60, 0, 255, 0]);
  const result = decodeBulkRgbReadback(payload);
  assert.equal(result.length, 2);
  assert.equal(result[0].index, 10);
  assert.equal(result[0].rawParameter, 50);
  assert.equal(result[0].r, 255);
  assert.equal(result[0].g, 0);
  assert.equal(result[0].b, 0);
  assert.equal(result[1].index, 11);
  assert.equal(result[1].rawParameter, 60);
  assert.equal(result[1].r, 0);
  assert.equal(result[1].g, 255);
  assert.equal(result[1].b, 0);
});

test('decodeBulkRgbReadback — throws on too short', () => {
  const payload = new Uint8Array([10, 1, 2, 3]); // 4 bytes, need at least 5 (1 + 4)
  assert.throws(() => decodeBulkRgbReadback(payload), /Invalid bulk RGB readback payload/);
});

test('decodeBulkRgbReadback — throws on invalid alignment', () => {
  const payload = new Uint8Array([10, 1, 2, 3, 4, 5]); // 6 bytes = 1 + 5 (not multiple of 4)
  assert.throws(() => decodeBulkRgbReadback(payload), /Invalid bulk RGB readback payload/);
});

// ─── Keyboard Config Decoding Tests ──────────────────────────────────────────

test('decodeKeyboardConfig — valid payload', () => {
  // word0=0x1234, word1=0x5678, flags=0x42, strings=rest
  const payload = new Uint8Array([0x34, 0x12, 0x78, 0x56, 0x42, 0x61, 0x62, 0x63]);
  const result = decodeKeyboardConfig(payload);
  assert.equal(result.word0, 0x1234);
  assert.equal(result.word1, 0x5678);
  assert.equal(result.flags, 0x42);
  assert.deepEqual([...result.strings], [0x61, 0x62, 0x63]);
});

test('decodeKeyboardConfig — throws on too short', () => {
  const payload = new Uint8Array([1, 2, 3, 4, 5]);
  assert.throws(() => decodeKeyboardConfig(payload), /Keyboard config payload too short/);
});

// ─── Product Info Decoding Tests ─────────────────────────────────────────────

test('decodeProductInfo — valid payload', () => {
  const payload = new Uint8Array([0x34, 0x12, 0x78, 0x56, 0x42, 0x61, 0x62, 0x63]);
  const result = decodeProductInfo(payload);
  assert.equal(result.word0, 0x1234);
  assert.equal(result.word1, 0x5678);
  assert.equal(result.flags, 0x42);
  assert.deepEqual([...result.data], [0x61, 0x62, 0x63]);
});

test('decodeProductInfo — throws on too short', () => {
  const payload = new Uint8Array([1, 2, 3, 4, 5]);
  assert.throws(() => decodeProductInfo(payload), /Product info payload too short/);
});

// ─── Synthetic Fixture Tests (Documenting Expected Behavior) ─────────────────

test('SYNTHETIC: encodeCustomRgbReport round-trip through parseResponseFrame', () => {
  // This test documents the expected request/response pattern
  encodeCustomRgbReport(50, [255, 17, 0], [34, 49]);
  // Simulated response (single frame, same command echo)
  const response = new Uint8Array(64);
  response.set([0xfa, 0x10, 1, 1, 0, 0]); // ACK with no payload
  const parsed = parseResponseFrame(response);
  assert.ok(parsed !== null);
  if (parsed) {
    assert.equal(parsed.command, 0x10);
    assert.equal(parsed.isComplete, true);
  }
});

test('SYNTHETIC: multi-frame readback simulation', () => {
  // Simulate a 3-frame readback response for opcode 0x11
  const frames = [
    new Uint8Array(64).fill(0),
    new Uint8Array(64).fill(0),
    new Uint8Array(64).fill(0),
  ];
  frames[0].set([0xfa, 0x11, 1, 3, 0, 3, 10, 0xaa, 0xbb]);
  frames[1].set([0xfa, 0x11, 2, 3, 0, 3, 11, 0xcc, 0xdd]);
  frames[2].set([0xfa, 0x11, 3, 3, 0, 3, 12, 0xee, 0xff]);

  const parsed = frames.map(parseResponseFrame).filter((f) => f !== null);
  assert.equal(parsed.length, 3);

  const assembled = assemblePaginatedResponse(parsed);
  assert.deepEqual([...assembled], [10, 0xaa, 0xbb, 11, 0xcc, 0xdd, 12, 0xee, 0xff]);
});

// ─── Edge Cases and Bounds ────────────────────────────────────────────────────

test('encodeCustomRgbPayload — boundary key index 0', () => {
  const payload = encodeCustomRgbPayload(0, [0, 0, 0], [0]);
  assert.equal(payload[4], 0);
});

test('encodeCustomRgbPayload — boundary key index 255', () => {
  const payload = encodeCustomRgbPayload(0, [0, 0, 0], [255]);
  assert.equal(payload[4], 255);
});

test('encodeTriggerSettingsPayload — threshold bounds', () => {
  const payload = encodeTriggerSettingsPayload(0, [1]);
  assert.deepEqual([...payload.slice(0, 2)], [0, 0]);
  const payload2 = encodeTriggerSettingsPayload(65535, [1]);
  assert.deepEqual([...payload2.slice(0, 2)], [0xff, 0xff]);
});

test('encodeBulkTriggerSettingsPayload — threshold bounds', () => {
  const records = [{ threshold: 65535, field4: 1, field5: 1, field6: 65535, field8: 65535 }];
  const payload = encodeBulkTriggerSettingsPayload(0, records);
  assert.equal(payload[2], 0xff);
  assert.equal(payload[3], 0xff);
  assert.equal(payload[4], 1);
  assert.equal(payload[5], 1);
  assert.equal(payload[6], 0xff);
  assert.equal(payload[7], 0xff);
  assert.equal(payload[8], 0xff);
  assert.equal(payload[9], 0xff);
});

test('encodeQuickTriggerPayload — field bounds', () => {
  const records = [{ keyIndex: 255, field4: 255, field5: 255, field6: 65535, field8: 65535 }];
  const payload = encodeQuickTriggerPayload(records);
  assert.equal(payload[0], 255);
  assert.equal(payload[2], 255);
  assert.equal(payload[3], 255);
});