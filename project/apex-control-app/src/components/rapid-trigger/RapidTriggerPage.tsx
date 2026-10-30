import React from 'react';
import {
  Zap,
  Power,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Info,
} from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import { RAPID_TRIGGER_LIMITS } from '../../types';
import { KeyboardVisualizer } from '../keyboard';

export const RapidTriggerPage: React.FC = () => {
  const rapidTriggerConfig = useAppStore((s) => s.rapidTriggerConfig);
  const updateRapidTrigger = useAppStore((s) => s.updateRapidTrigger);
  const selectedKeys = useAppStore((s) => s.selectedKeys);
  const setSelectedKeys = useAppStore((s) => s.setSelectedKeys);

  const toggleRapidTrigger = () => {
    updateRapidTrigger({ enabled: !rapidTriggerConfig.enabled });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-[#0096ff]" />
              Rapid Trigger Configuration
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" />
              Firmware Logic Unverified
            </span>
          </div>
          <p className="text-sm text-[#8888a0] mt-1">
            Dynamic reset on key release for instant repeated keystrokes in competitive FPS and rhythm games.
          </p>
        </div>

        <button
          onClick={() =>
            updateRapidTrigger({
              enabled: false,
              pressSensitivity: RAPID_TRIGGER_LIMITS.defaultPress,
              releaseSensitivity: RAPID_TRIGGER_LIMITS.defaultRelease,
              perKeyOverrides: [],
            })
          }
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-[#333355] text-[#8888a0] hover:text-white hover:bg-[#252540] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      {/* Main Activation Banner */}
      <div
        className={`p-6 rounded-xl border flex items-center justify-between transition-all ${
          rapidTriggerConfig.enabled
            ? 'bg-[#0096ff]/10 border-[#0096ff]/50 shadow-lg shadow-[#0096ff]/5'
            : 'bg-[#16162a] border-[#333355]'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              rapidTriggerConfig.enabled
                ? 'bg-[#0096ff] text-white'
                : 'bg-[#202035] text-[#606080]'
            }`}
          >
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Rapid Trigger Engine
            </h2>
            <p className="text-xs text-[#8888a0]">
              {rapidTriggerConfig.enabled
                ? 'Active — keys reset dynamically the instant they travel upward.'
                : 'Disabled — standard static actuation and reset thresholds are active.'}
            </p>
          </div>
        </div>

        <button
          onClick={toggleRapidTrigger}
          className={`px-5 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all flex items-center gap-2 ${
            rapidTriggerConfig.enabled
              ? 'bg-[#0096ff] text-white hover:bg-[#0080db] shadow-md shadow-[#0096ff]/20'
              : 'bg-[#252540] text-[#a0a0be] hover:bg-[#303050] hover:text-white'
          }`}
        >
          <Power className="w-4 h-4" />
          {rapidTriggerConfig.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* Keyboard Visual Preview */}
      <div className="rounded-xl border border-[#333355] bg-[#16162a] p-4 shadow-lg">
        <KeyboardVisualizer
          selectedKeys={selectedKeys}
          onKeySelect={setSelectedKeys}
        />
      </div>

      {/* Sensitivity Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0096ff]" />
            Press Sensitivity (Downstroke)
          </h2>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#8888a0]">
              Required downward movement to reactivate
            </span>
            <span className="font-mono text-sm font-bold text-[#0096ff]">
              {rapidTriggerConfig.pressSensitivity.toFixed(1)} mm
            </span>
          </div>
          <input
            type="range"
            min={RAPID_TRIGGER_LIMITS.minSensitivity}
            max={RAPID_TRIGGER_LIMITS.maxSensitivity}
            step={RAPID_TRIGGER_LIMITS.step}
            value={rapidTriggerConfig.pressSensitivity}
            onChange={(e) =>
              updateRapidTrigger({ pressSensitivity: parseFloat(e.target.value) })
            }
            className="w-full accent-[#0096ff]"
          />
        </div>

        <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0096ff]" />
            Release Sensitivity (Upstroke)
          </h2>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#8888a0]">
              Required upward movement to deactivate
            </span>
            <span className="font-mono text-sm font-bold text-[#0096ff]">
              {rapidTriggerConfig.releaseSensitivity.toFixed(1)} mm
            </span>
          </div>
          <input
            type="range"
            min={RAPID_TRIGGER_LIMITS.minSensitivity}
            max={RAPID_TRIGGER_LIMITS.maxSensitivity}
            step={RAPID_TRIGGER_LIMITS.step}
            value={rapidTriggerConfig.releaseSensitivity}
            onChange={(e) =>
              updateRapidTrigger({ releaseSensitivity: parseFloat(e.target.value) })
            }
            className="w-full accent-[#0096ff]"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#333355] bg-[#16162a] p-4 flex items-start gap-3 text-xs text-[#8888a0]">
        <Info className="w-4 h-4 text-[#0096ff] shrink-0 mt-0.5" />
        <p>
          <strong className="text-white">Tournament Notice:</strong> Some competitive circuits (e.g., Counter-Strike 2 Major rules, osu! tournament rankings) regulate sub-0.2mm sensitivity or snap-tap automation. Verify rule legality before tournament play.
        </p>
      </div>
    </div>
  );
};
