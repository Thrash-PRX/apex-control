/**
 * Mock HID Transport for development and testing.
 *
 * Simulates an APEX 200S keyboard connection without real hardware.
 * All mock behavior is CLEARLY labeled — this transport never claims
 * to be a real device connection.
 *
 * Uses the unverified VID/PID from research. Mock responses are
 * synthetic and do not represent actual device protocol behavior.
 */

import type {
  HidTransport,
  HidDeviceFilter,
  HidDeviceInfo,
  TransportEventHandler,
  TransportEvent,
} from './transport.ts';
import { APEX_200S_VID, APEX_200S_PID } from '../../types/device.ts';

const MOCK_DEVICE: HidDeviceInfo = {
  path: 'mock://apex-200s',
  vendorId: APEX_200S_VID,
  productId: APEX_200S_PID,
  manufacturer: 'Ant Esports (Mock)',
  product: 'APEX 200 (Mock Device)',
  serialNumber: 'MOCK-000000',
  interfaceNumber: 1,
  usagePage: 0xff02, // Simulated observed APEX collection
  usage: 0x02,
  maxInputReportLength: 64,
  maxOutputReportLength: 64,
  maxFeatureReportLength: 64,
};

export class MockHidTransport implements HidTransport {
  readonly name = 'Mock';

  private _isOpen = false;
  private _handlers: Set<TransportEventHandler> = new Set();
  private _responseDelay = 50; // Simulated latency in ms

  isAvailable(): boolean {
    return true; // Always available
  }

  async enumerate(filter?: HidDeviceFilter): Promise<HidDeviceInfo[]> {
    // Simulate enumeration delay
    await this._delay(100);

    // Apply filter if provided
    if (filter) {
      if (filter.vendorId && filter.vendorId !== MOCK_DEVICE.vendorId) return [];
      if (filter.productId && filter.productId !== MOCK_DEVICE.productId) return [];
      if (filter.usagePage && filter.usagePage !== MOCK_DEVICE.usagePage) return [];
      if (filter.usage && filter.usage !== MOCK_DEVICE.usage) return [];
    }

    return [{ ...MOCK_DEVICE }];
  }

  async open(devicePath: string): Promise<void> {
    if (devicePath !== MOCK_DEVICE.path) {
      throw new Error(`Mock transport: unknown device path "${devicePath}"`);
    }

    await this._delay(200); // Simulate connection time
    this._isOpen = true;

    this._emit({
      type: 'device-connected',
      device: { ...MOCK_DEVICE },
      timestamp: Date.now(),
    });
  }

  async close(): Promise<void> {
    if (!this._isOpen) return;

    this._isOpen = false;
    this._emit({
      type: 'device-disconnected',
      device: { ...MOCK_DEVICE },
      timestamp: Date.now(),
    });
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  getConnectedDevice(): HidDeviceInfo | null {
    return this._isOpen ? { ...MOCK_DEVICE } : null;
  }

  async sendOutputReport(reportId: number, data: Uint8Array): Promise<void> {
    this._assertOpen();
    await this._delay(this._responseDelay);

    console.log(
      `[MockHID] Output Report 0x${reportId.toString(16).padStart(2, '0')}:`,
      this._formatBytes(data)
    );

    // In the future, this could simulate device responses
    // based on known protocol commands.
  }

  async sendFeatureReport(reportId: number, data: Uint8Array): Promise<void> {
    this._assertOpen();
    await this._delay(this._responseDelay);

    console.log(
      `[MockHID] Feature Report SET 0x${reportId.toString(16).padStart(2, '0')}:`,
      this._formatBytes(data)
    );
  }

  async getFeatureReport(reportId: number): Promise<Uint8Array> {
    this._assertOpen();
    await this._delay(this._responseDelay);

    console.log(
      `[MockHID] Feature Report GET 0x${reportId.toString(16).padStart(2, '0')}`
    );

    // Return a mock response — all zeros with the report ID
    // Real protocol responses will be added as they are discovered
    const response = new Uint8Array(64);
    response[0] = reportId;
    return response;
  }

  on(handler: TransportEventHandler): () => void {
    this._handlers.add(handler);
    return () => this._handlers.delete(handler);
  }

  // ─── Internal ───────────────────────────────────────────────────────────

  private _assertOpen(): void {
    if (!this._isOpen) {
      throw new Error('Mock transport: device is not open');
    }
  }

  private _emit(event: TransportEvent): void {
    for (const handler of this._handlers) {
      try {
        handler(event);
      } catch (err) {
        console.error('[MockHID] Error in event handler:', err);
      }
    }
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private _formatBytes(data: Uint8Array): string {
    return Array.from(data)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
  }
}
