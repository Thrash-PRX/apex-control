import React from 'react';
import {
  Gauge,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import { ACTUATION_LIMITS } from '../../types';
import { KeyboardVisualizer } from '../keyboard';

export const ActuationPage: React.FC = () => {
  const actuationConfig = useAppStore((s) => s.actuationConfig);
  const updateActuation = useAppStore((s) => s.updateActuation);
  const selectedKeys = useAppStore((s) => s.selectedKeys);
  const setSelectedKeys = useAppStore((s) => s.setSelectedKeys);

  const keySubtitles = new Map<string, string>();
  // Mark keys with current actuation
  actuationConfig.perKeyOverrides.forEach((override) => {
    keySubtitles.set(override.keyId, `${override.actuationPoint.toFixed(1)}mm`);
  });

  const handleGlobalActuationChange = (val: number) => {
    updateActuation({ actuationPoint: val });
  };

  const handleGlobalResetChange = (val: number) => {
    updateActuation({ resetPoint: val });
  };

  const applyToSelectedKeys = (point: number) => {
    if (selectedKeys.length === 0) return;

    const currentOverrides = [...actuationConfig.perKeyOverrides];
    selectedKeys.forEach((keyId) => {
      const idx = currentOverrides.findIndex((o) => o.keyId === keyId);
      if (idx >= 0) {
        currentOverrides[idx] = {
          ...currentOverrides[idx],
          actuationPoint: point,
        };
      } else {
        currentOverrides.push({
          keyId,
          actuationPoint: point,
          resetPoint: actuationConfig.resetPoint,
        });
      }
    });

    updateActuation({ perKeyOverrides: currentOverrides });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Gauge className="w-6 h-6 text-[#0096ff]" />
              Hall-Effect Actuation Controls
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" />
              Sensor Limits Unverified
            </span>
          </div>
          <p className="text-sm text-[#8888a0] mt-1">
            Adjust magnetic Hall-effect actuation depths between 0.1mm and 3.6mm.
          </p>
        </div>

        <button
          onClick={() =>
            updateActuation({
              actuationPoint: ACTUATION_LIMITS.defaultActuation,
              resetPoint: ACTUATION_LIMITS.defaultReset,
              perKeyOverrides: [],
            })
          }
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-[#333355] text-[#8888a0] hover:text-white hover:bg-[#252540] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All to 2.0mm
        </button>
      </div>

      {/* Visual Keyboard */}
      <div className="rounded-xl border border-[#333355] bg-[#16162a] p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-xs font-semibold text-[#8888a0] uppercase tracking-wider">
            Select Keys for Custom Actuation (Selected: {selectedKeys.length})
          </span>
          {selectedKeys.length > 0 && (
            <button
              onClick={() => setSelectedKeys([])}
              className="text-xs text-[#0096ff] hover:underline"
            >
              Clear Selection
            </button>
          )}
        </div>
        <KeyboardVisualizer
          selectedKeys={selectedKeys}
          onKeySelect={setSelectedKeys}
          keySubtitles={keySubtitles}
        />
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global Settings */}
        <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0096ff]" />
            Global Actuation (All Keys)
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-medium text-[#c0c0d8]">
                Actuation Point Depth
              </label>
              <span className="font-mono text-sm font-bold text-[#0096ff]">
                {actuationConfig.actuationPoint.toFixed(1)} mm
              </span>
            </div>
            <input
              type="range"
              min={ACTUATION_LIMITS.min}
              max={ACTUATION_LIMITS.max}
              step={ACTUATION_LIMITS.step}
              value={actuationConfig.actuationPoint}
              onChange={(e) =>
                handleGlobalActuationChange(parseFloat(e.target.value))
              }
              className="w-full accent-[#0096ff]"
            />
            <div className="flex justify-between text-[11px] text-[#6b6b85] font-mono">
              <span>{ACTUATION_LIMITS.min}mm (Ultra Hair-Trigger)</span>
              <span>{ACTUATION_LIMITS.max}mm (Deep Press)</span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-[#252540]">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-medium text-[#c0c0d8]">
                Release Reset Point
              </label>
              <span className="font-mono text-sm font-bold text-[#0096ff]">
                {actuationConfig.resetPoint.toFixed(1)} mm
              </span>
            </div>
            <input
              type="range"
              min={ACTUATION_LIMITS.min}
              max={ACTUATION_LIMITS.max}
              step={ACTUATION_LIMITS.step}
              value={actuationConfig.resetPoint}
              onChange={(e) =>
                handleGlobalResetChange(parseFloat(e.target.value))
              }
              className="w-full accent-[#0096ff]"
            />
            <p className="text-[11px] text-[#70708c]">
              The upward travel point where key deactivation registers when Rapid Trigger is not active.
            </p>
          </div>
        </div>

        {/* Per-Key Customization */}
        <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#0096ff]" />
              Per-Key Override Tool
            </span>
            <span className="text-xs font-mono text-[#0096ff]">
              {selectedKeys.length} selected
            </span>
          </h2>

          {selectedKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[#333355] rounded-lg text-center">
              <p className="text-xs text-[#8888a0]">
                Click keys on the virtual keyboard above (or Shift+Click multiple keys like WASD) to customize individual actuation depths.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-[#1e1e32] rounded-lg border border-[#30304c]">
                <span className="text-xs text-[#8888a0] block mb-1">
                  Target Keys:
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedKeys.map((k) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded text-xs font-mono bg-[#2b2b48] text-white border border-[#44446a]"
                    >
                      {k.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-[#c0c0d8]">
                  Quick Presets for Selected:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => applyToSelectedKeys(0.4)}
                    className="p-2 text-xs font-semibold rounded bg-[#202035] hover:bg-[#282845] border border-[#343455] text-white"
                  >
                    0.4mm (Fast)
                  </button>
                  <button
                    onClick={() => applyToSelectedKeys(1.5)}
                    className="p-2 text-xs font-semibold rounded bg-[#202035] hover:bg-[#282845] border border-[#343455] text-white"
                  >
                    1.5mm (Balanced)
                  </button>
                  <button
                    onClick={() => applyToSelectedKeys(2.8)}
                    className="p-2 text-xs font-semibold rounded bg-[#202035] hover:bg-[#282845] border border-[#343455] text-white"
                  >
                    2.8mm (Precise)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
