import {useState} from 'react';
import {ArrowRight, ArrowUpRight, FolderOpen, Gauge, Keyboard, Loader2, Monitor, Palette, Plug, Settings, SlidersHorizontal, Unplug, Zap} from 'lucide-react';
import {useAppStore, type AppPage} from '../../stores/app-store';
import {ConnectionState} from '../../types';
import {KeyboardVisualizer} from '../keyboard';
import {PageHeader} from '../layout/PageHeader';
const features=[
 {page:'key-mapping',title:'Key mapping',detail:'Give every key a purpose.',icon:Keyboard,draft:true},
 {page:'actuation',title:'Actuation',detail:'Find your ideal trigger point.',icon:Gauge,draft:false},
 {page:'rapid-trigger',title:'Rapid Trigger',detail:'Fine-tune press and release.',icon:Zap,draft:true},
 {page:'socd',title:'SOCD',detail:'Choose how opposing keys behave.',icon:SlidersHorizontal,draft:true},
 {page:'lighting',title:'Lighting',detail:'Set the tone of your setup.',icon:Palette,draft:false},
 {page:'display',title:'OLED Studio',detail:'A little screen, made yours.',icon:Monitor,draft:true},
] as const;
function profileName(){try{const profiles=JSON.parse(localStorage.getItem('apex-control-profiles-v1')??'[]');const active=Array.isArray(profiles)?profiles.find(p=>p?.active&&typeof p.name==='string'):null;return active?.name??'Default Desktop';}catch{return 'Default Desktop';}}
export function DashboardPage(){
 const connection=useAppStore(s=>s.connection),mock=useAppStore(s=>s.useMock),pair=useAppStore(s=>s.pairDevice),scan=useAppStore(s=>s.scanDevices),connect=useAppStore(s=>s.connectDevice),disconnect=useAppStore(s=>s.disconnectDevice),navigate=useAppStore(s=>s.setActivePage);
 const [error,setError]=useState('');const [profile]=useState(profileName);
 const occupied=useAppStore(s=>s.deviceBusy);
 const connected=connection.state===ConnectionState.Connected,busy=connection.state===ConnectionState.Connecting||connection.state===ConnectionState.Scanning;
 const supported=typeof navigator!=='undefined'&&'hid' in navigator;
 async function pairKeyboard(){setError('');try{if(mock){await scan();const d=useAppStore.getState().discoveredDevices[0];if(d)await connect(d.path);}else{const d=await pair();if(d)await connect(d.path);}}catch(e){setError(e instanceof Error?e.message:String(e));}}
 function open(page:AppPage){navigate(page);}
 return <div className="page-stack">
  <PageHeader eyebrow="YOUR WORKSPACE" title="Welcome to your setup." description="A little fine-tuning. A keyboard that feels like yours." actions={<button className="ui-button" onClick={()=>open('profiles')}><FolderOpen size={15}/>Profile drafts</button>}/>
  <section className="overview-hero"><div className="overview-hero-header"><div><p className="overview-eyebrow">YOUR KEYBOARD</p><h2>APEX 200<span className="product-tag">MAGNETIC</span></h2><p>82 keys · Rotary dial · OLED display</p></div><span className="connection-pill"><i className={connected&&!mock?'device-dot connected':'device-dot'}/>{mock?'Demo workspace':connected?'USB connected':busy?'Connecting…':'Not connected'}</span></div>
   <div className="overview-keyboard"><KeyboardVisualizer interactive={false} mode="display"/></div>
   <div className="overview-hero-footer"><span>{mock?'Demo mode is on. No keyboard settings will be changed.':connected?'Your keyboard is ready for supported device controls.':'Connect with USB to read and configure your keyboard.'}</span><button className="ui-button primary" disabled={busy||occupied||(!mock&&!supported)} onClick={connected?()=>disconnect():pairKeyboard}>{busy?<Loader2 size={15} className="animate-spin"/>:connected?<Unplug size={15}/>:<Plug size={15}/>} {connected?'Disconnect':mock?'Connect demo':'Connect keyboard'}</button></div>
  </section>
  {(error||connection.error)&&<p role="alert" className="inline-error">{error||connection.error}</p>}
  {!supported&&!mock&&<p className="inline-note">USB pairing needs a WebHID-capable browser such as Chrome or Edge. You can explore the editors using Demo mode.</p>}
  <div className="overview-strip"><button onClick={()=>open('profiles')}><span className="strip-icon"><FolderOpen size={18}/></span><span><small>LOCAL PROFILE</small><strong>{profile}</strong></span><ArrowUpRight size={16}/></button><button onClick={()=>open('actuation')}><span className="strip-icon"><Gauge size={18}/></span><span><small>DEVICE ACTUATION</small><strong>Read, apply & restore</strong></span><ArrowUpRight size={16}/></button><button onClick={()=>open('settings')}><span className="strip-icon"><Settings size={18}/></span><span><small>DEVICE TOOLS</small><strong>Readback & diagnostics</strong></span><ArrowUpRight size={16}/></button></div>
  <div className="section-heading"><div><h2>Make it your own</h2><p>Choose a setting to get started.</p></div><span className="subtle-tag">APEX CONTROL WEB</span></div>
  <div className="feature-grid">{features.map(({page,title,detail,icon:Icon,draft})=><button key={page} className="feature-card" onClick={()=>open(page)}><div className="feature-card-top"><span className="feature-icon"><Icon size={22}/></span><span className={draft?'subtle-tag':'available-tag'}>{draft?'LOCAL EDITOR':'DEVICE CONTROLS'}</span></div><h3>{title}</h3><p>{detail}</p><ArrowRight size={17} className="feature-arrow"/></button>)}</div>
 </div>;
}
