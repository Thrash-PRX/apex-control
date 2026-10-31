import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../dist/', import.meta.url);
const port = 5175;
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon' };
const server = createServer(async (req,res)=>{
 if (!['127.0.0.1:'+port,'localhost:'+port].includes(req.headers.host)) {res.writeHead(403).end();return;}
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return;}
 try {
  const path = new URL(req.url,'http://localhost').pathname;
  if(path!=='/'&&path!=='/index.html'&&!/^\/assets\/[a-zA-Z0-9_.-]+$/.test(path)){res.writeHead(404).end();return;}
  const file = new URL(path==='/'?'index.html':path.slice(1),root);
  const data=await readFile(file); const ext=fileURLToPath(file).match(/\.[^.]+$/)?.[0];
  res.writeHead(200,{'Content-Type':mime[ext]??'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});
  res.end(req.method==='HEAD'?undefined:data);
 } catch {res.writeHead(404).end();}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'APEX preview is already running. Open http://127.0.0.1:5175':error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{ if(process.argv.includes('--open') && process.platform==='win32') spawn('cmd.exe',['/c','start','','http://127.0.0.1:5175'],{windowsHide:true,stdio:'ignore'}); console.log('APEX CONTROL local preview: http://127.0.0.1:5175\nHardware Apply is locked. Close this window to stop.'); });


