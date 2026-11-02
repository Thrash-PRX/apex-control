import { useState } from 'react';
import { Download, ScanLine } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';

export function DeviceReadback() {
  const read = useAppStore(s => s.readDeviceState);
  const enabled = useAppStore(s => !s.useMock && s.connection.state === 'connected');
  const occupied = useAppStore(s => s.deviceBusy);
  const snapshot = useAppStore(s => s.deviceSnapshot);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function capture() {
    setBusy(true); setError('');
    try { await read(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }
  function download() {
    if (!snapshot) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `apex-readback-${snapshot.capturedAt.replace(/[:.]/g, '-')}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="rounded-xl border border-[#292929] bg-[#101010] p-5 space-y-4" aria-labelledby="device-readback-title">
    <div><h2 id="device-readback-title" className="font-semibold flex items-center gap-2"><ScanLine size={17} className="text-[#f4f4f4]" />Read from keyboard</h2><p className="text-xs text-[#8e8e8e] mt-2">Read the actual profiles, keymaps, advanced keys and trigger records without changing settings. Close MKeyboard and stop playback first.</p></div>
    <div className="flex flex-wrap items-center gap-3"><button onClick={capture} disabled={busy || occupied || !enabled} aria-busy={busy} className="ui-button primary">{busy ? 'Reading keyboard…' : 'Read device settings'}</button>{snapshot && <button onClick={download} className="ui-button"><Download size={14} />Export raw readback</button>}</div>
    {!enabled && <p className="text-xs text-[#8e8e8e]">Turn Demo off and pair your keyboard from Overview to read its settings.</p>}
    <div role="status" aria-live="polite">{error && <p className="text-sm text-red-300">{error}</p>}{snapshot && <p className="text-sm text-emerald-300">{snapshot.sections.length} sections read at {new Date(snapshot.capturedAt).toLocaleTimeString()}. Kept in this workspace only.</p>}</div>
    {snapshot && <div className="space-y-2">{snapshot.sections.map(section => <details key={`${section.command}-${section.selector}`} className="rounded border border-[#292929] p-3"><summary className="text-xs cursor-pointer">{section.name} · {section.pages.length} pages</summary><pre className="text-[11px] text-[#8e8e8e] mt-3 overflow-x-auto select-text">{section.pages.map((page, index) => `${index+1}: ${page.map(b => b.toString(16).padStart(2,'0')).join(' ')}`).join('\n')}</pre></details>)}</div>}
    <p className="text-[11px] text-[#8e8e8e]">Raw readback is a partial snapshot, not a complete restorable backup. It may contain profile names and key assignments; export it only where you intend to keep it. Values are not converted into millimetres or SOCD modes. Macro text is excluded.</p>
  </section>;
}
