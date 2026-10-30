/**
 * Top header bar for APEX CONTROL.
 *
 * Displays the current page title, device connection status indicator,
 * and a toggle for switching between mock and real hardware modes.
 */

import React from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { useAppStore, type AppPage } from '../../stores/app-store';
import { ConnectionState } from '../../types';

// ─── Page title mapping ─────────────────────────────────────────────────────

const PAGE_TITLES: Record<AppPage, string> = {
  dashboard:       'Dashboard',
  lighting:        'Lighting Studio',
  actuation:       'Actuation',
  'rapid-trigger': 'Rapid Trigger',
  socd:            'SOCD',
  'key-mapping':   'Key Mapping',
  profiles:        'Profiles',
  settings:        'Settings',
};

// ─── Connection status helpers ──────────────────────────────────────────────

interface StatusMeta {
  label: string;
  color: string;
}

function getStatusMeta(state: ConnectionState, isMock: boolean): StatusMeta {
  switch (state) {
    case ConnectionState.Connected:
      return {
        label: isMock ? 'Mock Connected' : 'Connected',
        color: '#00c853',
      };
    case ConnectionState.Connecting:
    case ConnectionState.Scanning:
      return { label: 'Connecting…', color: '#ffab00' };
    case ConnectionState.Error:
      return { label: 'Error', color: '#ff3d3d' };
    case ConnectionState.Disconnected:
    default:
      return { label: 'Disconnected', color: '#8888a0' };
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export const Header: React.FC = () => {
  const activePage = useAppStore((s) => s.activePage);
  const connection = useAppStore((s) => s.connection);
  const useMock = useAppStore((s) => s.useMock);
  const toggleMockMode = useAppStore((s) => s.toggleMockMode);

  const { label: statusLabel, color: statusColor } = getStatusMeta(
    connection.state,
    connection.isMock,
  );

  return (
    <header
      className="flex items-center justify-between h-14 px-6 shrink-0 border-b"
      style={{
        backgroundColor: '#16162a',
        borderColor: '#333355',
      }}
    >
      {/* ── Page title ──────────────────────────────────────────────── */}
      <h2
        className="text-base font-semibold tracking-wide"
        style={{ color: '#e4e4ef' }}
      >
        {PAGE_TITLES[activePage]}
      </h2>

      {/* ── Right section ───────────────────────────────────────────── */}
      <div className="flex items-center gap-5">
        {/* Connection status */}
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span
            className="text-xs font-medium font-mono"
            style={{ color: statusColor }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Divider */}
        <div
          className="w-px h-5"
          style={{ backgroundColor: '#333355' }}
        />

        {/* Mock mode toggle */}
        <button
          onClick={toggleMockMode}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150"
          style={{
            backgroundColor: useMock ? 'rgba(0, 150, 255, 0.12)' : '#252540',
            color: useMock ? '#0096ff' : '#8888a0',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = useMock
              ? 'rgba(0, 150, 255, 0.18)'
              : '#2d2d4a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = useMock
              ? 'rgba(0, 150, 255, 0.12)'
              : '#252540';
          }}
          title={useMock ? 'Switch to hardware mode' : 'Switch to mock mode'}
        >
          {useMock ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          <span>{useMock ? 'Mock Mode' : 'Hardware'}</span>
        </button>
      </div>
    </header>
  );
};
