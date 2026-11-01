import React from 'react';
import {
  APEX_200S_LAYOUT,
  LAYOUT_BOUNDS, APEX_DISPLAY, APEX_LIGHT_BAR, APEX_200S_KEY_COUNT,
  type KeyDefinition,
} from '../../lib/keyboard-layout';
import type { RgbColor } from '../../types';

interface KeyboardVisualizerProps {
  selectedKeys?: string[];
  onKeySelect?: (keyIds: string[]) => void;
  keyColors?: Map<string, RgbColor>;
  keySubtitles?: Map<string, string>;
  mode?: 'select' | 'display';
  interactive?: boolean;
}

export const KeyboardVisualizer: React.FC<KeyboardVisualizerProps> = ({
  selectedKeys = [],
  onKeySelect,
  keyColors,
  keySubtitles,
  mode = 'select',
  interactive = true,
}) => {
  // Base unit size in pixels for 1U
  const unitSize = 44;
  const gap = 4;
  const padding = 14;

  const totalWidth = LAYOUT_BOUNDS.width * unitSize + padding * 2;
  const totalHeight = LAYOUT_BOUNDS.height * unitSize + padding * 2;

  const handleKeyClick = (key: KeyDefinition, e: React.MouseEvent) => {
    if (!interactive || mode === 'display' || !onKeySelect) return;

    if (e.shiftKey) {
      // Toggle key in selection
      if (selectedKeys.includes(key.id)) {
        onKeySelect(selectedKeys.filter((id) => id !== key.id));
      } else {
        onKeySelect([...selectedKeys, key.id]);
      }
    } else {
      // Single select or toggle if already single selected
      if (selectedKeys.length === 1 && selectedKeys[0] === key.id) {
        onKeySelect([]);
      } else {
        onKeySelect([key.id]);
      }
    }
  };

  return (
    <div className="flex flex-col items-center select-none overflow-x-auto p-4 w-full">
      <div
        className="relative shrink-0 rounded-2xl border shadow-2xl transition-all"
        style={{
          width: `${totalWidth}px`,
          height: `${totalHeight}px`,
          backgroundColor: '#101216',
          borderColor: '#484e59',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
        }}
      >
        {/* Status display placeholder top right */}
        <div
          className="absolute flex items-center justify-center text-[9px] font-mono tracking-wider px-2 py-0.5 rounded border border-[#f28b50]/40 bg-[#1c1e22] text-[#f28b50]"
          style={{
            top: `${padding + APEX_DISPLAY.y * unitSize}px`,
            left: `${padding + APEX_DISPLAY.x * unitSize}px`,
            height: APEX_DISPLAY.h * unitSize - gap, width: APEX_DISPLAY.w * unitSize - gap,
          }}
        >
          APEX 200
        </div>

<div aria-label="APEX light bar" className="absolute rounded bg-gradient-to-r from-purple-400 to-green-400" style={{left:padding+APEX_LIGHT_BAR.x*unitSize,top:padding+APEX_LIGHT_BAR.y*unitSize,width:APEX_LIGHT_BAR.w*unitSize-gap,height:APEX_LIGHT_BAR.h*unitSize}} />
        {APEX_200S_LAYOUT.map((key) => {
          const isSelected = selectedKeys.includes(key.id);
          const customColor = keyColors?.get(key.id);
          const subtitle = keySubtitles?.get(key.id);

          const left = padding + key.x * unitSize;
          const top = padding + key.y * unitSize;
          const width = key.w * unitSize - gap;
          const height = key.h * unitSize - gap;

          if (key.isSpecial) {
            // Knob representation
            return (
              <div
                key={key.id}
                title="Volume & Mode Rotary Encoder"
                className="absolute rounded-full flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 border-2 shadow-inner"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  backgroundColor: '#30353e',
                  borderColor: isSelected ? '#f28b50' : '#656d7b',
                  boxShadow: isSelected ? '0 0 12px rgba(242,139,80,0.3)' : 'none',
                }}
                onClick={(e) => handleKeyClick(key, e)}
              >
                <div className="w-4 h-4 rounded-full border border-[#656d7b] bg-[#17181c] flex items-center justify-center text-[10px]">
                  ⚙
                </div>
              </div>
            );
          }

          // Keycap color calculation
          const keyBg = customColor
            ? `rgb(${customColor.r}, ${customColor.g}, ${customColor.b})`
            : isSelected
            ? '#594031'
            : '#30353e';

          const textColor = customColor
            ? (customColor.r * 0.299 + customColor.g * 0.587 + customColor.b * 0.114 > 150 ? '#111' : '#fff')
            : isSelected
            ? '#ffffff'
            : '#d5dae3';

          return (
            <button
              key={key.id}
              type="button"
              disabled={!interactive || mode === 'display'}
              onClick={(e) => handleKeyClick(key, e)}
              className="absolute rounded-md flex flex-col items-center justify-center font-sans font-medium text-xs transition-all border group"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor: keyBg,
                borderColor: isSelected ? '#f28b50' : '#555d6a',
                color: textColor,
                boxShadow: isSelected
                  ? '0 0 10px rgba(242, 139, 80, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.4)',
                transform: isSelected ? 'translateY(-1px)' : 'none',
              }}
            >
              {key.secondaryLabel && (
                <span className="text-[9px] opacity-70 leading-none">
                  {key.secondaryLabel}
                </span>
              )}
              <span className="text-[11px] leading-tight font-semibold tracking-tight">
                {key.label}
              </span>
              {subtitle && (
                <span className="text-[8px] font-mono mt-0.5 text-[#f28b50] font-bold">
                  {subtitle}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between w-full max-w-4xl mt-3 text-xs text-[#999fac]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#30353e] border border-[#555d6a] inline-block" />
            Normal Key
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#594031] border border-[#f28b50] inline-block" />
            Selected (Click or Shift+Click)
          </span>
        </div>
        <div>
          <span>APEX 200 · {APEX_200S_KEY_COUNT} keys + volume knob</span>
        </div>
      </div>
    </div>
  );
};
