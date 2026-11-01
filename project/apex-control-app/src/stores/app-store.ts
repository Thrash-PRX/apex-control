import { nativeRgbMode } from '../lib/native-rgb-mode';
import {pageFromHash,type AppPage} from '../lib/app-navigation';
export type {AppPage} from '../lib/app-navigation';
import type { DeviceSnapshot } from '../lib/read-device-state';
import type { TriggerTable } from '../lib/device-actuation';
/**
 * Main application store using Zustand.
 *
 * Manages device connection state, active page, and settings.
 * Mock vs hardware mode is tracked and clearly indicated.
 */

import { create } from 'zustand';
import { DeviceManager } from '../lib/hid/device-manager';
import { MockHidTransport } from '../lib/hid/mock-transport';
import { WebHidTransport } from '../lib/hid/webhid-transport';
import type { HidDeviceInfo } from '../lib/hid/transport';
import {
  ConnectionState,
  type ConnectionInfo,
  type DeviceCapabilities,
  createUnknownCapabilities,
  type LightingConfig,
  LightingEffect,
  type GlobalActuationConfig,
  type GlobalRapidTriggerConfig,
  type SocdConfig,
  SocdMode,
  ACTUATION_LIMITS,
  RAPID_TRIGGER_LIMITS,
} from '../types';

// ─── Navigation ─────────────────────────────────────────────────────────────


// ─── Store State ────────────────────────────────────────────────────────────

interface AppState {
  // Navigation
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;

  // Device connection
  connection: ConnectionInfo;
  capabilities: DeviceCapabilities;
  deviceSnapshot: DeviceSnapshot | null;
  discoveredDevices: HidDeviceInfo[];

  // Transport mode
  useMock: boolean;
  toggleMockMode: () => void;

  // Device actions
  scanDevices: () => Promise<void>;
  pairDevice: () => Promise<HidDeviceInfo | null>;
  connectDevice: (path: string) => Promise<void>;
  disconnectDevice: () => Promise<void>;

  // Lighting
  playRgb: (signal: AbortSignal, restoreOnly?:boolean, fast?:boolean,loop?:boolean) => Promise<void>;
  applyRgb: () => Promise<void>;
  readDeviceState: () => Promise<DeviceSnapshot>;
  readActuation: () => Promise<TriggerTable>;
  applyActuation: (raw: number, keys: number[], restoreOnly?: boolean) => Promise<void>;
  lightingConfig: LightingConfig;
  updateLighting: (config: Partial<LightingConfig>) => void;
  selectedKeys: string[];
  setSelectedKeys: (keys: string[]) => void;

  // Actuation
  actuationConfig: GlobalActuationConfig;
  updateActuation: (config: Partial<GlobalActuationConfig>) => void;

  // Rapid Trigger
  rapidTriggerConfig: GlobalRapidTriggerConfig;
  updateRapidTrigger: (config: Partial<GlobalRapidTriggerConfig>) => void;

  // SOCD
  socdConfig: SocdConfig;
  updateSocd: (config: Partial<SocdConfig>) => void;

  // Logs
  logs: LogEntry[];
  addLog: (level: LogLevel, message: string) => void;
  clearLogs: () => void;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: number;
  timestamp: number;
  level: LogLevel;
  message: string;
}

// ─── Device Manager Management ──────────────────────────────────────────────

let deviceManager: DeviceManager | null = null;
let logCounter = 0;

function createDeviceManager(useMock: boolean): DeviceManager {
  const transport = useMock ? new MockHidTransport() : new WebHidTransport();
  return new DeviceManager(transport);
}

function getOrCreateDeviceManager(useMock: boolean): DeviceManager {
  if (!deviceManager) {
    deviceManager = createDeviceManager(useMock);
  }
  return deviceManager;
}

function replaceDeviceManager(useMock: boolean): DeviceManager {
  if (deviceManager) {
    deviceManager.dispose();
  }
  deviceManager = createDeviceManager(useMock);
  return deviceManager;
}

