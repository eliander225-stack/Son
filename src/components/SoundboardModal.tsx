import React, { useState } from 'react';
import { Volume2, X, Sparkles, Crosshair, Award, Bell, Coins } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface SoundboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundboardModal: React.FC<SoundboardModalProps> = ({ isOpen, onClose }) => {
  const [activeSfx, setActiveSfx] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerSound = (id: string) => {
    setActiveSfx(id);
    audioEngine.playSFX(id);
    setTimeout(() => {
      setActiveSfx((curr) => (curr === id ? null : curr));
    }, 400);
  };

  const sounds = [
    {
      id: 'levelup',
      label: 'LEVEL UP',
      desc: 'Ascending 8-bit fanfare chime',
      icon: Sparkles,
      color: 'from-amber-500/20 to-yellow-500/10 border-yellow-500/40 text-yellow-300',
    },
    {
      id: 'laser',
      label: 'CYBER LASER',
      desc: 'Pitch-drop sci-fi beam shot',
      icon: Crosshair,
      color: 'from-red-500/20 to-pink-500/10 border-red-500/40 text-red-300',
    },
    {
      id: 'coin',
      label: 'ARCADE COIN',
      desc: 'Dual-frequency crisp coin collect',
      icon: Coins,
      color: 'from-emerald-500/20 to-cyan-500/10 border-emerald-500/40 text-emerald-300',
    },
    {
      id: 'cyberding',
      label: 'HUD ALERT',
      desc: 'High-tech notification chirp',
      icon: Bell,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-300',
    },
    {
      id: 'victory',
      label: 'ANIME VICTORY',
      desc: 'Triumphant boss battle victory chords',
      icon: Award,
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0d0d18] border border-pink-500/40 rounded-2xl p-6 shadow-2xl neon-glow-pink">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-950/60 border border-pink-500/40 text-pink-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wider text-slate-100 font-cyber">
                GAMER SOUNDBOARD // SFX MATRIX
              </h2>
              <p className="text-xs text-pink-400/80 font-mono-cyber">
                INSTANT PROCEDURAL AUDIO SYNTHESIS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sound Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {sounds.map((sound) => {
            const Icon = sound.icon;
            const isPlaying = activeSfx === sound.id;
            return (
              <button
                key={sound.id}
                onClick={() => triggerSound(sound.id)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border bg-gradient-to-br transition-all text-left ${
                  sound.color
                } ${
                  isPlaying
                    ? 'scale-95 ring-2 ring-white/60 brightness-125'
                    : 'hover:scale-[1.02] hover:brightness-110'
                }`}
              >
                <div className="p-2 rounded-lg bg-black/40 border border-white/10 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-bold font-cyber tracking-wider text-white">
                    {sound.label}
                  </span>
                  <span className="block text-xs text-slate-400 line-clamp-1">
                    {sound.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="p-3 rounded-lg bg-[#08080f] border border-slate-800 text-xs text-slate-400 font-mono-cyber flex items-center justify-between">
          <span>All SFX generated in real time via Web Audio API oscillators.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
