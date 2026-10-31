/** Plan only captured 0x10/0x11 palette writes. Never touch inactive slots. */
export interface PaletteWrite {command:16|17; payload:number[]; indices:number[];}
const same=(a:readonly number[]|undefined,b:readonly number[])=>!!a&&a.length===b.length&&a.every((v,i)=>v===b[i]);
export function planPaletteDelta(previous:ReadonlyMap<number,number[]>,next:ReadonlyMap<number,number[]>,active:readonly number[],strategy:'auto'|'grouped'='auto'):PaletteWrite[]{
 const ids=[...active].sort((a,b)=>a-b);
 if(new Set(ids).size!==ids.length||ids.some(i=>!Number.isInteger(i)||i<0||i>255))throw Error('Invalid active RGB indices');
 for(const i of ids){const r=next.get(i);if(!r||r.length!==4||r.some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('Invalid RGB record');}
 const changed=ids.filter(i=>!same(previous.get(i),next.get(i)!));
 if(!changed.length)return [];
 const groups=new Map<string,number[]>();
 for(const i of changed){const key=next.get(i)!.join(',');groups.set(key,[...(groups.get(key)??[]),i]);}
 const grouped:PaletteWrite[]=[];
 for(const [raw,indices] of groups)for(let at=0;at<indices.length;at+=54){const slice=indices.slice(at,at+54);grouped.push({command:16,payload:[...raw.split(',').map(Number),...slice],indices:slice});}
 if(strategy==='grouped')return grouped;
 const activeSet=new Set(ids),bulk:PaletteWrite[]=[];
 for(let at=0;at<changed.length;){
  const start=changed[at];let limit=start;
  while(limit<start+13&&activeSet.has(limit+1))limit++;
  let end=start;while(at<changed.length&&changed[at]<=limit)end=changed[at++];
  const indices=Array.from({length:end-start+1},(_,i)=>start+i);
  bulk.push({command:17,payload:[start,...indices.flatMap(i=>next.get(i)!)],indices});
 }
 return grouped.length<=bulk.length?grouped:bulk;
}
