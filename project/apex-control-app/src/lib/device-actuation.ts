import { exchangeRgb } from './rgb-exchange.ts';
export const DEVICE_ACTUATION_LIMITS = { min: 10, max: 359, unitsPerMm: 100 } as const;
export const ACTUATION_BACKUP_KEY = 'apex-actuation-device-backup-v1';
// Captured stock26/A6 and approved APEX-engine W240→241→240 test passed.
// Browser UI/session testing and physical naming beyond W remain separate.
export const ACTUATION_WRITES_ENABLED = true;
export type TriggerTable = [number, number[]][];
interface Backup { version: 1; device: '314B:1026'; before: TriggerTable; keys: number[]; target: number }
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;
function identity(device: HIDDevice) { if (device.vendorId !== 0x314b || device.productId !== 0x1026) throw Error('Connect a real APEX 200'); }
function active(index: number) { return Number.isInteger(index) && index >= 0 && index < 84 && index !== 14 && index !== 15; }
function packet(command: number, payload: number[], page = 1, total = 1) { const p = new Uint8Array(64); p.set([250, command, page, total, 0, payload.length, ...payload]); return p; }
const same = (a: TriggerTable, b: TriggerTable) => JSON.stringify(a) === JSON.stringify(b);
export async function readTriggerTable(device: HIDDevice): Promise<TriggerTable> {
  identity(device);
  const records = new Map<number, number[]>(); let total = 1;
  for (let page = 1; page <= total; page++) {
    const r = await exchangeRgb(device, packet(0x2c, [], page, total));
    if (page === 1) total = r[3];
    if (total < 1 || total > 16 || r[3] !== total || r[5] < 9 || (r[5] - 1) % 8) throw Error('Invalid trigger readback');
    for (let n = 0; n < (r[5] - 1) / 8; n++) {
      const index = r[6] + n;
      if (index >= 84 || records.has(index)) throw Error('Duplicate or unexpected trigger index');
      records.set(index, [...r.slice(7 + n * 8, 15 + n * 8)]);
    }
  }
  if (records.size !== 84) throw Error('Incomplete trigger table; no actuation changes allowed');
  return [...records].sort((a, b) => a[0] - b[0]);
}
function targetTable(backup: Backup): TriggerTable { return backup.before.map(([i, r]) => [i, backup.keys.includes(i) ? [backup.target & 255, backup.target >> 8, ...r.slice(2)] : [...r]]); }
function parseBackup(text: string): Backup {
  const b = JSON.parse(text) as Backup;
  if (b.version !== 1 || b.device !== '314B:1026' || !Array.isArray(b.before) || b.before.length !== 84 || !Array.isArray(b.keys) || !b.keys.length || new Set(b.keys).size !== b.keys.length || b.keys.some(i => !active(i)) || !Number.isInteger(b.target) || b.target < 10 || b.target > 359) throw Error('Invalid actuation backup');
  for (let i = 0; i < 84; i++) { const item = b.before[i]; if (!Array.isArray(item) || item[0] !== i || !Array.isArray(item[1]) || item[1].length !== 8 || item[1].some(v => !Number.isInteger(v) || v < 0 || v > 255)) throw Error('Invalid trigger backup records'); }
  for (const i of b.keys) { const r = b.before[i][1], v = r[0] | r[1] << 8; if (v < 10 || v > 359) throw Error('Original actuation is outside established limits'); }
  return b;
}
async function setThreshold(device: HIDDevice, raw: number, keys: number[]) {
  for (let at = 0; at < keys.length; at += 54) {
    const r = await exchangeRgb(device, packet(0x26, [raw & 255, raw >> 8, ...keys.slice(at, at + 54)]));
    if (r[3] !== 1 || r[5] !== 1 || r[6] !== 0) throw Error('Actuation not acknowledged');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
async function restore(device: HIDDevice, backup: Backup, storage: Storage) {
  // Recover only states composed of the recorded old/new thresholds. Preserve
  // every RT byte and unrelated key; refuse a stale backup after other edits.
  const current = await readTriggerTable(device), desired = targetTable(backup);
  if (current.some(([i,r]) => JSON.stringify(r) !== JSON.stringify(backup.before[i][1]) && JSON.stringify(r) !== JSON.stringify(desired[i][1]))) throw Error('Device changed since this backup; restoration blocked');
  const groups = new Map<number, number[]>();
  for (const i of backup.keys) { const r = backup.before[i][1], v = r[0] | r[1] << 8; groups.set(v, [...(groups.get(v) ?? []), i]); }
  for (const [raw, keys] of groups) await setThreshold(device, raw, keys);
  if (!same(await readTriggerTable(device), backup.before)) throw Error('Actuation restoration readback failed; keep the saved backup');
  storage.removeItem(ACTUATION_BACKUP_KEY);
}
export async function restoreDeviceActuation(device: HIDDevice, storage: Storage = localStorage): Promise<void> {
  identity(device); const saved = storage.getItem(ACTUATION_BACKUP_KEY); if (!saved) throw Error('No saved actuation backup'); await restore(device, parseBackup(saved), storage);
}
export async function applyDeviceActuation(device: HIDDevice, raw: number, keys: number[], storage: Storage = localStorage): Promise<void> {
  identity(device);
  if (!Number.isInteger(raw) || raw < 10 || raw > 359 || !keys.length || keys.length > 82 || new Set(keys).size !== keys.length || keys.some(i => !active(i))) throw Error('Choose active keys and actuation between 0.10 and 3.59 mm');
  if (storage.getItem(ACTUATION_BACKUP_KEY)) throw Error('Restore the previous actuation backup before another Apply');
  const backup: Backup = { version: 1, device: '314B:1026', before: await readTriggerTable(device), keys: [...keys], target: raw };
  const saved = JSON.stringify(backup); parseBackup(saved); storage.setItem(ACTUATION_BACKUP_KEY, saved);
  if (storage.getItem(ACTUATION_BACKUP_KEY) !== saved) throw Error('Actuation backup was not persisted; no settings sent');
  try {
    await setThreshold(device, raw, keys);
    if (!same(await readTriggerTable(device), targetTable(backup))) throw Error('Actuation readback mismatch');
  } catch (error) {
    try { await restore(device, backup, storage); } catch (recovery) { throw new AggregateError([error, recovery], 'Actuation failed and restoration was not confirmed; keep the browser backup'); }
    throw new Error('Actuation failed; previous trigger table restored and verified', { cause: error });
  }
}
