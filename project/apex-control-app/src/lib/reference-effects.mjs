// Browser-only lighting. These are independent interpretations, not firmware modes.
export const EFFECT_CATALOG = [
  ['static','Static','▦','Your individual key colors.'],
  ['wave','Rainbow wave','≈','A flowing rainbow across the board.'],
  ['breathe','Breathe','◉','Your colors fade together.'],
  ['reactive','Reactive','✧','Clicked or typed keys glow and fade.'],
  ['spectrum','Spectrum cycle','◌','The whole board cycles through the spectrum.'],
  ['gradient','Color gradient','▨','A slowly moving two-color wash.'],
  ['wheel','Rainbow wheel','◎','A rainbow rotates around the center.'],
  ['snake','Snake','∿','A rainbow trail travels through each row.'],
  ['rain','Raindrops','⋮','Colored droplets fall down the columns.'],
  ['twinkle','Twinkle','⋆','Soft, scattered stars shimmer independently.'],
  ['ripple','Ripple','⊙','Clicked or typed keys send out colorful rings.'],
  ['scanner','Scanner','↔','A beam sweeps from side to side.'],
  ['fireworks','Fireworks','✺','Colorful bursts expand across the board.'],
  ['heatmap','Typing heatmap','♨','Frequently pressed keys grow warmer.'],
  ['flash-away','Flash away','↝','A bright colored flash races across the board.'],
  ['shadow','Shadow disappear','◐','Each press leaves a fading shadow in your key colors.'],
  ['neon-stream','Neon stream','≋','Neon bands stream diagonally across the keys.'],
  ['sine-wave','Sine wave','∿','A colorful sine ribbon oscillates across the board.'],
  ['windmill','Rotating windmill','✣','Four rainbow blades rotate around the center.'],
  ['waterfall','Colorful waterfall','⇣','Multicolored cascades flow down the rows.'],
  ['blossom','Blossoming','❋','Colorful petals bloom outward from the center.'],
  ['storm','Rotating storm','◉','A rainbow spiral sweeps around the center.'],
  ['custom','Self-define','▦','Display the individual colors you painted on each key.'],
  ['off','Off','○','Turn off the browser lighting preview.'],
].map(([id,label,icon,description])=>({id,label,icon,description}));
// Label provenance is verified in the official WK68 download's English XML.
// Animation behavior is an original interpretation, not a firmware reproduction.
export const WK68_LABELS = {
  static:'Fixed_on',breathe:'Respire',wave:'Rainbow','flash-away':'Flash_away',rain:'Raindrops',wheel:'Rainbow_wheel',ripple:'Ripples_shining',twinkle:'Stars_twinkle',shadow:'Shadow_disappear',snake:'Retro_snake','neon-stream':'Neon_stream',reactive:'Reaction','sine-wave':'Sine_wave',scanner:'Retinue scanning',windmill:'Rotating windmill',waterfall:'Colorful waterfall',blossom:'Blossoming',storm:'Rotating storm',custom:'Self-define',off:'OFF',
};
for(const item of EFFECT_CATALOG){item.sourceName=WK68_LABELS[item.id]??null;if(item.sourceName)item.label=item.sourceName.replaceAll('_',' ');}
EFFECT_CATALOG.sort((a,b)=>{const order=Object.keys(WK68_LABELS);return (a.sourceName?order.indexOf(a.id):100)-(b.sourceName?order.indexOf(b.id):100);});
export const EFFECTS = EFFECT_CATALOG.map(x=>x.id);
const clamp = x=>Math.max(0,Math.min(1,x));
const hash = n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const mod = (n,m)=>((n%m)+m)%m;
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function hsv(h,s=0.85,v=1){h=mod(h,360)/60;const c=v*s,x=c*(1-Math.abs(h%2-1)),m=v-c;const channels=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];return channels.map(a=>(a+m)*255);}

/** Deterministic renderer; time in milliseconds, position in normalized board units.
 * hits: {key,x,y,time}, supplied only by page-local click/keyboard events. */
