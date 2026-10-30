/**
 * Ant Esports APEX 200S keyboard layout definition.
 *
 * Layout: 75% compact, 84 keys + rotary knob encoder.
 *
 * Standard 75% 84-key breakdown:
 * - Row 0: Esc + F1–F12 + PrtSc + Pause + Del (16 items, where one position is the rotary knob)
 * - Row 1: `~ + 1–0 + - + = + Backspace + Home (15 keys)
 * - Row 2: Tab + Q–P + [ + ] + \ + PgUp (15 keys)
 * - Row 3: CapsLock + A–L + ; + ' + Enter + PgDn (14 keys)
 * - Row 4: LShift + Z–M + , + . + / + RShift + Up + End (14 keys)
 * - Row 5: LCtrl + LWin + LAlt + Space + RAlt + Fn + RCtrl + Left + Down + Right (10 keys)
 *
 * Total standard keys: 84
 * Total with rotary encoder: 85
 */

export interface KeyDefinition {
  id: string;
  label: string;
  secondaryLabel?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  row: number;
  col: number;
  isSpecial?: boolean;
}

// Row 0: Function row (Esc, F1–F12, PrtSc, Pause, Del, and Rotary Knob)
const row0: KeyDefinition[] = [
  { id: 'esc', label: 'Esc', x: 0, y: 0, w: 1, h: 1, row: 0, col: 0 },
  { id: 'f1', label: 'F1', x: 1, y: 0, w: 1, h: 1, row: 0, col: 1 },
  { id: 'f2', label: 'F2', x: 2, y: 0, w: 1, h: 1, row: 0, col: 2 },
  { id: 'f3', label: 'F3', x: 3, y: 0, w: 1, h: 1, row: 0, col: 3 },
  { id: 'f4', label: 'F4', x: 4, y: 0, w: 1, h: 1, row: 0, col: 4 },
  { id: 'f5', label: 'F5', x: 5, y: 0, w: 1, h: 1, row: 0, col: 5 },
  { id: 'f6', label: 'F6', x: 6, y: 0, w: 1, h: 1, row: 0, col: 6 },
  { id: 'f7', label: 'F7', x: 7, y: 0, w: 1, h: 1, row: 0, col: 7 },
  { id: 'f8', label: 'F8', x: 8, y: 0, w: 1, h: 1, row: 0, col: 8 },
  { id: 'f9', label: 'F9', x: 9, y: 0, w: 1, h: 1, row: 0, col: 9 },
  { id: 'f10', label: 'F10', x: 10, y: 0, w: 1, h: 1, row: 0, col: 10 },
  { id: 'f11', label: 'F11', x: 11, y: 0, w: 1, h: 1, row: 0, col: 11 },
  { id: 'f12', label: 'F12', x: 12, y: 0, w: 1, h: 1, row: 0, col: 12 },
  { id: 'prtsc', label: 'PrtSc', x: 13, y: 0, w: 1, h: 1, row: 0, col: 13 },
  { id: 'pause', label: 'Pause', x: 14, y: 0, w: 1, h: 1, row: 0, col: 14 },
  { id: 'del', label: 'Del', x: 15, y: 0, w: 1, h: 1, row: 0, col: 15 },
  // Dedicated physical rotary encoder
  { id: 'knob', label: '🔊', x: 16.1, y: 0, w: 1, h: 1, row: 0, col: 16, isSpecial: true },
];

