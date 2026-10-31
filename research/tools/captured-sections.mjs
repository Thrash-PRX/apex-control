/** Export matched captured readback sections, never a complete/restorable device backup. */
import { createHash } from 'node:crypto';
const getters=new Set([0x16,0x17,0x18,0x2a,0x2b,0x2c,0x42,0x57,0x5e]);
export function exportCapturedSections(capture) {
 if(capture.truncated||!capture.descriptors.some(d=>d.vendorId===0x314b&&d.productId===0x1026))throw Error('Incomplete capture or APEX descriptor missing');
 const sections=[];const active=new Map();let pending=null;
 for(const r of capture.reports){
  if(r.status!==0||r.bytes!==64||r.data.length!==64||r.payloadLength>58)throw Error('Malformed or failed report');
  if(r.direction==='out'){
   pending=getters.has(r.command)?r:null;

   continue;
  }
  if(!pending)continue;
  const q=pending;pending=null;
  if(r.command!==(q.command|0x80)||r.frame!==q.frame||r.total<1||r.frame>r.total)throw Error('Response mismatch');
  let tx=active.get(q.command);
  if(r.frame===1){tx={command:q.command,total:r.total,pages:[]};active.set(q.command,tx);}
  if(!tx||tx.total!==r.total||r.frame!==tx.pages.length+1||(r.frame>1&&q.total!==r.total))throw Error('Broken pagination');
  tx.pages.push({request:[...q.data],response:[...r.data],payload:r.data.slice(6,6+r.payloadLength)});
  if(tx.pages.length===tx.total){const bytes=JSON.stringify(tx.pages);sections.push({...tx,sha256:createHash('sha256').update(bytes).digest('hex')});active.delete(q.command);}
 }
 return {schema:'apex-captured-sections',version:1,completeDeviceBackup:false,restoreEnabled:false,sections,incompleteCommands:[...active.keys()]};
}


