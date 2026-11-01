import test from 'node:test';
import assert from 'node:assert/strict';
import {readDeviceState} from '../src/lib/read-device-state.ts';
import {WebHidTransport} from '../src/lib/hid/webhid-transport.ts';
function fake(mutate=()=>{}) {
 const handlers=new Set(), sent=[];
 const device={vendorId:0x314b,productId:0x1026,sent,
  addEventListener(_,h){handlers.add(h)},removeEventListener(_,h){handlers.delete(h)},get listeners(){return handlers.size},
  async sendReport(id,p){
   sent.push([...p]);assert.equal(id,0);assert.equal(p.length,64);
   const r=new Uint8Array(64);r.set([250,p[1]|128,p[2],p[1]===0x2a?2:1,0,2,p[6],p[2]]);mutate(r,p);
   queueMicrotask(()=>{for(const h of handlers)h({reportId:0,data:new DataView(r.buffer)})});
  }};
 return device;
}
test('Device readback uses only captured getters, serial pages and both keymap selectors',async()=>{
 const d=fake(),snapshot=await readDeviceState(d);
 assert.equal(snapshot.sections.length,6);assert.equal(d.sent.length,8);assert.equal(d.listeners,0);
 assert.deepEqual([...new Set(d.sent.map(p=>p[1]))],[0x57,0x5e,0x2a,0x2b,0x2c]);
 for(const selector of [0,1]){
  const pages=d.sent.filter(p=>p[1]===0x2a&&p[6]===selector);
  assert.deepEqual(pages.map(p=>[p[2],p[3],p[5],p[6]]),[[1,1,1,selector],[2,2,1,selector]]);
 }
 assert.equal(snapshot.completeDeviceBackup,false);assert.equal(snapshot.restoreEnabled,false);
 assert.deepEqual(snapshot.sections[3].pages,[[1,1],[1,2]]);
});
test('Device readback rejects another keyboard before sending any report',async()=>{
 const d=fake();d.vendorId=0x3402;await assert.rejects(readDeviceState(d),/real APEX/);assert.equal(d.sent.length,0);
});
test('Invalid pagination stops the read without claiming a complete snapshot',async()=>{
 for(const count of [0,17]){const d=fake(r=>r[3]=count);await assert.rejects(readDeviceState(d),/pagination/);assert.equal(d.sent.length,1);assert.equal(d.listeners,0);}
});
test('Changing page total, empty payload and malformed reply fail closed',async()=>{
 for(const corrupt of [(r,p)=>{if(p[1]===0x2a&&p[2]===2)r[3]=3},r=>r[5]=0,r=>r[5]=59]){
  const d=fake(corrupt);await assert.rejects(readDeviceState(d),/pagination|mismatch/);assert.equal(d.listeners,0);
 }
});
test('A failed getter send cleans up listeners and never attempts a setter or retry',async()=>{
 const d=fake();d.sendReport=async(_,p)=>{d.sent.push([...p]);throw Error('disconnected')};await assert.rejects(readDeviceState(d),/disconnected/);assert.equal(d.sent.length,1);assert.equal(d.listeners,0);
});
test('Readback excludes simultaneous RGB writes and a second read, then releases the transport lock',async()=>{
 const d=fake();d.opened=true;d.collections=[{outputReports:[{reportId:0,items:[{reportSize:8,reportCount:64}]}]}];
 const transport=new WebHidTransport();transport._device=d;
 const pending=transport.readDeviceState();
 await assert.rejects(transport.applyRgb(1,[255,255,255],100,50),/already in progress/);
 await assert.rejects(transport.readDeviceState(),/already in progress/);
 await pending;
 assert.equal((await transport.readDeviceState()).sections.length,6);
 assert.ok(d.sent.every(p=>[0x57,0x5e,0x2a,0x2b,0x2c].includes(p[1])));
});
test('Readback failure releases the shared device lock for recovery',async()=>{
 const d=fake();d.opened=true;d.collections=[{outputReports:[{reportId:0,items:[{reportSize:8,reportCount:64}]}]}];
 const transport=new WebHidTransport();transport._device=d;const send=d.sendReport;
 d.sendReport=async()=>{throw Error('read failed')};await assert.rejects(transport.readDeviceState(),/read failed/);
 d.sendReport=send;assert.equal((await transport.readDeviceState()).sections.length,6);
});
