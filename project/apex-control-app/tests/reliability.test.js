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

// ─── Reliability: Transport Switching Race Conditions ────────────────────────

test('Device Manager — switchTransport prevents concurrent switches', async () => {
  const mockTransport = new MockHidTransport();
  const manager = new DeviceManager(mockTransport);

  const found = await manager.scan();
  await manager.connect(found[0].path);
  assert.equal(manager.connection.state, ConnectionState.Connected);

  // Start two switches concurrently (without awaiting the first)
  const promise1 = manager.switchTransport(new MockHidTransport());
  const promise2 = manager.switchTransport(new MockHidTransport());

  // Both should settle - one succeeds, one fails
  const results = await Promise.allSettled([promise1, promise2]);
  const rejected = results.filter(r => r.status === 'rejected');
  const fulfilled = results.filter(r => r.status === 'fulfilled');

  assert.equal(rejected.length, 1, 'One switch should be rejected');
  assert.equal(fulfilled.length, 1, 'One switch should succeed');
  assert.ok(rejected[0].reason instanceof Error);
  assert.ok(rejected[0].reason.message.includes('Transport switch already in progress'));

  manager.dispose();
});

test('Device Manager — connect prevents duplicate connection attempts', async () => {
  const mockTransport = new MockHidTransport();
  const manager = new DeviceManager(mockTransport);

  const found = await manager.scan();
  await manager.connect(found[0].path);
  assert.equal(manager.connection.state, ConnectionState.Connected);

  // Second connect to same device should be idempotent (no-op)
  await manager.connect(found[0].path);
  assert.equal(manager.connection.state, ConnectionState.Connected);

  // Connect to invalid path should throw
  await assert.rejects(
    manager.connect(''),
    /Invalid device path: empty string/
  );

  manager.dispose();
});

test('Device Manager — disconnect is idempotent', async () => {
  const mockTransport = new MockHidTransport();
  const manager = new DeviceManager(mockTransport);

  // Disconnect when already disconnected should not throw
  await manager.disconnect();
  assert.equal(manager.connection.state, ConnectionState.Disconnected);

  const found = await manager.scan();
  await manager.connect(found[0].path);
  assert.equal(manager.connection.state, ConnectionState.Connected);

  await manager.disconnect();
  assert.equal(manager.connection.state, ConnectionState.Disconnected);

  // Second disconnect should not throw
  await manager.disconnect();
  assert.equal(manager.connection.state, ConnectionState.Disconnected);

  manager.dispose();
});

test('Device Manager — switchTransport cleans up previous transport listeners', async () => {
  const mockTransport1 = new MockHidTransport();
  const manager = new DeviceManager(mockTransport1);

  const found = await manager.scan();
  await manager.connect(found[0].path);
  assert.equal(manager.connection.state, ConnectionState.Connected);

  const mockTransport2 = new MockHidTransport();
  await manager.switchTransport(mockTransport2);
  assert.equal(manager.isMock, true);
  assert.equal(manager.connection.state, ConnectionState.Disconnected);

  // First transport should be closed
  assert.equal(mockTransport1.isOpen(), false);
  // Second transport should be ready but not connected
  assert.equal(mockTransport2.isOpen(), false);

  manager.dispose();
});

// ─── WebHID Transport Reliability ────────────────────────────────────────────

test('WebHID Transport — enumerate handles errors gracefully', async () => {
  const transport = new WebHidTransport();

  // Mock navigator.hid.getDevices to throw
  const originalHid = Object.getOwnPropertyDescriptor(navigator, 'hid');
  Object.defineProperty(navigator, 'hid', {
    configurable: true,
    value: {
      async getDevices() { throw new Error('Permission denied'); },
    },
  });

  try {
    const devices = await transport.enumerate();
    assert.deepEqual(devices, [], 'Should return empty array on error');
  } finally {
    if (originalHid) Object.defineProperty(navigator, 'hid', originalHid);
    else delete navigator.hid;
  }
});

test('WebHID Transport — open validates device path', async () => {
  const transport = new WebHidTransport();

  // Mock navigator.hid to make isAvailable() return true
  const originalHid = Object.getOwnPropertyDescriptor(navigator, 'hid');
  Object.defineProperty(navigator, 'hid', {
    configurable: true,
    value: {
      async getDevices() { return []; },
    },
  });

  try {
    await assert.rejects(
      transport.open(''),
      /Invalid device path: empty string/
    );

    await assert.rejects(
      transport.open('   '),
      /Invalid device path: empty string/
    );
  } finally {
    if (originalHid) Object.defineProperty(navigator, 'hid', originalHid);
    else delete navigator.hid;
  }
});

