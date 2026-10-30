/**
 * Sidebar navigation for APEX CONTROL.
 *
 * Displays the app logo and a vertical list of navigation items.
 * The active page is highlighted with an electric blue accent.
 * Uses the app store for navigation state.
 */

import React from 'react';
import {
  LayoutDashboard,
  Palette,
  Monitor,
  Gauge,
  Zap,
  ArrowLeftRight,
  Keyboard,
  FolderOpen,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useAppStore, type AppPage } from '../../stores/app-store';

// ─── Navigation Item Definitions ────────────────────────────────────────────

interface NavItem {
  page: AppPage;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard',     label: 'Dashboard',       icon: LayoutDashboard },
  { page: 'display', label: 'Display Studio', icon: Monitor },
  { page: 'lighting',      label: 'Lighting Studio',  icon: Palette },
  { page: 'actuation',     label: 'Actuation',       icon: Gauge },
  { page: 'rapid-trigger', label: 'Rapid Trigger',    icon: Zap },
  { page: 'socd',          label: 'SOCD',            icon: ArrowLeftRight },
  { page: 'key-mapping',   label: 'Key Mapping',     icon: Keyboard },
  { page: 'profiles',      label: 'Profiles',        icon: FolderOpen },
  { page: 'settings',      label: 'Settings',        icon: Settings },
];

// ─── Component ──────────────────────────────────────────────────────────────

export const Sidebar: React.FC = () => {
  const activePage = useAppStore((s) => s.activePage);
  const setActivePage = useAppStore((s) => s.setActivePage);

  return (
    <aside
      className="flex flex-col w-60 h-screen shrink-0 border-r"
      style={{
        backgroundColor: '#16162a',
        borderColor: '#333355',
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-5 py-5 mb-2">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-md text-xs font-bold tracking-wider"
          style={{ backgroundColor: '#0096ff', color: '#fff' }}
        >
          AC
        </div>
        <div>
          <h1
            className="text-sm font-bold tracking-widest uppercase"
            style={{ color: '#e4e4ef' }}
          >
            APEX
          </h1>
          <p
            className="text-[10px] font-medium tracking-wider uppercase -mt-0.5"
            style={{ color: '#0096ff' }}
          >
            CONTROL
          </p>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 overflow-y-auto">
        {NAV_ITEMS.map(({ page, label, icon: Icon }) => {
          const isActive = activePage === page;

          return (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={
                'group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium ' +
                'transition-colors duration-150 w-full text-left'
              }
              style={{
                backgroundColor: isActive ? 'rgba(0, 150, 255, 0.12)' : 'transparent',
                color: isActive ? '#0096ff' : '#8888a0',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#252540';
                  e.currentTarget.style.color = '#e4e4ef';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#8888a0';
                }
              }}
            >
              {/* Active indicator bar */}
              <div
                className="w-0.5 h-5 rounded-full shrink-0 transition-colors duration-150"
                style={{
                  backgroundColor: isActive ? '#0096ff' : 'transparent',
                }}
              />
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div
        className="px-5 py-4 text-[11px] border-t"
        style={{ color: '#8888a0', borderColor: '#333355' }}
      >
        v0.1.0 — dev build
      </div>
    </aside>
  );
};
