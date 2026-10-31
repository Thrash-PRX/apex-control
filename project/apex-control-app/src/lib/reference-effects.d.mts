export function sampleEffect(profile:{effect:string;speed:number;brightness:number;keys:Record<string,{color:string}>},key:string,position:{x:number;y:number;index:number;count:number},time:number,hits?:{key:string;x:number;y:number;time:number}[]):{color:string;light:number};
export const EFFECTS: string[];
