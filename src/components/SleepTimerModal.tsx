import React, { useState, useEffect } from 'react';
import { Moon, X, Clock, Play } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTimerSeconds: number | null;
  onSetTimer: (seconds: number | null) => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  activeTimerSeconds,
  onSetTimer,
}) => {
  const [customMinutes, setCustomMinutes] = useState(20);

  if (!isOpen) return null;

  const presets = [
    { label: '15 MIN', minutes: 15 },
    { label: '30 MIN', minutes: 30 },
    { label: '45 MIN', minutes: 45 },
    { label: '60 MIN', minutes: 60 },
  ];

  const handleStart = (minutes: number) => {
    onSetTimer(minutes * 60);
    audioEngine.playSFX('cyberding');
    onClose();
  };

  const handleCancel = () => {
    onSetTimer(null);
    onClose();
  };

  const formatRemaining = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0d0d18] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl neon-glow-cyan">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wider text-slate-100 font-cyber">
                SLEEP TIMER // AUTO SHUTDOWN
              </h2>
              <p className="text-xs text-indigo-400/80 font-mono-cyber">
                GRADUAL 4-SECOND AUDIO FADEOUT
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

        {activeTimerSeconds !== null && (
          <div className="mb-5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-mono-cyber text-slate-300">
                ACTIVE COUNTDOWN:
              </span>
              <span className="text-sm font-bold font-mono-cyber text-cyan-300">
                {formatRemaining(activeTimerSeconds)}
              </span>
            </div>
            <button
              onClick={handleCancel}
              className="text-xs text-red-400 hover:text-red-300 underline font-mono-cyber"
            >
              Cancel Timer
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
          {presets.map((preset) => (
            <button
              key={preset.minutes}
              onClick={() => handleStart(preset.minutes)}
              className="py-3 px-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 font-cyber font-bold tracking-wider transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div className="p-3 rounded-xl bg-[#08080f] border border-slate-800 mb-6">
          <label className="block text-xs font-mono-cyber text-slate-400 mb-2">
            CUSTOM MINUTES: {customMinutes} MIN
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="120"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(parseInt(e.target.value, 10))}
              className="flex-1"
            />
            <button
              onClick={() => handleStart(customMinutes)}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-cyber rounded-lg transition-colors flex items-center gap-1"
            >
              <Play className="w-3.5 h-3.5" /> Set
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-cyber tracking-wider rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
