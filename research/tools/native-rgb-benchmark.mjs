/** Controlled native RGB benchmark. Explicit captured RGB commands only. Backups stay private. */
import {createRequire} from 'node:module';import fs from 'node:fs';import {setTimeout as sleep} from 'node:timers/promises';
import layout from '../../project/apex-control-app/src/lib/device-rgb-layout.json' with {type:'json'};
if(!process.argv.includes('--run-hardware-test'))throw Error('Explicit --run-hardware-test required; this changes RGB settings and writes a private backup');
const HID=createRequire(process.argv[2])('node-hid');
const found=HID.devices().filter(d=>d.vendorId===0x314b&&d.productId===0x1026&&d.usagePage===0xff02&&d.usage===2);
if(found.length!==1)throw Error('Expected one APEX vendor collection');
const device=new HID.HID(found[0].path),root=process.argv[3];
const packet=(cmd,payload=[],frame=1,total=1)=>{if(payload.length>58)throw Error('Payload too long');const p=Array(65).fill(0);p.splice(0,7+payload.length,0,250,cmd,frame,total,0,payload.length,...payload);return p;};
const exchange=(cmd,payload=[],frame=1,total=1)=>{if(device.write(packet(cmd,payload,frame,total))!==65)throw Error('Short write');const deadline=performance.now()+2000;while(performance.now()<deadline){const r=device.readTimeout(25);if(r[0]!==250||r[1]!==(cmd|128)||r[2]!==frame)continue;if(r.length!==64||r[5]>58)throw Error('Invalid response');return r;}throw Error('Timeout command '+cmd);};
function read(){const records=new Map();let total=1;for(let page=1;page<=total;page++){const r=exchange(22,[],page,total);if(page===1){total=r[3];if(total<1||total>16)throw Error('Invalid palette total');}if(r[3]!==total||r[5]<5||(r[5]-1)%4)throw Error('Palette bounds');for(let i=0;i<(r[5]-1)/4;i++){const index=r[6]+i;if(index>255||records.has(index))throw Error('Palette index');records.set(index,r.slice(7+i*4,11+i*4));}}return records;}
const indices=layout.map(k=>k.index).sort((a,b)=>a-b),chunks=[];for(const i of indices){const last=chunks.at(-1);if(last&&last.length<14&&last.at(-1)===i-1)last.push(i);else chunks.push([i]);}
const previous=read();if(indices.some(i=>!previous.has(i)))throw Error('Incomplete palette');
let staticRecord;const white=process.argv[4]==='white';
if(white){let total=1;for(let page=1;page<=total;page++){const r=exchange(23,[255],page,total);if(page===1)total=r[3];if(total<1||total>16||r[5]%8)throw Error('Invalid effect table');for(let at=6;at<6+r[5];at+=8)if(r[at]===1)staticRecord=r.slice(at,at+8);}if(!staticRecord)throw Error('Static mode missing');}
fs.writeFileSync(root+'-backup.json',JSON.stringify({version:1,device:'314B:1026',records:[...previous],staticRecord,completeDeviceBackup:false},null,2),{flag:'wx'});
const results=[];let error;try{
 const ack=exchange(25,[255]);if(ack[5]!==1||ack[6]!==0)throw Error('Custom mode not acknowledged');
 if(white){
  const desired=[...staticRecord];desired[1]=100;desired.splice(5,3,255,255,255);let r=exchange(19,desired);if(r[6]!==0)throw Error('Static white not acknowledged');r=exchange(25,[1]);if(r[6]!==0)throw Error('Static selection failed');console.log('PHASE A: native Static white100 for5seconds');await sleep(5000);
  r=exchange(25,[255]);if(r[6]!==0)throw Error('Custom selection failed');for(let at=0;at<indices.length;at+=54){r=exchange(16,[100,255,255,255,...indices.slice(at,at+54)]);if(r[6]!==0)throw Error('Custom white failed');await sleep(60);}const actual=read();if(indices.some(i=>JSON.stringify(actual.get(i))!=='[100,255,255,255]'))throw Error('White readback mismatch');console.log('PHASE B: custom white100 for5seconds; palette readback confirmed');await sleep(5000);
 }else for(const gap of [4,12,30,60]){
  const phase=results.length+1,target=new Map([...previous].map(([i,r])=>[i,[...r]]));for(const i of indices)target.set(i,[100,(i*7+phase*35)%256,(i*11+phase*53)%256,(i*13+phase*97)%256]);
  const start=performance.now();for(let page=0;page<chunks.length;page++){const ids=chunks[page];if(device.write(packet(17,[ids[0],...ids.flatMap(i=>target.get(i))],page+1,chunks.length))!==65)throw Error('Short bulk write');if(page<chunks.length-1)await sleep(gap);}
  const transferMs=performance.now()-start;await sleep(100);const actual=read(),mismatches=indices.filter(i=>JSON.stringify(actual.get(i))!==JSON.stringify(target.get(i)));
  results.push({gap,transferMs,correct:indices.length-mismatches.length,total:indices.length,mismatches});console.log(JSON.stringify(results.at(-1)));
 }
}catch(e){error=e.message;}finally{
 try{if(staticRecord){const r=exchange(19,staticRecord);if(r[6]!==0)throw Error('Native Static restore not acknowledged');exchange(25,[255]);}const groups=new Map();for(const i of indices){const key=previous.get(i).join(',');groups.set(key,[...(groups.get(key)??[]),i]);}
 for(const [raw,ids] of groups)for(let at=0;at<ids.length;at+=54){const r=exchange(16,[...raw.split(',').map(Number),...ids.slice(at,at+54)]);if(r[5]!==1||r[6]!==0)throw Error('Restore not acknowledged');await sleep(60);}
 const actual=read();if(indices.some(i=>JSON.stringify(actual.get(i))!==JSON.stringify(previous.get(i))))throw Error('Restore readback mismatch');console.log('Original palette restored and readback verified');
 }catch(e){error=(error?error+'; ':'')+'RESTORE: '+e.message;}finally{device.close();}
 fs.writeFileSync(root+'-result.json',JSON.stringify({results,error,restoreConfirmed:!error?.includes('RESTORE:')},null,2));if(error)throw Error(error);
}


