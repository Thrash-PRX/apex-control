import {KeyboardVisualizer} from './KeyboardVisualizer';
import {useAppStore} from '../../stores/app-store';
export function KeyWorkspace({subtitles}:{subtitles?:Map<string,string>}) {
 const selected=useAppStore(s=>s.selectedKeys),select=useAppStore(s=>s.setSelectedKeys);
 return <section className="keyboard-workspace"><div className="keyboard-toolbar"><span><strong>APEX 200</strong><span className="toolbar-muted">82-key layout</span></span><div className="selection-actions"><span>{selected.length ? `${selected.length} selected` : 'Select a key'}</span>{selected.length>0&&<button onClick={()=>select([])}>Clear selection</button>}</div></div><KeyboardVisualizer selectedKeys={selected} onKeySelect={select} keySubtitles={subtitles}/><div className="keyboard-hint">Click a key to select it. Hold Shift to select multiple keys.</div></section>;
}
