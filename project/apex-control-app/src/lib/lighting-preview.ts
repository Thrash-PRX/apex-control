/** Authored browser previews, not recovered WK68 firmware algorithms. No device I/O. */
import type { LightingConfig, RgbColor } from '../types/lighting.ts';
import type { KeyDefinition } from './keyboard-layout.ts';

function spectrum(h: number): RgbColor {
 const n=((h%1)+1)%1*6, x=1-Math.abs(n%2-1);
 const colors=[[1,x,0],[x,1,0],[0,1,x],[0,x,1],[x,0,1],[1,0,x]];
 const c=colors[Math.floor(n)]; return {r:c[0]*255,g:c[1]*255,b:c[2]*255};
}
export function previewLighting(config: LightingConfig, keys: readonly KeyDefinition[], seconds: number, selected: readonly string[]=[]): Map<string,RgbColor> {
 const result=new Map<string,RgbColor>();
 const time=seconds*(0.15+config.speed/100*1.85), brightness=Math.max(0,Math.min(1,config.brightness/100));
 for(const key of keys){
  if(key.isSpecial) continue;
  const vertical=config.direction==='top-to-bottom'||config.direction==='bottom-to-top';
  let position=vertical?key.y/6:key.x/17;
  if(config.direction==='right-to-left'||config.direction==='bottom-to-top')position=1-position;
  let color=config.primaryColor, gain=1;
  switch(config.effect){
   case 'off': gain=0; break;
   case 'breathing': gain=(Math.sin(time*Math.PI*2)+1)/2; break;
   case 'wave': color=spectrum(position-time/3); break;
   case 'rainbow': color=spectrum(position+key.y/12+time/5); break;
   case 'color_cycle': color=spectrum(time/5); break;
   case 'gradient': { const end=config.secondaryColor??{r:170,g:0,b:255}; color={r:color.r+(end.r-color.r)*position,g:color.g+(end.g-color.g)*position,b:color.b+(end.b-color.b)*position}; break; }
   case 'reactive': gain=selected.includes(key.id)?(Math.cos(time*Math.PI*2)+1)/2:0; break;
   case 'ripple': { const origin=keys.find(k=>selected.includes(k.id)); gain=origin?Math.max(0,1-Math.abs(Math.hypot(key.x-origin.x,key.y-origin.y)-(time%3)*6)):0; break; }
   case 'custom': gain=selected.includes(key.id)?1:0; break;
  }
  const scale=(v:number)=>Math.round(Math.max(0,Math.min(255,v*gain*brightness)));
  result.set(key.id,{r:scale(color.r),g:scale(color.g),b:scale(color.b)});
 }
 return result;
}
