import { planPaletteDelta } from './rgb-delta.ts';
import {playNativeColorCycle,restoreNativeColorCycle} from './native-color-cycle.ts';
import layout from './device-rgb-layout.json' with { type: 'json' };
import { sampleEffect, EFFECTS } from './reference-effects.mjs';
import type { LightingConfig } from '../types/lighting.ts';
/** Bounded host playback using captured 10/16/19 commands; no firmware operations. */
export async function playCustomRgb(device:HIDDevice,config:LightingConfig,signal:AbortSignal,restoreOnly=false,fast=false,loop=false):Promise<void>{
 const aliases:Record<string,string>={breathing:'breathe',rainbow:'wave',color_cycle:'spectrum',star:'twinkle',cross:'ripple'};
 const effect=aliases[config.effect]??config.effect;
 if(!restoreOnly&&(!EFFECTS.includes(effect)||[config.speed,config.brightness].some(v=>!Number.isFinite(v)||v<0||v>100)))throw Error('Unsupported animation settings');
 if(signal.aborted)throw new DOMException('Playback cancelled','AbortError');
 if(device.vendorId!==0x314b||device.productId!==0x1026)throw Error('APEX required');
 const nativeRecovered=await restoreNativeColorCycle(device);if(restoreOnly&&nativeRecovered)return;
 if(!restoreOnly&&fast&&effect==='spectrum')return playNativeColorCycle(device,config,signal,loop);
 const exchange=(p:Uint8Array):Promise<Uint8Array>=>new Promise((resolve,reject)=>{
  const done=()=>{clearTimeout(timer);device.removeEventListener('inputreport',onData);};
  const onData=(e:HIDInputReportEvent)=>{const r=new Uint8Array(e.data.buffer,e.data.byteOffset,e.data.byteLength);if(r[0]!==250||r[1]!==(p[1]|128))return;done();if(r.length!==64||r[2]!==p[2]||r[5]>58)reject(Error('Custom RGB response mismatch: request '+JSON.stringify([...p.slice(0,6)])+' response '+JSON.stringify([...r.slice(0,7)])));else resolve(r.slice());};
  const timer=setTimeout(()=>{done();reject(Error('Custom RGB timeout; reconnect and restore exported colors'));},2000);device.addEventListener('inputreport',onData);device.sendReport(0,p).catch(e=>{done();reject(e);});
 });
 const packet=(cmd:number,payload:number[],frame=1,total=1)=>{const p=new Uint8Array(64);if(payload.length>58)throw Error('RGB payload overflow');p.set([250,cmd,frame,total,0,payload.length,...payload]);return p;};
 const read=async()=>{const records=new Map<number,number[]>();let total=1;for(let page=1;page<=total;page++){const r=await exchange(packet(22,[],page,total));if(page===1){total=r[3];if(total<1||total>16)throw Error('Invalid palette page count');}if(r[3]!==total||r[5]<5||(r[5]-1)%4!==0||r[6]+(r[5]-1)/4>256)throw Error('Invalid palette readback');for(let i=0;i<(r[5]-1)/4;i++){const index=r[6]+i;if(records.has(index))throw Error('Duplicate palette index');records.set(index,[...r.slice(7+i*4,11+i*4)]);}}return records;};
 const live=await read();
 const saved=restoreOnly?JSON.parse(localStorage.getItem('apex-custom-rgb-history-v1')??'[]')[0]:null;
 if(restoreOnly&&(!saved||!Array.isArray(saved.records)))throw Error('Original animation palette backup missing');
 const previous:Map<number,number[]>=restoreOnly?new Map(saved.records):live;if(signal.aborted)throw new DOMException('Playback cancelled','AbortError');if(!layout.every(k=>previous.has(k.index)))throw Error('Incomplete RGB palette; no animation started');
 if(!restoreOnly){const backup={version:1,device:'314B:1026',createdAt:new Date().toISOString(),records:[...previous],completeDeviceBackup:false};
 const history=JSON.parse(localStorage.getItem?.('apex-custom-rgb-history-v1')??'[]');if(!Array.isArray(history))throw Error('Invalid RGB backup history');
 localStorage.setItem('apex-custom-rgb-history-v1',JSON.stringify([...history,backup].slice(-5)));
 localStorage.setItem('apex-custom-rgb-backup-v1',JSON.stringify(backup));}
 let lastWrite=performance.now();
 const write=async(parameter:number,color:number[],indices:number[])=>{for(let offset=0;offset<indices.length;offset+=54){const wait=Math.max(0,50-(performance.now()-lastWrite));if(wait)await new Promise(resolve=>setTimeout(resolve,wait));const r=await exchange(packet(16,[parameter,...color,...indices.slice(offset,offset+54)]));if(r[3]!==1||r[5]!==1||r[6]!==0)throw Error('Custom color not acknowledged: '+JSON.stringify([...r.slice(0,7)]));lastWrite=performance.now();}};
 const hits:{key:string;x:number;y:number;time:number}[]=[];const start=performance.now();
 const onKey=(e:KeyboardEvent)=>{if(e.target instanceof HTMLElement&&(e.target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)))return;const k=layout.find(k=>k.label.toLowerCase()===e.key.toLowerCase());if(k){hits.push({key:String(k.index),x:k.x,y:k.y,time:performance.now()-start});if(hits.length>128)hits.shift();}};
 let changed=restoreOnly;let failure: unknown;
 try{
  if(!restoreOnly){const selected=await exchange(packet(25,[255]));if(selected[5]!==1||selected[6]!==0)throw Error('Custom mode not acknowledged');changed=true;
  window.addEventListener('keydown',onKey);
  const aliases:Record<string,string>={breathing:'breathe',rainbow:'wave',color_cycle:'spectrum',star:'twinkle',cross:'ripple'};
  const effect=aliases[config.effect]??config.effect;
  const hex='#'+[config.primaryColor.r,config.primaryColor.g,config.primaryColor.b].map(v=>v.toString(16).padStart(2,'0')).join('');
  const profile={effect,speed:config.speed,brightness:config.brightness,keys:Object.fromEntries(layout.map(k=>[String(k.index),{color:hex}]))};
  if(fast){
   if(Array.from({length:84},(_,i)=>i).some(i=>!previous.has(i)))throw Error('Bulk transfer needs the complete 84-record palette');
   const indices=layout.map(k=>k.index).sort((a,b)=>a-b),chunks:number[][]=[];
   for(const index of indices){const last=chunks.at(-1);if(last&&last.length<14&&last.at(-1)===index-1)last.push(index);else chunks.push([index]);}
   let gap=12;
   const matches=(a:Map<number,number[]>,b:Map<number,number[]>)=>[...b].every(([i,r])=>JSON.stringify(a.get(i))===JSON.stringify(r));
   const bulk=async(records:Map<number,number[]>)=>{
    for(let page=0;page<chunks.length;page++){const ids=chunks[page],payload=[ids[0],...ids.flatMap(i=>records.get(i)!)];await device.sendReport(0,packet(17,payload,page+1,chunks.length));if(page<chunks.length-1)await new Promise(resolve=>setTimeout(resolve,gap));}
    await new Promise(resolve=>setTimeout(resolve,35));return matches(await read(),records);
   };
   // Inactive14/15 are never written. Full palette readback must match.
   const probe=new Map([...previous].map(([i,r])=>[i,[...r]]));for(const k of layout){const old=previous.get(k.index)!;probe.set(k.index,[old[0],old[1],old[2],old[3]^1]);}probe.set(34,[100,255,0,255]);let verified=false;
   for(const spacing of [60,80]){gap=spacing;if(await bulk(probe)){verified=true;break;}}
   if(!verified)throw Error('Bulk palette readback failed at all tested spacings; playback blocked');   const started=performance.now();let frames=0,packets=0;
   let confirmed=probe;lastWrite=performance.now();const cadence=Math.max(60,gap);
   for(;!signal.aborted&&(loop||performance.now()-started<5000);frames++){
    const now=performance.now(),records=new Map([...previous].map(([i,r])=>[i,[...r]]));
    for(let i=0;i<layout.length;i++){const k=layout[i],sample=sampleEffect(profile,String(k.index),{x:k.x,y:k.y,index:i,count:layout.length},now-start,hits);records.set(k.index,[100,...sample.color.match(/[\d.]+/g)!.map(Number)]);}
    const updates=planPaletteDelta(confirmed,records,indices);
    for(const update of updates){
     const pause=Math.max(0,cadence-(performance.now()-lastWrite));if(pause)await new Promise(resolve=>setTimeout(resolve,pause));
     if(update.command===16)await write(update.payload[0],update.payload.slice(1,4),update.indices);
     else {await device.sendReport(0,packet(17,update.payload));lastWrite=performance.now();}
     packets++;
    }
    if(updates.length){await new Promise(resolve=>setTimeout(resolve,35));if(!matches(await read(),records))throw Error('Live palette readback differs; stopped playback');}
    confirmed=records;
    if(frames===0||frames%10===0)window.dispatchEvent?.(new CustomEvent('apex-rgb-progress',{detail:{frames:frames+1,fps:(frames+1)/((performance.now()-started)/1000),gap:cadence,packets}}));
    const delay=Math.max(0,50-(performance.now()-now));if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
   }
   localStorage.setItem('apex-last-playback-metrics-v1',JSON.stringify({frames,fps:frames/((performance.now()-started)/1000),packets,transfer:'delta10-11'}));
  }else{
  // Deliberately bounded initial device test: 8 frames at 2 fps, one in-flight request.
  for(let frame=0;frame<8&&!signal.aborted;frame++){
   const now=performance.now(),groups=new Map<string,number[]>();
   for(let i=0;i<layout.length;i++){const k=layout[i];const sample=sampleEffect(profile,String(k.index),{x:k.x,y:k.y,index:i,count:layout.length},now-start,hits);const color=sample.color.match(/[\d.]+/g)!.map(Number);const peak=Math.round(255*config.brightness/100);const quantized=color.map(v=>v>=peak/2?peak:0).join(',');groups.set(quantized,[...(groups.get(quantized)??[]),k.index]);}
   for(const [color,indices] of groups){if(signal.aborted)break;await write(100,color.split(',').map(Number),indices);}
   const delay=Math.max(0,500-(performance.now()-now));if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
  }
  }
  }
 }catch(error){failure=error;}finally{
  window.removeEventListener('keydown',onKey);
 }
 if(changed){try{const groups=new Map<string,number[]>();for(const k of layout){const raw=previous.get(k.index)!.join(',');groups.set(raw,[...(groups.get(raw)??[]),k.index]);}for(const [raw,indices] of groups){const old=raw.split(',').map(Number);await write(old[0],old.slice(1),indices);}await new Promise(resolve=>setTimeout(resolve,75));const after=await read();if(layout.some(k=>JSON.stringify(after.get(k.index))!==JSON.stringify(previous.get(k.index))))throw Error('Palette restore readback differs; keep the exported backup');}catch(error){failure=failure?new AggregateError([failure,error],'Animation and restore failed; keep the browser backup'):error;}
 }
 if(failure)throw failure;
}
