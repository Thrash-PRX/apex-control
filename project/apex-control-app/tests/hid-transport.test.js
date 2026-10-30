import test from 'node:test';
import assert from 'node:assert/strict';

import { MockHidTransport } from '../src/lib/hid/mock-transport.ts';
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
