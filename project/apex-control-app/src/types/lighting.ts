/**
 * RGB and lighting type definitions.
 *
 * These types model the target feature set. Actual hardware support
 * for each mode must be verified before marking as available.
 */

// ─── Color ──────────────────────────────────────────────────────────────────

export interface RgbColor {
  r: number; // 0–255
  g: number; // 0–255
  b: number; // 0–255
}

export interface HslColor {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

// ─── Lighting Effects ───────────────────────────────────────────────────────

export const LightingEffect = {
  Static: 'static',
  Breathing: 'breathing',
  Wave: 'wave',
  Rainbow: 'rainbow',
  ColorCycle: 'color_cycle',
  Reactive: 'reactive',
  Ripple: 'ripple',
  Gradient: 'gradient',
  Custom: 'custom',
  Off: 'off',
} as const;

export type LightingEffect = (typeof LightingEffect)[keyof typeof LightingEffect];

/** Verification status for each effect. */
export type EffectVerification = 'unverified' | 'confirmed' | 'unsupported';

export interface EffectInfo {
  effect: LightingEffect;
  label: string;
  description: string;
  verification: EffectVerification;
  /** Whether this effect supports per-key color. */
  supportsPerKey: boolean | null;
  /** Whether this effect supports speed parameter. */
  supportsSpeed: boolean | null;
  /** Whether this effect supports direction parameter. */
  supportsDirection: boolean | null;
}

// ─── Lighting Configuration ─────────────────────────────────────────────────

export type EffectDirection = 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';

export interface LightingConfig {
  effect: LightingEffect;
  primaryColor: RgbColor;
  secondaryColor?: RgbColor;
  brightness: number; // 0–100
  speed: number; // 0–100
  direction?: EffectDirection;
}

export interface PerKeyColor {
  /** Key identifier (row, col or key code). */
  keyId: string;
  color: RgbColor;
}

export interface LightingProfile {
  config: LightingConfig;
  perKeyColors: PerKeyColor[];
}

// ─── Registry of all known effects ──────────────────────────────────────────

export const LIGHTING_EFFECTS: EffectInfo[] = [
  {
    effect: LightingEffect.Static,
    label: 'Static',
    description: 'Single solid color across all keys',
    verification: 'unverified',
    supportsPerKey: null,
    supportsSpeed: false,
    supportsDirection: false,
  },
  {
    effect: LightingEffect.Breathing,
    label: 'Breathing',
    description: 'Pulsing color fade in and out',
    verification: 'unverified',
    supportsPerKey: null,
    supportsSpeed: null,
    supportsDirection: false,
  },
  {
    effect: LightingEffect.Wave,
    label: 'Wave',
    description: 'Color wave sweeping across the keyboard',
    verification: 'unverified',
    supportsPerKey: false,
    supportsSpeed: null,
    supportsDirection: null,
  },
  {
    effect: LightingEffect.Rainbow,
    label: 'Rainbow',
    description: 'Full spectrum color cycle',
    verification: 'unverified',
    supportsPerKey: false,
    supportsSpeed: null,
    supportsDirection: null,
  },
  {
    effect: LightingEffect.ColorCycle,
    label: 'Color Cycle',
    description: 'Smooth transition through colors',
    verification: 'unverified',
    supportsPerKey: false,
    supportsSpeed: null,
    supportsDirection: false,
  },
  {
    effect: LightingEffect.Reactive,
    label: 'Reactive',
    description: 'Keys light up when pressed',
    verification: 'unverified',
    supportsPerKey: null,
    supportsSpeed: null,
    supportsDirection: false,
  },
  {
    effect: LightingEffect.Ripple,
    label: 'Ripple',
    description: 'Ripple effect emanating from pressed keys',
    verification: 'unverified',
    supportsPerKey: null,
    supportsSpeed: null,
    supportsDirection: false,
  },
  {
    effect: LightingEffect.Gradient,
    label: 'Gradient',
    description: 'Smooth gradient between two colors',
    verification: 'unverified',
    supportsPerKey: false,
    supportsSpeed: false,
    supportsDirection: null,
  },
  {
    effect: LightingEffect.Custom,
    label: 'Custom',
    description: 'Per-key color assignment',
    verification: 'unverified',
    supportsPerKey: true,
    supportsSpeed: false,
    supportsDirection: false,
  },
  {
    effect: LightingEffect.Off,
    label: 'Off',
    description: 'All lighting disabled',
    verification: 'unverified',
    supportsPerKey: false,
    supportsSpeed: false,
    supportsDirection: false,
  },
];
