import {ArrowDown,ArrowUp,RotateCcw,Zap} from 'lucide-react';
import {useAppStore} from '../../stores/app-store';
import {RAPID_TRIGGER_LIMITS} from '../../types';
import {PageHeader,LocalBadge} from '../layout/PageHeader';
import {KeyWorkspace} from '../keyboard/KeyWorkspace';
import {APEX_200S_LAYOUT} from '../../lib/keyboard-layout';

export function RapidTriggerPage(){
 const config=useAppStore(s=>s.rapidTriggerConfig),update=useAppStore(s=>s.updateRapidTrigger),selected=useAppStore(s=>s.selectedKeys);
 const keys=selected.filter(id=>APEX_200S_LAYOUT.some(k=>k.id===id&&!k.isSpecial));
 const subtitles=new Map(config.perKeyOverrides.map(item=>[item.keyId,item.config.enabled?`RT ${item.config.pressSensitivity.toFixed(1)}/${item.config.releaseSensitivity.toFixed(1)}`:'RT off']));
 function copyToSelected(){const remaining=config.perKeyOverrides.filter(item=>!keys.includes(item.keyId));update({perKeyOverrides:[...remaining,...keys.map(keyId=>({keyId,config:{enabled:config.enabled,pressSensitivity:config.pressSensitivity,releaseSensitivity:config.releaseSensitivity}}))]});}
 return <div className="page-stack">
  <KeyWorkspace subtitles={subtitles}/>
  <PageHeader title="Rapid Trigger" description="Fine-tune the movement needed to press and release a key again." badge={<LocalBadge/>} actions={<button className="ui-button" onClick={()=>update({enabled:false,pressSensitivity:RAPID_TRIGGER_LIMITS.defaultPress,releaseSensitivity:RAPID_TRIGGER_LIMITS.defaultRelease,perKeyOverrides:[]})}><RotateCcw size={14}/>Reset draft</button>}/>

  <div className="editor-grid"><div className="editor-panel"><div className="editor-panel-title"><h2>Press. Release. Repeat.</h2><Zap size={17} className="text-[#ffffff]"/></div><p>A local illustration of the sensitivity in this draft. This does not show live key travel from the keyboard.</p><div className="trigger-illustration" aria-label="Rapid Trigger draft illustration"><div className="travel-track"><div className="travel-guide" style={{top:`${15+config.pressSensitivity/3.6*60}%`}}/><div className="travel-stem"/><div className="travel-keycap">W</div><span className="travel-label top">REST</span><span className="travel-label bottom">BOTTOM</span></div><div className="travel-explanation"><div><span className="travel-icon"><ArrowDown size={17}/></span><span>Press sensitivity<strong>{config.pressSensitivity.toFixed(1)} mm</strong></span></div><div><span className="travel-icon"><ArrowUp size={17}/></span><span>Release sensitivity<strong>{config.releaseSensitivity.toFixed(1)} mm</strong></span></div><p>Smaller draft values represent less travel.</p></div></div><div className="inline-note">{selected.length?`${selected.length} keys selected in the workspace.`:'Select keys above to explore your setup.'} Hardware Rapid Trigger Apply is not available yet.</div></div>
   <section className="editor-panel"><div className="editor-panel-title"><h2>Rapid Trigger settings</h2><LocalBadge/></div><div className="editor-row"><button className="editor-toggle" role="switch" aria-checked={config.enabled} onClick={()=>update({enabled:!config.enabled})}><span><span className="editor-label">Enable in draft</span><span className="editor-help block">{config.enabled?'On in this local draft':'Off in this local draft'}</span></span><span className="switch-track"><i/></span></button></div>
    {([{key:'pressSensitivity',label:'Press sensitivity',help:'Downward travel before another press.'},{key:'releaseSensitivity',label:'Release sensitivity',help:'Upward travel before release.'}] as const).map(({key,label,help})=><div className="sensitivity-control" key={key}><div><label htmlFor={`rt-${key}`} className="editor-label">{label}</label><output htmlFor={`rt-${key}`}>{config[key].toFixed(1)} <small>mm</small></output></div><p className="editor-help">{help}</p><input id={`rt-${key}`} type="range" min={RAPID_TRIGGER_LIMITS.minSensitivity} max={RAPID_TRIGGER_LIMITS.maxSensitivity} step={RAPID_TRIGGER_LIMITS.step} value={config[key]} onChange={e=>update({[key]:Number(e.target.value)})}/><div className="range-endpoints"><span>{RAPID_TRIGGER_LIMITS.minSensitivity} mm</span><span>{RAPID_TRIGGER_LIMITS.maxSensitivity} mm</span></div></div>)}
    <div className="rt-draft-actions"><button className="ui-button primary" disabled={!keys.length} onClick={copyToSelected}>Copy draft to {keys.length} selected keys</button><p className="editor-help">{config.perKeyOverrides.length} key overrides in this draft. This does not enable hardware Rapid Trigger.</p></div>
    <p className="editor-help">These are editor values. Device readback is available in Settings; raw RT fields have not yet been mapped into a verified hardware workflow.</p>
   </section></div>
 </div>;
}
