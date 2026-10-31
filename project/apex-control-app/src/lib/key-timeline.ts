import keys from './apex200-physical-layout.json' with {type:'json'};
/** One continuous physical path, alternating direction at each row end. */
export const SNAKE_ROUTE=[...new Set(keys.map(k=>k.row))].sort((a,b)=>a-b).flatMap((row,n)=>keys.filter(k=>k.row===row).sort((a,b)=>n%2?b.x-a.x:a.x-b.x).map(k=>k.deviceIndex));
export const snakeStepMs=(speed:number)=>240-Math.max(0,Math.min(100,speed))*1.6;
function color(position:number,brightness:number):number[]{
 const h=position/SNAKE_ROUTE.length*6,x=1-Math.abs(h%2-1),rgb=h<1?[1,x,0]:h<2?[x,1,0]:h<3?[0,1,x]:h<4?[0,x,1]:h<5?[x,0,1]:[1,0,x];
 return [100,...rgb.map(v=>Math.round(v*255*Math.max(0,Math.min(100,brightness))/100))];
}
/** Explicit per-key ON and OFF deadlines. A slow transport never skips head keys. */
export class SnakeTimeline{
 private position=0;
 private nextOn=0;
 private lit=new Map<number,number>();
 readonly stepMs:number;
 private brightness:number;
 constructor(speed:number,brightness:number){this.stepMs=snakeStepMs(speed);this.brightness=brightness;}
 advance(now:number):Map<number,number[]>{
  const changes=new Map<number,number[]>();
  for(const [key,offAt] of this.lit)if(now>=offAt){changes.set(key,[100,0,0,0]);this.lit.delete(key);}
  if(now>=this.nextOn){
   const position=this.position++%SNAKE_ROUTE.length,key=SNAKE_ROUTE[position];
   changes.set(key,color(position,this.brightness));this.lit.set(key,now+this.stepMs*6);this.nextOn=now+this.stepMs;
  }
  return changes;
 }
 get nextDue():number{return Math.min(this.nextOn,...this.lit.values());}
}
/** Same route, key colors and six-step hold used by the on-screen preview. */
export function snakeAt(timeMs:number,speed:number,brightness:number):Map<number,number[]>{
 const result=new Map(SNAKE_ROUTE.map(i=>[i,[100,0,0,0]]));
 const head=Math.floor(Math.max(0,timeMs)/snakeStepMs(speed));
 for(let age=0;age<6&&age<=head;age++){const position=(head-age)%SNAKE_ROUTE.length;result.set(SNAKE_ROUTE[position],color(position,brightness));}
 return result;
}
