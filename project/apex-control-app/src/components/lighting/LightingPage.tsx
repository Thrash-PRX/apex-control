import { nativeRgbMode } from '../../lib/native-rgb-mode';
import React, { useEffect, useState, useRef } from 'react';
import {
  Palette,
  Sliders,
  Sun,
  Flame,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import { LIGHTING_EFFECTS, LightingEffect, type RgbColor } from '../../types';
import { KeyboardVisualizer } from '../keyboard';

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
  const playController = useRef<AbortController | null>(null);
  const playRgb = useAppStore(s=>s.playRgb);
  useEffect(()=>()=>{playController.current?.abort();},[]);
  const [overlay, setOverlay] = useState<'none'|'reactive'|'ripple'>('none');
  const [applying, setApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState('');
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
    const timer = window.setInterval(() => setSeconds((performance.now() - start) / 1000), 50);
    return () => window.clearInterval(timer);
  }, []);
  const keyColorsMap = previewLighting(lightingConfig, APEX_200S_LAYOUT, seconds, selectedKeys);
  if(overlay!=='none'){
    const top=previewLighting({...lightingConfig,effect:overlay},APEX_200S_LAYOUT,seconds,selectedKeys);
    for(const [id,c] of top){const base=keyColorsMap.get(id)!;keyColorsMap.set(id,{r:Math.max(base.r,c.r),g:Math.max(base.g,c.g),b:Math.max(base.b,c.b)});}
  }
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Palette className="w-6 h-6 text-[#0096ff]" />
              Lighting Studio
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" />
              Protocol Unverified
            </span>
          </div>
          <p className="text-sm text-[#8888a0] mt-1">
            Preview RGB effects locally. Native APEX modes can be applied after pairing. Reactive and ripple use selected keys as demonstration origins.
          </p>
        </div>

        <button
          onClick={() =>
            updateLighting({
              effect: LightingEffect.Static,
              primaryColor: { r: 0, g: 150, b: 255 },
              brightness: 80,
              speed: 50,
            })
          }
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-[#333355] text-[#8888a0] hover:text-white hover:bg-[#252540] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      <div className="rounded-xl border border-[#333355] p-4 space-y-2">
        <button disabled={applying || nativeRgbMode(lightingConfig)===null || overlay!=='none'} className="px-4 py-2 rounded bg-[#0096ff] disabled:opacity-50" onClick={async()=>{setApplying(true);setApplyStatus('Backing up RGB settings and applying…');try{await applyRgb();setApplyStatus('RGB settings acknowledged and read back from APEX.');}catch(e){setApplyStatus(e instanceof Error?e.message:String(e));}finally{setApplying(false);}}}>{applying?'Applying…':'Apply RGB to Keyboard'}</button>
        <button className="ml-3 text-sm underline" onClick={()=>{const raw=localStorage.getItem("apex-rgb-device-backup-v1");if(!raw){setApplyStatus("No device RGB backup yet. Apply reads and saves it before changing settings.");return;}const url=URL.createObjectURL(new Blob([raw],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="apex-rgb-backup.json";a.click();URL.revokeObjectURL(url);}}>Export RGB backup</button><p className="text-xs text-[#8888a0]">Hardware: APEX native effects only; other effects and overlays are browser previews. Close MKeyboard first, switch to hardware mode and pair APEX from Dashboard. Current RGB records are backed up in this browser before applying.</p>
        <div className="flex gap-3">
          <button className="px-3 py-2 rounded bg-purple-700 disabled:opacity-50" disabled={applying || lightingConfig.effect==='native_layer' || overlay!=='none'} onClick={async()=>{const controller=new AbortController();playController.current=controller;setApplying(true);setApplyStatus('Backing up palette; running bounded hardware animation…');try{await playRgb(controller.signal);setApplyStatus('Animation test ended; palette restore readback confirmed. Custom mode remains selected.');}catch(e){setApplyStatus(e instanceof Error?e.message:String(e));}finally{playController.current=null;setApplying(false);}}}>Test hardware animation (8 frames)</button>
          <button className="px-3 py-2 border rounded" onClick={()=>playController.current?.abort()}>Stop animation and restore colors</button>
        </div>
<button className="text-sm underline" onClick={()=>{const raw=localStorage.getItem("apex-custom-rgb-history-v1");if(!raw){setApplyStatus("No animation palette backup yet.");return;}const url=URL.createObjectURL(new Blob([raw],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="apex-animation-palettes.json";a.click();URL.revokeObjectURL(url);}}>Export animation palette backups</button><p className="text-xs text-[#8888a0]">Experimental host playback: keep this page open. Eight frames at up to 2 fps, followed by palette restore/readback. Custom mode remains selected. Reactive previews use keys typed while this page has focus. Unplugging prevents automatic restore; the backup remains in browser storage.</p>
        <p role="status" className="text-sm">{applyStatus}</p>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label>Wave direction <select className="bg-[#252540] p-2 ml-2 rounded" value={lightingConfig.direction??'left-to-right'} onChange={e=>updateLighting({direction:e.target.value as 'left-to-right'|'right-to-left'|'top-to-bottom'|'bottom-to-top'})}>
          <option value="left-to-right">Left → right</option><option value="right-to-left">Right → left</option><option value="top-to-bottom">Top → bottom</option><option value="bottom-to-top">Bottom → top</option>
        </select></label>
        <label>Preview overlay <select className="bg-[#252540] p-2 ml-2 rounded" value={overlay} onChange={e=>setOverlay(e.target.value as typeof overlay)}><option value="none">None</option><option value="reactive">Reactive</option><option value="ripple">Ripple</option></select></label>
        <p className="text-xs text-[#8888a0]">WK68-inspired animations and Wootility-style overlays are local interpretations. Overlays cannot be sent to APEX. Layer is a native firmware mode; its preview is blank. Per-key Custom is separate and is not enabled for hardware painting yet.</p>
      </div>
      {/* Keyboard Visual Preview */}
      <div className="rounded-xl border border-[#333355] bg-[#16162a] p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-xs font-semibold text-[#8888a0] uppercase tracking-wider">
            Local Preview (Selected Keys: {selectedKeys.length})
          </span>
          {selectedKeys.length > 0 && (
            <button
              onClick={() => setSelectedKeys([])}
              className="text-xs text-[#0096ff] hover:underline"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Effect Selector (2 cols on lg) */}
        <div className="lg:col-span-2 rounded-xl border border-[#333355] bg-[#16162a] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#0096ff]" />
            Lighting Effects
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="group" aria-label="Lighting effects">
            {LIGHTING_EFFECTS.map((eff) => {
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
                      ? 'border-[#0096ff] bg-[#0096ff]/10 text-white shadow-md shadow-[#0096ff]/10'
                      : 'border-[#2b2b45] bg-[#1c1c30] text-[#a0a0b8] hover:border-[#3d3d60] hover:text-white'
                  } focus:outline-none focus:ring-2 focus:ring-[#0096ff] focus:ring-offset-2 focus:ring-offset-[#1a1a2e]`}
                >
                  <span className="text-xs font-bold leading-tight flex items-center justify-between w-full">
                    {eff.label}
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#0096ff]" aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-[11px] text-[#70708c] mt-1 line-clamp-2">
                    {nativeRgbMode({effect:eff.effect})!==null?'APEX native · ':'Preview only · '}{eff.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Adjustments & Color Controls */}
        <div className="space-y-6">
          {/* Color Picker Card */}
          <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#0096ff]" />
              Color Accent
            </h2>

            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-lg border border-[#444466] shadow-inner"
                style={{
                  backgroundColor: `rgb(${lightingConfig.primaryColor.r}, ${lightingConfig.primaryColor.g}, ${lightingConfig.primaryColor.b})`,
                }}
              />
              <div className="font-mono text-xs text-[#8888a0] space-y-1">
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
                  className="h-7 rounded border border-[#333355] transition-transform hover:scale-105 active:scale-95
                             focus:outline-none focus:ring-2 focus:ring-[#0096ff] focus:ring-offset-2 focus:ring-offset-[#1a1a2e]"
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
                <label htmlFor="rgb-r" className="flex justify-between text-[#8888a0]">
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
                <label htmlFor="rgb-g" className="flex justify-between text-[#8888a0]">
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
                <label htmlFor="rgb-b" className="flex justify-between text-[#8888a0]">
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
                  className="w-full accent-[#0096ff]"
                  aria-label="Blue channel (0-255)"
                />
              </div>
            </div>
          </div>

          {/* Brightness & Speed */}
          <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0096ff]" />
              Parameters
            </h2>

            <div className="space-y-1 text-xs">
              <label htmlFor="brightness" className="flex justify-between text-[#8888a0]">
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
                value={lightingConfig.brightness}
                onChange={(e) => updateLighting({ brightness: parseInt(e.target.value) })}
                className="w-full accent-[#0096ff]"
                aria-label="Brightness (0-100%)"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label htmlFor="speed" className="flex justify-between text-[#8888a0]">
                <span>Speed</span>
                <span className="font-mono">{lightingConfig.speed}%</span>
              </label>
              <input
                id="speed"
                type="range"
                min="0"
                max="100"
                value={lightingConfig.speed}
                onChange={(e) => updateLighting({ speed: parseInt(e.target.value) })}
                className="w-full accent-[#0096ff]"
                aria-label="Effect speed (0-100%)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
