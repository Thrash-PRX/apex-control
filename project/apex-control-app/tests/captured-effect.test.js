import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import { encodeCapturedEffect,decodeCapturedEffectResponse } from '../src/lib/protocol/captured-effect.ts';
import { exportCapturedSections } from '../../../research/tools/captured-sections.mjs';
const f=JSON.parse(fs.readFileSync(new URL('../../../research/evidence/apex-red-green-fixtures.json',import.meta.url)));
test('Captured red and green match offline effect encoder byte for byte',()=>{
 for(const color of ['red','green']){const bytes=f[color];assert.deepEqual([...encodeCapturedEffect(bytes.slice(6,11),bytes.slice(11,14))],bytes);}
 assert.deepEqual(f.red.slice(6,11),f.green.slice(6,11));assert.deepEqual(f.red.slice(11,14),[255,0,0]);assert.deepEqual(f.green.slice(11,14),[0,255,0]);
 assert.equal(decodeCapturedEffectResponse(Uint8Array.from(f.response)),0);
 assert.throws(()=>encodeCapturedEffect([1,100,50,0,13],[256,0,0]));
 const bad=Uint8Array.from(f.response);bad[5]=8;assert.throws(()=>decodeCapturedEffectResponse(bad));
});
function report(direction,command,frame,total){const data=Array(64).fill(0);data.splice(0,6,250,command,frame,total,0,0);return {direction,command,frame,total,payloadLength:0,data,status:0,bytes:64};}
test('Captured section export matches request/response and rejects missing, duplicate or mismatched pages',()=>{
 const capture={truncated:false,descriptors:[{vendorId:0x314b,productId:0x1026}],reports:[report('out',0x16,1,1),report('in',0x96,1,2),report('out',0x16,2,2),report('in',0x96,2,2)]};
 const b=exportCapturedSections(capture);assert.equal(b.sections.length,1);assert.equal(b.completeDeviceBackup,false);assert.equal(b.restoreEnabled,false);assert.equal(b.sections[0].sha256.length,64);
 assert.equal(exportCapturedSections({...capture,reports:capture.reports.slice(0,2)}).sections.length,0);
 const wrong=structuredClone(capture);wrong.reports[3].command=0x97;assert.throws(()=>exportCapturedSections(wrong),/mismatch/);
 assert.throws(()=>exportCapturedSections({...capture,truncated:true}));
});

test('Brightness-only capture changes exactly the second payload byte to 50',()=>{
 const before=f.green,after=f.brightness50;
 assert.deepEqual(after.slice(11,14),[0,255,0]);assert.equal(after[7],50);
 assert.deepEqual(after.filter((_,i)=>i!==7),before.filter((_,i)=>i!==7));
 assert.deepEqual([...encodeCapturedEffect(after.slice(6,11),after.slice(11,14))],after);
});

test('Captured speed differential changes only third payload byte; Breath settings preserve raw fields',()=>{
 assert.equal(f.speed100[8],100);assert.equal(f.speed80[8],80);
 assert.deepEqual(f.speed100.filter((_,i)=>i!==8),f.speed80.filter((_,i)=>i!==8));
 assert.equal(f.breathFinal[6],3);assert.equal(f.breathFinal[7],100);assert.equal(f.breathFinal[8],80);assert.deepEqual(f.breathFinal.slice(11,14),[0,255,0]);
 assert.deepEqual([...encodeCapturedEffect(f.breathFinal.slice(6,11),f.breathFinal.slice(11,14))],f.breathFinal);
});

import { decodeCapturedEffectRecords } from '../src/lib/protocol/captured-effect.ts';
test('Effect readback records preserve unknown fields and can reconstruct captured packets',()=>{
 const records=decodeCapturedEffectRecords(Uint8Array.from(f.breathFinal.slice(6,14)));
 assert.equal(records[0].mode,3);assert.deepEqual([...encodeCapturedEffect(records[0].rawPrefix,records[0].rgb)],f.breathFinal);
 assert.throws(()=>decodeCapturedEffectRecords(new Uint8Array(7)));
 assert.throws(()=>decodeCapturedEffectRecords(new Uint8Array(16)),/Duplicate/);
 const names=JSON.parse(fs.readFileSync(new URL('../../../research/evidence/apex-captured-effect-names.json',import.meta.url)));
 assert.equal(names.names.find(n=>n.id===1).label,'Static');assert.equal(names.names.find(n=>n.id===3).label,'Breath');assert.equal(names.names.length,12);
});
