/** Bounded captured0x10 ACK pacing test. Explicit opt-in and private backup required. */
import {createRequire} from 'node:module';import fs from 'node:fs';import {setTimeout as sleep} from 'node:timers/promises';
import {exchangeRgb} from '../../project/apex-control-app/src/lib/rgb-exchange.ts';
import layout from '../../project/apex-control-app/src/lib/device-rgb-layout.json' with {type:'json'};
if(!process.argv.includes('--run-hardware-test'))throw Error('Explicit hardware test flag required');
const HID=createRequire(process.argv[2])('node-hid'),prefix=process.argv[3];if(!prefix)throw Error('New private output prefix required');
const found=HID.devices().filter(d=>d.vendorId===0x314b&&d.productId===0x1026&&d.usagePage===0xff02&&d.usage===2);if(found.length!==1)throw Error('Expected one APEX');
const native=new HID.HID(found[0].path),listeners=new Set();let closed=false;
const device={addEventListener(_,h){listeners.add(h)},removeEventListener(_,h){listeners.delete(h)},async sendReport(id,p){if(id!==0||p.length!==64||native.write([0,...p])!==65)throw Error('Short or invalid write');}};
native.on('data',data=>{if(closed)return;const r=Uint8Array.from(data);for(const h of listeners)h({reportId:0,data:new DataView(r.buffer)});});native.on('error',()=>{});
const packet=(cmd,payload=[],page=1,total=1)=>{if(payload.length>58)throw Error('Payload overflow');const p=new Uint8Array(64);p.set([250,cmd,page,total,0,payload.length,...payload]);return p;};
const exchange=(cmd,payload=[],page=1,total=1)=>exchangeRgb(device,packet(cmd,payload,page,total));
async function ack(cmd,payload){const r=await exchange(cmd,payload);if(r[3]!==1||r[5]!==1||r[6]!==0)throw Error('Invalid RGB acknowledgement');}
async function read(){const records=new Map();let total=1;for(let page=1;page<=total;page++){const r=await exchange(22,[],page,total);if(page===1)total=r[3];if(total<1||total>16||r[3]!==total||r[5]<5||(r[5]-1)%4)throw Error('Readback bounds');for(let n=0;n<(r[5]-1)/4;n++){const i=r[6]+n;if(i>255||records.has(i))throw Error('Palette index');records.set(i,[...r.slice(7+n*4,11+n*4)]);}}return records;}
const indices=layout.map(k=>k.index),testIndices=indices.filter(i=>i>=32&&i<48);let previous,changed=false,restoreConfirmed=false,error;const results=[];
try{
 previous=await read();if(indices.some(i=>!previous.has(i)))throw Error('Incomplete backup');fs.writeFileSync(prefix+'-backup.json',JSON.stringify({device:'314B:1026',records:[...previous],completeDeviceBackup:false},null,2),{flag:'wx'});
 changed=true;await ack(25,[255]);await sleep(80);
 if(process.argv.includes('--readback-timing')){
  let lastAck=-Infinity;
  for(const settle of [65,50,35,20]){
   const start=performance.now();let maxFrameMs=0;
   for(let frame=0;frame<12;frame++){
    const began=performance.now();await sleep(Math.max(0,50-(performance.now()-lastAck)));const raw=[100,(frame*31+settle)%256,(frame*53+settle)%256,(frame*97+settle)%256];await ack(16,[...raw,34]);lastAck=performance.now();await sleep(settle);
    const r=await exchange(22,[],3,6);if(r[3]!==6||r[5]!==57||r[6]!==28)throw Error('Changed-page layout mismatch');for(let n=0;n<14;n++){const index=28+n,expected=index===34?raw:previous.get(index);if(JSON.stringify([...r.slice(7+n*4,11+n*4)])!==JSON.stringify(expected))throw Error('Changed-page readback mismatch');}maxFrameMs=Math.max(maxFrameMs,performance.now()-began);
   }
   const elapsedMs=performance.now()-start,result={settle,frames:12,elapsedMs,updatesPerSecond:12/(elapsedMs/1000),maxFrameMs,allFramesReadbackMatch:true};results.push(result);console.log(JSON.stringify(result));if(maxFrameMs>500)break;
  }
 }else{
 for(const gap of [50,25,10,0]){
  const target=new Map([...previous].map(([i,r])=>[i,[...r]]));let acknowledgements=0;const phase=results.length+1,start=performance.now();
  for(const i of testIndices){const raw=[100,(i*17+phase*53)%256,(i*11+phase*31)%256,(i*7+phase*97)%256];target.set(i,raw);await ack(16,[...raw,i]);acknowledgements++;if(gap)await sleep(gap);}
  const transferMs=performance.now()-start;await sleep(100);const actual=await read(),mismatches=indices.filter(i=>JSON.stringify(actual.get(i))!==JSON.stringify(target.get(i)));
  const result={gap,commands:acknowledgements,transferMs,updatesPerSecond:acknowledgements/(transferMs/1000),allActiveRecordsMatch:mismatches.length===0};results.push(result);console.log(JSON.stringify(result));if(mismatches.length)throw Error('Captured selected-key writes did not all persist');
 }
 }
}catch(e){error=e.message;}finally{
 if(changed){try{const groups=new Map();for(const i of indices){const key=previous.get(i).join(',');groups.set(key,[...(groups.get(key)??[]),i]);}for(const [raw,ids] of groups)for(let at=0;at<ids.length;at+=54){await sleep(65);await ack(16,[...raw.split(',').map(Number),...ids.slice(at,at+54)]);}await sleep(100);const actual=await read();if(indices.some(i=>JSON.stringify(actual.get(i))!==JSON.stringify(previous.get(i))))throw Error('Restore mismatch');restoreConfirmed=true;}catch(e){error=(error?error+'; ':'')+'RESTORE: '+e.message;}}
 closed=true;native.close();fs.writeFileSync(prefix+'-result.json',JSON.stringify({results,error,restoreConfirmed},null,2),{flag:'wx'});console.log(restoreConfirmed?'Original palette restored and verified':'Restoration not confirmed');
}
if(error)throw Error(error);
