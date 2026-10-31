import test from 'node:test';import assert from 'node:assert/strict';import layout from '../src/lib/device-rgb-layout.json' with {type:'json'};
import { playCustomRgb } from '../src/lib/play-custom-rgb.ts';
function fake(){const colors=Array.from({length:84},()=>[80,10,20,30]),handlers=new Set();let writes=0,lastPaletteWrite=-Infinity,bulkCount=0,lastBulkWrite=-Infinity;return {vendorId:0x314b,productId:0x1026,colors,get writes(){return writes},get bulkCount(){return bulkCount},addEventListener(_,h){handlers.add(h)},removeEventListener(_,h){handlers.delete(h)},async sendReport(_,p){const r=new Uint8Array(64);r.set([250,p[1]|128,p[2],1,0,1,0]);if(p[1]===22){r[3]=6;r[5]=57;r[6]=(p[2]-1)*14;for(let i=0;i<14;i++)r.set(colors[r[6]+i],7+i*4);}if(p[1]===17){if(this.failBulk)throw Error('Bulk unsupported');r[3]=p[3];bulkCount++;const dropped=performance.now()-lastBulkWrite<(this.minBulkGap??0);if(!dropped)lastBulkWrite=performance.now();for(let j=0;j<(p[5]-1)/4&&!dropped;j++)colors[p[6]+j]=[...p.slice(7+j*4,11+j*4)];if(this.onBulk)this.onBulk(bulkCount);}if(p[1]===16){if(performance.now()-lastPaletteWrite<45)throw Error('Simulated firmware busy from burst writes');lastPaletteWrite=performance.now();writes++;for(const index of p.slice(10,6+p[5]))colors[index]=[...p.slice(6,10)];}queueMicrotask(()=>{for(const h of handlers)h({data:new DataView(r.buffer)});});}};}
function environment(storage){Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});Object.defineProperty(globalThis,'window',{configurable:true,value:{addEventListener(){},removeEventListener(){}}});}
const config={effect:'wheel',brightness:70,speed:80,primaryColor:{r:0,g:255,b:0}};
test('Bounded custom playback restores and verifies the complete active palette',async()=>{
 let backup;environment({setItem(k,v){backup=JSON.parse(v)}});const d=fake();await playCustomRgb(d,config,new AbortController().signal);assert.ok(d.writes>2);assert.equal(backup.records.length,84);for(const k of layout)assert.deepEqual(d.colors[k.index],[80,10,20,30]);delete globalThis.window;delete globalThis.localStorage;
});
test('Custom playback storage failure blocks all palette writes',async()=>{
 environment({setItem(){throw Error('Storage unavailable')}});const d=fake();await assert.rejects(playCustomRgb(d,config,new AbortController().signal),/Storage unavailable/);assert.equal(d.writes,0);delete globalThis.window;delete globalThis.localStorage;
});


test('Restore-only recovers the original snapshot without changing backup history',async()=>{
 const rows=Array.from({length:84},(_,i)=>[i,[80,1,2,3]]);
 environment({getItem(){return JSON.stringify([{records:rows}])},setItem(){throw Error('Restore must not overwrite original backup')}});
 const d=fake();await playCustomRgb(d,{...config,effect:'native_layer'},new AbortController().signal,true);
 for(const k of layout)assert.deepEqual(d.colors[k.index],[80,1,2,3]);
 assert.equal(d.writes,2);delete globalThis.window;delete globalThis.localStorage;
});

test('Bulk palette probe checks readback before loop and restores after cancellation',async()=>{
 environment({setItem(){}});const d=fake(),controller=new AbortController();d.onBulk=n=>{if(n===6)controller.abort()};
 await playCustomRgb(d,config,controller.signal,false,true);assert.equal(d.bulkCount,6);for(const k of layout)assert.deepEqual(d.colors[k.index],[80,10,20,30]);delete globalThis.window;delete globalThis.localStorage;
});
test('Unsupported bulk transfer fails without animation and restores through captured grouped writes',async()=>{
 environment({setItem(){}});const d=fake();d.failBulk=true;await assert.rejects(playCustomRgb(d,config,new AbortController().signal,false,true),/Bulk unsupported/);assert.equal(d.bulkCount,0);for(const k of layout)assert.deepEqual(d.colors[k.index],[80,10,20,30]);delete globalThis.window;delete globalThis.localStorage;
});

test('Bulk probe verifies every active chunk and increases spacing when writes are dropped',async()=>{
 environment({setItem(){}});const d=fake(),c=new AbortController();d.minBulkGap=70;d.onBulk=n=>{if(n===18)c.abort()};
 await playCustomRgb(d,config,c.signal,false,true);assert.equal(d.bulkCount,18);for(const k of layout)assert.deepEqual(d.colors[k.index],[80,10,20,30]);delete globalThis.window;delete globalThis.localStorage;
});

test('Continuous playback completes the current frame on Stop and restores original colors',async()=>{
 const saved=new Map();environment({setItem(k,v){saved.set(k,v)}});const d=fake(),c=new AbortController();d.onBulk=n=>{if(n===18)c.abort()};
 await playCustomRgb(d,config,c.signal,false,true,true);assert.equal(d.bulkCount,18);assert.equal(JSON.parse(saved.get('apex-last-playback-metrics-v1')).frames,2);for(const k of layout)assert.deepEqual(d.colors[k.index],[80,10,20,30]);delete globalThis.window;delete globalThis.localStorage;
});
