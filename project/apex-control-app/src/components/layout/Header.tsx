import {useState} from 'react';
import {ChevronLeft,FlaskConical,FolderOpen,Keyboard,Loader2,RefreshCw,Settings} from 'lucide-react';
import {useAppStore} from '../../stores/app-store';
export function Header(){
 const page=useAppStore(s=>s.activePage),navigate=useAppStore(s=>s.setActivePage),connection=useAppStore(s=>s.connection),mock=useAppStore(s=>s.useMock),toggle=useAppStore(s=>s.toggleMockMode),read=useAppStore(s=>s.readDeviceState);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function readConfig(){setBusy(true);setMessage('Reading device…');try{const result=await read();setMessage(`${result.sections.length} sections read`);navigate('settings');}catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 return <header className={`hub-header ${page==='dashboard'?'is-home':''}`}>
  <div className="hub-header-left">{page==='dashboard'?<button className="hub-wordmark" onClick={()=>navigate('dashboard')} aria-label="APEX CONTROL overview">APEX<span>CONTROL</span></button>:<><button className="hub-pill" onClick={()=>navigate('dashboard')}><ChevronLeft size={15}/>Back</button><button className="hub-pill hub-model" onClick={()=>navigate('dashboard')}><Keyboard size={16}/>APEX 200<span className={connection.state==='connected'&&!mock?'device-dot connected':'device-dot'}/></button></>}</div>
  <div className="hub-header-actions"><button className="hub-pill profile-shortcut" onClick={()=>navigate('profiles')}><FolderOpen size={15}/>Profile drafts</button><button className="hub-pill white" disabled={busy||mock||connection.state!=='connected'} onClick={readConfig}>{busy?<Loader2 size={15} className="animate-spin"/>:<RefreshCw size={15}/>}Read config</button><button className="hub-icon-button" onClick={()=>navigate('settings')} aria-label="Settings"><Settings size={19}/></button><button className={`hub-icon-button ${mock?'selected':''}`} onClick={toggle} role="switch" aria-checked={mock} aria-label="Demo mode" title="Toggle demo mode"><FlaskConical size={18}/></button></div>
  {message&&<p role="status" className="hub-read-status">{message}</p>}
 </header>;
}
