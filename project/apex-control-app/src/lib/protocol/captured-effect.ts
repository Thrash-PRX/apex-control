/** Capture-established 0x13 effect packet. Offline only; raw prefix semantics unresolved. */
export function encodeCapturedEffect(rawPrefix: readonly [number,number,number,number,number], rgb: readonly [number,number,number]): Uint8Array {
 if(rawPrefix.length!==5||rgb.length!==3)throw new RangeError('Invalid effect fields');
 const payload=[...rawPrefix,...rgb];
 if(payload.some(v=>!Number.isInteger(v)||v<0||v>255))throw new RangeError('Expected byte');
 const report=new Uint8Array(64);report.set([0xfa,0x13,1,1,0,8,...payload]);return report;
}
/** Only the declared response byte is parsed; copied bytes after it are padding. */
export function decodeCapturedEffectResponse(data: Uint8Array): number {
 if(data.length!==64||data[0]!==0xfa||data[1]!==0x93||data[2]!==1||data[3]!==1||data[5]!==1)throw new RangeError('Unexpected effect response');
 return data[6]; // 0 was observed; success/error meaning is not generalized.
}

/** 0x97 captured settings pages contain whole eight-byte records, without a start-index prefix. */
export function decodeCapturedEffectRecords(payload: Uint8Array): {mode: number; rawPrefix: readonly [number,number,number,number,number]; rgb: readonly [number,number,number]}[] {
 if(payload.length===0||payload.length%8!==0)throw new RangeError('Truncated effect settings');
 const seen=new Set<number>();
 return Array.from({length:payload.length/8},(_,i)=>{
  const at=i*8,mode=payload[at];if(seen.has(mode))throw new RangeError('Duplicate effect record');seen.add(mode);
  return {mode,rawPrefix:[mode,payload[at+1],payload[at+2],payload[at+3],payload[at+4]],rgb:[payload[at+5],payload[at+6],payload[at+7]]};
 });
}
