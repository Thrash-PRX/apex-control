import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Image,
  ZoomIn,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Grid,
  Download,
  Upload,
  Trash2,
  Save,
  Settings,
  Sliders,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  loadDraft,
  saveDraft,
  exportDraft,
  importDraft,
  validateImageFile,
  loadImageAsDataURL,
  type DisplayDraft,
  type ImageSettings,
  type TextAlign,
  type BackgroundPreset,
  type LayoutPreset,
  BACKGROUND_PRESETS,
  LAYOUT_PRESETS,
  defaultImageSettings,
} from '../../lib/display';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getTransformStyle(settings: ImageSettings): string {
  const transforms = [
    `translate(${settings.offsetX}%, ${settings.offsetY}%)`,
    `rotate(${settings.rotation}deg)`,
    `scale(${settings.scale})`,
  ];
  return transforms.join(' ');
}

export function DisplayPage() {
  const [draft, setDraft] = useState<DisplayDraft>(() => loadDraft());
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const loadId = useRef(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3000);
  }, []);

  const updateText = useCallback((key: 'title' | 'label' | 'value', value: string) => {
    setDraft((d) => ({ ...d, [key]: value.slice(0, 64) }));
  }, []);

  const updateImageSettings = useCallback((settings: Partial<ImageSettings>) => {
    setDraft((d) => ({
      ...d,
      imageSettings: { ...d.imageSettings, ...settings },
    }));
  }, []);

  const updateTextAlign = useCallback((align: TextAlign) => {
    setDraft((d) => ({ ...d, textAlign: align }));
  }, []);

  const updateBackgroundPreset = useCallback((preset: BackgroundPreset) => {
    setDraft((d) => ({ ...d, backgroundPreset: preset }));
  }, []);

  const updateLayoutPreset = useCallback((preset: LayoutPreset) => {
    setDraft((d) => ({ ...d, layoutPreset: preset }));
  }, []);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.style.opacity = '1';
  }, []);

  const handleImageError = useCallback(() => {
    showToast('Failed to load image', 'error');
    setDraft((d) => ({ ...d, image: null }));
  }, [showToast]);

  const loadImage = useCallback(async (file?: File) => {
    if (!file) return;
    
    const id = ++loadId.current;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.error!, 'error');
      return;
    }

    try {
      const { dataUrl, width, height } = await loadImageAsDataURL(file);
      
      if (width * height > 16_000_000) {
        showToast('Image must be at most 16 megapixels', 'error');
        return;
      }

      if (dataUrl.length > 2_800_000) {
        showToast('Encoded image too large', 'error');
        return;
      }

      if (id === loadId.current) {
        setDraft((d) => ({ ...d, image: dataUrl, imageSettings: defaultImageSettings }));
        showToast(`Image loaded (${width}×${height})`, 'success');
      }
    } catch {
      showToast('Cannot decode image. Use PNG, JPEG, or WebP.', 'error');
    }
  }, [showToast]);

  const removeImage = useCallback(() => {
    loadId.current++;
    setDraft((d) => ({ ...d, image: null }));
    showToast('Image removed', 'info');
  }, [showToast]);

  const handleSave = useCallback(() => {
    const result = saveDraft(draft);
    if (result.success) {
      showToast('Draft saved locally', 'success');
    } else {
      showToast(result.error || 'Save failed', 'error');
    }
  }, [draft, showToast]);

  const handleExport = useCallback(() => {
    try {
      const json = exportDraft(draft);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apex-display-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Draft exported', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  }, [draft, showToast]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = importDraft(content);
        if (result.success && result.draft) {
          setDraft(result.draft);
          showToast('Draft imported', 'success');
        } else {
          showToast(result.error || 'Import failed', 'error');
        }
      } catch {
        showToast('Invalid file', 'error');
      }
    };
    reader.onerror = () => showToast('Could not read file', 'error');
    reader.readAsText(file);
  }, [showToast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (e.target.id === 'import-file') {
        handleImport(file);
      } else {
        loadImage(file);
      }
      e.target.value = '';
    }
  }, [handleImport, loadImage]);

  const handleDrag = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!isDragging || !dragStart || !previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const offsetX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const offsetY = ((e.clientY - dragStart.y) / rect.height) * 100;
    
    updateImageSettings({
      offsetX: clamp(draft.imageSettings.offsetX + offsetX, -50, 50),
      offsetY: clamp(draft.imageSettings.offsetY + offsetY, -50, 50),
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, draft.imageSettings, updateImageSettings]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!draft.image) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, [draft.image]);

  // Native event handler for global listeners
  const handleDragEndNative = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // React event handler for onMouseUp/onMouseLeave
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // React event handler for onMouseMove
  const handleDragReact = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const offsetX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const offsetY = ((e.clientY - dragStart.y) / rect.height) * 100;
    
    updateImageSettings({
      offsetX: clamp(draft.imageSettings.offsetX + offsetX, -50, 50),
      offsetY: clamp(draft.imageSettings.offsetY + offsetY, -50, 50),
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, draft.imageSettings, updateImageSettings]);

  const resetImageSettings = useCallback(() => {
    setDraft((d) => ({ ...d, imageSettings: defaultImageSettings }));
    showToast('Image settings reset', 'info');
  }, [showToast]);

  const rotateImage = useCallback(() => {
    const rotations: ImageSettings['rotation'][] = [0, 90, 180, 270];
    const currentIndex = rotations.indexOf(draft.imageSettings.rotation);
    const nextRotation = rotations[(currentIndex + 1) % 4];
    updateImageSettings({ rotation: nextRotation });
  }, [draft.imageSettings.rotation, updateImageSettings]);

  // Persist draft changes to localStorage
  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }
      if (e.key === 'Delete' && draft.image && !(e.target instanceof HTMLElement && (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)))) {
        removeImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draft.image, handleSave, handleExport, removeImage]);

  // Global mouse handlers for drag
  useEffect(() => {
    if (isDragging) {
      const handleDragWrapper = (e: MouseEvent) => handleDrag(e);
      const handleDragEndWrapper = () => handleDragEndNative();
      
      window.addEventListener('mousemove', handleDragWrapper);
      window.addEventListener('mouseup', handleDragEndWrapper);
      
      return () => {
        window.removeEventListener('mousemove', handleDragWrapper);
        window.removeEventListener('mouseup', handleDragEndWrapper);
      };
    }
  }, [isDragging, handleDrag, handleDragEndNative]);

  const backgroundStyle = BACKGROUND_PRESETS[draft.backgroundPreset].css;
  const transformStyle = getTransformStyle(draft.imageSettings);

  return (
    <section className="p-6 space-y-6 max-w-7xl mx-auto" style={{ backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
      {/* Toast */}
      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg border shadow-lg animate-slide-in flex items-center gap-2 ${
            notice.type === 'success' ? 'border-[#00c853] bg-[#00c853]/10 text-[#00c853]' :
            notice.type === 'error' ? 'border-red-500 bg-red-500/10 text-red-400' :
            'border-[#0096ff] bg-[#0096ff]/10 text-[#0096ff]'
          }`}
          role="alert"
          aria-live="polite"
        >
          {notice.type === 'success' && <Image className="w-4 h-4" />}
          {notice.type === 'error' && <AlertTriangle className="w-4 h-4" />}
          {notice.type === 'info' && <Settings className="w-4 h-4" />}
          <span className="text-sm font-medium">{notice.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Image className="w-6 h-6 text-[#0096ff]" />
            Display Studio
          </h1>
          <p className="text-sm text-[#8888a0] mt-1">
            Local image preview & stat card designer. Hardware display support unverified.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-[#333355] text-[#8888a0] hover:text-white hover:bg-[#252540] transition-colors"
            title="Export draft (Ctrl+E)"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-[#333355] text-[#8888a0] hover:text-white hover:bg-[#252540] transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Import
            <input
              id="import-file"
              type="file"
              accept=".json"
              className="sr-only"
              onChange={handleFileSelect}
              aria-label="Import draft from JSON"
            />
          </label>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#0096ff] text-white hover:bg-[#0080db] shadow-md shadow-[#0096ff]/20 transition-all"
            title="Save draft (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>
        </div>
      </div>

      {/* Warning banner */}
      <div className="rounded-xl border border-amber-700 bg-amber-950/30 p-4 text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm">
          <p className="font-bold">Display Hardware Support Unverified</p>
          <p>This canvas is illustrative only. Panel resolution, color format, and upload commands are unknown. 
             No live CPU/GPU/FPS telemetry is available without a verified local data provider and protocol.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Editor Panel */}
        <div className="lg:col-span-1 space-y-5">
          {/* Text Fields */}
          <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#0096ff]" />
              Text Content
            </h2>
            <div className="space-y-4">
              {(['title', 'label', 'value'] as const).map((key) => (
                <label key={key} className="block">
                  <span className="block text-xs font-medium text-[#8888a0] mb-1 capitalize">{key}</span>
                  <input
                    className="block w-full rounded bg-[#1e1e32] p-3 border border-[#333355] text-white placeholder-[#555] focus:border-[#0096ff] focus:outline-none focus:ring-1 focus:ring-[#0096ff]"
                    maxLength={64}
                    value={draft[key]}
                    onChange={(e) => updateText(key, e.target.value)}
                    placeholder={`Enter ${key}`}
                    aria-label={`${key} (max 64 chars)`}
                  />
                </label>
              ))}
            </div>
            
            {/* Text Alignment */}
            <div className="space-y-2 pt-2 border-t border-[#252540]">
              <span className="text-xs font-medium text-[#8888a0] block">Text Alignment</span>
              <div className="flex gap-1" role="radiogroup" aria-label="Text alignment">
                {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
                  <button
                    key={align}
                    onClick={() => updateTextAlign(align)}
                    className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-all ${
                      draft.textAlign === align
                        ? 'bg-[#0096ff] text-white shadow-sm'
                        : 'bg-[#1e1e32] text-[#8888a0] hover:text-white hover:bg-[#282845]'
                    } border border-[#333355}`}
                    role="radio"
                    aria-checked={draft.textAlign === align}
                  >
                    {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                    {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                    {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Image Settings */}
          <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] flex items-center gap-2">
              <Image className="w-4 h-4 text-[#0096ff]" />
              Background Image
            </h2>
            
            <label className="block">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                id="image-upload"
                onChange={handleFileSelect}
                aria-label="Upload background image"
              />
              <button
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={!!draft.image}
                className={`w-full py-3 rounded-lg border-2 border-dashed transition-colors ${
                  draft.image
                    ? 'border-[#333355] bg-[#1e1e32] text-[#555] cursor-not-allowed'
                    : 'border-[#333355] bg-[#1e1e32] text-[#8888a0] hover:border-[#0096ff]/50 hover:bg-[#252540] hover:text-white'
                }`}
              >
                {draft.image ? (
                  <>Image loaded ✓</>
                ) : (
                  <>
                    <Upload className="w-6 h-6 mx-auto mb-1" />
                    <span className="block text-sm">Upload Image (PNG/JPEG/WebP, ≤2MB)</span>
                    <span className="text-xs text-[#666]">Max 16 megapixels</span>
                  </>
                )}
              </button>
            </label>

            {draft.image && (
              <div className="space-y-3 pt-2 border-t border-[#252540]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#8888a0]">Image Controls</span>
                  <button
                    onClick={resetImageSettings}
                    className="px-2 py-1 text-xs text-[#8888a0] hover:text-white hover:bg-[#252540] rounded transition-colors"
                    title="Reset image settings"
                  >
                    <RotateCcw className="w-3 h-3 inline" />
                    Reset
                  </button>
                </div>

                {/* Scale */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#8888a0]">
                    <span className="flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5" /> Scale
                    </span>
                    <span className="font-mono text-[#0096ff]">{Math.round(draft.imageSettings.scale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={Math.round(draft.imageSettings.scale * 100)}
                    onChange={(e) => updateImageSettings({ scale: parseInt(e.target.value) / 100 })}
                    className="w-full accent-[#0096ff]"
                    aria-label="Image scale (10%-300%)"
                  />
                </div>

                {/* Opacity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#8888a0]">
                    <span>Opacity</span>
                    <span className="font-mono text-[#0096ff]">{Math.round(draft.imageSettings.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={Math.round(draft.imageSettings.opacity * 100)}
                    onChange={(e) => updateImageSettings({ opacity: parseInt(e.target.value) / 100 })}
                    className="w-full accent-[#0096ff]"
                    aria-label="Image opacity (0%-100%)"
                  />
                </div>

                {/* Rotation */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#8888a0]">
                    <span>Rotation</span>
                    <span className="font-mono text-[#0096ff]">{draft.imageSettings.rotation}°</span>
                  </div>
                  <button
                    onClick={rotateImage}
                    className="w-full px-3 py-2 rounded bg-[#1e1e32] hover:bg-[#282845] border border-[#333355] text-white text-sm font-medium flex items-center justify-center gap-2"
                    aria-label={`Rotate image (current: ${draft.imageSettings.rotation}°)`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Rotate 90°
                  </button>
                </div>

                {/* Position Hint */}
                <p className="text-xs text-[#666] text-center pt-1">
                  Drag image in preview to reposition. Hold Shift for fine control.
                </p>

                <button
                  onClick={removeImage}
                  className="w-full px-3 py-1.5 rounded text-xs font-medium bg-[#252540] hover:bg-[#303050] text-white border border-[#333355] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                  Remove Image
                </button>
              </div>
            )}
          </div>

          {/* Background Preset */}
          <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] flex items-center gap-2">
              <Grid className="w-4 h-4 text-[#0096ff]" />
              Preview Background
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(BACKGROUND_PRESETS) as BackgroundPreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => updateBackgroundPreset(preset)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    draft.backgroundPreset === preset
                      ? 'border-[#0096ff] bg-[#0096ff]/10 text-white shadow-sm'
                      : 'border-[#2b2b45] bg-[#1d1d30] text-[#a0a0b8] hover:border-[#3d3d60] hover:text-white'
                  }`}
                  role="radio"
                  aria-checked={draft.backgroundPreset === preset}
                >
                  <span className="text-xs font-medium block mb-1">{BACKGROUND_PRESETS[preset].name}</span>
                  <div className={`h-6 rounded ${BACKGROUND_PRESETS[preset].css}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Layout Preset */}
          <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8888a0] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0096ff]" />
              Layout Preset
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(LAYOUT_PRESETS) as LayoutPreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => updateLayoutPreset(preset)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    draft.layoutPreset === preset
                      ? 'border-[#0096ff] bg-[#0096ff]/10 text-white'
                      : 'border-[#2b2b45] bg-[#1d1d30] text-[#a0a0b8] hover:border-[#3d3d60] hover:text-white'
                  }`}
                  role="radio"
                  aria-checked={draft.layoutPreset === preset}
                >
                  <span className="text-xs font-bold block">{LAYOUT_PRESETS[preset].name}</span>
                  <span className="text-[10px] text-[#70708c]">{LAYOUT_PRESETS[preset].description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-3 py-2 rounded-lg border border-[#333355] bg-[#16162a] text-xs text-[#8888a0] hover:text-white hover:border-[#0096ff]/50 transition-colors flex items-center justify-center gap-2"
          >
            <Settings className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="rounded-xl border border-[#333355] bg-[#16162a] p-5 space-y-3 animate-slide-in">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8888a0]">Image Transform Values</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#1e1e32] p-2 rounded">
                  <span className="text-[#666] block">Scale</span>
                  <span className="font-mono text-[#0096ff]">{draft.imageSettings.scale.toFixed(2)}</span>
                </div>
                <div className="bg-[#1e1e32] p-2 rounded">
                  <span className="text-[#666] block">Offset X</span>
                  <span className="font-mono text-[#0096ff]">{draft.imageSettings.offsetX.toFixed(1)}%</span>
                </div>
                <div className="bg-[#1e1e32] p-2 rounded">
                  <span className="text-[#666] block">Offset Y</span>
                  <span className="font-mono text-[#0096ff]">{draft.imageSettings.offsetY.toFixed(1)}%</span>
                </div>
                <div className="bg-[#1e1e32] p-2 rounded">
                  <span className="text-[#666] block">Rotation</span>
                  <span className="font-mono text-[#0096ff]">{draft.imageSettings.rotation}°</span>
                </div>
                <div className="bg-[#1e1e32] p-2 rounded col-span-2">
                  <span className="text-[#666] block">Opacity</span>
                  <span className="font-mono text-[#0096ff]">{Math.round(draft.imageSettings.opacity * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-[#333355] bg-[#16162a] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8888a0] uppercase tracking-wider">
                Live Preview (Layout: {LAYOUT_PRESETS[draft.layoutPreset].name})
              </span>
              {draft.image && (
                <span className="text-xs text-[#0096ff] font-mono">
                  {draft.imageSettings.rotation}° · {Math.round(draft.imageSettings.scale * 100)}% · {Math.round(draft.imageSettings.opacity * 100)}%
                </span>
              )}
            </div>

            <div
              ref={previewRef}
              className={`relative overflow-hidden rounded-xl border-8 ${backgroundStyle} aspect-[2/1] flex flex-col items-center justify-center text-center p-6 select-none cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
              style={{ touchAction: 'none' }}
              onMouseDown={handleDragStart}
              onMouseMove={handleDragReact}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              {draft.image && (
                <img
                  ref={imageRef}
                  src={draft.image}
                  alt="Custom display background"
                  className="absolute inset-0 h-full w-full object-contain transition-opacity duration-200"
                  style={{
                    transform: transformStyle,
                    opacity: draft.imageSettings.opacity,
                    pointerEvents: 'none',
                  }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
              <div className="relative z-10 w-full" style={{ textAlign: draft.textAlign }}>
                {draft.layoutPreset === 'status-bar' && (
                  <div className="flex items-center justify-between w-full px-2 mb-2">
                    <p className="text-sm tracking-widest text-white/70">{draft.title}</p>
                    <p className="text-2xl font-bold text-white">{draft.value}</p>
                    <p className="text-cyan-300 text-sm">{draft.label}</p>
                  </div>
                )}
                {draft.layoutPreset !== 'status-bar' && (
                  <>
                    {draft.layoutPreset !== 'minimal' && draft.title && (
                      <p className={`text-sm tracking-widest text-white/70 mb-1 ${draft.layoutPreset === 'gaming' ? 'text-cyan-300' : ''}`}>
                        {draft.title}
                      </p>
                    )}
                    <p className={`font-bold my-2 ${draft.layoutPreset === 'value-focused' || draft.layoutPreset === 'gaming' ? 'text-5xl' : 'text-4xl'} text-white`}>
                      {draft.value}
                    </p>
                    {draft.layoutPreset !== 'minimal' && draft.label && (
                      <p className={`text-sm ${draft.layoutPreset === 'gaming' ? 'text-cyan-300' : 'text-cyan-300'}`}>
                        {draft.label}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-[#666] mt-2 text-center">
              {draft.image ? 'Drag image to reposition' : 'Upload an image to see it here'}
              {' • '}
              Illustrative preview — not the keyboard's measured screen dimensions.
            </p>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <details className="rounded-lg border border-[#252540] bg-[#1a1a2e] p-3">
            <summary className="text-xs text-[#8888a0] cursor-pointer select-none flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Keyboard Shortcuts
            </summary>
            <ul className="text-xs text-[#666] mt-2 space-y-1 pl-4 list-disc">
              <li><kbd className="px-1.5 py-0.5 bg-[#252540] rounded text-white font-mono">Ctrl+S</kbd> Save draft</li>
              <li><kbd className="px-1.5 py-0.5 bg-[#252540] rounded text-white font-mono">Ctrl+E</kbd> Export draft</li>
              <li><kbd className="px-1.5 py-0.5 bg-[#252540] rounded text-white font-mono">Delete</kbd> Remove image</li>
              <li>Drag image in preview to reposition</li>
            </ul>
          </details>
        </div>
      </div>
    </section>
  );
}
