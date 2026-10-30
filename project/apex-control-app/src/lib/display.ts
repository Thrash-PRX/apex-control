export interface DisplayDraft { title: string; label: string; value: string; image: string | null }
export const defaultDisplay: DisplayDraft = { title: 'APEX CONTROL', label: 'Custom stat', value: '—', image: null };
export function parseDisplayDraft(value: unknown): DisplayDraft {
  if (!value || typeof value !== 'object') throw new Error('Invalid display draft');
  const d = value as Record<string, unknown>;
  for (const key of ['title', 'label', 'value']) if (typeof d[key] !== 'string' || d[key].length > 64) throw new Error('Display text must be at most 64 characters');
  if (d.image !== null && (typeof d.image !== 'string' || d.image.length > 2800000 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(d.image))) throw new Error('Invalid image');
  return { title: d.title as string, label: d.label as string, value: d.value as string, image: d.image as string | null };
}
