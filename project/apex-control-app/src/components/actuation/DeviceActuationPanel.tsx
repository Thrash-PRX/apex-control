import { useState } from 'react';
import { useAppStore } from '../../stores/app-store';
import { APEX_200S_LAYOUT } from '../../lib/keyboard-layout';
import { ACTUATION_WRITES_ENABLED, type TriggerTable } from '../../lib/device-actuation';

export function DeviceActuationPanel() {
  const read = useAppStore(s => s.readActuation);
  const apply = useAppStore(s => s.applyActuation);
  const selected = useAppStore(s => s.selectedKeys);
  const ready = useAppStore(s => !s.useMock && s.connection.state === 'connected');
  const [table, setTable] = useState<TriggerTable | null>(null);
  const [target, setTarget] = useState('2.40');
  const raw = Math.round(Number(target) * 100);
  const validTarget = target.trim() !== '' && Number.isFinite(raw) && raw >= 10 && raw <= 359 && Math.abs(Number(target) * 100 - raw) < 1e-8;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const keys = APEX_200S_LAYOUT.filter(k => selected.includes(k.id) && k.deviceIndex !== undefined);
  const validSelection = keys.length > 0 && keys.length === selected.length;
  async function run(action: 'read' | 'apply' | 'restore') {
    setBusy(true); setStatus(action === 'read' ? 'Reading device actuation…' : 'Backing up and verifying actuation…');
    try {
      if (action !== 'read') await apply(raw, keys.map(k => k.deviceIndex!), action === 'restore');
      const current = await read(); setTable(current);
      if (action !== 'apply') { const record = current.find(([i]) => i === (keys[0]?.deviceIndex ?? 34))?.[1]; if (record) setTarget(((record[0] | record[1] << 8) / 100).toFixed(2)); }
      setStatus(action === 'read' ? 'All 84 trigger slots read from APEX; no settings changed.' : action === 'restore' ? 'Previous actuation restored; full trigger table verified.' : 'Selected actuation applied; all trigger and RT bytes verified.');
    } catch (e) { setStatus(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }
  return <section className="rounded-xl border border-[#333333] bg-[#171717] p-5 space-y-4" aria-labelledby="hardware-actuation-title">
    <div><h2 id="hardware-actuation-title" className="font-semibold">Device actuation</h2><p className="text-xs text-[#8e8e8e] mt-2">Read actual trigger settings. Select keys on the keyboard below. Original APEX limits: 0.10–3.59 mm, 0.01 mm steps.</p></div>
    <div className="flex flex-wrap gap-3 items-center"><button disabled={!ready || busy} onClick={() => run('read')} className="px-3 py-2 rounded-md border border-[#656c79] disabled:opacity-40">Read from keyboard</button><label className="text-sm flex items-center gap-2">Target actuation <input aria-label="Target device actuation in millimetres" className="bg-[#090909] border border-[#656c79] rounded px-2 py-1 w-24" type="number" min="0.10" max="3.59" step="0.01" value={target} onChange={e => setTarget(e.target.value)} disabled={busy} />mm</label></div>
    <div className="flex flex-wrap gap-3"><button disabled={!ACTUATION_WRITES_ENABLED || !ready || busy || !validSelection || !table || !validTarget} onClick={() => run('apply')} className="px-3 py-2 rounded-md bg-[#f4f4f4] disabled:opacity-40">Apply to {keys.length} selected keys</button><button disabled={!ACTUATION_WRITES_ENABLED || !ready || busy} onClick={() => run('restore')} className="px-3 py-2 rounded-md border border-[#656c79] disabled:opacity-40">Restore previous actuation</button></div>
    {!ACTUATION_WRITES_ENABLED && <p className="text-xs text-amber-200">Stock W 2.40→2.41→2.40 capture verified. Browser Apply is locked until its own approved hardware validation.</p>}
    {ACTUATION_WRITES_ENABLED && <p className="text-xs text-[#8e8e8e]">Hardware Apply and restoration tested on W. Other key names follow the vendor layout; their mapping has not been checked individually.</p>}
    {table && <div className="flex flex-wrap gap-2" aria-label="Actual device actuation">{(keys.length ? keys : APEX_200S_LAYOUT.filter(k => k.id === 'w')).map(key => { const record = table.find(([i]) => i === key.deviceIndex)?.[1]; return record && <span key={key.id} className="text-xs bg-[#090909] rounded px-3 py-2">{key.label}: {((record[0] | record[1] << 8) / 100).toFixed(2)} mm <span className="text-[#8e8e8e]">· raw {record[0] | record[1] << 8}</span></span>; })}</div>}
    <p role="status" aria-live="polite" className="text-xs text-[#b0b0b0]">{status || (ready ? 'Close MKeyboard before reading or applying.' : 'Turn Demo off and connect your keyboard to read device settings.')}</p>
    <p className="text-[11px] text-[#8e8e8e]">This workflow preserves Rapid Trigger fields and unrelated keys. Apply keeps a browser backup; restore it before another Apply. Controls below remain local drafts.</p>
  </section>;
}
