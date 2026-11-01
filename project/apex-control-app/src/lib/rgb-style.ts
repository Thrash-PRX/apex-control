import type {RgbColor} from '../types/lighting.ts';
export const DEFAULT_BACKGROUND_GLOW=22;
/** RGB-only styling. The captured leading device parameter stays at100. */
export function ambientColor(color:RgbColor,brightness:number,glow=DEFAULT_BACKGROUND_GLOW):number[]{
 const rgb=[color.r,color.g,color.b],lift=Math.max(...rgb)*.14;
 return [100,...rgb.map(v=>Math.round((v*.86+lift)*brightness/100*glow/100))];
}
export function vividHue(hue:number,brightness:number):number[]{
 const h=((hue%1)+1)%1*6,x=1-Math.abs(h%2-1),rgb=h<1?[1,x,0]:h<2?[x,1,0]:h<3?[0,1,x]:h<4?[0,x,1]:h<5?[x,0,1]:[1,0,x];
 return [100,...rgb.map(v=>Math.round((.18+.82*v)*255*brightness/100))];
}