export function sampleEffect(profile, key, position, time, hits=[]) {
  const {x,y,index,count}=position, speed=0.25+profile.speed/100*2.75;
  const t=time/1000*speed;
  let color=rgb(profile.keys[key].color), light=1;
  switch(profile.effect){
    case 'static':case 'custom':break;
    case 'off':light=0;break;
    case 'wave':color=hsv(x*300-y*90-t*65);break;
    case 'breathe':light=0.08+0.92*(Math.sin(t*2)+1)/2;break;
    case 'spectrum':color=hsv(t*45);break;
    case 'gradient':{const mix=(Math.sin(x*3+y+t)+1)/2;const other=[101,219,255];color=color.map((v,i)=>v*(1-mix)+other[i]*mix);break;}
    case 'wheel':color=hsv(Math.atan2((y-.5)*.5,x-.5)*180/Math.PI+t*65);break;
    case 'snake':{const head=mod(t*12,count),distance=mod(head-index,count);light=Math.max(0,1-distance/12);color=hsv(index*5+t*30);break;}
    case 'rain':{const col=Math.round(x*15),drop=mod(t*.7+hash(col)*2,1.6)-.3;light=clamp(1-Math.abs(y-drop)*6);color=hsv(col*29+t*20);break;}
    case 'twinkle':{const phase=t*.65+hash(index)*8,epoch=Math.floor(phase);light=Math.pow((Math.sin(phase*Math.PI*2)+1)/2,6)*(.35+.65*hash(index+epoch*67));color=hsv(hash(index)*360);break;}
    case 'scanner':{const beam=(Math.sin(t*1.6)+1)/2;light=clamp(1-Math.abs(x-beam)*7);break;}
    case 'flash-away':{const beam=mod(t*.8,1.5)-.25;light=clamp(1-Math.abs(x-beam)*9);color=hsv(t*90);break;}
    case 'shadow':{const intensity=hits.reduce((v,h)=>h.key===key?Math.max(v,Math.exp(-Math.max(0,time-h.time)*speed/900)):v,0);light=1-intensity;break;}
    case 'neon-stream':{const band=mod(x+y*.7-t*.4,1);light=.1+.9*Math.pow(Math.sin(band*Math.PI),4);color=hsv(band*360+t*20);break;}
    case 'sine-wave':{const line=.5+.35*Math.sin(x*8-t*3);light=clamp(1-Math.abs(y-line)*5);color=hsv(x*300+t*40);break;}
    case 'windmill':{const angle=Math.atan2((y-.5)*.5,x-.5);light=.08+.92*Math.pow((Math.cos(angle*4-t*4)+1)/2,5);color=hsv(angle*180/Math.PI+t*60);break;}
    case 'waterfall':{const col=Math.floor(x*15),flow=mod(y-t*.55+hash(col)*.5,1);light=.1+.9*Math.pow(1-flow,2);color=hsv(y*180+col*19-t*90);break;}
    case 'blossom':{const dx=x-.5,dy=(y-.5)*.5,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);const radius=.15+.12*Math.sin(angle*6+t)+.1*Math.sin(t*.8);light=clamp(1-Math.abs(r-radius)*9);color=hsv(angle*180/Math.PI+t*35);break;}
    case 'storm':{const dx=x-.5,dy=(y-.5)*.5,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);const phase=angle*3-r*20+t*4;light=.05+.95*Math.pow((Math.sin(phase)+1)/2,3);color=hsv(angle*180/Math.PI+r*300-t*70);break;}
    case 'fireworks':{const epoch=Math.floor(t/2),age=mod(t,2),cx=.15+hash(epoch+5)*.7,cy=.15+hash(epoch+25)*.7;const distance=Math.hypot(x-cx,(y-cy)*.5);light=clamp(1-Math.abs(distance-age*.45)*14)*clamp(1-age/2);color=hsv(epoch*137+distance*100);break;}
    case 'reactive':light=hits.reduce((v,h)=>h.key===key?Math.max(v,Math.exp(-Math.max(0,time-h.time)*speed/650)):v,0);break;
    case 'ripple':{light=0;for(const hit of hits){const age=Math.max(0,time-hit.time)/1000*speed;const distance=Math.hypot(x-hit.x,(y-hit.y)*.5);const intensity=clamp(1-Math.abs(distance-age*.65)*14)*clamp(1-age/2);if(intensity>light){light=intensity;color=hsv(age*150+distance*180);}}break;}
    case 'heatmap':{const heat=hits.reduce((n,h)=>n+(h.key===key?Math.exp(-Math.max(0,time-h.time)/12000):0),0);light=clamp(heat/4);color=hsv(220-light*220,1);break;}
    default:throw new Error('Unknown preview effect');
  }
  const intensity=clamp(light)*profile.brightness/100;
  return {color:`rgb(${color.map(v=>Math.round(v*intensity)).join(' ')})`,light:intensity};
}
