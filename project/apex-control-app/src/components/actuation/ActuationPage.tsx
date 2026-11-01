import React from 'react';
import {
  Sliders,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import { ACTUATION_LIMITS } from '../../types';
import { KeyWorkspace } from '../keyboard/KeyWorkspace';
import { PageHeader } from '../layout/PageHeader';
import { DeviceActuationPanel } from './DeviceActuationPanel';

export const ActuationPage: React.FC = () => {
  const actuationConfig = useAppStore((s) => s.actuationConfig);
  const updateActuation = useAppStore((s) => s.updateActuation);
  const selectedKeys = useAppStore((s) => s.selectedKeys);


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
    <div className="page-stack">
      <PageHeader title="Actuation" description="Choose how far a key travels before it registers. Read your keyboard, select keys and fine-tune their trigger point." badge={<span className="available-tag">DEVICE CONTROLS</span>} />
      <KeyWorkspace subtitles={keySubtitles} />
      <DeviceActuationPanel />
      <details className="draft-disclosure"><summary>Local draft settings & presets</summary>
      <div className="flex justify-end my-4"><button className="ui-button" onClick={() => updateActuation({actuationPoint: ACTUATION_LIMITS.defaultActuation, resetPoint: ACTUATION_LIMITS.defaultReset, perKeyOverrides: []})}><RotateCcw size={13} />Reset local draft</button></div>
      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global Settings */}
        <div className="rounded-xl border border-[#393d46] bg-[#1c1e22] p-5 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#999fac] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#f28b50]" />
            Local draft — global settings
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-medium text-[#c0c0d8]">
                Actuation Point Depth
              </label>
              <span className="font-mono text-sm font-bold text-[#f28b50]">
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
              className="w-full accent-[#f28b50]"
            />
            <div className="flex justify-between text-[11px] text-[#95a1b4] font-mono">
              <span>{ACTUATION_LIMITS.min}mm (Ultra Hair-Trigger)</span>
              <span>{ACTUATION_LIMITS.max}mm (Deep Press)</span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-[#25282f]">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-medium text-[#c0c0d8]">
                Release Reset Point
              </label>
              <span className="font-mono text-sm font-bold text-[#f28b50]">
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
              className="w-full accent-[#f28b50]"
            />
            <p className="text-[11px] text-[#9ba7b8]">
              The upward travel point where key deactivation registers when Rapid Trigger is not active.
            </p>
          </div>
        </div>

        {/* Per-Key Customization */}
        <div className="rounded-xl border border-[#393d46] bg-[#1c1e22] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#999fac] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#f28b50]" />
              Local draft — per-key presets
            </span>
            <span className="text-xs font-mono text-[#f28b50]">
              {selectedKeys.length} selected
            </span>
          </h2>

          {selectedKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[#393d46] rounded-lg text-center">
              <p className="text-xs text-[#999fac]">
                Click keys on the virtual keyboard above (or Shift+Click multiple keys like WASD) to customize individual actuation depths.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-[#202833] rounded-lg border border-[#414d5e]">
                <span className="text-xs text-[#999fac] block mb-1">
                  Target Keys:
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedKeys.map((k) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded text-xs font-mono bg-[#323d4d] text-white border border-[#656c79]"
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
                    className="p-2 text-xs font-semibold rounded bg-[#29323d] hover:bg-[#354152] border border-[#4b586b] text-white"
                  >
                    0.4mm (Fast)
                  </button>
                  <button
                    onClick={() => applyToSelectedKeys(1.5)}
                    className="p-2 text-xs font-semibold rounded bg-[#29323d] hover:bg-[#354152] border border-[#4b586b] text-white"
                  >
                    1.5mm (Balanced)
                  </button>
                  <button
                    onClick={() => applyToSelectedKeys(2.8)}
                    className="p-2 text-xs font-semibold rounded bg-[#29323d] hover:bg-[#354152] border border-[#4b586b] text-white"
                  >
                    2.8mm (Precise)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </details>
    </div>
  );
};
