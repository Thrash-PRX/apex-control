/**
 * Core device type definitions for the Ant Esports APEX 200S keyboard.
 *
 * VID/PID values are UNVERIFIED and must be confirmed via actual USB enumeration.
 * Do not treat these as ground truth until hardware verification is completed.
 */

// ─── Device Identity ────────────────────────────────────────────────────────

/** Known (but unverified) USB identifiers for the APEX 200S. */
export const APEX_200S_VID = 0x3402;
export const APEX_200S_PID = 0x0300;

export interface DeviceIdentity {
  vendorId: number;
  productId: number;
  manufacturer: string;
  product: string;
  serialNumber?: string;
  firmwareVersion?: string;
}

// ─── Connection State ───────────────────────────────────────────────────────

export const ConnectionState = {
  Disconnected: 'disconnected',
  Scanning: 'scanning',
  Connecting: 'connecting',
  Connected: 'connected',
  Error: 'error',
} as const;

export type ConnectionState = (typeof ConnectionState)[keyof typeof ConnectionState];

export interface ConnectionInfo {
  state: ConnectionState;
  device: DeviceIdentity | null;
  /** Whether this is a mock device (for development/testing). */
  isMock: boolean;
  /** Timestamp of last successful communication. */
  lastSeen: number | null;
  /** Human-readable error message when state is Error. */
  error: string | null;
}

// ─── HID Reports ────────────────────────────────────────────────────────────

export const ReportType = {
  Input: 'input',
  Output: 'output',
  Feature: 'feature',
} as const;

export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export interface HidReport {
  reportId: number;
  reportType: ReportType;
  data: Uint8Array;
}

// ─── Device Capabilities (discovered at runtime) ────────────────────────────

export interface DeviceCapabilities {
  /** Total number of keys on the keyboard. */
  keyCount: number | null;
  /** Whether per-key RGB is supported. */
  perKeyRgb: boolean | null;
  /** Whether onboard effect engine exists. */
  onboardEffects: boolean | null;
  /** Whether host-streamed RGB is supported. */
  hostStreamedRgb: boolean | null;
  /** Whether per-key actuation distance is supported. */
  perKeyActuation: boolean | null;
  /** Whether Rapid Trigger is supported. */
  rapidTrigger: boolean | null;
  /** Whether SOCD processing is firmware-level. */
  firmwareSocd: boolean | null;
  /** Whether profiles can be stored on-device. */
  onboardProfiles: boolean | null;
  /** Number of profiles supported (null = unknown). */
  profileCount: number | null;
  /** Actuation distance range in mm [min, max] (null = unknown). */
  actuationRange: [number, number] | null;
  /** Rapid Trigger sensitivity range in mm [min, max] (null = unknown). */
  rapidTriggerRange: [number, number] | null;
}

/** Default capabilities — all unknown until verified. */
export function createUnknownCapabilities(): DeviceCapabilities {
  return {
    keyCount: null,
    perKeyRgb: null,
    onboardEffects: null,
    hostStreamedRgb: null,
    perKeyActuation: null,
    rapidTrigger: null,
    firmwareSocd: null,
    onboardProfiles: null,
    profileCount: null,
    actuationRange: null,
    rapidTriggerRange: null,
  };
}
