import test from 'node:test';
import assert from 'node:assert/strict';
import { DeviceManager } from '../src/lib/hid/device-manager.ts';
import { MockHidTransport } from '../src/lib/hid/mock-transport.ts';
import { encodeBulkCustomRgbReport, decodeBulkRgbReadback, parseResponseFrame } from '../src/lib/protocol/apex.ts';
test('Repeated connect uses transport path rather than serial number', async () => {
 const transport = new MockHidTransport(); let opens=0;
 const open=transport.open.bind(transport); transport.open=async p=>{opens++; await open(p);};
 const dm=new DeviceManager(transport); const [device]=await dm.scan();
 await dm.connect(device.path); await dm.connect(device.path); assert.equal(opens,1); await dm.disconnect(); dm.dispose();
});
test('64-byte candidate framing rejects oversized RGB and wrapping indices',()=>{
 assert.equal(encodeBulkCustomRgbReport(0,Array.from({length:14},()=>[0,1,2,3])).length,64);
 assert.throws(()=>encodeBulkCustomRgbReport(0,Array.from({length:15},()=>[0,1,2,3])));
 assert.throws(()=>decodeBulkRgbReadback(Uint8Array.from([255,0,1,2,3,0,1,2,3])));
 assert.equal(parseResponseFrame(new Uint8Array(129)),null);
});

import { loadDraft, parseDisplayDraft } from '../src/lib/display.ts';
test('Existing v1 display draft survives migration and rejects nonfinite transforms',()=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>k==='apex-control-display-v1'?JSON.stringify({title:'Saved',label:'L',value:'V',image:null}):null}});
 try { assert.equal(loadDraft().title,'Saved'); assert.equal(parseDisplayDraft({title:'T',label:'L',value:'V',image:null,imageSettings:{scale:NaN}}).imageSettings.scale,1); }
 finally { if(old)Object.defineProperty(globalThis,'localStorage',old);else delete globalThis.localStorage; }
});
