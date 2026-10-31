import layout from './device-rgb-layout.json' with { type: 'json' };
import { sampleEffect, EFFECTS } from './reference-effects.mjs';
import type { LightingConfig } from '../types/lighting.ts';
/** Bounded host playback using captured 10/16/19 commands; no firmware operations. */
export async function playCustomRgb(device:HIDDevice,config:LightingConfig,signal:AbortSignal):Promise<void>{
 const aliases:Record<string,string>={breathing:'breathe',rainbow:'wave',color_cycle:'spectrum',star:'twinkle',cross:'ripple'};
 const effect=aliases[config.effect]??config.effect;
 if(!EFFECTS.includes(effect)||[config.speed,config.brightness].some(v=>!Number.isFinite(v)||v<0||v>100))throw Error('Unsupported animation settings');
 if(signal.aborted)throw new DOMException('Playback cancelled','AbortError');
 if(device.vendorId!==0x314b||device.productId!==0x1026)throw Error('APEX required');
 const exchange=(p:Uint8Array):Promise<Uint8Array>=>new Promise((resolve,reject)=>{
  const done=()=>{clearTimeout(timer);device.removeEventListener('inputreport',onData);};
  const onData=(e:HIDInputReportEvent)=>{const r=new Uint8Array(e.data.buffer,e.data.byteOffset,e.data.byteLength);if(r[0]!==250||r[1]!==(p[1]|128))return;done();if(r.length!==64||r[2]!==p[2]||r[5]>58)reject(Error('Custom RGB response mismatch'));else resolve(r.slice());};
  const timer=setTimeout(()=>{done();reject(Error('Custom RGB timeout; reconnect and restore exported colors'));},2000);device.addEventListener('inputreport',onData);device.sendReport(0,p).catch(e=>{done();reject(e);});
 });
 const packet=(cmd:number,payload:number[],frame=1,total=1)=>{const p=new Uint8Array(64);if(payload.length>58)throw Error('RGB payload overflow');p.set([250,cmd,frame,total,0,payload.length,...payload]);return p;};
 const read=async()=>{const records=new Map<number,number[]>();let total=1;for(let page=1;page<=total;page++){const r=await exchange(packet(22,[],page,total));if(page===1){total=r[3];if(total<1||total>16)throw Error('Invalid palette page count');}if(r[3]!==total||r[5]<5||(r[5]-1)%4!==0||r[6]+(r[5]-1)/4>256)throw Error('Invalid palette readback');for(let i=0;i<(r[5]-1)/4;i++){const index=r[6]+i;if(records.has(index))throw Error('Duplicate palette index');records.set(index,[...r.slice(7+i*4,11+i*4)]);}}return records;};
 const previous=await read();if(signal.aborted)throw new DOMException('Playback cancelled','AbortError');if(!layout.every(k=>previous.has(k.index)))throw Error('Incomplete RGB palette; no animation started');
 const backup={version:1,device:'314B:1026',createdAt:new Date().toISOString(),records:[...previous],completeDeviceBackup:false};
 const history=JSON.parse(localStorage.getItem?.('apex-custom-rgb-history-v1')??'[]');if(!Array.isArray(history))throw Error('Invalid RGB backup history');
 localStorage.setItem('apex-custom-rgb-history-v1',JSON.stringify([...history,backup].slice(-5)));
 localStorage.setItem('apex-custom-rgb-backup-v1',JSON.stringify(backup));
 const write=async(parameter:number,color:number[],indices:number[])=>{for(let offset=0;offset<indices.length;offset+=54){const r=await exchange(packet(16,[parameter,...color,...indices.slice(offset,offset+54)]));if(r[3]!==1||r[5]!==1||r[6]!==0)throw Error('Custom color not acknowledged');}};
 const hits:{key:string;x:number;y:number;time:number}[]=[];const start=performance.now();
 const onKey=(e:KeyboardEvent)=>{if(e.target instanceof HTMLElement&&(e.target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)))return;const k=layout.find(k=>k.label.toLowerCase()===e.key.toLowerCase());if(k){hits.push({key:String(k.index),x:k.x,y:k.y,time:performance.now()-start});if(hits.length>128)hits.shift();}};
 let changed=false;let failure: unknown;
 try{
  const selected=await exchange(packet(25,[255]));if(selected[5]!==1||selected[6]!==0)throw Error('Custom mode not acknowledged');changed=true;
  window.addEventListener('keydown',onKey);
  const aliases:Record<string,string>={breathing:'breathe',rainbow:'wave',color_cycle:'spectrum',star:'twinkle',cross:'ripple'};
  const effect=aliases[config.effect]??config.effect;
  const hex='#'+[config.primaryColor.r,config.primaryColor.g,config.primaryColor.b].map(v=>v.toString(16).padStart(2,'0')).join('');
  const profile={effect,speed:config.speed,brightness:config.brightness,keys:Object.fromEntries(layout.map(k=>[String(k.index),{color:hex}]))};
  // Deliberately bounded initial device test: 8 frames at 2 fps, one in-flight request.
  for(let frame=0;frame<8&&!signal.aborted;frame++){
   const now=performance.now(),groups=new Map<string,number[]>();
   for(let i=0;i<layout.length;i++){const k=layout[i];const sample=sampleEffect(profile,String(k.index),{x:k.x,y:k.y,index:i,count:layout.length},now-start,hits);const color=sample.color.match(/[\d.]+/g)!.map(Number);const quantized=color.map(v=>Math.round(v/85)*85).join(',');groups.set(quantized,[...(groups.get(quantized)??[]),k.index]);}
   for(const [color,indices] of groups){if(signal.aborted)break;await write(100,color.split(',').map(Number),indices);}
   const delay=Math.max(0,500-(performance.now()-now));if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
  }
 }catch(error){failure=error;}finally{
  window.removeEventListener('keydown',onKey);
 }
 if(changed){try{for(const k of layout){const old=previous.get(k.index)!;await write(old[0],old.slice(1),[k.index]);}const after=await read();if(layout.some(k=>JSON.stringify(after.get(k.index))!==JSON.stringify(previous.get(k.index))))throw Error('Palette restore readback differs; keep the exported backup');}catch(error){failure=failure?new AggregateError([failure,error],'Animation and restore failed; keep the browser backup'):error;}
 }
 if(failure)throw failure;
}



