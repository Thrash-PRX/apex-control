import { decodeCapturedEffectRecords, encodeCapturedEffect } from './protocol/captured-effect.ts';
/** Narrow RGB workflow. Generic transport writes remain locked. */
export async function applyDeviceRgb(device: HIDDevice, mode: number, rgb: readonly [number,number,number], brightness: number, speed: number): Promise<void> {
 if(device.vendorId!==0x314b||device.productId!==0x1026||![1,3].includes(mode))throw Error('Only captured APEX Static and Breath modes are enabled');
 if([brightness,speed].some(v=>!Number.isInteger(v)||v<0||v>100)||rgb.some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('Invalid RGB settings');
 const exchange=(packet:Uint8Array,expected:number):Promise<Uint8Array>=>new Promise((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timer);device.removeEventListener('inputreport',handler);};
  const handler=(e:HIDInputReportEvent)=>{const data=new Uint8Array(e.data.buffer,e.data.byteOffset,e.data.byteLength);if(data[0]!==250||data[1]!==expected)return;cleanup();if(data.length!==64||data[2]!==packet[2]||data[5]>58)reject(Error('RGB response mismatch; settings may have changed'));else resolve(data.slice());};
  const timer=setTimeout(()=>{cleanup();reject(Error('RGB timeout; settings may have changed. Close MKeyboard and retry readback.'));},2000);
  device.addEventListener('inputreport',handler);device.sendReport(0,packet).catch(e=>{cleanup();reject(e);});
 });
 const read=async()=>{const records=[];let total=1;for(let page=1;page<=total;page++){const p=new Uint8Array(64);p.set([250,23,page,total,0,1,255]);const r=await exchange(p,151);if(page===1){total=r[3];if(total<1||total>16)throw Error('Invalid effect page count');}if(r[3]!==total)throw Error('Effect page count changed');records.push(...decodeCapturedEffectRecords(r.slice(6,6+r[5])));}if(new Set(records.map(r=>r.mode)).size!==records.length)throw Error('Duplicate effect settings');return records;};
 const records=await read(),previous=records.find(r=>r.mode===mode);if(!previous)throw Error('Selected effect not found on device');
 // Must persist the exact device settings before any configuration mutation.
 localStorage.setItem('apex-rgb-device-backup-v1',JSON.stringify({version:1,device:'314B:1026',time:new Date().toISOString(),records,completeDeviceBackup:false}));
 const prefix=[...previous.rawPrefix] as [number,number,number,number,number];prefix[1]=brightness;prefix[2]=speed;
 const ack=await exchange(encodeCapturedEffect(prefix,rgb),147);if(ack[3]!==1||ack[5]!==1||ack[6]!==0)throw Error('RGB write not acknowledged; settings may have changed');
 const select=new Uint8Array(64);select.set([250,25,1,1,0,1,mode]);const selected=await exchange(select,153);if(selected[3]!==1||selected[5]!==1||selected[6]!==0)throw Error('RGB mode selection not acknowledged');
 const after=(await read()).find(r=>r.mode===mode);if(!after||JSON.stringify([...after.rawPrefix,...after.rgb])!==JSON.stringify([...prefix,...rgb]))throw Error('RGB readback differs; settings may have changed');
}
