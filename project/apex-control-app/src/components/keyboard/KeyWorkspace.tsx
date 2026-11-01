import {KeyboardVisualizer} from './KeyboardVisualizer';
import {useAppStore} from '../../stores/app-store';
import {APEX_200S_LAYOUT} from '../../lib/keyboard-layout';
export function KeyWorkspace({subtitles}:{subtitles?:Map<string,string>}) {
 const selected=useAppStore(s=>s.selectedKeys),select=useAppStore(s=>s.setSelectedKeys);
 const ids=APEX_200S_LAYOUT.filter(k=>!k.isSpecial).map(k=>k.id);
 return <section className="keyboard-workspace"><KeyboardVisualizer selectedKeys={selected} onKeySelect={select} keySubtitles={subtitles}/><div className="keyboard-toolbar"><span><strong>APEX 200</strong><span className="toolbar-muted">{selected.length ? `${selected.length} keys selected` : 'Select one or more keys'}</span></span><div className="selection-actions"><button aria-pressed={ids.every(id=>selected.includes(id))} onClick={()=>select(ids)}>Select all</button><button aria-pressed={selected.length===4&&['w','a','s','d'].every(id=>selected.includes(id))} onClick={()=>select(['w','a','s','d'])}>Select WASD</button><button disabled={!selected.length} onClick={()=>select([])}>Clear</button></div></div></section>;
}
