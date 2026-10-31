import test from 'node:test';
import assert from 'node:assert/strict';
import {playNativeColorCycle,restoreNativeColorCycle} from '../src/lib/native-color-cycle.ts';
import {playCustomRgb} from '../src/lib/play-custom-rgb.ts';
const original=[1,80,50,7,13,10,20,30],config={effect:'color_cycle',speed:50,brightness:100,primaryColor:{r:255,g:0,b:0}};
function fake(){const handlers=new Set();return {vendorId:0x314b,productId:0x1026,record:[...original],writes:[],addEventListener(_,h){handlers.add(h)},removeEventListener(_,h){handlers.delete(h)},async sendReport(_,p){const r=new Uint8Array(64);r.set([250,p[1]|128,p[2],1,0,1,0]);if(p[1]===23){r[5]=8;r.set(this.record,6);}else{this.writes.push([...p]);if(p[1]===19){if(this.dropNext)this.dropNext=false;else this.record=[...p.slice(6,14)];this.onWrite?.();}}queueMicrotask(()=>{for(const h of handlers)h({data:new DataView(r.buffer)});});}};}
function environment(storage){Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});Object.defineProperty(globalThis,'window',{configurable:true,value:{dispatchEvent(){}}});}
function storage(){const values=new Map();return {values,getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};}
test('Native color cycle uses one captured Static write per frame and restores exact unknown fields',async()=>{
 const saved=storage();environment(saved);const d=fake(),c=new AbortController();d.onWrite=()=>c.abort();
 await playNativeColorCycle(d,config,c.signal,true);
 assert.deepEqual(d.record,original);assert.deepEqual(d.writes.filter(p=>p[1]===25).map(p=>p[6]),[1,255]);
 const frames=d.writes.filter(p=>p[1]===19);assert.equal(frames.length,2);assert.deepEqual(frames[0].slice(8,11),original.slice(2,5));assert.equal(frames[0][7],100);
 assert.ok(d.writes.every(p=>[19,25].includes(p[1])));assert.equal(JSON.parse(saved.getItem('apex-native-color-cycle-backup-v1')).pending,false);
 assert.equal(JSON.parse(saved.getItem('apex-last-playback-metrics-v1')).transfer,'native-static13');
});
test('Native cycle backup failure prevents any mode selection or configuration write',async()=>{
 environment({getItem(){},setItem(){throw Error('Storage unavailable')}});const d=fake();await assert.rejects(playNativeColorCycle(d,config,new AbortController().signal,true),/Storage unavailable/);assert.equal(d.writes.length,0);
});
test('Dropped native color write fails readback, restores settings and clears pending recovery',async()=>{
 const saved=storage();environment(saved);const d=fake();d.dropNext=true;
 await assert.rejects(playNativeColorCycle(d,config,new AbortController().signal,true),/readback mismatch/);assert.deepEqual(d.record,original);assert.equal(JSON.parse(saved.getItem('apex-native-color-cycle-backup-v1')).pending,false);
});
test('Restore control recovers interrupted native cycle without needing a custom palette backup',async()=>{
 const saved=storage();saved.setItem('apex-native-color-cycle-backup-v1',JSON.stringify({version:1,device:'314B:1026',pending:true,record:original}));environment(saved);
 const d=fake();d.record=[1,100,50,7,13,255,0,0];await playCustomRgb(d,config,new AbortController().signal,true);assert.deepEqual(d.record,original);assert.equal(JSON.parse(saved.getItem('apex-native-color-cycle-backup-v1')).pending,false);
 saved.setItem('apex-native-color-cycle-backup-v1',JSON.stringify({version:1,device:'314B:1026',pending:true,record:[1]}));const count=d.writes.length;await assert.rejects(restoreNativeColorCycle(d),/Invalid native/);assert.equal(d.writes.length,count);
});
test('Failed native restoration retains a pending backup and can recover after reconnect',async()=>{
 const saved=storage();environment(saved);const d=fake(),c=new AbortController();let count=0;
 d.onWrite=()=>{if(++count===1){d.dropNext=true;c.abort();}};
 await assert.rejects(playNativeColorCycle(d,config,c.signal,true),/restore readback mismatch/);
 assert.equal(JSON.parse(saved.getItem('apex-native-color-cycle-backup-v1')).pending,true);
 d.onWrite=undefined;assert.equal(await restoreNativeColorCycle(d),true);assert.deepEqual(d.record,original);assert.equal(JSON.parse(saved.getItem('apex-native-color-cycle-backup-v1')).pending,false);
});
