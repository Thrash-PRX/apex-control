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
import { ReportType } from '../../types/index.ts';

export class WebHidTransport implements HidTransport {
  readonly name = 'WebHID';

  private _device: HIDDevice | null = null;
  private _deviceInfo: HidDeviceInfo | null = null;
  private _handlers: Set<TransportEventHandler> = new Set();
  private _inputReportHandler: ((event: HIDInputReportEvent) => void) | null = null;

  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'hid' in navigator;
  }

  async enumerate(filter?: HidDeviceFilter): Promise<HidDeviceInfo[]> {
    if (!this.isAvailable()) return [];

    const devices = await navigator.hid.getDevices();

    return devices
      .filter((d: HIDDevice) => {
        if (filter?.vendorId && d.vendorId !== filter.vendorId) return false;
        if (filter?.productId && d.productId !== filter.productId) return false;
        return true;
      })
      .map((d: HIDDevice) => this._mapDevice(d));
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
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        return null;
      }
      throw err;
    }
  }

  async open(devicePath: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('WebHID is not available in this browser');
    }

    const devices = await navigator.hid.getDevices();
    const device = devices.find(
      (d: HIDDevice) => `webhid://${d.vendorId}:${d.productId}` === devicePath
    );

    if (!device) {
      throw new Error(`WebHID: device not found for path "${devicePath}"`);
    }

    if (!device.opened) {
      await device.open();
    }

    this._device = device;
    this._deviceInfo = this._mapDevice(device);

    this._inputReportHandler = (event: HIDInputReportEvent) => {
      const data = new Uint8Array(event.data.buffer);
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

    this._emit({
      type: 'device-connected',
      device: this._deviceInfo,
      timestamp: Date.now(),
    });
  }

  async close(): Promise<void> {
    if (!this._device) return;

    if (this._inputReportHandler) {
      this._device.removeEventListener('inputreport', this._inputReportHandler);
      this._inputReportHandler = null;
    }

    await this._device.close();
    const info = this._deviceInfo;
    this._device = null;
    this._deviceInfo = null;

    if (info) {
      this._emit({
        type: 'device-disconnected',
        device: info,
        timestamp: Date.now(),
      });
    }
  }

  isOpen(): boolean {
    return this._device !== null && this._device.opened;
  }

  getConnectedDevice(): HidDeviceInfo | null {
    return this._deviceInfo;
  }

  async sendOutputReport(reportId: number, data: Uint8Array): Promise<void> {
    this._assertOpen();
    await this._device!.sendReport(reportId, data as unknown as BufferSource);
  }

  async sendFeatureReport(reportId: number, data: Uint8Array): Promise<void> {
    this._assertOpen();
    await this._device!.sendFeatureReport(reportId, data as unknown as BufferSource);
  }

  async getFeatureReport(reportId: number): Promise<Uint8Array> {
    this._assertOpen();
    const result = await this._device!.receiveFeatureReport(reportId);
    return new Uint8Array(result.buffer);
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
    const vendorCollection = device.collections?.find(
      (c: HIDCollectionInfo) => c.usagePage !== undefined && c.usagePage >= 0xff00
    );
    const firstCollection = device.collections?.[0];
    const collection = vendorCollection || firstCollection;

    return {
      path: `webhid://${device.vendorId}:${device.productId}`,
      vendorId: device.vendorId,
      productId: device.productId,
      manufacturer: device.productName || 'Unknown',
      product: device.productName || 'Unknown',
      serialNumber: '',
      interfaceNumber: 0,
      usagePage: collection?.usagePage ?? 0,
      usage: collection?.usage ?? 0,
      maxInputReportLength: 64,
      maxOutputReportLength: 64,
      maxFeatureReportLength: 64,
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
