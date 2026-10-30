import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Download,
  Upload,
  Check,
  Trash2,
} from 'lucide-react';

interface ProfileItem {
  id: string;
  name: string;
  game: string;
  actuation: string;
  rt: boolean;
  active: boolean;
}

export const ProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<ProfileItem[]>([
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
  ]);

  const activateProfile = (id: string) => {
    setProfiles(
      profiles.map((p) => ({
        ...p,
        active: p.id === id,
      }))
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
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
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-[#333355] text-[#8888a0] hover:text-white hover:bg-[#252540] transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Import JSON
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-[#333355] text-[#8888a0] hover:text-white hover:bg-[#252540] transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#0096ff] text-white hover:bg-[#0080db] shadow-md shadow-[#0096ff]/20 transition-all">
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
                className="text-[#606080] hover:text-red-400 disabled:opacity-30 disabled:hover:text-[#606080] p-1.5"
                title="Delete Profile"
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
