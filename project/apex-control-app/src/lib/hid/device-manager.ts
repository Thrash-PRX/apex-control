/**
 * Device Manager — high-level device connection management.
 *
 * Orchestrates transport selection, device discovery, connection lifecycle,
 * and state synchronization. This is the main entry point for device
 * communication from the UI layer.
 */

import type { HidTransport, HidDeviceFilter, HidDeviceInfo, TransportEvent } from './transport.ts';
import { MockHidTransport } from './mock-transport.ts';
import { WebHidTransport } from './webhid-transport.ts';
import {
  ConnectionState,
  APEX_200S_VID,
  APEX_200S_PID,
  createUnknownCapabilities,
  type ConnectionInfo,
  type DeviceCapabilities,
} from '../../types/index.ts';

// ─── Device Manager Events ──────────────────────────────────────────────────

export type DeviceManagerEventType =
  | 'connection-changed'
  | 'capabilities-updated'
  | 'error';

export interface DeviceManagerEvent {
  type: DeviceManagerEventType;
  connection?: ConnectionInfo;
  capabilities?: DeviceCapabilities;
  error?: string;
}

export type DeviceManagerEventHandler = (event: DeviceManagerEvent) => void;

// ─── Manager ────────────────────────────────────────────────────────────────

export class DeviceManager {
  private _transport: HidTransport;
  private _connection: ConnectionInfo;
  private _capabilities: DeviceCapabilities;
  private _handlers: Set<DeviceManagerEventHandler> = new Set();
  private _unsubTransport: (() => void) | null = null;

  /** Default filter targeting the APEX 200S vendor-specific interface. */
  static readonly DEFAULT_FILTER: HidDeviceFilter = {
    vendorId: APEX_200S_VID,
    productId: APEX_200S_PID,
    usagePage: 0xff02, // Observed in USB-CAPS-002.
    usage: 2,
  };

