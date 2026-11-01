import {APEX_200S_LAYOUT} from './keyboard-layout.ts';
export const KEYMAP_DRAFT_KEY='apex-keymap-draft-v1';
export const KEYMAP_TARGETS=APEX_200S_LAYOUT.filter(k=>!k.isSpecial).map(k=>({id:k.id,label:k.label}));
export const MEDIA_TARGETS=[{id:'play-pause',label:'Play / Pause'},{id:'mute',label:'Mute'},{id:'volume-up',label:'Volume up'},{id:'volume-down',label:'Volume down'},{id:'next-track',label:'Next track'},{id:'previous-track',label:'Previous track'}];
export type DraftAssignment={kind:'standard'|'media'|'disabled';target:string};
export type KeymapDraft={version:1;base:Record<string,DraftAssignment>;fn:Record<string,DraftAssignment>};
export const emptyKeymapDraft=():KeymapDraft=>({version:1,base:{},fn:{}});
const keys=new Set(KEYMAP_TARGETS.map(k=>k.id));
export function parseKeymapDraft(text:string):KeymapDraft{
 if(text.length>100000)throw Error('Keymap draft too large');
 const value=JSON.parse(text) as KeymapDraft;
 if(!value||value.version!==1)throw Error('Unsupported draft version');
 for(const layer of [value.base,value.fn]){
  if(!layer||Array.isArray(layer)||typeof layer!=='object'||Object.keys(layer).length>82)throw Error('Invalid draft layer');
  for(const [key,a] of Object.entries(layer)){
   if(!keys.has(key)||!a||typeof a!=='object'||!['standard','media','disabled'].includes(a.kind)||typeof a.target!=='string')throw Error('Invalid key assignment');
   if((a.kind==='standard'&&!keys.has(a.target))||(a.kind==='media'&&!MEDIA_TARGETS.some(m=>m.id===a.target))||(a.kind==='disabled'&&a.target!==''))throw Error('Unsupported draft target');
  }
 }
 return value;
}
export function assignmentLabel(a:DraftAssignment){return a.kind==='disabled'?'Unassigned':a.kind==='media'?MEDIA_TARGETS.find(m=>m.id===a.target)?.label??a.target:KEYMAP_TARGETS.find(k=>k.id===a.target)?.label??a.target;}