// Row 1: Number row (15 keys)
const row1: KeyDefinition[] = [
  { id: 'grave', label: '`', secondaryLabel: '~', x: 0, y: 1, w: 1, h: 1, row: 1, col: 0 },
  { id: '1', label: '1', secondaryLabel: '!', x: 1, y: 1, w: 1, h: 1, row: 1, col: 1 },
  { id: '2', label: '2', secondaryLabel: '@', x: 2, y: 1, w: 1, h: 1, row: 1, col: 2 },
  { id: '3', label: '3', secondaryLabel: '#', x: 3, y: 1, w: 1, h: 1, row: 1, col: 3 },
  { id: '4', label: '4', secondaryLabel: '$', x: 4, y: 1, w: 1, h: 1, row: 1, col: 4 },
  { id: '5', label: '5', secondaryLabel: '%', x: 5, y: 1, w: 1, h: 1, row: 1, col: 5 },
  { id: '6', label: '6', secondaryLabel: '^', x: 6, y: 1, w: 1, h: 1, row: 1, col: 6 },
  { id: '7', label: '7', secondaryLabel: '&', x: 7, y: 1, w: 1, h: 1, row: 1, col: 7 },
  { id: '8', label: '8', secondaryLabel: '*', x: 8, y: 1, w: 1, h: 1, row: 1, col: 8 },
  { id: '9', label: '9', secondaryLabel: '(', x: 9, y: 1, w: 1, h: 1, row: 1, col: 9 },
  { id: '0', label: '0', secondaryLabel: ')', x: 10, y: 1, w: 1, h: 1, row: 1, col: 10 },
  { id: 'minus', label: '-', secondaryLabel: '_', x: 11, y: 1, w: 1, h: 1, row: 1, col: 11 },
  { id: 'equal', label: '=', secondaryLabel: '+', x: 12, y: 1, w: 1, h: 1, row: 1, col: 12 },
  { id: 'backspace', label: 'Backspace', x: 13, y: 1, w: 2, h: 1, row: 1, col: 13 },
  { id: 'home', label: 'Home', x: 15, y: 1, w: 1, h: 1, row: 1, col: 14 },
];

// Row 2: QWERTY row (15 keys)
const row2: KeyDefinition[] = [
  { id: 'tab', label: 'Tab', x: 0, y: 2, w: 1.5, h: 1, row: 2, col: 0 },
  { id: 'q', label: 'Q', x: 1.5, y: 2, w: 1, h: 1, row: 2, col: 1 },
  { id: 'w', label: 'W', x: 2.5, y: 2, w: 1, h: 1, row: 2, col: 2 },
  { id: 'e', label: 'E', x: 3.5, y: 2, w: 1, h: 1, row: 2, col: 3 },
  { id: 'r', label: 'R', x: 4.5, y: 2, w: 1, h: 1, row: 2, col: 4 },
  { id: 't', label: 'T', x: 5.5, y: 2, w: 1, h: 1, row: 2, col: 5 },
  { id: 'y', label: 'Y', x: 6.5, y: 2, w: 1, h: 1, row: 2, col: 6 },
  { id: 'u', label: 'U', x: 7.5, y: 2, w: 1, h: 1, row: 2, col: 7 },
  { id: 'i', label: 'I', x: 8.5, y: 2, w: 1, h: 1, row: 2, col: 8 },
  { id: 'o', label: 'O', x: 9.5, y: 2, w: 1, h: 1, row: 2, col: 9 },
  { id: 'p', label: 'P', x: 10.5, y: 2, w: 1, h: 1, row: 2, col: 10 },
  { id: 'bracket_l', label: '[', secondaryLabel: '{', x: 11.5, y: 2, w: 1, h: 1, row: 2, col: 11 },
  { id: 'bracket_r', label: ']', secondaryLabel: '}', x: 12.5, y: 2, w: 1, h: 1, row: 2, col: 12 },
  { id: 'backslash', label: '\\', secondaryLabel: '|', x: 13.5, y: 2, w: 1.5, h: 1, row: 2, col: 13 },
  { id: 'pgup', label: 'PgUp', x: 15, y: 2, w: 1, h: 1, row: 2, col: 14 },
];

// Row 3: Home row (14 keys)
const row3: KeyDefinition[] = [
  { id: 'caps', label: 'Caps', x: 0, y: 3, w: 1.75, h: 1, row: 3, col: 0 },
  { id: 'a', label: 'A', x: 1.75, y: 3, w: 1, h: 1, row: 3, col: 1 },
  { id: 's', label: 'S', x: 2.75, y: 3, w: 1, h: 1, row: 3, col: 2 },
  { id: 'd', label: 'D', x: 3.75, y: 3, w: 1, h: 1, row: 3, col: 3 },
  { id: 'f', label: 'F', x: 4.75, y: 3, w: 1, h: 1, row: 3, col: 4 },
  { id: 'g', label: 'G', x: 5.75, y: 3, w: 1, h: 1, row: 3, col: 5 },
  { id: 'h', label: 'H', x: 6.75, y: 3, w: 1, h: 1, row: 3, col: 6 },
  { id: 'j', label: 'J', x: 7.75, y: 3, w: 1, h: 1, row: 3, col: 7 },
  { id: 'k', label: 'K', x: 8.75, y: 3, w: 1, h: 1, row: 3, col: 8 },
  { id: 'l', label: 'L', x: 9.75, y: 3, w: 1, h: 1, row: 3, col: 9 },
  { id: 'semicolon', label: ';', secondaryLabel: ':', x: 10.75, y: 3, w: 1, h: 1, row: 3, col: 10 },
  { id: 'quote', label: "'", secondaryLabel: '"', x: 11.75, y: 3, w: 1, h: 1, row: 3, col: 11 },
  { id: 'enter', label: 'Enter', x: 12.75, y: 3, w: 2.25, h: 1, row: 3, col: 12 },
  { id: 'pgdn', label: 'PgDn', x: 15, y: 3, w: 1, h: 1, row: 3, col: 13 },
];

