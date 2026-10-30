/**
 * WebHID Transport implementation.
 *
 * Uses the browser WebHID API for direct USB HID communication.
 * Only available in Chromium-based browsers with WebHID support.
 */

import type {
  HidTransport,
  HidDeviceFilter,
  HidDeviceInfo,
  TransportEventHandler,
  TransportEvent,
} from './transport.ts';
import { collectionsDeep, reportLengths } from './descriptors.ts';
import { ReportType } from '../../types/index.ts';

export class WebHidTransport implements HidTransport {
  readonly name = 'WebHID';

  private _device: HIDDevice | null = null;
  private _deviceInfo: HidDeviceInfo | null = null;
  private _handlers: Set<TransportEventHandler> = new Set();
  private _inputReportHandler: ((event: HIDInputReportEvent) => void) | null = null;
  private _knownDevices = new Map<string, HIDDevice>();
  private _devicePaths = new WeakMap<HIDDevice, string>();
  private _nextDeviceId = 0;
  private _isClosing = false;

  private _disconnectHandler: EventListener = (event) => {
    if ((event as Event & { device: HIDDevice }).device === this._device) this._detach();
  };
  private _detach(): void {
    const info = this._deviceInfo;
    if (this._device && this._inputReportHandler) this._device.removeEventListener('inputreport', this._inputReportHandler);
    navigator.hid.removeEventListener?.('disconnect', this._disconnectHandler);
    this._inputReportHandler = null;
    this._device = null;
    this._deviceInfo = null;
    if (info) this._emit({ type: 'device-disconnected', device: info, timestamp: Date.now() });
  }
  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'hid' in navigator;
  }

  async enumerate(filter?: HidDeviceFilter): Promise<HidDeviceInfo[]> {
    if (!this.isAvailable()) return [];

    try {
      const devices = await navigator.hid.getDevices();

      return devices
        .filter((d: HIDDevice) => {
          if (filter?.vendorId !== undefined && d.vendorId !== filter.vendorId) return false;
          if (filter?.productId !== undefined && d.productId !== filter.productId) return false;
          if (filter?.usagePage !== undefined && !collectionsDeep(d.collections).some((c) => c.usagePage === filter.usagePage)) return false;
          if (filter?.usage !== undefined && !collectionsDeep(d.collections).some((c) =>
            c.usage === filter.usage && (filter.usagePage === undefined || c.usagePage === filter.usagePage)
          )) return false;
          return true;
        })
        .map((d: HIDDevice) => this._mapDevice(d));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._emit({ type: 'error', error: new Error(`Enumerate failed: ${msg}`), timestamp: Date.now() });
      return [];
    }
  }

  async requestDevice(filter?: HidDeviceFilter): Promise<HidDeviceInfo | null> {
    if (!this.isAvailable()) return null;

    const filters: HIDDeviceFilter[] = [];
    if (filter) {
      filters.push({
        vendorId: filter.vendorId,
        productId: filter.productId,
        usagePage: filter.usagePage,
        usage: filter.usage,
      });
    }

    try {
      const devices = await navigator.hid.requestDevice({ filters });
      if (devices.length === 0) return null;
      return this._mapDevice(devices[0]);
    } catch (err) {
      if (err instanceof DOMException) {
        // User cancelled or denied permission - not an error
        if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
          return null;
        }
        // SecurityError, NetworkError, etc. are actual errors
        this._emit({ type: 'error', error: new Error(`WebHID requestDevice: ${err.name}: ${err.message}`), timestamp: Date.now() });
      }
      throw err;
    }
  }

  async open(devicePath: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('WebHID is not available in this browser');
    }
    if (!devicePath || devicePath.trim() === '') {
      throw new Error('Invalid device path: empty string');
    }
    if (this._isClosing) {
      throw new Error('Transport is closing, cannot open new connection');
    }

    // Prefer the exact HIDDevice selected in the permission dialog. VID/PID alone
    // is not a unique device path when two identical keyboards are attached.
    let device = this._knownDevices.get(devicePath);
    if (!device) {
      const authorized = await navigator.hid.getDevices();
      authorized.forEach((d) => this._mapDevice(d));
      device = this._knownDevices.get(devicePath);
    }

    if (!device) {
      throw new Error(`WebHID: device not found for path "${devicePath}". Device may have been disconnected or permission revoked.`);
    }

    if (this._device === device && device.opened) return;
    if (this._device) await this.close();
    if (!device.opened) {
      await device.open();
    }

    this._device = device;
    this._deviceInfo = this._mapDevice(device);

    this._inputReportHandler = (event: HIDInputReportEvent) => {
      const data = new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength);
      this._emit({
        type: 'data-received',
        data: {
          reportId: event.reportId,
          reportType: ReportType.Input,
          data,
        },
        timestamp: Date.now(),
      });
    };
    device.addEventListener('inputreport', this._inputReportHandler);
    navigator.hid.addEventListener?.('disconnect', this._disconnectHandler);

    this._emit({
      type: 'device-connected',
      device: this._deviceInfo,
      timestamp: Date.now(),
    });
  }

  async close(): Promise<void> {
    if (!this._device) return;

    const device = this._device;
    try { if (device.opened) await device.close(); }
    finally { this._detach(); }
  }

  isOpen(): boolean {
    return this._device !== null && this._device.opened;
  }

  getConnectedDevice(): HidDeviceInfo | null {
    return this._deviceInfo;
  }

  async sendOutputReport(reportId: number, data: Uint8Array): Promise<void> {
    this._assertOpen();
    void reportId; void data;
    throw new Error('Hardware writes are locked until the APEX protocol and backup path are verified');
  }

  async sendFeatureReport(reportId: number, data: Uint8Array): Promise<void> {
    this._assertOpen();
    void reportId; void data;
    throw new Error('Hardware writes are locked until the APEX protocol and backup path are verified');
  }

  async getFeatureReport(reportId: number): Promise<Uint8Array> {
    this._assertOpen();
    if (!reportLengths(this._device!.collections, 'featureReports').has(reportId)) throw new Error('Feature report is not declared by this device');
    const result = await this._device!.receiveFeatureReport(reportId);
    return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
  }

  on(handler: TransportEventHandler): () => void {
    this._handlers.add(handler);
    return () => this._handlers.delete(handler);
  }

  private _assertOpen(): void {
    if (!this._device || !this._device.opened) {
      throw new Error('WebHID: device is not open');
    }
  }

  private _mapDevice(device: HIDDevice): HidDeviceInfo {
    let path = this._devicePaths.get(device);
    if (!path) {
      path = `webhid://${device.vendorId.toString(16)}:${device.productId.toString(16)}/${this._nextDeviceId++}`;
      this._devicePaths.set(device, path);
    }
    this._knownDevices.set(path, device);

    const vendorCollection = collectionsDeep(device.collections).find(
      (c: HIDCollectionInfo) => c.usagePage !== undefined && c.usagePage >= 0xff00
    );
    const firstCollection = device.collections?.[0];
    const collection = vendorCollection || firstCollection;

    return {
      path,
      vendorId: device.vendorId,
      productId: device.productId,
      manufacturer: 'Unknown',
      product: device.productName || 'Unknown',
      serialNumber: '',
      interfaceNumber: -1, // Not exposed by WebHID.
      usagePage: collection?.usagePage ?? 0,
      usage: collection?.usage ?? 0,
      maxInputReportLength: Math.max(0, ...reportLengths(device.collections, 'inputReports').values()),
      maxOutputReportLength: Math.max(0, ...reportLengths(device.collections, 'outputReports').values()),
      maxFeatureReportLength: Math.max(0, ...reportLengths(device.collections, 'featureReports').values()),
    };
  }

  private _emit(event: TransportEvent): void {
    for (const handler of this._handlers) {
      try {
        handler(event);
      } catch (err) {
        console.error('[WebHID] Error in event handler:', err);
      }
    }
  }
}
