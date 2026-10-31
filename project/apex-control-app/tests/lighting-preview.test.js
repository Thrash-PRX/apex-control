import test from 'node:test';
import assert from 'node:assert/strict';
import { previewLighting } from '../src/lib/lighting-preview.ts';
const keys=[{id:'a',x:0,y:0},{id:'b',x:4.25,y:0},{id:'knob',x:2,y:0,isSpecial:true}];
const config={effect:'static',primaryColor:{r:100,g:50,b:20},brightness:50,speed:50};
test('Preview applies brightness across all keys, excludes knob and blacks out off',()=>{
 const colors=previewLighting(config,keys,0); assert.equal(colors.size,2); assert.deepEqual(colors.get('a'),{r:50,g:25,b:10});
 assert.deepEqual(previewLighting({...config,effect:'off'},keys,0).get('a'),{r:0,g:0,b:0});
});
test('Local wave responds to time and direction without changing input',()=>{
 const wave={...config,effect:'wave',direction:'left-to-right'};
 assert.notDeepEqual(previewLighting(wave,keys,0),previewLighting(wave,keys,1));
 assert.notDeepEqual(previewLighting(wave,keys,0),previewLighting({...wave,direction:'right-to-left'},keys,0));
 assert.equal(wave.direction,'left-to-right');
});
test('Custom preview colors selection only; reactive and ripple require a demonstration origin',()=>{
 assert.deepEqual(previewLighting({...config,effect:'custom'},keys,0,['a']).get('b'),{r:0,g:0,b:0});
 for(const effect of ['reactive','ripple'])assert.deepEqual(previewLighting({...config,effect},keys,0).get('a'),{r:0,g:0,b:0});
});

