import test from 'node:test';
import assert from 'node:assert/strict';
import {applyDeviceActuation,restoreDeviceActuation,readTriggerTable,ACTUATION_BACKUP_KEY} from '../src/lib/device-actuation.ts';
import { WebHidTransport } from '../src/lib/hid/webhid-transport.ts';
function rig() {
 const handlers=new Set(),values=new Map(),sent=[];
 const table=Array.from({length:84},(_,i)=>[240,0,i===34?1:0,i===34?1:0,i===34?240:170,0,100,0]);
 const original=structuredClone(table);
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const device={vendorId:0x314b,productId:0x1026,hook:null,table,sent,addEventListener(_,h){handlers.add(h)},removeEventListener(_,h){handlers.delete(h)},async sendReport(id,p){
  assert.equal(id,0);assert.equal(p.length,64);sent.push([...p]);const r=new Uint8Array(64);
  if(p[1]===0x2c){const start=(p[2]-1)*7,records=table.slice(start,start+7);r.set([250,0xac,p[2],12,0,1+records.length*8,start,...records.flat()]);}
  else if(p[1]===0x26){for(const i of p.slice(8,6+p[5]))table[i].splice(0,2,p[6],p[7]);r.set([250,0xa6,1,1,0,1,0]);}
  else throw Error('Unexpected command');
  device.hook?.(p,r);
  queueMicrotask(()=>{for(const h of handlers)h({reportId:0,data:new DataView(r.buffer)})});
 }};
 return {device,storage,table,original,values,sent};
}
test('Captured W actuation241 packet, full-table verification and original240 restore',async()=>{
 const r=rig();await applyDeviceActuation(r.device,241,[34],r.storage);
 const setter=r.sent.find(p=>p[1]===0x26);assert.deepEqual(setter,[250,38,1,1,0,3,241,0,34,...Array(55).fill(0)]);
 assert.equal(r.table[34][0],241);assert.deepEqual(r.table[34].slice(2),r.original[34].slice(2));
 assert.deepEqual(r.table.filter((_,i)=>i!==34),r.original.filter((_,i)=>i!==34));assert.ok(r.values.has(ACTUATION_BACKUP_KEY));
 await restoreDeviceActuation(r.device,r.storage);assert.deepEqual(r.table,r.original);assert.equal(r.values.has(ACTUATION_BACKUP_KEY),false);
});
test('Actuation refuses unestablished bounds, duplicate/inactive keys and wrong device before I/O',async()=>{
 for(const [raw,keys] of [[9,[34]],[360,[34]],[240.5,[34]],[241,[]],[241,[34,34]],[241,[14]],[241,[15]],[241,[84]]]){const r=rig();await assert.rejects(applyDeviceActuation(r.device,raw,keys,r.storage));assert.equal(r.sent.length,0);}
 const r=rig();r.device.vendorId=0x3402;await assert.rejects(applyDeviceActuation(r.device,241,[34],r.storage));assert.equal(r.sent.length,0);
});
test('Backup failure prevents any threshold write',async()=>{
 const r=rig();r.storage.setItem=()=>{throw Error('storage full')};await assert.rejects(applyDeviceActuation(r.device,241,[34],r.storage),/storage full/);assert.ok(r.sent.every(p=>p[1]===0x2c));assert.deepEqual(r.table,r.original);
});
test('Lost write acknowledgement restores old values without retrying the target write',async()=>{
 const r=rig();let first=true;r.device.hook=p=>{if(p[1]===0x26&&first){first=false;throw Error('lost ack')}};
 await assert.rejects(applyDeviceActuation(r.device,241,[34],r.storage),/restored and verified/);assert.deepEqual(r.table,r.original);
 assert.deepEqual(r.sent.filter(p=>p[1]===0x26).map(p=>p[6]),[241,240]);
});
test('Unexpected RT or neighboring-key changes cannot pass verification or be overwritten by recovery',async()=>{
 const r=rig();r.device.hook=p=>{if(p[1]===0x26)r.table[2][2]=1};
 await assert.rejects(applyDeviceActuation(r.device,241,[34],r.storage),/restoration was not confirmed/);assert.ok(r.values.has(ACTUATION_BACKUP_KEY));assert.equal(r.table[2][2],1);
});
test('Manual restore rejects stale state and a second Apply requires recovery first',async()=>{
 const r=rig();await applyDeviceActuation(r.device,241,[34],r.storage);const n=r.sent.length;
 await assert.rejects(applyDeviceActuation(r.device,242,[34],r.storage),/Restore the previous/);assert.equal(r.sent.length,n);
 r.table[3][4]=171;await assert.rejects(restoreDeviceActuation(r.device,r.storage),/changed since/);assert.equal(r.sent.filter(p=>p[1]===0x26).length,1);
});
test('Missing or duplicated trigger records fail before any actuation mutation',async()=>{
 for(const hook of [(p,r)=>{if(p[1]===0x2c)r[3]=11},(p,r)=>{if(p[1]===0x2c&&p[2]===2)r[6]=0}]){
  const r=rig();r.device.hook=hook;await assert.rejects(readTriggerTable(r.device),/Incomplete|Duplicate/);assert.ok(r.sent.every(p=>p[1]===0x2c));
 }
});
test('WebHID actuation entry point applies, blocks overlapping operations and restores the saved table',async()=>{
 const r=rig();r.device.opened=true;r.device.collections=[{outputReports:[{reportId:0,items:[{reportSize:8,reportCount:64}]}]}];
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');Object.defineProperty(globalThis,'localStorage',{value:r.storage,configurable:true});
 try{
  const t=new WebHidTransport();t._device=r.device;
  const pending=t.applyActuation(241,[34]);await assert.rejects(t.readActuation(),/already in progress/);await pending;
  assert.equal(r.table[34][0],241);await t.applyActuation(0,[],true);assert.deepEqual(r.table,r.original);
 }finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else delete globalThis.localStorage;}
});
