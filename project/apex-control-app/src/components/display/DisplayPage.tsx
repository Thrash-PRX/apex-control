import { useRef, useState } from 'react';
import { defaultDisplay, parseDisplayDraft, type DisplayDraft } from '../../lib/display';
const STORAGE_KEY = 'apex-control-display-v1';
export function DisplayPage() {
  const [draft, setDraft] = useState<DisplayDraft>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? parseDisplayDraft(JSON.parse(saved)) : defaultDisplay; }
    catch { return defaultDisplay; }
  });
  const [notice, setNotice] = useState('');
  const loadId = useRef(0);
  const update = (key: 'title' | 'label' | 'value', value: string) => setDraft(d => ({ ...d, [key]: value }));
  async function loadImage(file?: File) {
    const id = ++loadId.current;
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { setNotice('Choose a PNG, JPEG or WebP image up to 2 MB.'); return; }
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 16000000) { bitmap.close(); throw new Error('Image must be at most 16 megapixels.'); }
      bitmap.close();
      const reader = new FileReader();
      reader.onload = () => { if (id === loadId.current) { setDraft(d => ({ ...d, image: String(reader.result) })); setNotice('Image ready for local preview.'); } };
      reader.onerror = () => setNotice('Could not read this image.');
      reader.readAsDataURL(file);
    } catch { setNotice('Cannot decode image. Use PNG, JPEG or WebP up to 16 megapixels.'); }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parseDisplayDraft(draft))); setNotice('Draft saved in this browser. Keyboard unchanged.'); }
    catch { setNotice('Could not save: browser storage is full or unavailable.'); }
  }
  return <section className="p-8 space-y-6 text-slate-200">
    <div><h1 className="text-2xl font-bold">Display Studio</h1><p className="text-slate-400 mt-2">Custom images and stat cards · local preview</p></div>
    <p className="rounded-xl border border-amber-700 bg-amber-950/30 p-4 text-amber-200">Display hardware support is unverified. This canvas is illustrative; panel resolution, colour format and upload commands are unknown.</p>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-slate-700 p-6">
        {(['title', 'label', 'value'] as const).map(key => <label key={key} className="block capitalize">{key}<input className="block mt-2 w-full rounded bg-slate-900 p-3 border border-slate-600" maxLength={64} value={draft[key]} onChange={e => update(key, e.target.value)} /></label>)}
        <label className="block">Custom image<input className="block mt-2 w-full" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => void loadImage(e.target.files?.[0])} /></label>
        <button className="rounded border border-slate-600 px-4 py-2" onClick={() => { ++loadId.current; setDraft(d => ({ ...d, image: null })); }}>Remove image</button>
        <p className="text-sm text-slate-400">Stat values are entered manually. Live CPU/GPU temperature and game FPS need a local data provider and a verified display protocol.</p>
      </div>
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border-8 border-slate-800 bg-black aspect-[2/1] flex flex-col items-center justify-center text-center p-6">
          {draft.image && <img src={draft.image} alt="Custom display background" className="absolute inset-0 h-full w-full object-contain opacity-50" />}
          <div className="relative"><p className="text-sm tracking-widest">{draft.title}</p><p className="text-4xl font-bold my-3">{draft.value}</p><p className="text-cyan-300">{draft.label}</p></div>
        </div>
        <p className="text-sm text-slate-400">Illustrative preview — not the keyboard's measured screen dimensions.</p>
        <div className="flex gap-3"><button className="bg-blue-600 rounded px-4 py-2" onClick={save}>Save draft</button><button className="rounded px-4 py-2 bg-slate-800 text-slate-500" disabled>Upload unavailable</button></div>
        <p role="status" className="text-sm text-cyan-200">{notice}</p>
      </div>
    </div>
  </section>;
}
