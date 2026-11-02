import {useState} from 'react';
import {ArrowDown,Keyboard,RefreshCw,Undo2} from 'lucide-react';
import {useAppStore} from '../../stores/app-store';
import {APEX_200S_LAYOUT} from '../../lib/keyboard-layout';
import {ACTUATION_BACKUP_KEY,ACTUATION_WRITES_ENABLED,type TriggerTable} from '../../lib/device-actuation';
function pendingBackup(){try{return Boolean(localStorage.getItem(ACTUATION_BACKUP_KEY));}catch{return false;}}
export function DeviceActuationPanel(){
 const read=useAppStore(s=>s.readActuation),apply=useAppStore(s=>s.applyActuation),selected=useAppStore(s=>s.selectedKeys),ready=useAppStore(s=>!s.useMock&&s.connection.state==='connected');
 const identity=useAppStore(s=>s.connection.device);
 const occupied=useAppStore(s=>s.deviceBusy);
 const [snapshot,setSnapshot]=useState<{identity:unknown;table:TriggerTable}|null>(null),[draft,setDraft]=useState<{selection:string;value:string}|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[backup,setBackup]=useState(pendingBackup),[failed,setFailed]=useState(false);
 const table=snapshot?.identity===identity?snapshot?.table??null:null;
 const keys=APEX_200S_LAYOUT.filter(k=>selected.includes(k.id)&&k.deviceIndex!==undefined),signature=keys.map(k=>k.id).join(',');
 const first=table?.find(([i])=>i===keys[0]?.deviceIndex)?.[1];
 const target=draft?.selection===signature?draft.value:first?((first[0]|first[1]<<8)/100).toFixed(2):'2.40';
 const raw=Math.round(Number(target)*100),validTarget=target.trim()!==''&&Number.isFinite(raw)&&raw>=10&&raw<=359&&Math.abs(Number(target)*100-raw)<1e-8;
 const validSelection=keys.length>0&&keys.length===selected.length;
 async function run(action:'read'|'apply'|'restore'){
  setBusy(true);setFailed(false);setStatus(action==='read'?'Reading keyboard…':action==='apply'?'Backing up and applying actuation…':'Restoring previous actuation…');
  try{
   if(action!=='read')await apply(raw,keys.map(k=>k.deviceIndex!),action==='restore');
   setSnapshot({identity,table:await read()});setDraft(null);
   setStatus(action==='read'?'Device settings read. Nothing changed.':action==='restore'?'Previous actuation restored. Full trigger table verified.':'Actuation applied. Full trigger table and RT bytes verified.');
  }catch(e){setFailed(true);setStatus(e instanceof Error?e.message:String(e));}finally{setBackup(pendingBackup());setBusy(false);}
 }
 return <section className="device-actuation-section" aria-labelledby="hardware-actuation-title">
  <div className="editor-panel-title"><div><h2 id="hardware-actuation-title">Actuation settings</h2><p className="editor-help">Set the trigger point for selected keys.</p></div><button className="ui-button" disabled={!ready||busy||occupied} onClick={()=>run('read')}><RefreshCw size={14}/>Read keyboard</button></div>
  {!keys.length?<div className="no-selection"><Keyboard size={28}/><h3>No keys selected</h3><p>Select keys above, or use Select all / Select WASD.</p></div>:<div className="actuation-control-grid"><div className="actuation-adjustment"><div className="actuation-value"><label htmlFor="device-actuation-number">Trigger point</label><div><input id="device-actuation-number" aria-label="Target device actuation in millimetres" type="number" min="0.10" max="3.59" step="0.01" value={target} onChange={e=>setDraft({selection:signature,value:e.target.value})} disabled={busy}/><span>mm</span></div></div><input aria-label="Device actuation slider" className="actuation-range" type="range" min="10" max="359" step="1" value={validTarget?raw:240} onChange={e=>setDraft({selection:signature,value:(Number(e.target.value)/100).toFixed(2)})} disabled={busy}/><div className="range-endpoints"><span>0.10 mm</span><span>3.59 mm</span></div><div className="selection-chips">{keys.map(key=><span key={key.id}>{key.label}</span>)}</div><button className="ui-button primary" disabled={!ACTUATION_WRITES_ENABLED||!ready||busy||occupied||!validSelection||!table||!validTarget||backup} onClick={()=>run('apply')}>Apply to {keys.length} selected {keys.length===1?'key':'keys'}</button>{!table&&<p className="editor-help mt-3">Read the keyboard before applying.</p>}{backup&&<p className="editor-help mt-3">A previous actuation backup is available. Restore it before another Apply.</p>}</div><div className="actuation-current"><ArrowDown size={20}/><h3>Read from keyboard</h3>{table?<div className="current-values">{keys.map(key=>{const r=table.find(([i])=>i===key.deviceIndex)?.[1];return r&&<span key={key.id}><strong>{key.label}</strong>{((r[0]|r[1]<<8)/100).toFixed(2)} mm</span>;})}</div>:<p>Read your current trigger points before changing them.</p>}</div></div>}
  <div className="actuation-footer"><p role="status" aria-live="polite" className={failed?'text-red-300':''}>{status||(ready?'Close MKeyboard before reading or applying.':'Connect your keyboard from Overview to use device controls.')}</p><button className="ui-button" disabled={!ACTUATION_WRITES_ENABLED||!ready||busy||occupied||!backup} onClick={()=>run('restore')}><Undo2 size={13}/>Restore previous</button></div>
  <details className="device-details"><summary>Verification & backup details</summary><p>Actuation Apply and restore were physically tested on W. Other key names follow the vendor layout and have not been checked individually. Every Apply keeps a browser backup and verifies all 84 trigger slots, including RT and unrelated keys. No RT settings are changed by this control.</p></details>
 </section>;
}
