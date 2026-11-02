import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
test('Actual app store reflects physical unplug and clears readback without sending a report',async()=>{
 const previous=Object.getOwnPropertyDescriptor(navigator,'hid');const bus=new EventTarget();let writes=0;
 const device=new EventTarget();Object.assign(device,{vendorId:0x314b,productId:0x1026,productName:'APEX test',opened:false,collections:[{usagePage:0xff02,usage:2,inputReports:[{reportId:0,items:[{reportSize:8,reportCount:64}]}],outputReports:[{reportId:0,items:[{reportSize:8,reportCount:64}]}]}],async open(){this.opened=true},async close(){this.opened=false},async sendReport(){writes++;throw Error('Unexpected settings report')}});
 Object.defineProperty(navigator,'hid',{configurable:true,value:{getDevices:async()=>[device],addEventListener:bus.addEventListener.bind(bus),removeEventListener:bus.removeEventListener.bind(bus)}});
 const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});let store;
 try{
  store=(await server.ssrLoadModule('/src/stores/app-store.ts')).useAppStore;
  assert.equal(store.getState().useMock,false);await store.getState().scanDevices();const found=store.getState().discoveredDevices[0];assert.ok(found);
  await store.getState().connectDevice(found.path);assert.equal(store.getState().connection.state,'connected');
  store.setState({deviceSnapshot:{schema:'apex-device-readback',version:1,sections:[]}});
  const unplug=new Event('disconnect');Object.assign(unplug,{device});bus.dispatchEvent(unplug);
  assert.equal(store.getState().connection.state,'disconnected');assert.equal(store.getState().connection.device,null);assert.equal(store.getState().deviceSnapshot,null);assert.equal(writes,0);
 }finally{if(store)await store.getState().disconnectDevice();await server.close();if(previous)Object.defineProperty(navigator,'hid',previous);else delete navigator.hid;}
});
test('Actual app store locks mode and overlapping operations, then releases UI after failure',async()=>{
 const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
 let transport,originalRead;
 try{
  const store=(await server.ssrLoadModule('/src/stores/app-store.ts')).useAppStore;
  transport=(await server.ssrLoadModule('/src/lib/hid/webhid-transport.ts')).WebHidTransport;
  originalRead=transport.prototype.readDeviceState;
  let release;transport.prototype.readDeviceState=()=>new Promise(resolve=>{release=resolve});
  store.setState({connection:{...store.getState().connection,state:'connected',device:{vendorId:0x314b,productId:0x1026,product:'Fake APEX'},isMock:false}});
  const pending=store.getState().readDeviceState();assert.equal(store.getState().deviceBusy,true);
  store.getState().toggleMockMode();assert.equal(store.getState().useMock,false);
  await assert.rejects(store.getState().readActuation(),/already in progress/);
  const snapshot={schema:'apex-device-readback',version:1,sections:[]};release(snapshot);await pending;
  assert.equal(store.getState().deviceBusy,false);assert.equal(store.getState().deviceSnapshot,snapshot);
  transport.prototype.readDeviceState=async()=>{throw Error('planned read failure')};
  await assert.rejects(store.getState().readDeviceState(),/planned read failure/);assert.equal(store.getState().deviceBusy,false);
  await store.getState().disconnectDevice();
 }finally{if(transport)transport.prototype.readDeviceState=originalRead;await server.close();}
});
