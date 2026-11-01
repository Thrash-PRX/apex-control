import { exchangeRgb } from './rgb-exchange.ts';

export interface DeviceSnapshot {
  schema: 'apex-device-readback';
  version: 1;
  capturedAt: string;
  device: '314B:1026';
  completeDeviceBackup: false;
  restoreEnabled: false;
  sections: { name: string; command: number; selector: number[]; pages: number[][] }[];
}

// Requests observed in stock startup captures. No product-info62 (sets clock),
// macros (may contain sensitive text), calibration, reset or firmware commands.
const sections = [
  { name: 'Profile information', command: 0x57, selector: [] },
  { name: 'Whole parameters (raw)', command: 0x5e, selector: [] },
  { name: 'Base keymap (raw)', command: 0x2a, selector: [0] },
  { name: 'FN keymap (raw)', command: 0x2a, selector: [1] },
  { name: 'Advanced keys / SOCD (raw)', command: 0x2b, selector: [] },
  { name: 'Actuation / Rapid Trigger (raw)', command: 0x2c, selector: [] },
];

/** Captured output-report getters only. Raw bytes never become editor mm or SOCD codes. */
export async function readDeviceState(device: HIDDevice): Promise<DeviceSnapshot> {
  if (device.vendorId !== 0x314b || device.productId !== 0x1026) throw Error('Connect a real APEX 200 first');
  const result: DeviceSnapshot = { schema: 'apex-device-readback', version: 1, capturedAt: new Date().toISOString(), device: '314B:1026', completeDeviceBackup: false, restoreEnabled: false, sections: [] };
  for (const section of sections) {
    const pages: number[][] = [];
    let total = 1;
    for (let page = 1; page <= total; page++) {
      const request = new Uint8Array(64);
      request.set([0xfa, section.command, page, total, 0, section.selector.length, ...section.selector]);
      const response = await exchangeRgb(device, request);
      if (page === 1) total = response[3];
      if (total < 1 || total > 16 || response[3] !== total || response[5] === 0) throw Error(`Invalid readback pagination for ${section.name}`);
      pages.push([...response.slice(6, 6 + response[5])]);
    }
    result.sections.push({ ...section, selector: [...section.selector], pages });
  }
  return result;
}