// Row 4: Shift row (14 keys)
const row4: KeyDefinition[] = [
  { id: 'lshift', label: 'Shift', x: 0, y: 4, w: 2.25, h: 1, row: 4, col: 0 },
  { id: 'z', label: 'Z', x: 2.25, y: 4, w: 1, h: 1, row: 4, col: 1 },
  { id: 'x', label: 'X', x: 3.25, y: 4, w: 1, h: 1, row: 4, col: 2 },
  { id: 'c', label: 'C', x: 4.25, y: 4, w: 1, h: 1, row: 4, col: 3 },
  { id: 'v', label: 'V', x: 5.25, y: 4, w: 1, h: 1, row: 4, col: 4 },
  { id: 'b', label: 'B', x: 6.25, y: 4, w: 1, h: 1, row: 4, col: 5 },
  { id: 'n', label: 'N', x: 7.25, y: 4, w: 1, h: 1, row: 4, col: 6 },
  { id: 'm', label: 'M', x: 8.25, y: 4, w: 1, h: 1, row: 4, col: 7 },
  { id: 'comma', label: ',', secondaryLabel: '<', x: 9.25, y: 4, w: 1, h: 1, row: 4, col: 8 },
  { id: 'period', label: '.', secondaryLabel: '>', x: 10.25, y: 4, w: 1, h: 1, row: 4, col: 9 },
  { id: 'slash', label: '/', secondaryLabel: '?', x: 11.25, y: 4, w: 1, h: 1, row: 4, col: 10 },
  { id: 'rshift', label: 'Shift', x: 12.25, y: 4, w: 1.75, h: 1, row: 4, col: 11 },
  { id: 'up', label: '↑', x: 14, y: 4, w: 1, h: 1, row: 4, col: 12 },
  { id: 'end', label: 'End', x: 15, y: 4, w: 1, h: 1, row: 4, col: 13 },
];

// Row 5: Bottom row (10 keys)
const row5: KeyDefinition[] = [
  { id: 'lctrl', label: 'Ctrl', x: 0, y: 5, w: 1.25, h: 1, row: 5, col: 0 },
  { id: 'lwin', label: 'Win', x: 1.25, y: 5, w: 1.25, h: 1, row: 5, col: 1 },
  { id: 'lalt', label: 'Alt', x: 2.5, y: 5, w: 1.25, h: 1, row: 5, col: 2 },
  { id: 'space', label: '', x: 3.75, y: 5, w: 6.25, h: 1, row: 5, col: 3 },
  { id: 'ralt', label: 'Alt', x: 10, y: 5, w: 1, h: 1, row: 5, col: 4 },
  { id: 'fn', label: 'Fn', x: 11, y: 5, w: 1, h: 1, row: 5, col: 5 },
  { id: 'rctrl', label: 'Ctrl', x: 12, y: 5, w: 1, h: 1, row: 5, col: 6 },
  { id: 'left', label: '←', x: 13, y: 5, w: 1, h: 1, row: 5, col: 7 },
  { id: 'down', label: '↓', x: 14, y: 5, w: 1, h: 1, row: 5, col: 8 },
  { id: 'right', label: '→', x: 15, y: 5, w: 1, h: 1, row: 5, col: 9 },
];

/** Complete APEX 200S key layout. */
export const APEX_200S_LAYOUT: KeyDefinition[] = [
  ...row0,
  ...row1,
  ...row2,
  ...row3,
  ...row4,
  ...row5,
];

/** Total key count (excluding the knob). */
export const APEX_200S_KEY_COUNT = APEX_200S_LAYOUT.filter((k) => !k.isSpecial).length;

/** Layout dimensions in key-units. */
export const LAYOUT_BOUNDS = {
  width: 17.2,
  height: 6.2,
} as const;

export const LAYOUT_VERIFIED = false;
