import test from 'node:test';import assert from 'node:assert/strict';
import {ambientColor,vividHue} from '../src/lib/rgb-style.ts';
import {effectInitialPalette,timedEffectAt} from '../src/lib/effect-timeline.ts';
import {snakeAt} from '../src/lib/key-timeline.ts';
const primary={r:40,g:160,b:255};
test('Vivid foreground keeps full peaks, lifts dark channels and never raises the raw parameter',()=>{
 for(let i=0;i<360;i++){const c=vividHue(i/360,100);assert.equal(c[0],100);assert.equal(Math.max(...c.slice(1)),255);assert.ok(Math.min(...c.slice(1))>=45);assert.ok(c.every(v=>Number.isInteger(v)&&v>=0&&v<=255));}assert.deepEqual(vividHue(.2,0),[100,0,0,0]);
});
test('Ambient glow respects black/off, brightness and a zero-glow preference',()=>{
 assert.deepEqual(ambientColor(primary,100,0),[100,0,0,0]);assert.deepEqual(ambientColor(primary,0),[100,0,0,0]);assert.deepEqual(ambientColor({r:0,g:0,b:0},100),[100,0,0,0]);assert.ok(ambientColor(primary,100).slice(1).every(v=>v>0));
});
test('Pulse effects light the background and Snake retains twelve strong accent keys',()=>{
 const snake=snakeAt(4000,50,100,primary);assert.equal([...snake.values()].filter(c=>c.slice(1).some(v=>v>0)).length,82);assert.equal([...snake.values()].filter(c=>Math.max(...c.slice(1))===255).length,12);
 for(const effect of ['wheel','rain','scanner','twinkle','windmill']){const c={effect,primaryColor:primary,speed:50,brightness:100};assert.equal([...timedEffectAt(c,4000).values()].filter(r=>r.slice(1).some(v=>v>0)).length,82,effect);}
});
test('Rainbow and Gradient start filled with coordinated colors instead of slowly painting black keys',()=>{
 for(const effect of ['rainbow','gradient']){const initial=effectInitialPalette({effect,primaryColor:primary,secondaryColor:{r:180,g:80,b:255},speed:50,brightness:100});assert.equal(initial.size,82);assert.ok(new Set([...initial.values()].map(r=>r.join(','))).size>=3);assert.ok([...initial.values()].every(r=>r.slice(1).some(v=>v>0)));}
});
