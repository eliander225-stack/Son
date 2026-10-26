import React, { useState, useEffect } from 'react';
import { Sliders, RotateCcw, X, Zap } from 'lucide-react';
import { audioEngine, EQ_FREQUENCIES, EQ_PRESETS } from '../services/audioEngine';
import { EQPreset } from '../types/audio';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ isOpen, onClose }) => {
  const [currentPreset, setCurrentPreset] = useState<EQPreset>(audioEngine.getCurrentPreset());
  const [gains, setGains] = useState<number[]>(audioEngine.getEQGains());

  useEffect(() => {
    if (isOpen) {
      setCurrentPreset(audioEngine.getCurrentPreset());
      setGains(audioEngine.getEQGains());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: EQPreset) => {
    setCurrentPreset(preset);
    audioEngine.setEQPreset(preset);
    setGains(audioEngine.getEQGains());
    audioEngine.playSFX('cyberding');
  };

  const handleSliderChange = (idx: number, val: number) => {
    const updated = [...gains];
    updated[idx] = val;
    setGains(updated);
    setCurrentPreset('Custom');
    audioEngine.setBandGain(idx, val);
  };

  const handleReset = () => {
    handlePresetSelect('Flat');
  };

  const formatFreq = (freq: number) => {
    return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
  };

  const presetsList: EQPreset[] = [
    'Flat',
    'BassBoost',
    'AnimeVocal',
    'CyberSynth',
    'GamerEDM',
    'JRock',
    'LoFiChill',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0d0d18] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl neon-glow-cyan">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wider text-slate-100 font-cyber">
                GRAPHIC EQUALIZER // 10-BAND DSP
              </h2>
              <p className="text-xs text-cyan-400/80 font-mono-cyber">
                PRECISION FREQUENCY RESPONSE CURVE
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

        {/* Preset Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono-cyber">
              Target Profile Preset
            </span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Flat
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {presetsList.map((preset) => {
              const active = currentPreset === preset;
              return (
                <button
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-cyber tracking-wider transition-all ${
                    active
                      ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300'
                  }`}
                >
                  {preset === 'BassBoost' ? 'BASS BOOST' : preset === 'AnimeVocal' ? 'ANIME VOCAL' : preset.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* 10-Band Sliders */}
        <div className="grid grid-cols-10 gap-2 sm:gap-3 p-4 rounded-xl bg-[#090910] border border-slate-800">
          {EQ_FREQUENCIES.map((freq, idx) => {
            const gain = gains[idx] ?? 0;
            return (
              <div key={freq} className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-mono-cyber font-semibold text-cyan-400 tabular-nums">
                  {gain > 0 ? `+${gain}` : gain}dB
                </span>
                <div className="relative h-44 flex items-center justify-center py-2">
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={gain}
                    onChange={(e) => handleSliderChange(idx, parseFloat(e.target.value))}
                    className="h-36 w-2 appearance-none bg-slate-800 rounded-lg cursor-pointer orient-vertical"
                    style={{
                      writingMode: 'vertical-lr',
                      direction: 'rtl',
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono-cyber text-slate-400">
                  {formatFreq(freq)}Hz
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-cyber">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hardware Accelerated WebAudio Filter Pipeline</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold font-cyber tracking-wider uppercase text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
