// Offline source render check. No browser, device access or network requests.
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
const saved=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
const memory=new Map();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)}});
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
try{
 const pages=[['dashboard','DashboardPage'],['key-mapping','KeyMappingPage'],['actuation','ActuationPage'],['rapid-trigger','RapidTriggerPage'],['socd','SocdPage'],['lighting','LightingPage'],['display','DisplayPage'],['profiles','ProfilesPage'],['settings','SettingsPage']];
 const results=[];
 const layout=await server.ssrLoadModule('/src/components/layout/AppLayout.tsx');
 const shell=renderToString(createElement(layout.AppLayout,null,createElement('h1',null,'Workspace')));
 if(!shell.includes('aria-label="Main navigation"')||!shell.includes('id="workspace"')||!shell.includes('hub-wordmark')||!shell.includes('Read config'))throw Error('App shell render failed');
 for(const [directory,name] of pages){
  const module=await server.ssrLoadModule(`/src/components/${directory}/${name}.tsx`);
  const html=renderToString(createElement(module[name]));
  const headings=(html.match(/<h1[\s>]/g)??[]).length;
  if(headings!==1||html.includes('0x3402')||html.includes('Sinowealth'))throw Error(`Unexpected page output: ${name}`);
  results.push({page:directory,headingCount:headings,rendered:true,bytes:Buffer.byteLength(html)});
 }
 console.log(JSON.stringify({method:'offline-react-server-render',browserVerification:false,deviceAccess:false,shellRendered:true,pages:results},null,2));
}finally{
 await server.close();
 if(saved)Object.defineProperty(globalThis,'localStorage',saved);else delete globalThis.localStorage;
}
