import {useState} from 'react';
import {ArrowRight,Keyboard,Search,Undo2} from 'lucide-react';
import {useAppStore} from '../../stores/app-store';
import {PageHeader,LocalBadge} from '../layout/PageHeader';
import {KeyWorkspace} from '../keyboard/KeyWorkspace';
import {KEYMAP_DRAFT_KEY,KEYMAP_TARGETS,MEDIA_TARGETS,emptyKeymapDraft,parseKeymapDraft,assignmentLabel,type DraftAssignment,type KeymapDraft} from '../../lib/keymap-draft';
function load(){try{return parseKeymapDraft(localStorage.getItem(KEYMAP_DRAFT_KEY)??'');}catch{return emptyKeymapDraft();}}
export function KeyMappingPage(){
 const selected=useAppStore(s=>s.selectedKeys);
 const [layer,setLayer]=useState<'base'|'fn'>('base'),[kind,setKind]=useState<DraftAssignment['kind']>('standard'),[target,setTarget]=useState('esc'),[search,setSearch]=useState(''),[draft,setDraft]=useState(load),[status,setStatus]=useState('');
 const usable=selected.filter(id=>KEYMAP_TARGETS.some(k=>k.id===id));
 const subtitles=new Map(Object.entries(draft[layer]).map(([id,a])=>[id,assignmentLabel(a)]));
 const options=(kind==='media'?MEDIA_TARGETS:KEYMAP_TARGETS).filter(k=>`${k.id} ${k.label}`.toLowerCase().includes(search.toLowerCase()));
 function save(next:KeymapDraft){setDraft(next);try{localStorage.setItem(KEYMAP_DRAFT_KEY,JSON.stringify(next));setStatus('Draft saved in this browser. Keyboard settings have not changed.');}catch{setStatus('Updated in this page, but browser storage is unavailable. Keyboard settings have not changed.');}}
 function assign(){if(!usable.length)return;const next={...draft,[layer]:{...draft[layer]}};for(const id of usable)next[layer][id]={kind,target:kind==='disabled'?'':target};save(next);}
 function undo(){const next={...draft,[layer]:{...draft[layer]}};for(const id of usable)delete next[layer][id];save(next);}
 return <div className="page-stack">  <KeyWorkspace subtitles={subtitles}/>
<PageHeader title="Key mapping" description="Select a key, choose an assignment and build your layout." badge={<LocalBadge/>} actions={<div className="editor-segment" aria-label="Keyboard layer"><button aria-pressed={layer==='base'} onClick={()=>setLayer('base')}>Base layer</button><button aria-pressed={layer==='fn'} onClick={()=>setLayer('fn')}>FN layer</button></div>}/>

  <div className="editor-grid"><section className="editor-panel"><div className="editor-panel-title"><h2>Choose an assignment</h2><span className="subtle-tag">{layer.toUpperCase()} LAYER</span></div><div className="editor-segment" aria-label="Assignment type">{([{id:'standard',label:'Keyboard'},{id:'media',label:'Media'},{id:'disabled',label:'Unassigned'}] as const).map(item=><button key={item.id} aria-pressed={kind===item.id} onClick={()=>{setKind(item.id);setTarget(item.id==='media'?'play-pause':'esc');setSearch('');}}>{item.label}</button>)}</div>
   {kind!=='disabled'?<><label className="assignment-search"><Search size={14}/><input aria-label="Search key assignments" placeholder="Search assignments…" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="assignment-grid">{options.map(option=><button className="assignment-option" key={option.id} aria-pressed={target===option.id} onClick={()=>setTarget(option.id)}>{option.label}</button>)}</div>{!options.length&&<p className="editor-help mt-4">No matching assignments.</p>}</>:<div className="assignment-empty"><div><Keyboard size={26} className="mx-auto mb-3"/>Mark selected keys as unassigned in this draft.</div></div>}
  </section><section className="editor-panel"><div className="editor-panel-title"><h2>Your selection</h2><span className="subtle-tag">{usable.length} KEYS</span></div>{usable.length?<><div className="selection-chips">{usable.map(id=><span key={id}>{KEYMAP_TARGETS.find(k=>k.id===id)?.label}</span>)}</div><div className="assignment-preview"><span>{usable.length===1?KEYMAP_TARGETS.find(k=>k.id===usable[0])?.label:`${usable.length} keys`}</span><ArrowRight size={16}/><strong>{assignmentLabel({kind,target:kind==='disabled'?'':target})}</strong></div><button className="ui-button primary w-full" onClick={assign}>Assign in draft</button><button className="ui-button w-full mt-2" onClick={undo}><Undo2 size={13}/>Clear selected assignments</button></>:<div className="assignment-empty">Select a physical key above to start.</div>}<p className="editor-help mt-4">Assignments stay in this browser. Hardware remapping and advanced actions are not available yet.</p><p role="status" aria-live="polite" className="editor-help mt-3">{status}</p></section></div>
 </div>;
}
