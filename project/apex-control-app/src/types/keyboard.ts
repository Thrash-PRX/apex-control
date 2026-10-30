/**
 * Actuation, Rapid Trigger, and SOCD type definitions.
 *
 * Hardware specs from research (unverified until confirmed on physical device):
 * - Switches: Haimu Hall Effect Magnetic (Linear)
 * - Actuation range: 0.1mm – 3.6mm (some sources say 3.99mm)
 * - Rapid Trigger: Supported
 * - Key count: 84 (75% layout)
 */

// ─── Actuation ──────────────────────────────────────────────────────────────

/** Per-key actuation distance configuration. */
export interface ActuationConfig {
  /** Key identifier. */
  keyId: string;
  /** Actuation point in mm. */
  actuationPoint: number;
  /** Reset point in mm (the point where the key deactivates on upstroke). */
  resetPoint: number;
}

/** Global actuation settings. */
export interface GlobalActuationConfig {
  /** Global actuation distance in mm (applied to all keys unless overridden). */
  actuationPoint: number;
  /** Global reset point in mm. */
  resetPoint: number;
  /** Per-key overrides. */
  perKeyOverrides: ActuationConfig[];
}

/**
 * Hardware actuation limits (from product specs — must be verified).
 * Sources suggest 0.1mm – 3.6mm (some say up to 3.99mm).
 */
export const ACTUATION_LIMITS = {
  min: 0.1,
  max: 3.6,
  step: 0.1,
  defaultActuation: 2.0,
  defaultReset: 2.0,
  /** Whether these limits have been hardware-verified. */
  verified: false,
} as const;

// ─── Rapid Trigger ──────────────────────────────────────────────────────────

export interface RapidTriggerConfig {
  enabled: boolean;
  /** Sensitivity for press detection (how far key must travel down to register). */
  pressSensitivity: number;
  /** Sensitivity for release detection (how far key must travel up to deregister). */
  releaseSensitivity: number;
}

export interface PerKeyRapidTrigger {
  keyId: string;
  config: RapidTriggerConfig;
}

export interface GlobalRapidTriggerConfig {
  enabled: boolean;
  pressSensitivity: number;
  releaseSensitivity: number;
  perKeyOverrides: PerKeyRapidTrigger[];
}

export const RAPID_TRIGGER_LIMITS = {
  minSensitivity: 0.1,
  maxSensitivity: 3.6,
  step: 0.1,
  defaultPress: 0.3,
  defaultRelease: 0.3,
  verified: false,
} as const;

// ─── SOCD (Simultaneous Opposing Cardinal Directions) ───────────────────────

export const SocdMode = {
  /** Both inputs cancel — no output. */
  Neutral: 'neutral',
  /** The last key pressed takes priority. */
  LastInput: 'last_input',
  /** The first key pressed takes priority. */
  FirstInput: 'first_input',
  /** Both keys are active simultaneously (no SOCD processing). */
  Disabled: 'disabled',
} as const;

export type SocdMode = (typeof SocdMode)[keyof typeof SocdMode];

export interface SocdConfig {
  /** How horizontal SOCD is handled (A+D). */
  horizontal: SocdMode;
  /** How vertical SOCD is handled (W+S). */
  vertical: SocdMode;
}

/**
 * Whether SOCD is processed in firmware or on the host.
 * This MUST be determined by reverse engineering — do not guess.
 */
export type SocdProcessingLocation = 'firmware' | 'host' | 'unknown';

// ─── Profiles ───────────────────────────────────────────────────────────────

export interface KeyboardProfile {
  id: string;
  name: string;
  /** Whether this profile is currently active on the device. */
  isActive: boolean;
  /** Whether this profile is stored on-device or host-only. */
  storage: 'device' | 'host' | 'unknown';
  actuation: GlobalActuationConfig;
  rapidTrigger: GlobalRapidTriggerConfig;
  socd: SocdConfig;
}
