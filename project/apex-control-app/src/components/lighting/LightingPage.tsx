import React from 'react';
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

  const keyColorsMap = new Map<string, RgbColor>();
  if (lightingConfig.effect !== LightingEffect.Off) {
    // When an effect is active, preview it on keys
    // In per-key or static mode, show the primary color
    if (selectedKeys.length > 0) {
      selectedKeys.forEach((k) => keyColorsMap.set(k, lightingConfig.primaryColor));
    }
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
            Configure RGB lighting profiles, onboard illumination presets, and per-key styling.
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

      {/* Keyboard Visual Preview */}
      <div className="rounded-xl border border-[#333355] bg-[#16162a] p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-xs font-semibold text-[#8888a0] uppercase tracking-wider">
            Live Preview (Selected Keys: {selectedKeys.length})
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LIGHTING_EFFECTS.map((eff) => {
              const isSelected = lightingConfig.effect === eff.effect;
              return (
                <button
                  key={eff.effect}
                  type="button"
                  onClick={() => updateLighting({ effect: eff.effect })}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-[#0096ff] bg-[#0096ff]/10 text-white shadow-md shadow-[#0096ff]/10'
                      : 'border-[#2b2b45] bg-[#1c1c30] text-[#a0a0b8] hover:border-[#3d3d60] hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold leading-tight flex items-center justify-between w-full">
                    {eff.label}
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#0096ff]" />
                    )}
                  </span>
                  <span className="text-[11px] text-[#70708c] mt-1 line-clamp-2">
                    {eff.description}
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
            <div className="grid grid-cols-4 gap-2 mb-4">
              {PRESET_COLORS.map((col, idx) => (
                <button
                  key={idx}
                  onClick={() => updateLighting({ primaryColor: col })}
                  className="h-7 rounded border border-[#333355] transition-transform hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: `rgb(${col.r}, ${col.g}, ${col.b})`,
                  }}
                />
              ))}
            </div>

            {/* Sliders for R, G, B */}
            <div className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[#8888a0]">
                  <span>Red</span>
                  <span className="font-mono">{lightingConfig.primaryColor.r}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={lightingConfig.primaryColor.r}
                  onChange={(e) => handleColorChange('r', parseInt(e.target.value))}
                  className="w-full accent-[#ff4d4d]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[#8888a0]">
                  <span>Green</span>
                  <span className="font-mono">{lightingConfig.primaryColor.g}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={lightingConfig.primaryColor.g}
                  onChange={(e) => handleColorChange('g', parseInt(e.target.value))}
                  className="w-full accent-[#00e676]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[#8888a0]">
                  <span>Blue</span>
                  <span className="font-mono">{lightingConfig.primaryColor.b}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={lightingConfig.primaryColor.b}
                  onChange={(e) => handleColorChange('b', parseInt(e.target.value))}
                  className="w-full accent-[#0096ff]"
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
              <div className="flex justify-between text-[#8888a0]">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5" /> Brightness
                </span>
                <span className="font-mono">{lightingConfig.brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={lightingConfig.brightness}
                onChange={(e) => updateLighting({ brightness: parseInt(e.target.value) })}
                className="w-full accent-[#0096ff]"
              />
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#8888a0]">
                <span>Speed</span>
                <span className="font-mono">{lightingConfig.speed}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={lightingConfig.speed}
                onChange={(e) => updateLighting({ speed: parseInt(e.target.value) })}
                className="w-full accent-[#0096ff]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
