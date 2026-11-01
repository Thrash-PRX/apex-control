import {ambientColor,vividHue} from './rgb-style.ts';
import type {RgbColor} from '../types/lighting.ts';
import keys from './apex200-physical-layout.json' with {type:'json'};
/** One continuous physical path, alternating direction at each row end. */
export const SNAKE_ROUTE=[...new Set(keys.map(k=>k.row))].sort((a,b)=>a-b).flatMap((row,n)=>keys.filter(k=>k.row===row).sort((a,b)=>n%2?b.x-a.x:a.x-b.x).map(k=>k.deviceIndex));
export const snakeStepMs=(speed:number)=>245-Math.max(0,Math.min(100,speed))*1.8;
function color(position:number,brightness:number):number[]{return vividHue(position/SNAKE_ROUTE.length,brightness);}
/** Explicit per-key ON and OFF deadlines. A slow transport never skips head keys. */
export class SnakeTimeline{
 private position=0;
 private nextOn=0;
 private lit=new Map<number,number>();
 readonly stepMs:number;
 readonly background:number[];
 private brightness:number;
 constructor(speed:number,brightness:number,primary:RgbColor={r:0,g:150,b:255},glow?:number){this.stepMs=snakeStepMs(speed);this.brightness=brightness;this.background=ambientColor(primary,brightness,glow);}
 advance(now:number):Map<number,number[]>{
  const changes=new Map<number,number[]>();
  for(const [key,offAt] of this.lit)if(now>=offAt){changes.set(key,[...this.background]);this.lit.delete(key);}
  if(now>=this.nextOn){
   const position=this.position++%SNAKE_ROUTE.length,key=SNAKE_ROUTE[position];
   changes.set(key,color(position,this.brightness));this.lit.set(key,now+this.stepMs*12);this.nextOn=now+this.stepMs;
  }
  return changes;
 }
 get nextDue():number{return Math.min(this.nextOn,...this.lit.values());}
 /** Pause effect time while USB is busy, keeping the trail from expiring in gaps. */
 acknowledge(now:number):void{const late=Math.max(0,now-this.nextOn);if(late){this.nextOn+=late;for(const [key,at] of this.lit)this.lit.set(key,at+late);}}
}
/** Same route, key colors and twelve-step hold used by the on-screen preview. */
export function snakeAt(timeMs:number,speed:number,brightness:number,primary:RgbColor={r:0,g:150,b:255},glow?:number):Map<number,number[]>{
 const result=new Map(SNAKE_ROUTE.map(i=>[i,ambientColor(primary,brightness,glow)]));
 const head=Math.floor(Math.max(0,timeMs)/snakeStepMs(speed));
 for(let age=0;age<12&&age<=head;age++){const position=(head-age)%SNAKE_ROUTE.length;result.set(SNAKE_ROUTE[position],color(position,brightness));}
 return result;
}