// ─── Default configs ────────────────────────────────────────────────────────

const defaultLighting: LightingConfig = {
  effect: LightingEffect.Static,
  primaryColor: { r: 0, g: 150, b: 255 }, // Electric blue accent
  brightness: 100,
  backgroundGlow: 22,
  speed: 50,
};

const defaultActuation: GlobalActuationConfig = {
  actuationPoint: ACTUATION_LIMITS.defaultActuation,
  resetPoint: ACTUATION_LIMITS.defaultReset,
  perKeyOverrides: [],
};

const defaultRapidTrigger: GlobalRapidTriggerConfig = {
  enabled: false,
  pressSensitivity: RAPID_TRIGGER_LIMITS.defaultPress,
  releaseSensitivity: RAPID_TRIGGER_LIMITS.defaultRelease,
  perKeyOverrides: [],
};

const defaultSocd: SocdConfig = {
  horizontal: SocdMode.Neutral,
  vertical: SocdMode.Neutral,
};

// ─── Store ──────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  activePage: typeof window==='undefined'?'dashboard':pageFromHash(window.location?.hash??''),
  setActivePage: (page) => {
    if(get().activePage===page)return;
    if(typeof window!=='undefined'&&window.history?.pushState&&window.location?.hash!==`#/${page}`)window.history.pushState(null,'',`#/${page}`);
    set({activePage:page});
  },

  // Device
  connection: {
    state: ConnectionState.Disconnected,
    device: null,
    isMock: true,
    lastSeen: null,
    error: null,
  },
  capabilities: createUnknownCapabilities(),
  deviceSnapshot: null,
  discoveredDevices: [],

  // Transport
  useMock: false,
  toggleMockMode: () => {
    const { useMock, connection } = get();
    if (connection.state === ConnectionState.Connected) {
      get().disconnectDevice();
    }

    const newUseMock = !useMock;

    // Recreate device manager with new transport
    replaceDeviceManager(newUseMock);

    set({ useMock: newUseMock, deviceSnapshot: null });
    get().addLog('info', `Switched to ${newUseMock ? 'Mock' : 'WebHID'} transport`);
  },

  // Device actions
  scanDevices: async () => {
    const { useMock } = get();
    const dm = getOrCreateDeviceManager(useMock);

    // Don't scan if already scanning
    if (get().connection.state === ConnectionState.Scanning) {
      return;
    }

    get().addLog('info', 'Scanning for devices...');

    try {
      const devices = await dm.scan();
      set({ discoveredDevices: devices });
      get().addLog('info', `Found ${devices.length} device(s)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      get().addLog('error', `Scan failed: ${msg}`);
    }
  },

  pairDevice: async () => {
    if (get().useMock) {
      get().addLog('warn', 'Pairing requires hardware mode');
      return null;
    }

    const dm = getOrCreateDeviceManager(false);
    get().addLog('info', 'Opening browser HID permission picker...');
    try {
      // This must invoke navigator.hid.requestDevice() before the next await
      // on the click stack, or the browser can reject the user gesture.
      const picked = await dm.requestDevice();
      if (!picked) {
        get().addLog('info', 'HID pairing cancelled');
        return null;
      }
      set((state) => ({
        discoveredDevices: [
          ...state.discoveredDevices.filter((device) => device.path !== picked.path),
          picked,
        ],
      }));
      get().addLog('info', `HID access granted to ${picked.product} (${picked.vendorId.toString(16)}:${picked.productId.toString(16)})`);
      return picked;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      get().addLog('error', `HID pairing failed: ${msg}`);
      return null;
    }
  },

  connectDevice: async (path) => {
    const { useMock } = get();
    const dm = getOrCreateDeviceManager(useMock);

    // Validate path
    if (!path || path.trim() === '') {
      get().addLog('error', 'Invalid device path: empty string');
      return;
    }

    // Don't connect if already connecting
    if (get().connection.state === ConnectionState.Connecting) {
      get().addLog('warn', 'Connection already in progress');
      return;
    }

    set({
      connection: {
        ...get().connection,
        state: ConnectionState.Connecting,
        error: null,
      },
    });
    get().addLog('info', `Connecting to ${path}...`);

    try {
      await dm.connect(path);
      const conn = dm.connection;
      set({ connection: conn, deviceSnapshot: null });
      get().addLog('info', `Connected via ${dm.transportName}${dm.isMock ? ' (MOCK)' : ''}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set({
        connection: {
          ...get().connection,
          state: ConnectionState.Error,
          error: msg,
        },
      });
      get().addLog('error', `Connection failed: ${msg}`);
    }
  },

  disconnectDevice: async () => {
    const dm = deviceManager;
    if (!dm) return;

    try {
      await dm.disconnect();
      set({ connection: dm.connection, deviceSnapshot: null });
      get().addLog('info', 'Disconnected');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      get().addLog('error', `Disconnect error: ${msg}`);
    }
  },

  // Lighting
  readDeviceState: async () => {
    if (get().useMock) throw new Error('Turn Demo off and connect your APEX first');
    const connectedDevice=get().connection.device;
    set({deviceSnapshot:null});
    const snapshot=await getOrCreateDeviceManager(false).readDeviceState();
    if(get().useMock||get().connection.state!==ConnectionState.Connected||get().connection.device!==connectedDevice)throw Error('Connection changed during readback');
    set({deviceSnapshot:snapshot});
    return snapshot;
  },
  readActuation: async () => {
    if (get().useMock) throw Error('Connect real APEX first');
    return getOrCreateDeviceManager(false).readActuation();
  },
  applyActuation: async (raw, keys, restoreOnly = false) => {
    if (get().useMock) throw Error('Connect real APEX first');
    return getOrCreateDeviceManager(false).applyActuation(raw, keys, restoreOnly);
  },
  playRgb: async (signal,restoreOnly=false,fast=false,loop=false) => {if(get().useMock)throw new Error('Pair real APEX first');await getOrCreateDeviceManager(false).playRgb(get().lightingConfig,signal,restoreOnly,fast,loop);},
  applyRgb: async () => {
    const s=get(),c=s.lightingConfig;if(s.useMock)throw new Error('Switch to hardware mode and connect APEX first');
    const mode=nativeRgbMode(c);
    if(mode===null)throw new Error('This effect is a browser preview; no verified APEX streaming protocol is available');
    await getOrCreateDeviceManager(false).applyRgb(mode,[c.primaryColor.r,c.primaryColor.g,c.primaryColor.b],c.brightness,c.speed);
  },
  lightingConfig: defaultLighting,
  updateLighting: (config) =>
    set((s) => ({
      lightingConfig: { ...s.lightingConfig, ...config },
    })),
  selectedKeys: [],
  setSelectedKeys: (keys) => set({ selectedKeys: keys }),

  // Actuation
  actuationConfig: defaultActuation,
  updateActuation: (config) =>
    set((s) => ({
      actuationConfig: { ...s.actuationConfig, ...config },
    })),

  // Rapid Trigger
  rapidTriggerConfig: defaultRapidTrigger,
  updateRapidTrigger: (config) =>
    set((s) => ({
      rapidTriggerConfig: { ...s.rapidTriggerConfig, ...config },
    })),

  // SOCD
  socdConfig: defaultSocd,
  updateSocd: (config) =>
    set((s) => ({
      socdConfig: { ...s.socdConfig, ...config },
    })),

  // Logs
  logs: [],
  addLog: (level, message) => {
    const entry: LogEntry = {
      id: ++logCounter,
      timestamp: Date.now(),
      level,
      message,
    };
    set((s) => ({
      logs: [...s.logs.slice(-499), entry], // Keep last 500 entries
    }));
  },
  clearLogs: () => set({ logs: [] }),
}));
