class RgbTimeout extends Error {}
/** Serial request/response helper. Only captured read-only getters may be retried. */
export async function exchangeRgb(device:HIDDevice,request:Uint8Array,options:{timeoutMs?:number;retryDelayMs?:number}={}):Promise<Uint8Array>{
 const p=request.slice(),timeoutMs=options.timeoutMs??2000;
 const once=():Promise<Uint8Array>=>new Promise((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timer);device.removeEventListener('inputreport',handler);};
  const handler=(event:HIDInputReportEvent)=>{
   if(event.reportId!==undefined&&event.reportId!==0)return;
   const r=new Uint8Array(event.data.buffer,event.data.byteOffset,event.data.byteLength);
   // A delayed reply for another page must not consume this page's listener.
   if(r[0]!==250||r[1]!==(p[1]|128)||r[2]!==p[2])return;
   cleanup();if(r.length!==64||r[5]>58)reject(Error('RGB response mismatch at command 0x'+p[1].toString(16)+' page '+p[2]));else resolve(r.slice());
  };
  const timer=setTimeout(()=>{cleanup();reject(new RgbTimeout('RGB timeout at command 0x'+p[1].toString(16)+' page '+p[2]+'/'+p[3]+'; reconnect and restore saved RGB settings'));},timeoutMs);
  device.addEventListener('inputreport',handler);
  try{Promise.resolve(device.sendReport(0,p)).catch(e=>{cleanup();reject(e);});}catch(e){cleanup();reject(e);}
 });
 try{return await once();}catch(e){
  if(!(e instanceof RgbTimeout)||![0x16,0x17].includes(p[1]))throw e;
  await new Promise(resolve=>setTimeout(resolve,options.retryDelayMs??100));
  return once();
 }
}
