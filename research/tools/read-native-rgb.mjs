/** Captured RGB getters only. Never selects a mode or changes settings. */
import {createRequire} from 'node:module';import fs from 'node:fs';
if(!process.argv[2]||!process.argv[3])throw Error('Installed node-hid package JSON and new private output file required');
const HID=createRequire(process.argv[2])('node-hid');
const found=HID.devices().filter(d=>d.vendorId===0x314b&&d.productId===0x1026&&d.usagePage===0xff02&&d.usage===2);if(found.length!==1)throw Error('Expected one APEX');
const device=new HID.HID(found[0].path);
try{
 const exchange=(cmd,payload=[],page=1,total=1)=>{const p=Array(65).fill(0);p.splice(0,7+payload.length,0,250,cmd,page,total,0,payload.length,...payload);if(device.write(p)!==65)throw Error('Short getter request');const deadline=performance.now()+2000;while(performance.now()<deadline){const r=device.readTimeout(25);if(r[0]!==250||r[1]!==(cmd|128)||r[2]!==page)continue;if(r.length!==64||r[5]>58)throw Error('Invalid RGB getter response');return r;}throw Error('RGB getter timeout');};
 const effects=[];let total=1;for(let page=1;page<=total;page++){const r=exchange(23,[255],page,total);if(page===1)total=r[3];if(total<1||total>16||r[3]!==total||r[5]===0||r[5]%8)throw Error('Effect table bounds');for(let n=0;n<r[5]/8;n++)effects.push(r.slice(6+n*8,14+n*8));}if(new Set(effects.map(r=>r[0])).size!==effects.length)throw Error('Duplicate effect settings');
 const palette=[];total=1;for(let page=1;page<=total;page++){const r=exchange(22,[],page,total);if(page===1)total=r[3];if(total<1||total>16||r[3]!==total||r[5]<5||(r[5]-1)%4)throw Error('Palette bounds');for(let n=0;n<(r[5]-1)/4;n++){const i=r[6]+n;if(i>255)throw Error('Palette index');palette.push([i,r.slice(7+n*4,11+n*4)]);}}if(new Set(palette.map(r=>r[0])).size!==palette.length)throw Error('Duplicate palette settings');
 fs.writeFileSync(process.argv[3],JSON.stringify({device:'314B:1026',effects,palette,completeDeviceBackup:false},null,2),{flag:'wx'});
 const mode1=effects.find(r=>r[0]===1);console.log(JSON.stringify({mode1,matchesEarlierNativeWhiteTarget:JSON.stringify(mode1)==='[1,100,50,0,13,255,255,255]',effectRecords:effects.length,paletteRecords:palette.length,configurationMutations:0}));
}finally{device.close();}