  constructor(transport?: HidTransport) {
    // Select transport: prefer WebHID if available, fall back to mock
    if (transport) {
      this._transport = transport;
    } else {
      const webHid = new WebHidTransport();
      this._transport = webHid.isAvailable() ? webHid : new MockHidTransport();
    }

    this._connection = {
      state: ConnectionState.Disconnected,
      device: null,
      isMock: this._transport.name === 'Mock',
      lastSeen: null,
      error: null,
    };

    this._capabilities = createUnknownCapabilities();

    // Subscribe to transport events
    this._unsubTransport = this._transport.on(this._handleTransportEvent.bind(this));
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  get connection(): ConnectionInfo {
    return { ...this._connection };
  }

  get capabilities(): DeviceCapabilities {
    return { ...this._capabilities };
  }

  get transportName(): string {
    return this._transport.name;
  }

  get isMock(): boolean {
    return this._transport.name === 'Mock';
  }

  /** Switch to a different transport (e.g., from WebHID to Mock). */
  async switchTransport(transport: HidTransport): Promise<void> {
    // Close current connection
    if (this._transport.isOpen()) {
      await this._transport.close();
    }
    if (this._unsubTransport) {
      this._unsubTransport();
    }

    this._transport = transport;
    this._unsubTransport = this._transport.on(this._handleTransportEvent.bind(this));

    this._updateConnection({
      state: ConnectionState.Disconnected,
      device: null,
      isMock: transport.name === 'Mock',
      lastSeen: null,
      error: null,
    });
  }

  /** Scan for APEX 200S devices. */
  async scan(filter?: HidDeviceFilter): Promise<HidDeviceInfo[]> {
    this._updateConnection({
      ...this._connection,
      state: ConnectionState.Scanning,
    });

    try {
      // Default to observed APEX identity; an explicit filter can inspect other devices.
      const effectiveFilter = filter ?? DeviceManager.DEFAULT_FILTER;
      const devices = await this._transport.enumerate(effectiveFilter);

      this._updateConnection({
        ...this._connection,
        state: this._transport.isOpen() ? ConnectionState.Connected : ConnectionState.Disconnected,
      });

      return devices;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._updateConnection({
        ...this._connection,
        state: ConnectionState.Error,
        error: `Scan failed: ${msg}`,
      });
      return [];
    }
  }

  /**
   * Present a device permission chooser (supported transports only).
   * The call chain must originate in a user's click to retain browser activation.
   */
  async requestDevice(filter?: HidDeviceFilter): Promise<HidDeviceInfo | null> {
    if (!this._transport.requestDevice) {
      throw new Error(`${this._transport.name} does not support device permission requests`);
    }
    return this._transport.requestDevice(filter ?? DeviceManager.DEFAULT_FILTER);
  }

  /** Connect to a specific device.
   * Validates device path and prevents duplicate connections. */
  async connect(devicePath: string): Promise<void> {
    if (!devicePath || devicePath.trim() === '') {
      throw new Error('Invalid device path: empty string');
    }

    // Prevent concurrent connection attempts
    if (this._connection.state === ConnectionState.Connecting) {
      throw new Error('Connection already in progress');
    }

    // If already connected to this device, return early
    if (this._connection.state === ConnectionState.Connected && this._connection.device?.serialNumber === devicePath) {
      return;
    }

    // If connected to a different device, disconnect first
    if (this._transport.isOpen()) {
      await this.disconnect();
    }

    this._updateConnection({
      ...this._connection,
      state: ConnectionState.Connecting,
      error: null,
    });

    try {
      await this._transport.open(devicePath);
      const dev = this._transport.getConnectedDevice();

      if (!dev) {
        throw new Error('Transport opened but no device info returned');
      }

      this._updateConnection({
        state: ConnectionState.Connected,
        device: {
          vendorId: dev.vendorId,
          productId: dev.productId,
          manufacturer: dev.manufacturer,
          product: dev.product,
          serialNumber: dev.serialNumber,
        },
        isMock: this._transport.name === 'Mock',
        lastSeen: Date.now(),
        error: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._updateConnection({
        ...this._connection,
        state: ConnectionState.Error,
        error: `Connection failed: ${msg}`,
      });
      throw err;
    }
  }

  /** Disconnect from the current device. */
  async disconnect(): Promise<void> {
    try {
      await this._transport.close();
    } finally {
      this._updateConnection({
        state: ConnectionState.Disconnected,
        device: null,
        isMock: this._transport.name === 'Mock',
        lastSeen: null,
        error: null,
      });
    }
  }

  /** Send a feature report (for configuration commands). */
  async sendFeatureReport(reportId: number, data: Uint8Array): Promise<void> {
    if (!this._transport.isOpen()) {
      throw new Error('Cannot send report: device not connected');
    }
    await this._transport.sendFeatureReport(reportId, data);
    this._updateConnection({
      ...this._connection,
      lastSeen: Date.now(),
    });
  }

  /** Get a feature report (for reading device state). */
  async getFeatureReport(reportId: number): Promise<Uint8Array> {
    if (!this._transport.isOpen()) {
      throw new Error('Cannot get report: device not connected');
    }
    const data = await this._transport.getFeatureReport(reportId);
    this._updateConnection({
      ...this._connection,
      lastSeen: Date.now(),
    });
    return data;
  }

  /** Send an output report. */
  async sendOutputReport(reportId: number, data: Uint8Array): Promise<void> {
    if (!this._transport.isOpen()) {
      throw new Error('Cannot send report: device not connected');
    }
    await this._transport.sendOutputReport(reportId, data);
    this._updateConnection({
      ...this._connection,
      lastSeen: Date.now(),
    });
  }

  /** Subscribe to device manager events. */
  on(handler: DeviceManagerEventHandler): () => void {
    this._handlers.add(handler);
    return () => this._handlers.delete(handler);
  }

  /** Clean up resources. */
  dispose(): void {
    if (this._unsubTransport) {
      this._unsubTransport();
      this._unsubTransport = null;
    }
    if (this._transport.isOpen()) {
      this._transport.close().catch(console.error);
    }
    this._handlers.clear();
  }

  // ─── Internal ───────────────────────────────────────────────────────────

  private _handleTransportEvent(event: TransportEvent): void {
    switch (event.type) {
      case 'device-disconnected':
        this._updateConnection({
          state: ConnectionState.Disconnected,
          device: null,
          isMock: this._transport.name === 'Mock',
          lastSeen: null,
          error: null,
        });
        break;

      case 'error':
        this._updateConnection({
          ...this._connection,
          state: ConnectionState.Error,
          error: event.error?.message ?? 'Unknown transport error',
        });
        break;
    }
  }

  private _updateConnection(info: ConnectionInfo): void {
    this._connection = info;
    this._emit({ type: 'connection-changed', connection: info });
  }

  private _emit(event: DeviceManagerEvent): void {
    for (const handler of this._handlers) {
      try {
        handler(event);
      } catch (err) {
        console.error('[DeviceManager] Error in event handler:', err);
      }
    }
  }
}
