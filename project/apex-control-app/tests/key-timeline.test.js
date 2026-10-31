import test from 'node:test';import assert from 'node:assert/strict';
import {SnakeTimeline,SNAKE_ROUTE,snakeAt} from '../src/lib/key-timeline.ts';
test('Snake has 82 unique active keys and reverses direction at physical row boundaries',()=>{
 assert.equal(SNAKE_ROUTE.length,82);assert.equal(new Set(SNAKE_ROUTE).size,82);assert.ok(!SNAKE_ROUTE.includes(14)&&!SNAKE_ROUTE.includes(15));assert.deepEqual(SNAKE_ROUTE.slice(0,16),[0,1,2,3,4,5,6,7,8,9,10,11,12,13,31,30]);
});
test('Each key has an independent ON deadline and six-step OFF deadline',()=>{
 const clock=new SnakeTimeline(50,100),step=clock.stepMs;
 assert.deepEqual([...clock.advance(0).keys()],[SNAKE_ROUTE[0]]);assert.equal(clock.advance(step-1).size,0);
 assert.deepEqual([...clock.advance(step).keys()],[SNAKE_ROUTE[1]]);
 const due=clock.advance(step*6);assert.deepEqual(due.get(SNAKE_ROUTE[0]),[100,0,0,0]);assert.ok(due.has(SNAKE_ROUTE[2]));
});
test('Slow hardware advances only one head key and never skips keys to catch up',()=>{
 const clock=new SnakeTimeline(100,100);const seen=[];for(let n=0;n<90;n++){const changes=clock.advance(n*1000);seen.push([...changes].find(([,v])=>v.slice(1).some(x=>x>0))[0]);}assert.deepEqual(seen.slice(0,82),SNAKE_ROUTE);assert.deepEqual(seen.slice(82),SNAKE_ROUTE.slice(0,8));
});
test('Preview uses the same independently held full-brightness key colors',()=>{
 const clock=new SnakeTimeline(50,100);const state=new Map(SNAKE_ROUTE.map(i=>[i,[100,0,0,0]]));for(let n=0;n<12;n++){for(const [key,value] of clock.advance(n*clock.stepMs))state.set(key,value);assert.deepEqual(state,snakeAt(n*clock.stepMs,50,100));}assert.equal([...state.values()].filter(v=>v.slice(1).some(x=>x>0)).length,6);
});
