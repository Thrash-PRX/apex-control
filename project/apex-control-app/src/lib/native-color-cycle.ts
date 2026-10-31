import {sampleEffect} from './reference-effects.mjs';
import type {LightingConfig} from '../types/lighting.ts';
const BACKUP='apex-native-color-cycle-backup-v1';
const pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
function session(device:HIDDevice){
 if(device.vendorId!==0x314b||device.productId!==0x1026)throw Error('APEX required');
 const packet=(cmd:number,payload:number[]=[],page=1,total=1)=>{const p=new Uint8Array(64);if(payload.length>58)throw Error('RGB payload overflow');p.set([250,cmd,page,total,0,payload.length,...payload]);return p;};
 const exchange=(cmd:number,payload:number[]=[],page=1,total=1):Promise<Uint8Array>=>new Promise((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timer);device.removeEventListener('inputreport',handler);};
  const handler=(event:HIDInputReportEvent)=>{const r=new Uint8Array(event.data.buffer,event.data.byteOffset,event.data.byteLength);if(r[0]!==250||r[1]!==(cmd|128))return;cleanup();if(r.length!==64||r[2]!==page||r[5]>58)reject(Error('Color cycle response mismatch'));else resolve(r.slice());};
  const timer=setTimeout(()=>{cleanup();reject(Error('Color cycle timeout at command 0x'+cmd.toString(16)+' page '+page+'/'+total+'; reconnect and restore saved RGB settings'));},2000);
  device.addEventListener('inputreport',handler);device.sendReport(0,packet(cmd,payload,page,total)).catch(e=>{cleanup();reject(e);});
 });
 const ack=async(cmd:number,payload:number[])=>{const r=await exchange(cmd,payload);if(r[3]!==1||r[5]!==1||r[6]!==0)throw Error('Color cycle not acknowledged');};
 const read=async()=>{let total=1;let record:number[]|undefined;const seen=new Set<number>();for(let page=1;page<=total;page++){const r=await exchange(23,[255],page,total);if(page===1)total=r[3];if(total<1||total>16||r[3]!==total||r[5]===0||r[5]%8)throw Error('Invalid effect settings');for(let at=6;at<6+r[5];at+=8){if(seen.has(r[at]))throw Error('Duplicate effect settings');seen.add(r[at]);if(r[at]===1)record=[...r.slice(at,at+8)];}}if(!record)throw Error('Static settings unavailable');return record;};
 const restore=async(record:number[])=>{await pause(65);await ack(19,record);await pause(65);if(JSON.stringify(await read())!==JSON.stringify(record))throw Error('Static settings restore readback mismatch');await ack(25,[255]);await pause(65);};
 return {ack,read,restore};
}
/** Recovery for an interrupted native cycle. Custom palette itself is never changed. */
export async function restoreNativeColorCycle(device:HIDDevice):Promise<boolean>{
 const raw=localStorage.getItem?.(BACKUP);if(!raw)return false;const backup=JSON.parse(raw);if(!backup.pending)return false;
 if(backup.version!==1||backup.device!=='314B:1026'||!Array.isArray(backup.record)||backup.record.length!==8||backup.record[0]!==1||backup.record.some((v:number)=>!Number.isInteger(v)||v<0||v>255))throw Error('Invalid native color-cycle backup');
 await session(device).restore(backup.record);localStorage.setItem(BACKUP,JSON.stringify({...backup,pending:false}));return true;
}
/** One captured Static RGB write per frame, preserving all unknown native fields. */
export async function playNativeColorCycle(device:HIDDevice,config:LightingConfig,signal:AbortSignal,loop:boolean):Promise<void>{
 if([config.brightness,config.speed].some(v=>!Number.isFinite(v)||v<0||v>100))throw Error('Invalid color-cycle settings');
 if(signal.aborted)throw new DOMException('Playback cancelled','AbortError');
 await restoreNativeColorCycle(device);
 const io=session(device),record=await io.read();
 if(signal.aborted)throw new DOMException('Playback cancelled','AbortError');
 const backup={version:1,device:'314B:1026',record,pending:true,createdAt:new Date().toISOString(),completeDeviceBackup:false};
 localStorage.setItem(BACKUP,JSON.stringify(backup));
 let failure:unknown,frames=0;const start=performance.now();
 try{
  await io.ack(25,[1]);await pause(65);
  for(;!signal.aborted&&(loop||performance.now()-start<5000);frames++){
   const sampled=sampleEffect({effect:'spectrum',speed:config.speed,brightness:100,keys:{all:{color:'#ffffff'}}},'all',{x:0,y:0,index:0,count:1},performance.now()-start);
   const target=[...record];target[1]=Math.round(config.brightness);target.splice(5,3,...sampled.color.match(/[\d.]+/g)!.map(Number));
   await io.ack(19,target);await pause(65);
   if(JSON.stringify(await io.read())!==JSON.stringify(target))throw Error('Color cycle readback mismatch');
   if(frames===0||frames%10===0)window.dispatchEvent?.(new CustomEvent('apex-rgb-progress',{detail:{frames:frames+1,fps:(frames+1)/((performance.now()-start)/1000),transfer:'native-static13'}}));
  }
  localStorage.setItem('apex-last-playback-metrics-v1',JSON.stringify({frames,fps:frames/((performance.now()-start)/1000),packets:frames,transfer:'native-static13'}));
 }catch(e){failure=e;}finally{
  try{await io.restore(record);localStorage.setItem(BACKUP,JSON.stringify({...backup,pending:false}));}catch(e){failure=failure?new AggregateError([failure,e],'Color cycle and restore failed; keep the native color-cycle backup'):e;}
 }
 if(failure)throw failure;
}
