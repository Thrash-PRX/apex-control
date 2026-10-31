import test from 'node:test';import assert from 'node:assert/strict';
import {exchangeRgb} from '../src/lib/rgb-exchange.ts';
function fake(onSend){const handlers=new Set();let calls=0;return {get calls(){return calls},get listeners(){return handlers.size},addEventListener(_,h){handlers.add(h)},removeEventListener(_,h){handlers.delete(h)},async sendReport(_,p){calls++;onSend(this,p,calls)},emit(p,page=p[2]){const r=new Uint8Array(64);r.set([250,p[1]|128,page,1,0,1,0]);for(const h of handlers)h({reportId:0,data:new DataView(r.buffer)})}};}
const request=cmd=>Uint8Array.from([250,cmd,3,6,0,0,...Array(58).fill(0)]),options={timeoutMs:10,retryDelayMs:0};
test('Read-only RGB getter retries a lost response once and removes its listener',async()=>{
 const d=fake((d,p,n)=>{if(n===2)queueMicrotask(()=>d.emit(p))});const r=await exchangeRgb(d,request(22),options);assert.equal(r[2],3);assert.equal(d.calls,2);assert.equal(d.listeners,0);
});
test('Late reply for a different RGB page cannot resolve or reject the current request',async()=>{
 const d=fake((d,p)=>queueMicrotask(()=>{d.emit(p,2);d.emit(p,3)}));await exchangeRgb(d,request(22),options);assert.equal(d.calls,1);assert.equal(d.listeners,0);
});
test('RGB writes are never retried when their acknowledgement is lost',async()=>{
 for(const cmd of [16,17,19,25]){const d=fake(()=>{});await assert.rejects(exchangeRgb(d,request(cmd),options),/RGB timeout/);assert.equal(d.calls,1);assert.equal(d.listeners,0);}
});
test('Repeated read timeout is bounded to two requests and reports command/page',async()=>{
 const d=fake(()=>{});await assert.rejects(exchangeRgb(d,request(23),options),/command 0x17 page 3\/6/);assert.equal(d.calls,2);assert.equal(d.listeners,0);
});
