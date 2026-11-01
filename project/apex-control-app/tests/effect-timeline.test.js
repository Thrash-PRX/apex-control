import test from 'node:test';import assert from 'node:assert/strict';
import {KeyEffectTimeline,TIMED_EFFECTS,effectBackground,timedEffectAt} from '../src/lib/effect-timeline.ts';
import {SnakeTimeline,SNAKE_ROUTE} from '../src/lib/key-timeline.ts';
import {LIGHTING_EFFECTS} from '../src/types/lighting.ts';import {nativeRgbMode} from '../src/lib/native-rgb-mode.ts';
const config={effect:'wheel',brightness:100,speed:50,primaryColor:{r:255,g:50,b:10},secondaryColor:{r:0,g:0,b:255}};
test('Every playable custom spatial effect has a timed per-key implementation',()=>{
 const expected=LIGHTING_EFFECTS.filter(e=>nativeRgbMode({effect:e.effect})===null&&!['custom','color_cycle'].includes(e.effect)).map(e=>e.effect);assert.deepEqual([...TIMED_EFFECTS].sort(),expected.sort());
});
test('Every timed effect produces valid independent active-key changes without inactive slots',()=>{
 for(const effect of TIMED_EFFECTS){if(effect==='snake')continue;const timeline=new KeyEffectTimeline({...config,effect});const signatures=new Set(),changed=new Set();for(let n=0;n<100;n++){const hits=['shadow','heatmap'].includes(effect)?[{key:String(SNAKE_ROUTE[n%82]),x:0,y:0,time:n*timeline.stepMs}]:[];const updates=timeline.advance(n*timeline.stepMs,hits);for(const [i,r] of updates){assert.ok(SNAKE_ROUTE.includes(i),effect);assert.equal(r.length,4);assert.ok(r.every(v=>Number.isInteger(v)&&v>=0&&v<=255));changed.add(i);}signatures.add(JSON.stringify([...updates]));}assert.ok(changed.size>1,effect);assert.ok(signatures.size>1,effect);}
});
test('Authored previews reproduce the same timed key events and hold/off states',()=>{
 for(const effect of TIMED_EFFECTS){if(['snake','shadow','heatmap'].includes(effect))continue;const c={...config,effect},clock=new KeyEffectTimeline(c),state=new Map(SNAKE_ROUTE.map(i=>[i,effectBackground(c)]));for(let n=0;n<105;n++){for(const [i,r] of clock.advance(n*clock.stepMs))state.set(i,r);if(n%13===0||n===104)assert.deepEqual(state,timedEffectAt(c,n*clock.stepMs),effect+' step '+n);}}
});
test('Snake holds six lit keys through slow acknowledged USB operations',()=>{
 const clock=new SnakeTimeline(50,100),state=new Map(SNAKE_ROUTE.map(i=>[i,[100,0,0,0]]));for(let n=0;n<20;n++){for(const [i,r] of clock.advance(n*400))state.set(i,r);clock.acknowledge(n*400+400);if(n>=5)assert.equal([...state.values()].filter(r=>r.slice(1).some(v=>v>0)).length,6);}
});
test('Page-local Shadow and Heatmap respond once per hit and restore their key on expiry',()=>{
 for(const effect of ['shadow','heatmap']){const c={...config,effect},clock=new KeyEffectTimeline(c),hit={key:'34',x:0,y:0,time:0};assert.ok(clock.advance(0,[hit]).has(34));assert.equal(clock.advance(1,[hit]).size,0);const next=clock.advance(clock.stepMs*49,[]);assert.deepEqual(next.get(34),effectBackground(c));}
});
