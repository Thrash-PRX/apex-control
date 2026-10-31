import test from 'node:test';import assert from 'node:assert/strict';
import { nativeRgbMode } from '../src/lib/native-rgb-mode.ts';
import { previewLighting } from '../src/lib/lighting-preview.ts';
import { LIGHTING_EFFECTS } from '../src/types/lighting.ts';
import { APEX_200S_LAYOUT } from '../src/lib/keyboard-layout.ts';
test('Native mapping covers exactly captured IDs; reference effects never become device IDs',()=>{
 const configs=LIGHTING_EFFECTS.map(e=>({effect:e.effect}));for(const direction of ['left-to-right','right-to-left','top-to-bottom','bottom-to-top'])configs.push({effect:'wave',direction});
 const ids=new Set(configs.map(nativeRgbMode).filter(v=>v!==null));assert.deepEqual([...ids].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i));
 for(const effect of ['wheel','fireworks','storm','gradient','heatmap','rainbow','custom'])assert.equal(nativeRgbMode({effect}),null);
});
test('Every effect preview renders bounded deterministic colors at varied times',()=>{
 for(const {effect} of LIGHTING_EFFECTS)for(const time of [0,.3,3.4]){
 const c={effect,primaryColor:{r:10,g:100,b:250},brightness:65,speed:80};
 const a=previewLighting(c,APEX_200S_LAYOUT,time,['w']);assert.deepEqual(a,previewLighting(c,APEX_200S_LAYOUT,time,['w']));assert.equal(a.size,82);
 for(const color of a.values())for(const value of Object.values(color))assert.ok(Number.isInteger(value)&&value>=0&&value<=255,`${effect}: ${value}`);
 }
});
