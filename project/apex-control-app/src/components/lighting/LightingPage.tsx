import {FILLED_EFFECTS} from '../../lib/effect-timeline';
import { nativeRgbMode } from '../../lib/native-rgb-mode';
import React, { useEffect, useState, useRef } from 'react';
import {
  Palette,
  Sliders,
  Sun,
  Flame,

  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import { LIGHTING_EFFECTS, LightingEffect, type RgbColor } from '../../types';
import { KeyboardVisualizer } from '../keyboard';
import { PageHeader } from '../layout/PageHeader';

import { previewLighting } from '../../lib/lighting-preview';
import { APEX_200S_LAYOUT } from '../../lib/keyboard-layout';
const PRESET_COLORS: RgbColor[] = [
  { r: 0, g: 150, b: 255 },   // Electric Blue
  { r: 255, g: 50, b: 50 },   // Cyber Red
  { r: 0, g: 230, b: 118 },   // Acid Green
  { r: 255, g: 214, b: 0 },   // Gold Yellow
  { r: 170, g: 0, b: 255 },   // Neon Purple
  { r: 255, g: 109, b: 0 },   // Solar Orange
  { r: 255, g: 255, b: 255 }, // Pure White
  { r: 0, g: 0, b: 0 },       // Off
];

export const LightingPage: React.FC = () => {
  const useMock = useAppStore(s=>s.useMock);
  const connection = useAppStore(s=>s.connection);
  const hardwareReady = !useMock && connection.state==='connected';
  const playController = useRef<AbortController | null>(null);
  const playRgb = useAppStore(s=>s.playRgb);
  useEffect(()=>()=>{playController.current?.abort();},[]);
  const [showExperimental, setShowExperimental] = useState(false);
  const [overlay, setOverlay] = useState<'none'|'reactive'|'ripple'>('none');
  const [applying, setApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState('');
  const [hardwareColors,setHardwareColors]=useState<Map<string,RgbColor>|null>(null);
  useEffect(()=>{const update=(event:Event)=>{const d=(event as CustomEvent).detail;if(!d){setHardwareColors(null);return;}const rows=new Map<number,number[]>(d.records);const mapped=new Map<string,RgbColor>();for(const key of APEX_200S_LAYOUT){const r=key.deviceIndex===undefined?undefined:rows.get(key.deviceIndex);if(r)mapped.set(key.id,{r:r[1],g:r[2],b:r[3]});}setHardwareColors(mapped);};window.addEventListener('apex-rgb-palette',update);return()=>window.removeEventListener('apex-rgb-palette',update);},[]);
  useEffect(()=>{const progress=(event:Event)=>{const d=(event as CustomEvent).detail;setApplyStatus(`Playing on keyboard — ${d.fps.toFixed(1)} ${d.transfer==='per-key-timeline'?'key updates/s':'fps'}. Stop restores saved colors.`);};window.addEventListener('apex-rgb-progress',progress);return()=>window.removeEventListener('apex-rgb-progress',progress);},[]);
  const applyRgb = useAppStore(s => s.applyRgb);
  const lightingConfig = useAppStore((s) => s.lightingConfig);
  const updateLighting = useAppStore((s) => s.updateLighting);
  const selectedKeys = useAppStore((s) => s.selectedKeys);
  const setSelectedKeys = useAppStore((s) => s.setSelectedKeys);

  const handleColorChange = (channel: 'r' | 'g' | 'b', val: number) => {
    updateLighting({
      primaryColor: {
        ...lightingConfig.primaryColor,
        [channel]: val,
      },
    });
  };

  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;
    const start = performance.now();
    const timer = window.setInterval(() => {if(!playController.current)setSeconds((performance.now() - start) / 1000);}, 50);
    return () => window.clearInterval(timer);
  }, []);
  const keyColorsMap = hardwareColors?new Map(hardwareColors):previewLighting(lightingConfig, APEX_200S_LAYOUT, seconds, selectedKeys);
  if(overlay!=='none'&&!hardwareColors){
    const top=previewLighting({...lightingConfig,effect:overlay},APEX_200S_LAYOUT,seconds,selectedKeys);
    for(const [id,c] of top){const base=keyColorsMap.get(id)!;keyColorsMap.set(id,{r:Math.max(base.r,c.r),g:Math.max(base.g,c.g),b:Math.max(base.b,c.b)});}
  }
  return (
    <div className="page-stack">
      {/* Keyboard Visual Preview */}
      <div className="lighting-keyboard-stage rounded-xl border border-[#292929] bg-[#101010] p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-xs font-semibold text-[#8e8e8e] uppercase tracking-wider">
            {hardwareColors?'Last verified keyboard colors':'Local preview'} (Selected Keys: {selectedKeys.length})
          </span>
          {selectedKeys.length > 0 && (
            <button
              onClick={() => setSelectedKeys([])}
              className="text-xs text-[#f4f4f4] hover:underline"
            >
              Clear Key Selection
            </button>
          )}
        </div>
        <KeyboardVisualizer
          selectedKeys={selectedKeys}
          onKeySelect={setSelectedKeys}
          keyColors={keyColorsMap}
        />
      </div>


<PageHeader title="Lighting" description="Choose an effect, set your colors and make your setup glow." badge={<span className="available-tag">DEVICE CONTROLS</span>} actions={<button
          onClick={() =>
            updateLighting({
              effect: LightingEffect.Static,
              primaryColor: { r: 0, g: 150, b: 255 },
              brightness: 100,
              backgroundGlow: 22,
              speed: 50,
            })
          }
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-[#292929] text-[#8e8e8e] hover:text-white hover:bg-[#171717] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>} />
      <div className="editor-panel lighting-controls">
        <p className="text-sm">{hardwareReady?'APEX hardware connected — native Apply is available.':'No hardware connection — the keyboard image is a local preview only.'}</p>
        {!hardwareReady&&<button disabled={applying} className="px-4 py-2 rounded border border-[#f4f4f4]" onClick={async()=>{setApplying(true);setApplyStatus('Opening APEX pairing…');try{const state=useAppStore.getState();if(state.useMock)state.toggleMockMode();const device=await useAppStore.getState().pairDevice();if(device)await useAppStore.getState().connectDevice(device.path);const c=useAppStore.getState().connection;setApplyStatus(c.state==='connected'?'APEX connected. Choose a native effect, then Apply.':c.error??'No APEX connection. Close MKeyboard and select APEX in the browser picker.');}catch(e){setApplyStatus(String(e));}finally{setApplying(false);}}}>Connect APEX keyboard</button>}
        <button disabled={applying || !hardwareReady || nativeRgbMode(lightingConfig)===null || overlay!=='none'} className="px-4 py-2 rounded bg-[#f4f4f4] disabled:opacity-50" onClick={async()=>{setApplying(true);setApplyStatus('Backing up RGB settings and applying…');try{await applyRgb();setApplyStatus('RGB settings acknowledged and read back from APEX.');}catch(e){setApplyStatus(e instanceof AggregateError?e.message+": "+e.errors.map(x=>x instanceof Error?x.message:String(x)).join(" | "):e instanceof Error?e.message:String(e));}finally{setApplying(false);}}}>{applying?'Applying…':'Apply RGB to Keyboard'}</button>
        <button className="ml-3 text-sm underline" onClick={()=>{const raw=localStorage.getItem("apex-rgb-device-backup-v1");if(!raw){setApplyStatus("No device RGB backup yet. Apply reads and saves it before changing settings.");return;}const url=URL.createObjectURL(new Blob([raw],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="apex-rgb-backup.json";a.click();URL.revokeObjectURL(url);}}>Export RGB backup</button><p className="text-xs text-[#8e8e8e]">Use Apply for native effects or Play custom effect for host-driven animations. Overlays are preview-only. Close MKeyboard first and use Connect APEX keyboard above. Current RGB records are backed up in this browser before applying.</p>
        <div className="flex flex-wrap gap-3">
          <button className="px-3 py-2 rounded bg-purple-600 disabled:opacity-50" disabled={applying || !hardwareReady || nativeRgbMode(lightingConfig)!==null || lightingConfig.effect==='custom' || overlay!=='none'} onClick={async()=>{const c=new AbortController();playController.current=c;setApplying(true);setApplyStatus('Backing up settings and starting optimized custom playback…');try{await playRgb(c.signal,false,true,true);const m=JSON.parse(localStorage.getItem('apex-last-playback-metrics-v1')??'{}');setApplyStatus('Playback ended; saved RGB settings restored and readback confirmed. '+(m.fps?.toFixed(1)??'?')+(m.transfer==='per-key-timeline'?' key updates/s.':' fps.'));}catch(e){setApplyStatus(e instanceof AggregateError?e.message+': '+e.errors.map(x=>String(x)).join(' | '):String(e));}finally{playController.current=null;setApplying(false);}}}>Play custom effect (loop)</button>

<button disabled={applying} className="px-3 py-2 border rounded disabled:opacity-50" onClick={async()=>{setApplying(true);try{await playRgb(new AbortController().signal,true);setApplyStatus("Saved RGB settings restored and readback confirmed.");}catch(e){setApplyStatus(e instanceof Error?e.message:String(e));}finally{setApplying(false);}}}>Restore saved RGB settings</button><button className="px-3 py-2 border rounded" onClick={()=>playController.current?.abort()}>Stop animation and restore colors</button>
        </div>
<details className="draft-disclosure"><summary>Backups & playback diagnostics</summary><button className="text-sm underline" onClick={()=>{const raw=JSON.stringify({palettes:JSON.parse(localStorage.getItem('apex-custom-rgb-history-v1')??'[]'),nativeColorCycle:JSON.parse(localStorage.getItem('apex-native-color-cycle-backup-v1')??'null')});if(!localStorage.getItem('apex-custom-rgb-history-v1')&&!localStorage.getItem('apex-native-color-cycle-backup-v1')){setApplyStatus("No animation palette backup yet.");return;}const url=URL.createObjectURL(new Blob([raw],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="apex-animation-palettes.json";a.click();URL.revokeObjectURL(url);}}>Export animation palette backups</button><p className="text-xs text-[#8e8e8e]">Custom effects run while this page stays open. Stop restores saved colors. The keyboard image mirrors verified colors during playback. Native effects run on the keyboard; custom effects are authored interpretations. Shadow and Heatmap react only to typing in this page.</p>
        <details><summary className="text-sm cursor-pointer">Legacy slow diagnostic</summary>          <button className="px-3 py-2 rounded bg-purple-700 disabled:opacity-50" disabled={applying || !hardwareReady || lightingConfig.effect==='native_layer' || overlay!=='none'} onClick={async()=>{const controller=new AbortController();playController.current=controller;setApplying(true);setApplyStatus('Backing up palette; running bounded hardware animation…');try{await playRgb(controller.signal);setApplyStatus('Animation test ended; palette restore readback confirmed. Custom mode remains selected.');}catch(e){setApplyStatus(e instanceof AggregateError?e.message+": "+e.errors.map(x=>x instanceof Error?x.message:String(x)).join(" | "):e instanceof Error?e.message:String(e));}finally{playController.current=null;setApplying(false);}}}>Slow diagnostic (2 fps)</button></details></details><p role="status" className="text-sm">{applyStatus}</p>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label>Wave direction <select className="bg-[#171717] p-2 ml-2 rounded" value={lightingConfig.direction??'left-to-right'} onChange={e=>updateLighting({direction:e.target.value as 'left-to-right'|'right-to-left'|'top-to-bottom'|'bottom-to-top'})}>
          <option value="left-to-right">Left → right</option><option value="right-to-left">Right → left</option><option value="top-to-bottom">Top → bottom</option><option value="bottom-to-top">Bottom → top</option>
        </select></label>
        <label>Preview overlay <select disabled={applying} className="bg-[#171717] p-2 ml-2 rounded" value={overlay} onChange={e=>setOverlay(e.target.value as typeof overlay)}><option value="none">None</option><option value="reactive">Reactive</option><option value="ripple">Ripple</option></select></label>
        <p className="text-xs text-[#8e8e8e]">Custom animations are original interpretations; Play keeps the app running as their controller. Overlays cannot be sent to APEX. Layer is a native firmware mode; its preview is blank. Per-key Custom is separate and is not enabled for hardware painting yet.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Effect Selector (2 cols on lg) */}
        <div className="lg:col-span-2 rounded-xl border border-[#292929] bg-[#101010] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8e8e8e] mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#f4f4f4]" />
            APEX Effects
          </h2>

<p className="text-xs text-[#8e8e8e] mb-3">Native effects run in the keyboard. Custom effects run from this app using captured RGB controls; their speed depends on how many keys change. These are not exact WK68/Wooting firmware effects.</p><button className="text-xs underline mb-3" onClick={()=>setShowExperimental(v=>!v)}>{showExperimental?"Hide custom effects":"Show custom effects"}</button><div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="group" aria-label="Lighting effects">
            {LIGHTING_EFFECTS.filter(e=>showExperimental||nativeRgbMode({effect:e.effect})!==null).map((eff) => {
              const isSelected = lightingConfig.effect === eff.effect;
              return (
                <button
                  key={eff.effect}
                  type="button"
                  onClick={() => updateLighting({ effect: eff.effect })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      updateLighting({ effect: eff.effect });
                    }
                  }}
                  tabIndex={0}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={eff.label}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-[#f4f4f4] bg-[#f4f4f4]/10 text-white shadow-md shadow-[#f4f4f4]/10'
                      : 'border-[#333333] bg-[#1c1c30] text-[#aaaaaa] hover:border-[#444444] hover:text-white'
                  } focus:outline-none focus:ring-2 focus:ring-[#f4f4f4] focus:ring-offset-2 focus:ring-offset-[#090909]`}
                >
                  <span className="text-xs font-bold leading-tight flex items-center justify-between w-full">
                    {eff.label}
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#f4f4f4]" aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-[11px] text-[#8e8e8e] mt-1 line-clamp-2">
                    {eff.description}
                  </span>
                  <span className="mt-1 text-[10px] text-[#f4f4f4]">{nativeRgbMode({effect:eff.effect})!==null?'Native · Apply':eff.effect==='custom'?'Painting · preview only':eff.effect==='color_cycle'?'Custom · optimized color cycle':'Custom · host playback'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Adjustments & Color Controls */}
        <div className="space-y-6">
          {/* Color Picker Card */}
          <div className="rounded-xl border border-[#292929] bg-[#101010] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8e8e8e] mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#f4f4f4]" />
              Color Accent
            </h2>

            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-lg border border-[#444466] shadow-inner"
                style={{
                  backgroundColor: `rgb(${lightingConfig.primaryColor.r}, ${lightingConfig.primaryColor.g}, ${lightingConfig.primaryColor.b})`,
                }}
              />
              <div className="font-mono text-xs text-[#8e8e8e] space-y-1">
                <div>
                  RGB: ({lightingConfig.primaryColor.r}, {lightingConfig.primaryColor.g}, {lightingConfig.primaryColor.b})
                </div>
                <div>
                  HEX: #{lightingConfig.primaryColor.r.toString(16).padStart(2, '0')}
                  {lightingConfig.primaryColor.g.toString(16).padStart(2, '0')}
                  {lightingConfig.primaryColor.b.toString(16).padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Quick Palettes */}
            <div className="grid grid-cols-4 gap-2 mb-4" role="group" aria-label="Color presets">
              {PRESET_COLORS.map((col, idx) => (
                <button
                  key={idx}
                  onClick={() => updateLighting({ primaryColor: col })}
                  className="h-7 rounded border border-[#292929] transition-transform hover:scale-105 active:scale-95
                             focus:outline-none focus:ring-2 focus:ring-[#f4f4f4] focus:ring-offset-2 focus:ring-offset-[#090909]"
                  style={{
                    backgroundColor: `rgb(${col.r}, ${col.g}, ${col.b})`,
                  }}
                  aria-label={`Preset color: rgb(${col.r}, ${col.g}, ${col.b})`}
                />
              ))}
            </div>

            {/* Sliders for R, G, B */}
            <div className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <label htmlFor="rgb-r" className="flex justify-between text-[#8e8e8e]">
                  <span>Red</span>
                  <span className="font-mono">{lightingConfig.primaryColor.r}</span>
                </label>
                <input
                  id="rgb-r"
                  type="range"
                  min="0"
                  max="255"
                  value={lightingConfig.primaryColor.r}
                  onChange={(e) => handleColorChange('r', parseInt(e.target.value))}
                  className="w-full accent-[#ff4d4d]"
                  aria-label="Red channel (0-255)"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rgb-g" className="flex justify-between text-[#8e8e8e]">
                  <span>Green</span>
                  <span className="font-mono">{lightingConfig.primaryColor.g}</span>
                </label>
                <input
                  id="rgb-g"
                  type="range"
                  min="0"
                  max="255"
                  value={lightingConfig.primaryColor.g}
                  onChange={(e) => handleColorChange('g', parseInt(e.target.value))}
                  className="w-full accent-[#00e676]"
                  aria-label="Green channel (0-255)"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rgb-b" className="flex justify-between text-[#8e8e8e]">
                  <span>Blue</span>
                  <span className="font-mono">{lightingConfig.primaryColor.b}</span>
                </label>
                <input
                  id="rgb-b"
                  type="range"
                  min="0"
                  max="255"
                  value={lightingConfig.primaryColor.b}
                  onChange={(e) => handleColorChange('b', parseInt(e.target.value))}
                  className="w-full accent-[#f4f4f4]"
                  aria-label="Blue channel (0-255)"
                />
              </div>
            </div>
          </div>

          {/* Brightness & Speed */}
          <div className="rounded-xl border border-[#292929] bg-[#101010] p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8e8e8e] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#f4f4f4]" />
              Parameters
            </h2>

            <div className="space-y-1 text-xs">
              <label htmlFor="brightness" className="flex justify-between text-[#8e8e8e]">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5" aria-hidden="true" /> Brightness
                </span>
                <span className="font-mono">{lightingConfig.brightness}%</span>
              </label>
              <input
                id="brightness"
                type="range"
                min="0"
                max="100"
                disabled={applying}
                value={lightingConfig.brightness}
                onChange={(e) => updateLighting({ brightness: parseInt(e.target.value) })}
                className="w-full accent-[#f4f4f4]"
                aria-label="Brightness (0-100%)"
              />
            </div>

            <div className="space-y-2 text-xs">
              <button disabled={applying||nativeRgbMode(lightingConfig)!==null} className="px-3 py-2 rounded bg-purple-600 disabled:opacity-50" onClick={()=>updateLighting({brightness:100,backgroundGlow:28,primaryColor:{r:40,g:160,b:255},secondaryColor:{r:180,g:80,b:255},speed:85})}>Vivid preset</button>
              <label htmlFor="background-glow" className="flex justify-between text-[#8e8e8e]"><span>Background glow</span><span>{lightingConfig.backgroundGlow??22}%</span></label>
              <input id="background-glow" type="range" min="0" max="40" disabled={applying||nativeRgbMode(lightingConfig)!==null||(FILLED_EFFECTS.has(lightingConfig.effect)||lightingConfig.effect==='shadow')} value={lightingConfig.backgroundGlow??22} onChange={e=>updateLighting({backgroundGlow:Number(e.target.value)})} className="w-full accent-[#f4f4f4]" aria-label="Custom effect background glow (0-40%)" />
              <p className="text-[#8e8e8e]">Choose settings before Play. Glow applies to pulse effects; 0 gives a dark background.</p>
            </div>

            <div className="space-y-1 text-xs">
              <label htmlFor="speed" className="flex justify-between text-[#8e8e8e]">
                <span>Speed</span>
                <span className="font-mono">{lightingConfig.speed}%</span>
              </label>
              <input
                id="speed"
                disabled={applying}
                type="range"
                min="0"
                max="100"
                value={lightingConfig.speed}
                onChange={(e) => updateLighting({ speed: parseInt(e.target.value) })}
                className="w-full accent-[#f4f4f4]"
                aria-label="Effect speed (0-100%)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