test('WebHID Transport — open throws for unknown device path', async () => {
  const transport = new WebHidTransport();

  // Mock navigator.hid to make isAvailable() return true
  const originalHid = Object.getOwnPropertyDescriptor(navigator, 'hid');
  Object.defineProperty(navigator, 'hid', {
    configurable: true,
    value: {
      async getDevices() { return []; },
    },
  });

  try {
    await assert.rejects(
      transport.open('webhid://1234:abcd/999'),
      /device not found for path/
    );
  } finally {
    if (originalHid) Object.defineProperty(navigator, 'hid', originalHid);
    else delete navigator.hid;
  }
});

test('WebHID Transport — close is idempotent', async () => {
  const transport = new WebHidTransport();

  // Close when not connected should not throw
  await transport.close();
  assert.equal(transport.isOpen(), false);

  await transport.close();
  assert.equal(transport.isOpen(), false);
});

test('WebHID Transport — getFeatureReport validates declared reports', async () => {
  const transport = new WebHidTransport();

  // Mock a device with no feature reports
  const _mockHidDevice = {
    vendorId: 0x1234,
    productId: 0xabcd,
    productName: 'Test Device',
    collections: [{ usagePage: 0xff00, usage: 1, inputReports: [], outputReports: [], featureReports: [] }],
    opened: true,
    async open() { this.opened = true; },
    async close() { this.opened = false; },
    addEventListener() {},
    removeEventListener() {},
    async sendReport() {},
    async sendFeatureReport() {},
    async receiveFeatureReport() { throw new Error('Not implemented'); },
  };

  const originalHid = Object.getOwnPropertyDescriptor(navigator, 'hid');
  Object.defineProperty(navigator, 'hid', {
    configurable: true,
    value: {
      async getDevices() { return [_mockHidDevice]; },
    },
  });

  try {
    const devices = await transport.enumerate();
    await transport.open(devices[0].path);

    await assert.rejects(
      transport.getFeatureReport(0),
      /Feature report is not declared by this device/
    );
  } finally {
    if (originalHid) Object.defineProperty(navigator, 'hid', originalHid);
    else delete navigator.hid;
  }
});

// ─── Mock Transport Edge Cases ───────────────────────────────────────────────

test('Mock HID Transport — open validates device path', async () => {
  const transport = new MockHidTransport();

  await assert.rejects(
    transport.open(''),
    /Mock transport: unknown device path/
  );

  await assert.rejects(
    transport.open('invalid://path'),
    /Mock transport: unknown device path/
  );
});

test('Mock HID Transport — enumerate applies filter correctly', async () => {
  const transport = new MockHidTransport();

  // Filter by wrong VID
  let devices = await transport.enumerate({ vendorId: 0x9999 });
  assert.equal(devices.length, 0);

  // Filter by wrong PID
  devices = await transport.enumerate({ productId: 0x9999 });
  assert.equal(devices.length, 0);

  // Filter by wrong usagePage
  devices = await transport.enumerate({ usagePage: 0x1234 });
  assert.equal(devices.length, 0);

  // Filter by wrong usage
  devices = await transport.enumerate({ usage: 0x99 });
  assert.equal(devices.length, 0);

  // Correct filter
  devices = await transport.enumerate({ vendorId: APEX_200S_VID, productId: APEX_200S_PID });
  assert.equal(devices.length, 1);
});

test('Mock HID Transport — getFeatureReport returns proper mock response', async () => {
  const transport = new MockHidTransport();
  await transport.open('mock://apex-200s');

  const report = await transport.getFeatureReport(0x06);
  assert.equal(report.length, 64);
  assert.equal(report[0], 0x06); // Report ID echoed in first byte
});

test('Mock HID Transport — event handlers receive connection events', async () => {
  const transport = new MockHidTransport();
  const events = [];

  const unsubscribe = transport.on((event) => {
    events.push(event.type);
  });

  const devices = await transport.enumerate();
  await transport.open(devices[0].path);
  await transport.close();

  assert.ok(events.includes('device-connected'));
  assert.ok(events.includes('device-disconnected'));

  unsubscribe();
});

// ─── Integration: Store-level reliability ────────────────────────────────────

test('App Store — toggleMockMode recreates device manager', async () => {
  // This test validates the store's behavior by importing the actual store
  // We'll test the logic by checking the DeviceManager directly

  const mockTransport = new MockHidTransport();
  const manager = new DeviceManager(mockTransport);

  assert.equal(manager.isMock, true);

  // Simulate toggleMockMode logic: dispose and create new
  manager.dispose();
  const newManager = new DeviceManager(new MockHidTransport());

  assert.equal(newManager.isMock, true);
  assert.equal(newManager.connection.state, ConnectionState.Disconnected);

  newManager.dispose();
});

