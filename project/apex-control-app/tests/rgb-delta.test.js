import test from 'node:test';
import assert from 'node:assert/strict';
import {planPaletteDelta} from '../src/lib/rgb-delta.ts';
import layout from '../src/lib/device-rgb-layout.json' with {type:'json'};
const ids=layout.map(k=>k.index),palette=()=>new Map(ids.map(i=>[i,[100,0,0,0]]));
function apply(previous,plan){const actual=new Map([...previous].map(([i,r])=>[i,[...r]]));for(const p of plan){assert.ok(p.payload.length<=58);assert.ok(p.indices.every(i=>ids.includes(i)));if(p.command===16)for(const i of p.indices)actual.set(i,p.payload.slice(0,4));else for(let n=0;n<p.indices.length;n++)actual.set(p.indices[n],p.payload.slice(1+n*4,5+n*4));}return actual;}
test('Delta skips identical frames and groups a whole-board color into two captured writes',()=>{
 const before=palette(),after=new Map(ids.map(i=>[i,[100,255,25,50]]));assert.deepEqual(planPaletteDelta(before,before,ids),[]);
 const p=planPaletteDelta(before,after,ids);assert.equal(p.length,2);assert.ok(p.every(p=>p.command===16));assert.deepEqual(apply(before,p),after);
});
test('A moving twelve-key trail needs one bulk packet rather than six full-palette packets',()=>{
 const before=palette(),after=palette();for(let i=34;i<46;i++)after.set(i,[100,i*5,255-i*3,i]);
 const p=planPaletteDelta(before,after,ids);assert.equal(p.length,1);assert.equal(p[0].command,17);assert.deepEqual(apply(before,p),after);
});
test('Delta preserves unchanged bridge keys and excludes inactive14/15 across boundaries',()=>{
 const before=palette(),after=palette();after.set(12,[100,30,20,10]);after.set(16,[100,10,20,30]);after.set(18,[100,50,60,70]);
 const p=planPaletteDelta(before,after,ids);assert.deepEqual(apply(before,p),after);assert.ok(p.every(p=>!p.indices.includes(14)&&!p.indices.includes(15)));
});
test('Random palette deltas reproduce target exactly within captured payload limits',()=>{
 for(let phase=0;phase<50;phase++){const before=palette(),after=palette();for(const i of ids)if((i*17+phase*13)%7<phase%7)after.set(i,[100,(i*7+phase)%256,(i*11)%256,phase]);assert.deepEqual(apply(before,planPaletteDelta(before,after,ids)),after);}
 assert.throws(()=>planPaletteDelta(palette(),new Map(),ids),/Invalid RGB record/);
});
