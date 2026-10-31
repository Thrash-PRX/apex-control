import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
/** Offline USBPcap classic-PCAP reader. Does not open devices or send packets. */
import { readFileSync } from 'node:fs';
export function inspectUsbPcap(bytes, deviceAddress) {
 const b=Buffer.from(bytes);
 if(b.length<24||b.readUInt32LE(0)!==0xa1b2c3d4||b.readUInt32LE(20)!==249)throw Error('Expected little-endian classic PCAP with USBPcap link type 249');
 const result={packets:0,descriptors:[],reports:[],truncated:false}; let offset=24,first=null;
 while(offset<b.length){
  if(offset+16>b.length){result.truncated=true;break;}
  const length=b.readUInt32LE(offset+8),original=b.readUInt32LE(offset+12);
  if(length>16*1024*1024||offset+16+length>b.length){result.truncated=true;break;}
  const stamp=b.readUInt32LE(offset)+b.readUInt32LE(offset+4)/1e6;
  first??=stamp; const packet=b.subarray(offset+16,offset+16+length);offset+=16+length;
  if(packet.length<27)throw Error('USBPcap header truncated');
  const header=packet.readUInt16LE(0),address=packet.readUInt16LE(19),declared=packet.readUInt32LE(23);
  if(header<27||header>packet.length||declared>packet.length-header||length!==original)throw Error('Incomplete USBPcap packet');
  if(address!==deviceAddress)continue;
  result.packets++;
  const payload=packet.subarray(header,header+declared),transfer=packet[22],endpoint=packet[21];
  if(transfer===2&&payload.length>=18&&payload[0]===18&&payload[1]===1)result.descriptors.push({vendorId:payload.readUInt16LE(8),productId:payload.readUInt16LE(10)});
  const prefix=payload[0]===0xfa?0:payload[0]===0&&payload[1]===0xfa?1:-1;
  if(prefix>=0){ const p=payload.subarray(prefix);result.reports.push({elapsedMs:Math.round((stamp-first)*1000),direction:endpoint&128?'in':'out',endpoint,transfer,status:packet.readUInt32LE(10),bytes:payload.length,reportIdPrefix:prefix,command:p[1],frame:p[2],total:p[3],field4:p[4],payloadLength:p[5],data:[...p]}); }
 }
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(JSON.stringify(inspectUsbPcap(readFileSync(process.argv[2]),Number(process.argv[3])),null,2));

