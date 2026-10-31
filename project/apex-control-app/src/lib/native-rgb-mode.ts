import type { LightingConfig } from '../types/lighting.ts';
/** IDs are from APEX 0x98 name readback, never WK68/Wooting protocol IDs. */
export function nativeRgbMode(config: Pick<LightingConfig,'effect'|'direction'>): number | null {
 switch(config.effect){case 'off':return 0;case 'static':return 1;case 'native_layer':return 2;case 'breathing':return 3;case 'star':return 4;case 'wave':return ({'left-to-right':5,'right-to-left':6,'top-to-bottom':7,'bottom-to-top':8})[config.direction??'left-to-right'];case 'reactive':return 9;case 'cross':return 10;case 'ripple':return 11;default:return null;}
}
