import test from 'node:test';import assert from 'node:assert/strict';
import { applyDeviceRgb } from '../src/lib/apply-device-rgb.ts';
function fake(){let record=[1,100,50,0,13,255,0,0],writes=[];const handlers=new Set();return {vendorId:0x314b,productId:0x1026,writes,addEventListener(_,h){handlers.add(h)},removeEventListener(_,h){handlers.delete(h)},async sendReport(id,p){writes.push([...p]);const r=new Uint8Array(64);r.set([250,p[1]|128,p[2],1,0,1,0]);if(p[1]===23){r[5]=8;r.set(record,6);}if(p[1]===19)record=[...p.slice(6,14)];queueMicrotask(()=>{for(const h of handlers)h({data:new DataView(r.buffer)});});}};}
test('RGB workflow backs up before mutations and verifies settings by readback',async()=>{
 let backup;Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{setItem(k,v){backup=JSON.parse(v)}}});const d=fake();await applyDeviceRgb(d,1,[0,255,0],50,80);assert.deepEqual(d.writes.map(p=>p[1]),[23,19,25,23]);assert.deepEqual(backup.records[0].rgb,[255,0,0]);assert.deepEqual(d.writes[1].slice(6,14),[1,50,80,0,13,0,255,0]);delete globalThis.localStorage;
});
test('Failed backup and unsupported modes prevent configuration writes',async()=>{
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{setItem(){throw Error('Storage full')}}});const d=fake();await assert.rejects(applyDeviceRgb(d,1,[0,255,0],50,80),/Storage full/);assert.deepEqual(d.writes.map(p=>p[1]),[23]);await assert.rejects(applyDeviceRgb(d,2,[0,0,0],50,80));delete globalThis.localStorage;
});
