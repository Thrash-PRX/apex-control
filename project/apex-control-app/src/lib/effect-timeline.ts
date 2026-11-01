import {ambientColor,vividHue} from './rgb-style.ts';
import physical from './apex200-physical-layout.json' with {type:'json'};
import {SNAKE_ROUTE,snakeStepMs} from './key-timeline.ts';
import type {LightingConfig} from '../types/lighting.ts';
export const TIMED_EFFECTS=new Set(['snake','rainbow','gradient','flash-away','rain','wheel','twinkle','shadow','neon-stream','sine-wave','scanner','windmill','waterfall','blossom','storm','fireworks','heatmap']);
export const FILLED_EFFECTS=new Set(['rainbow','gradient','wheel','windmill','storm','neon-stream']);
export interface KeyHit{key:string;x:number;y:number;time:number;}
const points=physical.map(k=>({index:k.deviceIndex,x:(k.x+k.w/2)/17.3,y:(k.y+k.h/2)/6.3,row:k.row}));
const angle=(p:typeof points[number])=>Math.atan2((p.y-.5)*.5,p.x-.5);
const radius=(p:typeof points[number])=>Math.hypot(p.x-.5,(p.y-.5)*.5);
const mod=(v:number,n:number)=>((v%n)+n)%n;
const hash=(n:number)=>{const a=Math.sin(n*127.1+311.7)*43758.5453;return a-Math.floor(a);};
const rainbow=vividHue;
const primary=(c:LightingConfig)=>[100,...[c.primaryColor.r,c.primaryColor.g,c.primaryColor.b].map(v=>Math.round(v*c.brightness/100))];
export const effectBackground=(c:LightingConfig)=>(FILLED_EFFECTS.has(c.effect)||c.effect==='shadow')?primary(c):ambientColor(c.primaryColor,c.brightness,c.backgroundGlow);
export function effectInitialPalette(c:LightingConfig):Map<number,number[]>{
 return new Map(points.map(p=>{
  if(c.effect==='rainbow')return [p.index,rainbow(Math.min(3,Math.floor(p.x*4))/4,c.brightness)];
  if(['wheel','windmill','storm','neon-stream'].includes(c.effect)){const h=c.effect==='neon-stream'?mod(p.x+p.y*.7,1):mod(angle(p)/(Math.PI*2),1);return [p.index,rainbow(Math.floor(h*6)/6,c.brightness)];}
  if(c.effect==='gradient'){const mix=Math.min(3,Math.floor(p.x*4))/3,b=c.secondaryColor??{r:150,g:80,b:255};return [p.index,[100,...[c.primaryColor.r*(1-mix)+b.r*mix,c.primaryColor.g*(1-mix)+b.g*mix,c.primaryColor.b*(1-mix)+b.b*mix].map(v=>Math.round(v*c.brightness/100))]];}
  return [p.index,effectBackground(c)];
 }));
}
/** Authored, low-traffic interpretations: timed key pulses, not stored layer frames. */
function stage(effect:string,n:number,c:LightingConfig):{keys:number[];color:number[];hold:number}{
 let selected:typeof points=[],hold=6,color=rainbow(n/48,c.brightness);
 const beam=mod(n,24),column=beam<12?beam:23-beam;
 switch(effect){
  case 'rainbow':return {keys:[SNAKE_ROUTE[n%SNAKE_ROUTE.length]],color:rainbow((n%SNAKE_ROUTE.length)/SNAKE_ROUTE.length+Math.floor(n/SNAKE_ROUTE.length)/12,c.brightness),hold:Infinity};
  case 'gradient':{const p=points.find(p=>p.index===SNAKE_ROUTE[n%SNAKE_ROUTE.length])!,mix=(Math.sin(p.x*3+Math.floor(n/SNAKE_ROUTE.length)*.4)+1)/2,b=c.secondaryColor??{r:170,g:0,b:255};color=[100,...[c.primaryColor.r*(1-mix)+b.r*mix,c.primaryColor.g*(1-mix)+b.g*mix,c.primaryColor.b*(1-mix)+b.b*mix].map(v=>Math.round(v*c.brightness/100))];return {keys:[p.index],color,hold:Infinity};}
  case 'scanner':selected=points.filter(p=>Math.min(11,Math.floor(p.x*12))<=column+1&&Math.min(11,Math.floor(p.x*12))>=column-1);color=rainbow(.53,c.brightness);hold=3;break;
  case 'flash-away':selected=points.filter(p=>Math.min(11,Math.floor(p.x*12))===n%12);hold=4;break;
  case 'wheel':selected=points.filter(p=>mod(angle(p)-n*Math.PI/12,Math.PI*2)<Math.PI/3);color=rainbow(n/48,c.brightness);hold=Infinity;break;
  case 'windmill':selected=points.filter(p=>Math.cos(angle(p)*4-n*Math.PI/6)>.35);hold=Infinity;break;
  case 'storm':selected=points.filter(p=>Math.cos(angle(p)*3-radius(p)*18+n*.45)>.55);hold=Infinity;break;
  case 'blossom':selected=points.filter(p=>Math.abs(radius(p)-(.08+(n%8)*.06))<.085);hold=3;break;
  case 'fireworks':{const epoch=Math.floor(n/8),cx=.2+hash(epoch+5)*.6,cy=.2+hash(epoch+25)*.6;selected=points.filter(p=>Math.abs(Math.hypot(p.x-cx,(p.y-cy)*.5)-(n%8)*.065)<.08);hold=5;break;}
  case 'sine-wave':selected=points.filter(p=>Math.abs(p.y-(.5+.32*Math.sin(p.x*8-n*.35)))<.18);color=rainbow(.53,c.brightness);hold=3;break;
  case 'neon-stream':selected=points.filter(p=>mod(p.x+p.y*.7-n/16,1)<.25);hold=Infinity;break;
  case 'twinkle':selected=Array.from({length:6},(_,i)=>points[Math.floor(hash(n*7+i+1)*points.length)]);hold=8;break;
  case 'rain':case 'waterfall':{const drop=Math.floor(n/6),row=n%6,lane=hash(drop+3);const candidates=points.filter(p=>p.row===row).sort((a,b)=>Math.abs(a.x-lane)-Math.abs(b.x-lane));selected=candidates.slice(0,effect==='waterfall'?4:2);color=rainbow(drop*.137,c.brightness);hold=5;break;}
 }
 if(!selected.length&& !['shadow','heatmap'].includes(effect))selected=[points[n%points.length]];
 return {keys:[...new Set(selected.map(p=>p.index))],color,hold};
}
export class KeyEffectTimeline{
 readonly stepMs:number;
 readonly background:number[];
 readonly initialColors:Map<number,number[]>;
 private nextOn=0;
 private phase=0;
 private lit=new Map<number,number>();
 private seenHits=new Set<KeyHit>();
 private heat=new Map<number,number>();
 constructor(privateConfig:LightingConfig){this.config=privateConfig;this.stepMs=snakeStepMs(privateConfig.speed);this.background=effectBackground(privateConfig);this.initialColors=effectInitialPalette(privateConfig);}
 private config:LightingConfig;
 advance(now:number,hits:readonly KeyHit[]=[]):Map<number,number[]>{
  const changes=new Map<number,number[]>();
  for(const [key,offAt] of this.lit)if(now>=offAt){changes.set(key,[...this.background]);this.lit.delete(key);this.heat.delete(key);}
  if(['shadow','heatmap'].includes(this.config.effect)){
   for(const hit of hits)if(!this.seenHits.has(hit)){this.seenHits.add(hit);const key=Number(hit.key);if(!SNAKE_ROUTE.includes(key))continue;const heat=(this.heat.get(key)??0)+1;this.heat.set(key,heat);changes.set(key,this.config.effect==='shadow'?[100,0,0,0]:rainbow((220-Math.min(4,heat)*55)/360,this.config.brightness));this.lit.set(key,now+this.stepMs*(this.config.effect==='shadow'?6:48));}
   if(this.seenHits.size>256)this.seenHits=new Set(hits);
   this.nextOn=now+this.stepMs;return changes;
  }
  if(now>=this.nextOn){const next=stage(this.config.effect,this.phase++,this.config);for(const key of next.keys){changes.set(key,[...next.color]);if(Number.isFinite(next.hold))this.lit.set(key,now+this.stepMs*next.hold);}this.nextOn=now+this.stepMs;}
  return changes;
 }
 acknowledge(now:number):void{const late=Math.max(0,now-this.nextOn);if(late){this.nextOn+=late;for(const [key,at] of this.lit)this.lit.set(key,at+late);}}
 get nextDue():number{return Math.min(this.nextOn,...this.lit.values());}
}
/** Preview the same key events. While playing the UI displays verified device values. */
export function timedEffectAt(config:LightingConfig,timeMs:number):Map<number,number[]>{
 const result=effectInitialPalette(config);
 const step=snakeStepMs(config.speed),head=Math.floor(Math.max(0,timeMs)/step),start=Math.max(0,head-96),expiry=new Map<number,number>();
 for(let n=start;n<=head;n++){for(const [key,at] of expiry)if(n>=at){result.set(key,effectBackground(config));expiry.delete(key);}const next=stage(config.effect,n,config);for(const key of next.keys){result.set(key,next.color);if(Number.isFinite(next.hold))expiry.set(key,n+next.hold);}}
 return result;
}
