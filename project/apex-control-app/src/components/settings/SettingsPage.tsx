import React from 'react';
import {
  Settings,
  Terminal,
  Activity,
  Cpu,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '../../stores/app-store';

export const SettingsPage: React.FC = () => {
  const useMock = useAppStore((s) => s.useMock);
  const toggleMockMode = useAppStore((s) => s.toggleMockMode);
  const logs = useAppStore((s) => s.logs);
  const clearLogs = useAppStore((s) => s.clearLogs);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#0096ff]" />
          Diagnostics & Device Settings
        </h1>
        <p className="text-sm text-[#8888a0] mt-1">
          Low-level USB HID logs, transport configuration, and hardware identification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Information */}
        <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#0096ff]" />
            Hardware & USB Identity
          </h2>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 rounded bg-[#1e1e32]">
              <span className="text-[#8888a0]">Product Model:</span>
              <span className="text-white font-bold">Ant Esports APEX 200</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-[#1e1e32]">
              <span className="text-[#8888a0]">USB Vendor ID (VID):</span>
              <span className="text-[#0096ff]">0x3402 (Sinowealth OEM - Unconfirmed)</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-[#1e1e32]">
              <span className="text-[#8888a0]">USB Product ID (PID):</span>
              <span className="text-[#0096ff]">0x0300 (Unconfirmed)</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-[#1e1e32]">
              <span className="text-[#8888a0]">Layout Form Factor:</span>
              <span className="text-white">APEX 200 · 82 keys + volume knob</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-[#1e1e32]">
              <span className="text-[#8888a0]">Switches:</span>
              <span className="text-white">Haimu Linear Hall-Effect</span>
            </div>
          </div>
        </div>

        {/* Transport & Mock Toggle */}
        <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0096ff]" />
            Communication Layer
          </h2>

          <div className="p-4 rounded-lg bg-[#1d1d32] border border-[#323254] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Mock Transport Mode</p>
                <p className="text-[11px] text-[#8888a0]">
                  {useMock
                    ? 'Simulating hardware via internal loopback'
                    : 'Direct USB access via browser WebHID'}
                </p>
              </div>
              <button
                onClick={toggleMockMode}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                  useMock
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-[#0096ff] text-white hover:bg-[#0080db]'
                }`}
              >
                {useMock ? 'Mock: Active' : 'WebHID: Active'}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[#30304c] bg-[#19192c] text-xs text-[#8888a0] space-y-1.5">
            <div className="flex items-center gap-1.5 text-white font-medium">
              <ShieldCheck className="w-4 h-4 text-[#00c853]" />
              Safe Reverse-Engineering Protocol
            </div>
            <p className="text-[11px] leading-relaxed">
              No arbitrary firmware flash commands or undocumented write loops will be executed. All payloads must adhere to documented report structures.
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Diagnostics Log */}
      <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#0096ff]" />
            HID Event & Diagnostic Console ({logs.length} events)
          </h2>
          <button
            onClick={clearLogs}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#8888a0] hover:text-white hover:bg-[#252540] rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Log
          </button>
        </div>

        <div className="h-64 rounded-lg bg-[#0e0e1a] border border-[#252540] p-3 font-mono text-[11px] overflow-y-auto space-y-1 select-text">
          {logs.length === 0 ? (
            <div className="text-[#555577] italic py-8 text-center">
              No HID communications logged yet. Connect a device or run a scan to inspect traffic.
            </div>
          ) : (
            logs.map((log) => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString();
              const levelColor =
                log.level === 'error'
                  ? 'text-red-400'
                  : log.level === 'warn'
                  ? 'text-amber-400'
                  : 'text-[#8888a0]';

              return (
                <div key={log.id} className="flex gap-2">
                  <span className="text-[#555577] shrink-0">[{timeStr}]</span>
                  <span className={`uppercase font-bold shrink-0 ${levelColor}`}>
                    [{log.level}]
                  </span>
                  <span className="text-neutral-200">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
