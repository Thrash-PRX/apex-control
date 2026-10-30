import React from 'react';
import {
  ArrowLeftRight,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import { SocdMode } from '../../types';

interface SocdOption {
  mode: SocdMode;
  title: string;
  desc: string;
  diagram: string;
}

const SOCD_OPTIONS: SocdOption[] = [
  {
    mode: SocdMode.Neutral,
    title: 'Neutral Priority (A + D = 0)',
    desc: 'Simultaneous opposing presses cancel out completely. Standard tournament clean input.',
    diagram: 'Press A + Press D ➔ Output: None',
  },
  {
    mode: SocdMode.LastInput,
    title: 'Last-Input Priority (Snap Tap / Rappy Snappy)',
    desc: 'The most recently pressed opposing key overrides the earlier held key.',
    diagram: 'Hold A + Tap D ➔ Output: D overrides A',
  },
  {
    mode: SocdMode.FirstInput,
    title: 'First-Input Priority',
    desc: 'The initial key held keeps priority until released, ignoring the secondary opposing press.',
    diagram: 'Hold A + Press D ➔ Output: A stays active',
  },
  {
    mode: SocdMode.Disabled,
    title: 'Disabled (Raw Hardware)',
    desc: 'Both keys sent simultaneously to OS. Game engine decides resolution.',
    diagram: 'Hold A + Hold D ➔ Both sent to OS',
  },
];

export const SocdPage: React.FC = () => {
  const socdConfig = useAppStore((s) => s.socdConfig);
  const updateSocd = useAppStore((s) => s.updateSocd);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ArrowLeftRight className="w-6 h-6 text-[#0096ff]" />
              SOCD Resolution (Simultaneous Opposing Cardinal Directions)
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" />
              Firmware Execution Unverified
            </span>
          </div>
          <p className="text-sm text-[#8888a0] mt-1">
            Resolve opposing directional inputs (A+D horizontal strafe, W+S vertical axis).
          </p>
        </div>

        <button
          onClick={() =>
            updateSocd({
              horizontal: SocdMode.Neutral,
              vertical: SocdMode.Neutral,
            })
          }
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-[#333355] text-[#8888a0] hover:text-white hover:bg-[#252540] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Neutral
        </button>
      </div>

      {/* Tournament Warning Banner */}
      <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-red-300">
            Valve / Premier Tournament Compliance Notice
          </p>
          <p className="text-red-300/80 leading-relaxed">
            Automated SOCD (e.g. Snap Tap / Last-Input priority) is explicitly restricted in Counter-Strike 2 official matchmaking and major esports circuits. Use <strong>Neutral Priority</strong> for tournament-compliant play.
          </p>
        </div>
      </div>

      {/* Horizontal Axis (A / D) */}
      <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0]">
            Horizontal Strafe Axis (A ⟷ D)
          </h2>
          <span className="text-xs font-mono text-[#0096ff] font-semibold">
            Active: {socdConfig.horizontal.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SOCD_OPTIONS.map((opt) => {
            const isSelected = socdConfig.horizontal === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => updateSocd({ horizontal: opt.mode })}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-[#0096ff] bg-[#0096ff]/10 text-white'
                    : 'border-[#2b2b45] bg-[#1d1d30] text-[#a0a0b8] hover:border-[#3d3d60]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">
                    {opt.title}
                  </span>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-[#0096ff]" />
                  )}
                </div>
                <p className="text-[11px] text-[#70708c] mb-2">{opt.desc}</p>
                <div className="p-1.5 rounded bg-[#141424] font-mono text-[10px] text-[#0096ff]">
                  {opt.diagram}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vertical Axis (W / S) */}
      <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0]">
            Vertical Axis (W ⟷ S)
          </h2>
          <span className="text-xs font-mono text-[#0096ff] font-semibold">
            Active: {socdConfig.vertical.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SOCD_OPTIONS.map((opt) => {
            const isSelected = socdConfig.vertical === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => updateSocd({ vertical: opt.mode })}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-[#0096ff] bg-[#0096ff]/10 text-white'
                    : 'border-[#2b2b45] bg-[#1d1d30] text-[#a0a0b8] hover:border-[#3d3d60]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">
                    {opt.title}
                  </span>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-[#0096ff]" />
                  )}
                </div>
                <p className="text-[11px] text-[#70708c] mb-2">{opt.desc}</p>
                <div className="p-1.5 rounded bg-[#141424] font-mono text-[10px] text-[#0096ff]">
                  {opt.diagram}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
