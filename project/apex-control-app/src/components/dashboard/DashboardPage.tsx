/**
 * Dashboard page — primary landing view for APEX CONTROL.
 *
 * Shows device connection state, mock mode indicator, quick stats,
 * and navigation shortcuts to each configuration section.
 */

import React from 'react';
import {
  Plug,
  Unplug,
  Wifi,
  WifiOff,
  Cpu,
  Clock,
  User,
  Palette,
  Gauge,
  Zap,
  Gamepad2,
  Keyboard,
  Settings,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import { useAppStore, type AppPage } from '../../stores/app-store';
import { ConnectionState } from '../../types';

// ─── Connection state display helpers ───────────────────────────────────────

const CONNECTION_BADGE: Record<
  ConnectionState,
  { label: string; dotColor: string; textColor: string }
> = {
  [ConnectionState.Disconnected]: {
    label: 'Disconnected',
    dotColor: 'bg-[#8888a0]',
    textColor: 'text-[#8888a0]',
  },
  [ConnectionState.Scanning]: {
    label: 'Scanning…',
    dotColor: 'bg-[#ffab00]',
    textColor: 'text-[#ffab00]',
  },
  [ConnectionState.Connecting]: {
    label: 'Connecting…',
    dotColor: 'bg-[#ffab00]',
    textColor: 'text-[#ffab00]',
  },
  [ConnectionState.Connected]: {
    label: 'Connected',
    dotColor: 'bg-[#00c853]',
    textColor: 'text-[#00c853]',
  },
  [ConnectionState.Error]: {
    label: 'Error',
    dotColor: 'bg-red-500',
    textColor: 'text-red-400',
  },
};

// ─── Quick‐nav definitions ──────────────────────────────────────────────────

interface NavShortcut {
  page: AppPage;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const NAV_SHORTCUTS: NavShortcut[] = [
  {
    page: 'lighting',
    label: 'Lighting',
    description: 'RGB effects & per-key colors',
    icon: <Palette size={20} />,
  },
  {
    page: 'actuation',
    label: 'Actuation',
    description: 'Per-key actuation distances',
    icon: <Gauge size={20} />,
  },
  {
    page: 'rapid-trigger',
    label: 'Rapid Trigger',
    description: 'Dynamic actuation sensitivity',
    icon: <Zap size={20} />,
  },
  {
    page: 'socd',
    label: 'SOCD',
    description: 'Simultaneous key handling',
    icon: <Gamepad2 size={20} />,
  },
  {
    page: 'key-mapping',
    label: 'Key Mapping',
    description: 'Remap keys & macros',
    icon: <Keyboard size={20} />,
  },
  {
    page: 'profiles',
    label: 'Profiles',
    description: 'Save & load configurations',
    icon: <User size={20} />,
  },
  {
    page: 'settings',
    label: 'Settings',
    description: 'App & device settings',
    icon: <Settings size={20} />,
  },
];

// ─── Stat card ──────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-[#252540] border border-[#333355] px-4 py-3">
      <div className="text-[#0096ff]">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-[#8888a0] uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-[#e4e4ef] truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Dashboard page ─────────────────────────────────────────────────────────

export function DashboardPage() {
  const connection = useAppStore((s) => s.connection);
  const useMock = useAppStore((s) => s.useMock);
  const scanDevices = useAppStore((s) => s.scanDevices);
  const pairDevice = useAppStore((s) => s.pairDevice);
  const connectDevice = useAppStore((s) => s.connectDevice);
  const disconnectDevice = useAppStore((s) => s.disconnectDevice);
  const setActivePage = useAppStore((s) => s.setActivePage);

  const { state, device, lastSeen, error } = connection;
  const badge = CONNECTION_BADGE[state];

  const isConnected = state === ConnectionState.Connected;
  const isBusy =
    state === ConnectionState.Scanning || state === ConnectionState.Connecting;

  // ── Connection actions ──────────────────────────────────────────────────

  async function handleConnect() {
    if (!useMock) {
      // Request permission directly within this user gesture. A scan alone
      // only sees devices previously authorized by the browser.
      const paired = await pairDevice();
      if (paired) await connectDevice(paired.path);
      return;
    }

    await scanDevices();
    // After scanning, grab the fresh list from the store
    const devices = useAppStore.getState().discoveredDevices;
    if (devices.length > 0) {
      await connectDevice(devices[0].path);
    }
  }

  // Keyboard accessibility for nav shortcuts
  function handleNavKeyDown(e: React.KeyboardEvent, page: AppPage) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActivePage(page);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  function formatTimestamp(ts: number | null): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function formatVidPid(vid?: number, pid?: number): string {
    if (vid == null || pid == null) return '—';
    const v = vid.toString(16).toUpperCase().padStart(4, '0');
    const p = pid.toString(16).toUpperCase().padStart(4, '0');
    return `${v}:${p}`;
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Mock‐mode banner */}
      {useMock && (
        <div className="flex items-center gap-3 rounded-lg border border-[#ffab00]/30 bg-[#ffab00]/10 px-4 py-3">
          <Info size={18} className="shrink-0 text-[#ffab00]" />
          <p className="text-sm text-[#ffab00]">
            <span className="font-semibold">Mock Mode</span> — No real device
            connected. All interactions are simulated.
          </p>
        </div>
      )}

      {/* ── Device connection section ─────────────────────────────────────── */}
      <section className="rounded-lg border border-[#333355] bg-[#252540]">
        <div className="flex items-center justify-between border-b border-[#333355] px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#e4e4ef]">
            Device Connection
          </h2>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${badge.dotColor} ${
                isBusy ? 'animate-pulse' : ''
              }`}
            />
            <span className={`text-xs font-medium ${badge.textColor}`}>
              {badge.label}
            </span>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Transport type */}
          <div className="flex items-center gap-2 text-xs text-[#8888a0]">
            <Cpu size={14} />
            <span>
              Transport:{' '}
              <span className="font-mono text-[#e4e4ef]">
                {useMock ? 'Mock' : 'WebHID'}
              </span>
            </span>
          </div>

          {/* Device identity (when connected) */}
          {isConnected && device && (
            <div className="rounded-md border border-[#333355] bg-[#1a1a2e] px-4 py-3 space-y-1">
              <div className="flex items-center gap-2 text-xs text-[#8888a0]">
                <CheckCircle2 size={14} className="text-[#00c853]" />
                <span className="text-[#e4e4ef] font-medium">
                  {device.manufacturer} — {device.product}
                </span>
              </div>
              <p className="text-xs text-[#8888a0] font-mono pl-[22px]">
                VID:PID {formatVidPid(device.vendorId, device.productId)}
                {device.serialNumber && ` · S/N ${device.serialNumber}`}
              </p>
            </div>
          )}

          {/* Error message */}
          {state === ConnectionState.Error && error && (
            <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3">
              <XCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isBusy}
                aria-busy={isBusy}
                aria-label={isBusy ? 'Connection in progress' : useMock ? 'Connect mock device' : 'Pair and connect keyboard'}
                className="inline-flex items-center gap-2 rounded-md bg-[#0096ff] px-4 py-2 text-sm font-medium text-white
                           hover:bg-[#0077cc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                           focus:outline-none focus:ring-2 focus:ring-[#0096ff] focus:ring-offset-2 focus:ring-offset-[#1a1a2e]"
              >
                {isBusy ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Plug size={16} aria-hidden="true" />
                )}
                {isBusy ? 'Working…' : useMock ? 'Connect Mock Device' : 'Pair & Connect Keyboard'}
              </button>
            ) : (
              <button
                onClick={disconnectDevice}
                aria-label="Disconnect from keyboard"
                className="inline-flex items-center gap-2 rounded-md border border-[#333355] bg-[#1a1a2e] px-4 py-2 text-sm font-medium text-[#e4e4ef]
                           hover:bg-[#2d2d4a] transition-colors
                           focus:outline-none focus:ring-2 focus:ring-[#0096ff] focus:ring-offset-2 focus:ring-offset-[#1a1a2e]"
              >
                <Unplug size={16} aria-hidden="true" />
                Disconnect
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Quick stats ──────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={
            isConnected ? (
              <Wifi size={18} />
            ) : (
              <WifiOff size={18} />
            )
          }
          label="Status"
          value={badge.label}
        />
        <StatCard
          icon={<Cpu size={18} />}
          label="Transport"
          value={useMock ? 'Mock' : 'WebHID'}
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Last Seen"
          value={formatTimestamp(lastSeen)}
        />
        <StatCard
          icon={<User size={18} />}
          label="Active Profile"
          value="Unknown"
        />
      </section>

      {/* ── Quick navigation ─────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#8888a0]">
          Quick Navigation
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {NAV_SHORTCUTS.map((nav) => (
            <button
              key={nav.page}
              onClick={() => setActivePage(nav.page)}
              onKeyDown={(e) => handleNavKeyDown(e, nav.page)}
              tabIndex={0}
              role="menuitem"
              aria-label={`Navigate to ${nav.label}: ${nav.description}`}
              className="group flex items-start gap-3 rounded-lg border border-[#333355] bg-[#252540] px-4 py-3
                         hover:border-[#0096ff]/50 hover:bg-[#2d2d4a] transition-colors text-left
                         focus:outline-none focus:ring-2 focus:ring-[#0096ff] focus:ring-offset-2 focus:ring-offset-[#1a1a2e]"
            >
              <div className="mt-0.5 text-[#8888a0] group-hover:text-[#0096ff] transition-colors" aria-hidden="true">
                {nav.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#e4e4ef]">{nav.label}</p>
                <p className="text-xs text-[#8888a0] leading-snug">
                  {nav.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
