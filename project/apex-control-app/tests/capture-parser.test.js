import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectUsbPcap } from '../../../research/tools/inspect-usbpcap.mjs';
function capture(address=3){
 const h=Buffer.alloc(24);h.writeUInt32LE(0xa1b2c3d4);h.writeUInt32LE(249,20);
 const p=Buffer.alloc(27+64);p.writeUInt16LE(27);p.writeUInt16LE(address,19);p[21]=0x84;p[22]=1;p.writeUInt32LE(64,23);p.set([0xfa,0x96,1,1,0,5,0,1,2,3,4],27);
 const r=Buffer.alloc(16);r.writeUInt32LE(p.length,8);r.writeUInt32LE(p.length,12);return Buffer.concat([h,r,p]);
}
test('USBPcap parser preserves report bytes and filters device address',()=>{
 const result=inspectUsbPcap(capture(),3);assert.equal(result.reports.length,1);assert.equal(result.reports[0].command,0x96);assert.equal(result.reports[0].bytes,64);assert.equal(result.reports[0].direction,'in');assert.equal(inspectUsbPcap(capture(),2).packets,0);
});
test('USBPcap parser rejects wrong format and identifies truncated records',()=>{
 assert.throws(()=>inspectUsbPcap(Buffer.alloc(24),3));const c=capture();assert.equal(inspectUsbPcap(c.subarray(0,c.length-1),3).truncated,true);
 c.writeUInt16LE(200,40);assert.throws(()=>inspectUsbPcap(c,3),/header|Incomplete/);
});

