import test from 'node:test';
import assert from 'node:assert/strict';

import { MockHidTransport } from '../src/lib/hid/mock-transport.ts';
import { WebHidTransport } from '../src/lib/hid/webhid-transport.ts';
import { DeviceManager } from '../src/lib/hid/device-manager.ts';
import { ConnectionState, APEX_200S_VID, APEX_200S_PID } from '../src/types/device.ts';
import { LIGHTING_EFFECTS } from '../src/types/lighting.ts';
import { ACTUATION_LIMITS, RAPID_TRIGGER_LIMITS, SocdMode } from '../src/types/keyboard.ts';

test('Mock HID Transport — Device discovery and connection lifecycle', async () => {
  const transport = new MockHidTransport();
  assert.equal(transport.isOpen(), false);
  assert.equal(transport.getConnectedDevice(), null);

  const devices = await transport.enumerate();
  assert.equal(devices.length, 1);
  assert.equal(devices[0].vendorId, APEX_200S_VID);
  assert.equal(devices[0].productId, APEX_200S_PID);

  // Connect
  await transport.open(devices[0].path);
  assert.equal(transport.isOpen(), true);
  assert.notEqual(transport.getConnectedDevice(), null);

  // Reports
  const payload = new Uint8Array([0x01, 0x02, 0x03]);
  await assert.doesNotReject(async () => {
    await transport.sendOutputReport(0x05, payload);
    await transport.sendFeatureReport(0x06, payload);
    const res = await transport.getFeatureReport(0x06);
    assert.equal(res[0], 0x06);
  });

  // Disconnect
  await transport.close();
  assert.equal(transport.isOpen(), false);
});

test('Device Manager — State transitions and transport abstraction', async () => {
  const mockTransport = new MockHidTransport();
  const manager = new DeviceManager(mockTransport);

  assert.equal(manager.connection.state, ConnectionState.Disconnected);
  assert.equal(manager.isMock, true);

  const found = await manager.scan();
  assert.equal(found.length, 1);

  await manager.connect(found[0].path);
  assert.equal(manager.connection.state, ConnectionState.Connected);
  assert.equal(manager.connection.isMock, true);
  assert.notEqual(manager.connection.device, null);

  await manager.disconnect();
  assert.equal(manager.connection.state, ConnectionState.Disconnected);

  manager.dispose();
});

test('Protocol & Settings Specifications — Unverified boundaries', () => {
  assert.equal(ACTUATION_LIMITS.min, 0.1);
  assert.equal(ACTUATION_LIMITS.max, 3.6);
  assert.equal(ACTUATION_LIMITS.verified, false, 'Actuation limits must remain unverified');

  assert.equal(RAPID_TRIGGER_LIMITS.minSensitivity, 0.1);
  assert.equal(RAPID_TRIGGER_LIMITS.verified, false, 'Rapid Trigger limits must remain unverified');

  assert.equal(SocdMode.Neutral, 'neutral');
  assert.equal(SocdMode.LastInput, 'last_input');

  const unverifiedEffects = LIGHTING_EFFECTS.filter((e) => e.verification === 'unverified');
  assert.equal(unverifiedEffects.length, LIGHTING_EFFECTS.length, 'All lighting effects remain unverified until HW tested');
});

test('WebHID — user-granted pairing works without assuming VID/PID and keeps devices distinct', async () => {
  const mockHidDevice = (productName) => ({
    vendorId: 0x1234,
    productId: 0xabcd,
    productName,
    collections: [{ usagePage: 0xff00, usage: 1, featureReports: [{ reportId: 0, items: [{ reportSize: 8, reportCount: 2 }] }] }],
    opened: false,
    async open() { this.opened = true; },
    async close() { this.opened = false; },
    addEventListener() {},
    removeEventListener() {},
    async sendReport() {},
    async sendFeatureReport() {},
    async receiveFeatureReport() {
      const bytes = Uint8Array.from([0xaa, 0x21, 0x22, 0xbb]);
      return new DataView(bytes.buffer, 1, 2);
    },
  });

  const first = mockHidDevice('Device A');
  const second = mockHidDevice('Device B');
  let authorizedDevices = [];
  const hid = {
    async getDevices() { return authorizedDevices; },
    async requestDevice({ filters }) {
      assert.deepEqual(filters, [], 'Unknown VID/PID must not constrain the user picker');
      authorizedDevices = [first, second];
      return [first];
    },
  };

  const existing = Object.getOwnPropertyDescriptor(navigator, 'hid');
  Object.defineProperty(navigator, 'hid', { configurable: true, value: hid });

  try {
    const transport = new WebHidTransport();
    assert.deepEqual(await transport.enumerate(), [], 'No device without prior permission');

    const paired = await transport.requestDevice();
    assert.ok(paired);
    const devices = await transport.enumerate();
    assert.equal(devices.length, 2);
    assert.equal(devices[0].path, paired.path);
    assert.notEqual(devices[0].path, devices[1].path, 'Same VID/PID needs distinct paths');

    await transport.open(paired.path);
    assert.equal(transport.isOpen(), true);
    const report = await transport.getFeatureReport(0);
    assert.deepEqual([...report], [0x21, 0x22], 'Respect DataView byte offset and length');
    await transport.close();
    assert.equal(transport.isOpen(), false);
  } finally {
    if (existing) Object.defineProperty(navigator, 'hid', existing);
    else delete navigator.hid;
  }
});
