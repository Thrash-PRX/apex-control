import test from 'node:test';
import assert from 'node:assert/strict';
import { reportLengths } from '../src/lib/hid/descriptors.ts';
import { WebHidTransport } from '../src/lib/hid/webhid-transport.ts';
import { DeviceManager } from '../src/lib/hid/device-manager.ts';
import { encodeCustomRgbReport, decodeTriggerPayload } from '../src/lib/protocol/apex.ts';
import { parseDisplayDraft, defaultDisplay } from '../src/lib/display.ts';

test('Descriptor report bits aggregate across nested collections and report IDs', () => {
  const collections = [{ outputReports: [{ reportId: 0, items: [{ reportSize: 1, reportCount: 3 }] }], children: [{ outputReports: [{ reportId: 0, items: [{ reportSize: 1, reportCount: 5 }] }, { reportId: 2, items: [{ reportSize: 8, reportCount: 64 }] }] }] }];
  assert.deepEqual([...reportLengths(collections, 'outputReports')], [[0, 1], [2, 64]]);
  assert.equal(reportLengths(collections, 'featureReports').size, 0);
});

test('WebHID default pairing, repeated open, unplug, missing feature report and write lock', async () => {
  const bus = new EventTarget(); const device = new EventTarget(); let writes = 0;
  Object.assign(device, { vendorId: 0x314b, productId: 0x1026, productName: 'APEX200', opened: false,
    collections: [{ usagePage: 0xff02, usage: 2, inputReports: [{ reportId: 0, items: [{ reportSize: 8, reportCount: 64 }] }], outputReports: [{ reportId: 0, items: [{ reportSize: 8, reportCount: 64 }] }] }],
    async open() { this.opened = true; }, async close() { this.opened = false; },
    async sendReport() { writes++; }, async sendFeatureReport() { writes++; }, async receiveFeatureReport() { writes++; }
  });
  Object.assign(bus, { async getDevices() { return [device]; }, async requestDevice({ filters }) { assert.deepEqual(filters, [DeviceManager.DEFAULT_FILTER]); return [device]; } });
  const original = Object.getOwnPropertyDescriptor(navigator, 'hid');
  Object.defineProperty(navigator, 'hid', { configurable: true, value: bus });
  const transport = new WebHidTransport(); const manager = new DeviceManager(transport);
  try {
    const paired = await manager.requestDevice();
    assert.equal(paired.maxOutputReportLength, 64); assert.equal(paired.maxFeatureReportLength, 0);
    assert.equal(paired.interfaceNumber, -1); assert.equal(paired.manufacturer, 'Unknown');
    let received = 0; transport.on(e => { if (e.type === 'data-received') received++; });
    await manager.connect(paired.path); await transport.open(paired.path);
    const input = new Event('inputreport'); Object.assign(input, { reportId: 0, data: new DataView(new Uint8Array([1,2]).buffer) }); device.dispatchEvent(input);
    assert.equal(received, 1);
    await manager.scan(); assert.equal(manager.connection.state, 'connected');
    await assert.rejects(transport.sendOutputReport(0, new Uint8Array(64)), /locked/);
    await assert.rejects(transport.sendFeatureReport(0, new Uint8Array(64)), /locked/);
    await assert.rejects(transport.getFeatureReport(0), /not declared/); assert.equal(writes, 0);
    const unplug = new Event('disconnect'); Object.assign(unplug, { device }); bus.dispatchEvent(unplug);
    assert.equal(manager.connection.state, 'disconnected'); assert.equal(transport.isOpen(), false);
    device.dispatchEvent(input); assert.equal(received, 1);
    await manager.connect(paired.path); await manager.disconnect();
  } finally { manager.dispose(); if (original) Object.defineProperty(navigator, 'hid', original); else delete navigator.hid; }
});

test('Static RGB fixture matches documented byte order without HIDAPI prefix', () => {
  const frame = encodeCustomRgbReport(50, [255, 17, 0], [34, 49]);
  assert.equal(frame.length, 64);
  assert.deepEqual([...frame.slice(0,12)], [250,16,1,1,0,6,50,255,17,0,34,49]);
  assert.ok(frame.slice(12).every(x => x === 0));
  assert.throws(() => encodeCustomRgbReport(256, [0,0,0], [1]));
  assert.throws(() => encodeCustomRgbReport(0, [0,0,0], []));
  assert.throws(() => encodeCustomRgbReport(0, [0,0,0], [1,1]));
  assert.throws(() => encodeCustomRgbReport(0, [0,0,0], Array.from({length:55},(_,i)=>i)));
});

test('Trigger decoder respects sliced views, little endian and truncated records', () => {
  const bytes = Uint8Array.from([99,34,0x34,0x12,1,0,2,1,4,3,99]);
  assert.deepEqual(decodeTriggerPayload(bytes.subarray(1,10)), [{ index:34, threshold:0x1234, field4:true, field5:false, field6:258, field8:772 }]);
  assert.throws(() => decodeTriggerPayload(bytes.subarray(1,9)));
  assert.throws(() => decodeTriggerPayload(new Uint8Array(0)));
  const overflow = new Uint8Array(17); overflow[0]=255; assert.throws(() => decodeTriggerPayload(overflow));
});

test('Display drafts validate persisted data and reject active/oversized image content', () => {
  assert.deepEqual(parseDisplayDraft(defaultDisplay), defaultDisplay);
  assert.throws(() => parseDisplayDraft({...defaultDisplay, title:'x'.repeat(65)}));
  assert.throws(() => parseDisplayDraft({...defaultDisplay, image:'data:image/svg+xml;base64,AAAA'}));
  assert.throws(() => parseDisplayDraft({...defaultDisplay, image:'https://example.com/a.png'}));
  assert.throws(() => parseDisplayDraft(null));
  assert.equal(parseDisplayDraft({...defaultDisplay, image:'data:image/png;base64,AAAA'}).image, 'data:image/png;base64,AAAA');
});