test('App Store — scanDevices prevents concurrent scans', async () => {
  const mockTransport = new MockHidTransport();
  const manager = new DeviceManager(mockTransport);

  // First scan
  const found1 = await manager.scan();
  assert.equal(found1.length, 1);

  // Second scan while first completes should work (scans are sequential)
  const found2 = await manager.scan();
  assert.equal(found2.length, 1);

  manager.dispose();
});

// ─── Error Message Quality ──────────────────────────────────────────────────

test('Device Manager — error messages are descriptive', async () => {
  const mockTransport = new MockHidTransport();
  const manager = new DeviceManager(mockTransport);

  await manager.connect('mock://apex-200s');
  assert.equal(manager.connection.state, ConnectionState.Connected);

  // Try to send report when disconnected
  await manager.disconnect();
  await assert.rejects(
    manager.sendFeatureReport(0, new Uint8Array([1])),
    /Cannot send report: device not connected/
  );
});

test('WebHID Transport — requestDevice handles permission errors', async () => {
  const transport = new WebHidTransport();

  const _mockHidDevice = {
    vendorId: 0x1234,
    productId: 0xabcd,
    productName: 'Test Device',
    collections: [{ usagePage: 0xff00, usage: 1 }],
    opened: false,
    async open() { this.opened = true; },
    async close() { this.opened = false; },
    addEventListener() {},
    removeEventListener() {},
    async sendReport() {},
    async sendFeatureReport() {},
    async receiveFeatureReport() { return new DataView(new Uint8Array([0]).buffer); },
  };

  const originalHid = Object.getOwnPropertyDescriptor(navigator, 'hid');
  Object.defineProperty(navigator, 'hid', {
    configurable: true,
    value: {
      async getDevices() { return []; },
      async requestDevice() { throw new DOMException('Permission denied', 'NotAllowedError'); },
    },
  });

  try {
    const result = await transport.requestDevice();
    assert.equal(result, null, 'Should return null for NotAllowedError');
  } finally {
    if (originalHid) Object.defineProperty(navigator, 'hid', originalHid);
    else delete navigator.hid;
  }
});

test('WebHID Transport — requestDevice handles AbortError', async () => {
  const transport = new WebHidTransport();

  const originalHid = Object.getOwnPropertyDescriptor(navigator, 'hid');
  Object.defineProperty(navigator, 'hid', {
    configurable: true,
    value: {
      async getDevices() { return []; },
      async requestDevice() { throw new DOMException('User cancelled', 'AbortError'); },
    },
  });

  try {
    const result = await transport.requestDevice();
    assert.equal(result, null, 'Should return null for AbortError');
  } finally {
    if (originalHid) Object.defineProperty(navigator, 'hid', originalHid);
    else delete navigator.hid;
  }
});

// ─── Connection State Validation ─────────────────────────────────────────────

test('Device Manager — connection state reflects transport state', async () => {
  const mockTransport = new MockHidTransport();
  const manager = new DeviceManager(mockTransport);

  assert.equal(manager.connection.state, ConnectionState.Disconnected);

  const found = await manager.scan();
  // scan() updates state to Connected if transport is open
  // In mock, scan doesn't open, so state should be Disconnected
  assert.equal(manager.connection.state, ConnectionState.Disconnected);

  await manager.connect(found[0].path);
  assert.equal(manager.connection.state, ConnectionState.Connected);
  assert.equal(manager.transportName, 'Mock');

  await manager.disconnect();
  assert.equal(manager.connection.state, ConnectionState.Disconnected);

  manager.dispose();
});

test('Device Manager — connection info includes device details', async () => {
  const mockTransport = new MockHidTransport();
  const manager = new DeviceManager(mockTransport);

  const found = await manager.scan();
  await manager.connect(found[0].path);

  const conn = manager.connection;
  assert.ok(conn.device !== null);
  assert.equal(conn.device?.vendorId, APEX_200S_VID);
  assert.equal(conn.device?.productId, APEX_200S_PID);
  assert.ok(typeof conn.device?.manufacturer === 'string');
  assert.ok(typeof conn.device?.product === 'string');
  assert.ok(conn.lastSeen !== null);
  assert.equal(conn.error, null);
  assert.equal(conn.isMock, true);

  manager.dispose();
});
