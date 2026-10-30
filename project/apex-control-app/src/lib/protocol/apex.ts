/** Offline, static-evidence codecs only. Never connected to a transport.
 * See research/evidence/PROTOCOL.md. No display or firmware commands. */
function byte(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 255) throw new RangeError('Expected byte');
  return value;
}
/** Opcode 0x10 payload. Leading parameter and physical key mapping remain raw. */
export function encodeCustomRgbPayload(rawParameter: number, rgb: readonly [number, number, number], keyIndices: readonly number[]): Uint8Array {
  if (rgb.length !== 3 || keyIndices.length < 1 || keyIndices.length > 54) throw new RangeError('Invalid RGB payload size');
  if (new Set(keyIndices).size !== keyIndices.length) throw new RangeError('Duplicate key index');
  return Uint8Array.from([rawParameter, ...rgb, ...keyIndices].map(byte));
}
/** Known USB output wrapper; WebHID payload excludes the HIDAPI report-ID prefix. */
export function encodeCustomRgbReport(rawParameter: number, rgb: readonly [number, number, number], keyIndices: readonly number[]): Uint8Array {
  const payload = encodeCustomRgbPayload(rawParameter, rgb, keyIndices);
  const report = new Uint8Array(64);
  report.set([0xfa, 0x10, 1, 1, 0, payload.length]);
  report.set(payload, 6);
  return report;
}
export interface RawTriggerRecord { index: number; threshold: number; field4: boolean; field5: boolean; field6: number; field8: number }
/** Getter payload only: raw units, not millimetres or named RT modes. */
export function decodeTriggerPayload(payload: Uint8Array): RawTriggerRecord[] {
  if (payload.length < 9 || (payload.length - 1) % 8 !== 0 || payload[0] + (payload.length - 1) / 8 > 256) throw new RangeError('Invalid trigger payload');
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  return Array.from({ length: (payload.length - 1) / 8 }, (_, i) => {
    const at = 1 + i * 8;
    return { index: payload[0] + i, threshold: view.getUint16(at, true), field4: payload[at + 2] !== 0, field5: payload[at + 3] !== 0, field6: view.getUint16(at + 4, true), field8: view.getUint16(at + 6, true) };
  });
}
