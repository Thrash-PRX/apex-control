import test from 'node:test';import assert from 'node:assert/strict';import layout from '../src/lib/device-rgb-layout.json' with {type:'json'};
import { playCustomRgb } from '../src/lib/play-custom-rgb.ts';
function fake(){const colors=Array.from({length:84},()=>[80,10,20,30]),handlers=new Set();let writes=0;return {vendorId:0x314b,productId:0x1026,colors,get writes(){return writes},addEventListener(_,h){handlers.add(h)},removeEventListener(_,h){handlers.delete(h)},async sendReport(_,p){const r=new Uint8Array(64);r.set([250,p[1]|128,p[2],1,0,1,0]);if(p[1]===22){r[3]=6;r[5]=57;r[6]=(p[2]-1)*14;for(let i=0;i<14;i++)r.set(colors[r[6]+i],7+i*4);}if(p[1]===16){writes++;for(const index of p.slice(10,6+p[5]))colors[index]=[...p.slice(6,10)];}queueMicrotask(()=>{for(const h of handlers)h({data:new DataView(r.buffer)});});}};}
function environment(storage){Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});Object.defineProperty(globalThis,'window',{configurable:true,value:{addEventListener(){},removeEventListener(){}}});}
const config={effect:'wheel',brightness:70,speed:80,primaryColor:{r:0,g:255,b:0}};
test('Bounded custom playback restores and verifies the complete active palette',async()=>{
 let backup;environment({setItem(k,v){backup=JSON.parse(v)}});const d=fake();await playCustomRgb(d,config,new AbortController().signal);assert.ok(d.writes>82);assert.equal(backup.records.length,84);for(const k of layout)assert.deepEqual(d.colors[k.index],[80,10,20,30]);delete globalThis.window;delete globalThis.localStorage;
});
test('Custom playback storage failure blocks all palette writes',async()=>{
 environment({setItem(){throw Error('Storage unavailable')}});const d=fake();await assert.rejects(playCustomRgb(d,config,new AbortController().signal),/Storage unavailable/);assert.equal(d.writes,0);delete globalThis.window;delete globalThis.localStorage;
});
