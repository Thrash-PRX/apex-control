/**
 * HID Transport abstraction layer.
 *
 * Provides a unified interface for communicating with the keyboard
 * regardless of the underlying transport (WebHID, node-hid via Tauri, mock).
 *
 * The transport is responsible for:
 * - Discovering HID devices
 * - Opening/closing connections
 * - Sending and receiving HID reports
 * - Handling connection events
 *
 * All transports implement the same interface so the application layer
 * doesn't need to know which transport is active.
 */

import type { HidReport } from '../../types/device.ts';

// ─── Device Filter ──────────────────────────────────────────────────────────

export interface HidDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

// ─── Discovered Device Info ─────────────────────────────────────────────────

export interface HidDeviceInfo {
  /** Transport-specific device handle/path. */
  path: string;
  vendorId: number;
  productId: number;
  manufacturer: string;
  product: string;
  serialNumber: string;
  /** HID interface number. */
  interfaceNumber: number;
  /** HID usage page. */
  usagePage: number;
  /** HID usage. */
  usage: number;
  /** Max report lengths. */
  maxInputReportLength: number;
  maxOutputReportLength: number;
  maxFeatureReportLength: number;
}

// ─── Transport Events ───────────────────────────────────────────────────────

export type TransportEventType =
  | 'device-connected'
  | 'device-disconnected'
  | 'data-received'
  | 'error';

export interface TransportEvent {
  type: TransportEventType;
  device?: HidDeviceInfo;
  data?: HidReport;
  error?: Error;
  timestamp: number;
}

export type TransportEventHandler = (event: TransportEvent) => void;

// ─── Transport Interface ────────────────────────────────────────────────────

export interface HidTransport {
  /** Human-readable transport name (e.g., 'WebHID', 'Tauri/node-hid', 'Mock'). */
  readonly name: string;

  /** Whether this transport is available in the current environment. */
  isAvailable(): boolean;

  /**
   * Enumerate connected HID devices matching the filter.
   * Returns discovered devices without opening connections.
   */
  enumerate(filter?: HidDeviceFilter): Promise<HidDeviceInfo[]>;

  /**
   * Open a connection to a specific device.
   * @param devicePath Transport-specific device identifier from enumerate().
   */
  open(devicePath: string): Promise<void>;

  /** Close the active connection. */
  close(): Promise<void>;

  /** Whether a device is currently connected and open. */
  isOpen(): boolean;

  /** Get info about the currently connected device. */
  getConnectedDevice(): HidDeviceInfo | null;

  /**
   * Send an output report to the device.
   * @param reportId HID report ID.
   * @param data Report payload (excluding report ID byte).
   */
  sendOutputReport(reportId: number, data: Uint8Array): Promise<void>;

  /**
   * Send a feature report (SET_REPORT) to the device.
   * @param reportId HID report ID.
   * @param data Report payload (excluding report ID byte).
   */
  sendFeatureReport(reportId: number, data: Uint8Array): Promise<void>;

  /**
   * Request a feature report (GET_REPORT) from the device.
   * @param reportId HID report ID.
   * @returns The report data (excluding report ID byte).
   */
  getFeatureReport(reportId: number): Promise<Uint8Array>;

  /** Register an event handler. Returns an unsubscribe function. */
  on(handler: TransportEventHandler): () => void;
}
