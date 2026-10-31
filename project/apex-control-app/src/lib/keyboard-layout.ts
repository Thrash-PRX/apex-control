/** APEX 200: 82 active keys. Source: vendor APEX geometry, official product photo,
 * and user-confirmed model/key count. W→34 is capture-confirmed; remaining HID
 * indices are static-source-derived. Legacy export names retained for callers. */
import physicalKeys from './apex200-physical-layout.json' with {type:'json'};
export interface KeyDefinition {id:string;label:string;secondaryLabel?:string;x:number;y:number;w:number;h:number;row:number;col:number;isSpecial?:boolean;deviceIndex?:number;}
export const APEX_200S_LAYOUT: KeyDefinition[] = [...physicalKeys,{id:'knob',label:'Volume',x:870/54,y:228/54,w:50/54,h:50/54,row:4,col:15,isSpecial:true}];
export const APEX_200S_KEY_COUNT=physicalKeys.length;
export const LAYOUT_BOUNDS={width:17.3,height:6.3} as const;
export const LAYOUT_VERIFIED=false;
export const APEX_DISPLAY={x:816/54,y:12/54,w:104/54,h:50/54};
export const APEX_LIGHT_BAR={x:816/54,y:198/54,w:104/54,h:8/54};
