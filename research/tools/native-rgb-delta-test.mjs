/** Opt-in, bounded captured-RGB test. No unknown commands or feature reports. */
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';
import layout from '../../project/apex-control-app/src/lib/device-rgb-layout.json' with {type:'json'};
import {planPaletteDelta} from '../../project/apex-control-app/src/lib/rgb-delta.ts';
import {sampleEffect} from '../../project/apex-control-app/src/lib/reference-effects.mjs';
if(!process.argv.includes('--run-hardware-test'))throw Error('Explicit --run-hardware-test required');
const packagePath=process.argv[2],prefix=process.argv[3];
if(!packagePath||!prefix)throw Error('Installed node-hid package JSON and private output prefix required');
const HID=createRequire(packagePath)('node-hid');
const found=HID.devices().filter(d=>d.vendorId===0x314b&&d.productId===0x1026&&d.usagePage===0xff02&&d.usage===2);
if(found.length!==1)throw Error('Expected exactly one APEX vendor collection');
const device=new HID.HID(found[0].path),indices=layout.map(k=>k.index);
const packet=(cmd,payload=[],page=1,total=1)=>{if(payload.length>58)throw Error('Payload overflow');const p=Array(65).fill(0);p.splice(0,7+payload.length,0,250,cmd,page,total,0,payload.length,...payload);return p;};
const send=(cmd,payload=[],page=1,total=1)=>{if(device.write(packet(cmd,payload,page,total))!==65)throw Error('Short write');};
const exchange=(cmd,payload=[],page=1,total=1)=>{send(cmd,payload,page,total);const deadline=performance.now()+2000;while(performance.now()<deadline){const r=device.readTimeout(25);if(r[0]!==250||r[1]!==(cmd|128))continue;if(r.length!==64||r[2]!==page||r[5]>58)throw Error('Invalid RGB response');return r;}throw Error('RGB response timeout: command '+cmd+' page '+page);};
const ack=(cmd,payload)=>{const r=exchange(cmd,payload);if(r[3]!==1||r[5]!==1||r[6]!==0)throw Error('RGB acknowledgement failed');};
function read(){const records=new Map();let total=1;for(let page=1;page<=total;page++){const r=exchange(22,[],page,total);if(page===1)total=r[3];if(total<1||total>16||r[3]!==total||r[5]<5||(r[5]-1)%4)throw Error('Palette bounds');for(let j=0;j<(r[5]-1)/4;j++){const i=r[6]+j;if(i>255||records.has(i))throw Error('Palette index');records.set(i,r.slice(7+j*4,11+j*4));}}return records;}
const same=(a,b)=>indices.every(i=>JSON.stringify(a.get(i))===JSON.stringify(b.get(i)));
function readStatic(){let total=1,record;for(let page=1;page<=total;page++){const r=exchange(23,[255],page,total);if(page===1)total=r[3];if(total<1||total>16||r[3]!==total||r[5]%8)throw Error('Effect table bounds');for(let at=6;at<6+r[5];at+=8)if(r[at]===1){if(record)throw Error('Duplicate Static record');record=r.slice(at,at+8);}}if(!record)throw Error('Static settings missing');return record;}
const staticCycle=process.argv.includes('--static-cycle');
let original,staticRecord,backupSaved=false,changed=false,lastWrite=-Infinity,failure,restoreConfirmed=false;
const results=[];
async function transmit(plan){for(const p of plan){await sleep(Math.max(0,65-(performance.now()-lastWrite)));if(p.command===16)ack(16,p.payload);else send(17,p.payload);lastWrite=performance.now();}await sleep(40);}
try{
 original=read();if(indices.some(i=>!original.has(i)))throw Error('Incomplete palette');
 if(staticCycle)staticRecord=readStatic();
 fs.writeFileSync(prefix+'-backup.json',JSON.stringify({version:1,device:'314B:1026',records:[...original],staticRecord,completeDeviceBackup:false},null,2),{flag:'wx'});backupSaved=true;
 changed=true;ack(25,[255]);await sleep(65);
 if(staticCycle){
  ack(25,[1]);await sleep(65);lastWrite=performance.now();
  const start=performance.now(),frames=32;
  for(let frame=0;frame<frames;frame++){
   const sample=sampleEffect({effect:'spectrum',speed:50,brightness:100,keys:{all:{color:'#ff0000'}}},'all',{x:0,y:0,index:0,count:1},frame*80);
   const target=[...staticRecord];target[1]=100;target.splice(5,3,...sample.color.match(/[\d.]+/g).map(Number));
   await sleep(Math.max(0,65-(performance.now()-lastWrite)));ack(19,target);lastWrite=performance.now();await sleep(65);
   if(JSON.stringify(readStatic())!==JSON.stringify(target))throw Error('Native color-cycle readback mismatch');
  }
  const elapsedMs=performance.now()-start;const result={effect:'native-static-color-cycle',frames,packets:frames,elapsedMs,fps:frames/(elapsedMs/1000),allFramesReadbackConfirmed:true};results.push(result);console.log(JSON.stringify(result));
 }else{
 // Start dark, using captured grouped writes; every frame then has full readback.
 let confirmed=new Map([...original].map(([i,r])=>[i,indices.includes(i)?[100,0,0,0]:[...r]]));
 const groups=indices.map(i=>i);for(let at=0;at<groups.length;at+=54)await transmit([{command:16,payload:[100,0,0,0,...groups.slice(at,at+54)]}]);
 if(!same(read(),confirmed))throw Error('Initial black palette did not read back');
 for(const effect of ['snake','spectrum']){
  let packets=0;const start=performance.now(),frames=24;
  const profile={effect,speed:50,brightness:100,keys:Object.fromEntries(layout.map(k=>[String(k.index),{color:'#ff0000'}]))};
  for(let frame=0;frame<frames;frame++){
   const target=new Map([...confirmed].map(([i,r])=>[i,[...r]]));
   for(let j=0;j<layout.length;j++){const k=layout[j],sample=sampleEffect(profile,String(k.index),{x:k.x,y:k.y,index:j,count:layout.length},frame*80);target.set(k.index,[100,...sample.color.match(/[\d.]+/g).map(Number)]);}
   const plan=planPaletteDelta(confirmed,target,indices);await transmit(plan);packets+=plan.length;
   const actual=read();if(!same(actual,target))throw Error(effect+' frame '+frame+' failed full palette readback');
   confirmed=target;
  }
  const elapsedMs=performance.now()-start;const result={effect,frames,packets,elapsedMs,fps:frames/(elapsedMs/1000),allFramesReadbackConfirmed:true};results.push(result);console.log(JSON.stringify(result));
 }
}
}catch(e){failure=e.message;}finally{
 if(changed&&backupSaved){try{
  if(staticRecord){ack(19,staticRecord);await sleep(65);if(JSON.stringify(readStatic())!==JSON.stringify(staticRecord))throw Error('Static settings restore mismatch');ack(25,[255]);await sleep(65);}
  const groups=new Map();for(const i of indices){const key=original.get(i).join(',');groups.set(key,[...(groups.get(key)??[]),i]);}
  for(const [raw,ids] of groups)for(let at=0;at<ids.length;at+=54)await transmit([{command:16,payload:[...raw.split(',').map(Number),...ids.slice(at,at+54)]}]);
  if(!same(read(),original))throw Error('Palette restore readback mismatch');restoreConfirmed=true;
 }catch(e){failure=(failure?failure+'; ':'')+'RESTORE: '+e.message;}}
 device.close();
 fs.writeFileSync(prefix+'-result.json',JSON.stringify({results,error:failure,restoreConfirmed,customModeRemainsSelected:true},null,2),{flag:'wx'});
 console.log(restoreConfirmed?'Original palette restored and readback verified':'No confirmed restoration');
}
if(failure)throw Error(failure);
