import React, { useState } from 'react';
import {
  Keyboard,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import { KeyboardVisualizer } from '../keyboard';

export const KeyMappingPage: React.FC = () => {
  const selectedKeys = useAppStore((s) => s.selectedKeys);
  const setSelectedKeys = useAppStore((s) => s.setSelectedKeys);
  const [activeLayer, setActiveLayer] = useState<'base' | 'fn'>('base');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Keyboard className="w-6 h-6 text-[#f28b50]" />
              Key Remapping & Layers
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" />
              EEPROM Protocol Unverified
            </span>
          </div>
          <p className="text-sm text-[#999fac] mt-1">
            Remap physical keys, set up FN layer combos, and assign multimedia functions.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#1c1e22] p-1 rounded-lg border border-[#393d46]">
          <button
            onClick={() => setActiveLayer('base')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeLayer === 'base'
                ? 'bg-[#f28b50] text-white shadow-sm'
                : 'text-[#999fac] hover:text-white'
            }`}
          >
            Base Layer (Default)
          </button>
          <button
            onClick={() => setActiveLayer('fn')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeLayer === 'fn'
                ? 'bg-[#f28b50] text-white shadow-sm'
                : 'text-[#999fac] hover:text-white'
            }`}
          >
            FN Layer
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#393d46] bg-[#1c1e22] p-4 shadow-lg">
        <KeyboardVisualizer
          selectedKeys={selectedKeys}
          onKeySelect={setSelectedKeys}
        />
      </div>

      <div className="rounded-xl border border-[#393d46] bg-[#1c1e22] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#999fac] mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#f28b50]" />
          Key Assignment Matrix
        </h2>
        {selectedKeys.length === 0 ? (
          <p className="text-xs text-[#999fac]">
            Select a key on the visual layout above to rebind its function or assign advanced macros.
          </p>
        ) : (
          <div className="text-xs text-[#c0c0d8] space-y-3">
            <p>
              Selected key: <strong className="text-white font-mono text-sm">{selectedKeys[0].toUpperCase()}</strong> on{' '}
              <span className="text-[#f28b50] font-semibold">{activeLayer.toUpperCase()} Layer</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <button className="p-2.5 rounded bg-[#202035] hover:bg-[#282845] border border-[#343455] text-left">
                <span className="block font-bold text-white">Standard Keycode</span>
                <span className="text-[10px] text-[#70708c]">A-Z, 0-9, Modifiers</span>
              </button>
              <button className="p-2.5 rounded bg-[#202035] hover:bg-[#282845] border border-[#343455] text-left">
                <span className="block font-bold text-white">Media Function</span>
                <span className="text-[10px] text-[#70708c]">Play, Pause, Mute</span>
              </button>
              <button className="p-2.5 rounded bg-[#202035] hover:bg-[#282845] border border-[#343455] text-left">
                <span className="block font-bold text-white">DKS / Mod-Tap</span>
                <span className="text-[10px] text-[#70708c]">Dual Action by Depth</span>
              </button>
              <button className="p-2.5 rounded bg-[#202035] hover:bg-[#282845] border border-[#343455] text-left">
                <span className="block font-bold text-white">Disable Key</span>
                <span className="text-[10px] text-[#70708c]">Send No Event</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
