import React, { useState, useCallback, useEffect } from 'react';
import {
  FolderOpen,
  Plus,
  Download,
  Upload,
  Check,
  Trash2,
  AlertCircle,
  FileJson,
} from 'lucide-react';

interface ProfileItem {
  id: string;
  name: string;
  game: string;
  actuation: string;
  rt: boolean;
  active: boolean;
}

// Local storage key for profile persistence
const PROFILES_STORAGE_KEY = 'apex-control-profiles-v1';

// Default profiles
const DEFAULT_PROFILES: ProfileItem[] = [
  {
    id: 'p1',
    name: 'Default Desktop',
    game: 'General Typing',
    actuation: '2.0mm Global',
    rt: false,
    active: true,
  },
  {
    id: 'p2',
    name: 'Valorant / CS2 Competitive',
    game: 'Tactical Shooter',
    actuation: '0.4mm WASD / 1.5mm Rest',
    rt: true,
    active: false,
  },
  {
    id: 'p3',
    name: 'Apex Legends / Fast Pace',
    game: 'Movement FPS',
    actuation: '0.8mm Global',
    rt: true,
    active: false,
  },
];

// Validate imported profile data
function validateProfileData(data: unknown): data is ProfileItem[] {
  if (!Array.isArray(data) || data.length < 1 || data.length > 100) return false;
  return data.every((item) =>
    typeof item === 'object' &&
    item !== null &&
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.game === 'string' &&
    typeof item.actuation === 'string' &&
    typeof item.rt === 'boolean' &&
    typeof item.active === 'boolean'
  );
}

// Load profiles from localStorage
function loadProfiles(): ProfileItem[] {
  try {
    const saved = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (validateProfileData(parsed) && parsed.length > 0) {
        // Ensure exactly one active profile
        let hasActive = false;
        const normalized = parsed.map((p) => {
          if (p.active && !hasActive) {
            hasActive = true;
            return p;
          }
          if (p.active && hasActive) {
            return { ...p, active: false };
          }
          return p;
        });
        if (!hasActive && normalized.length > 0) {
          normalized[0].active = true;
        }
        return normalized;
      }
    }
  } catch {
    // Fall through to defaults
  }
  return DEFAULT_PROFILES.map((p, i) => ({ ...p, active: i === 0 }));
}

// Save profiles to localStorage
function saveProfiles(profiles: ProfileItem[]): void {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Silently fail - storage quota exceeded
  }
}

export const ProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<ProfileItem[]>(() => loadProfiles());
  useEffect(() => { saveProfiles(profiles); }, [profiles]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const activateProfile = (id: string) => {
    setProfiles((prev) =>
      prev.map((p) => ({
        ...p,
        active: p.id === id,
      }))
    );
    saveProfiles(
      profiles.map((p) => ({ ...p, active: p.id === id }))
    );
    showToast('Profile activated', 'success');
  };

  const deleteProfile = (id: string) => {
    if (profiles.length <= 1) {
      showToast('Cannot delete the last profile', 'error');
      return;
    }
    const profileToDelete = profiles.find((p) => p.id === id);
    if (profileToDelete?.active) {
      showToast('Cannot delete active profile', 'error');
      return;
    }
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    showToast('Profile deleted', 'success');
  };

  const createNewProfile = () => {
    const newProfile: ProfileItem = {
      id: `p${Date.now()}`,
      name: `Profile ${profiles.length + 1}`,
      game: 'Custom',
      actuation: '2.0mm Global',
      rt: false,
      active: false,
    };
    setProfiles((prev) => [...prev, newProfile]);
    showToast('New profile created', 'success');
  };

  const exportProfiles = () => {
    try {
      const json = JSON.stringify(profiles, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apex-control-profiles-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Profiles exported successfully', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  const importProfiles = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (!validateProfileData(parsed)) {
          throw new Error('Invalid profile format');
        }
        // Ensure unique IDs and one active
        const seenIds = new Set<string>();
        let hasActive = false;
        const normalized = parsed.map((p) => {
          let id = p.id;
          while (seenIds.has(id)) {
            id = `${id}-${Date.now()}`;
          }
          seenIds.add(id);
          if (p.active && !hasActive) {
            hasActive = true;
            return { ...p, id };
          }
          return { ...p, id, active: false };
        });
        if (!hasActive && normalized.length > 0) {
          normalized[0].active = true;
        }
        setProfiles(normalized);
        saveProfiles(normalized);
        showToast(`Imported ${normalized.length} profile(s)`, 'success');
      } catch {
        showToast('Import failed: invalid JSON or format', 'error');
      }
    };
    reader.onerror = () => showToast('Failed to read file', 'error');
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg border shadow-lg animate-slide-in flex items-center gap-2 ${
            toast.type === 'success' ? 'border-[#00c853] bg-[#00c853]/10 text-[#00c853]' :
            toast.type === 'error' ? 'border-red-500 bg-red-500/10 text-red-400' :
            'border-[#0096ff] bg-[#0096ff]/10 text-[#0096ff]'
          }`}
          role="alert"
          aria-live="polite"
        >
          {toast.type === 'success' && <Check className="w-4 h-4" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
          {toast.type === 'info' && <FileJson className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-[#0096ff]" />
            Configuration Profiles
          </h1>
          <p className="text-sm text-[#8888a0] mt-1">
            Store, export, and toggle actuation, Rapid Trigger, and RGB presets across your favorite games.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-[#333355] text-[#8888a0] hover:text-white hover:bg-[#252540] transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Import JSON
            <input
              type="file"
              accept=".json"
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && importProfiles(e.target.files[0])}
              aria-label="Import profiles from JSON file"
            />
          </label>
          <button
            onClick={exportProfiles}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-[#333355] text-[#8888a0] hover:text-white hover:bg-[#252540] transition-colors"
            aria-label="Export profiles to JSON file"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={createNewProfile}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#0096ff] text-white hover:bg-[#0080db] shadow-md shadow-[#0096ff]/20 transition-all"
            aria-label="Create new profile"
          >
            <Plus className="w-3.5 h-3.5" />
            New Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map((prof) => (
          <div
            key={prof.id}
            className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
              prof.active
                ? 'border-[#0096ff] bg-[#0096ff]/10 shadow-lg shadow-[#0096ff]/5'
                : 'border-[#333355] bg-[#16162a]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#0096ff] font-bold">
                  {prof.game}
                </span>
                {prof.active && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#0096ff] text-white">
                    <Check className="w-3 h-3" /> ACTIVE
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {prof.name}
              </h3>
              <div className="text-xs text-[#8888a0] space-y-1.5 mb-4">
                <div className="flex justify-between">
                  <span>Actuation:</span>
                  <span className="font-mono text-neutral-300">{prof.actuation}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rapid Trigger:</span>
                  <span className="font-mono text-neutral-300">
                    {prof.rt ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#252540] flex items-center justify-between">
              {!prof.active ? (
                <button
                  onClick={() => activateProfile(prof.id)}
                  className="px-3 py-1.5 rounded text-xs font-semibold bg-[#252540] hover:bg-[#303050] text-white"
                >
                  Activate
                </button>
              ) : (
                <span className="text-xs text-[#00c853] font-semibold">
                  Applied to Keyboard
                </span>
              )}

              <button
                disabled={prof.active}
                onClick={() => deleteProfile(prof.id)}
                className="text-[#606080] hover:text-red-400 disabled:opacity-30 disabled:hover:text-[#606080] p-1.5"
                title="Delete Profile"
                aria-label={`Delete profile ${prof.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      </div>
  );
};
