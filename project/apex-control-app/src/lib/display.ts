export interface DisplayDraft {
  title: string;
  label: string;
  value: string;
  image: string | null;
  /** Image display settings (local preview only) */
  imageSettings: ImageSettings;
  /** Text alignment */
  textAlign: TextAlign;
  /** Background preset */
  backgroundPreset: BackgroundPreset;
  /** Layout preset */
  layoutPreset: LayoutPreset;
}

export interface ImageSettings {
  /** Scale factor (0.1 - 3.0) */
  scale: number;
  /** X offset as percentage (-50 to 50) */
  offsetX: number;
  /** Y offset as percentage (-50 to 50) */
  offsetY: number;
  /** Rotation in degrees (0, 90, 180, 270) */
  rotation: 0 | 90 | 180 | 270;
  /** Opacity (0 - 1) */
  opacity: number;
}

export type TextAlign = 'left' | 'center' | 'right';

export type BackgroundPreset = 'none' | 'grid' | 'dots' | 'gradient' | 'solid';

export type LayoutPreset = 
  | 'default'           // Title top, value center, label bottom
  | 'value-focused'     // Large value centered, small title/label
  | 'status-bar'        // Horizontal layout: title | value | label
  | 'minimal'           // Just value
  | 'gaming'            // Title top, large value, label bottom with accent
  | 'custom';           // User-defined positions (future)

export const defaultImageSettings: ImageSettings = {
  scale: 1.0,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  opacity: 0.5,
};

export const defaultDisplay: DisplayDraft = {
  title: 'APEX CONTROL',
  label: 'Custom stat',
  value: '—',
  image: null,
  imageSettings: defaultImageSettings,
  textAlign: 'center',
  backgroundPreset: 'none',
  layoutPreset: 'default',
};

export const BACKGROUND_PRESETS: Record<BackgroundPreset, { name: string; css: string }> = {
  none: { name: 'None', css: 'bg-black' },
  grid: { name: 'Grid', css: 'bg-black bg-[size:20px_20px] bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]' },
  dots: { name: 'Dots', css: 'bg-black bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:16px_16px]' },
  gradient: { name: 'Gradient', css: 'bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a1a]' },
  solid: { name: 'Solid', css: 'bg-[#111122]' },
};

export const LAYOUT_PRESETS: Record<LayoutPreset, { name: string; description: string }> = {
  default: { name: 'Default', description: 'Title top, value center, label bottom' },
  'value-focused': { name: 'Value Focused', description: 'Large value centered, minimal text' },
  'status-bar': { name: 'Status Bar', description: 'Horizontal: title | value | label' },
  minimal: { name: 'Minimal', description: 'Just the value' },
  gaming: { name: 'Gaming', description: 'Title top, large value, accent label' },
  custom: { name: 'Custom', description: 'User-defined positions' },
};

const STORAGE_KEY = 'apex-control-display-v2';
const MAX_IMAGE_DATA_URL_LENGTH = 2_800_000; // ~2MB base64

export function parseDisplayDraft(value: unknown): DisplayDraft {
  if (!value || typeof value !== 'object') throw new Error('Invalid display draft');
  const d = value as Record<string, unknown>;
  
  // Validate text fields
  for (const key of ['title', 'label', 'value']) {
    if (typeof d[key] !== 'string' || d[key].length > 64) {
      throw new Error('Display text must be at most 64 characters');
    }
  }
  
  // Validate image
  let image: string | null = null;
  if (d.image !== null && d.image !== undefined) {
    if (typeof d.image !== 'string') throw new Error('Invalid image');
    if (d.image.length > MAX_IMAGE_DATA_URL_LENGTH) throw new Error('Image data too large');
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(d.image)) {
      throw new Error('Invalid image format');
    }
    image = d.image;
  }
  
  // Validate imageSettings
  let imageSettings = defaultImageSettings;
  if (d.imageSettings && typeof d.imageSettings === 'object') {
    const s = d.imageSettings as Record<string, unknown>;
    imageSettings = {
      scale: typeof s.scale === 'number' ? Math.max(0.1, Math.min(3.0, s.scale)) : 1.0,
      offsetX: typeof s.offsetX === 'number' ? Math.max(-50, Math.min(50, s.offsetX)) : 0,
      offsetY: typeof s.offsetY === 'number' ? Math.max(-50, Math.min(50, s.offsetY)) : 0,
      rotation: [0, 90, 180, 270].includes(s.rotation as number) ? s.rotation as 0 | 90 | 180 | 270 : 0,
      opacity: typeof s.opacity === 'number' ? Math.max(0, Math.min(1, s.opacity)) : 0.5,
    };
  }
  
  // Validate textAlign
  const textAlign: TextAlign = ['left', 'center', 'right'].includes(d.textAlign as string)
    ? d.textAlign as TextAlign
    : 'center';
  
  // Validate backgroundPreset
  const backgroundPreset: BackgroundPreset = Object.keys(BACKGROUND_PRESETS).includes(d.backgroundPreset as string)
    ? d.backgroundPreset as BackgroundPreset
    : 'none';
  
  // Validate layoutPreset
  const layoutPreset: LayoutPreset = Object.keys(LAYOUT_PRESETS).includes(d.layoutPreset as string)
    ? d.layoutPreset as LayoutPreset
    : 'default';
  
  return {
    title: d.title as string,
    label: d.label as string,
    value: d.value as string,
    image,
    imageSettings,
    textAlign,
    backgroundPreset,
    layoutPreset,
  };
}

export function loadDraft(): DisplayDraft {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parseDisplayDraft(parsed);
    }
  } catch {
    // Fall through to default
  }
  return defaultDisplay;
}

export function saveDraft(draft: DisplayDraft): { success: boolean; error?: string } {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    return { success: true };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      return { success: false, error: 'Browser storage quota exceeded. Try removing the image.' };
    }
    return { success: false, error: 'Could not save: storage unavailable' };
  }
}

export function exportDraft(draft: DisplayDraft): string {
  return JSON.stringify(draft, null, 2);
}

export function importDraft(json: string): { success: boolean; draft?: DisplayDraft; error?: string } {
  try {
    const parsed = JSON.parse(json);
    const draft = parseDisplayDraft(parsed);
    return { success: true, draft };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only PNG, JPEG, or WebP images are allowed' };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { valid: false, error: 'Image must be 2 MB or smaller' };
  }
  return { valid: true };
}

export async function loadImageAsDataURL(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}