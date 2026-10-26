import React, { useEffect, useRef, useState } from 'react';
import { AlignLeft, X, Languages, Sparkles } from 'lucide-react';
import { Song } from '../types/audio';
import { audioEngine } from '../services/audioEngine';

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  currentTime: number;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  isOpen,
  onClose,
  song,
  currentTime,
}) => {
  const [showRomaji, setShowRomaji] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const lyrics = song?.lyrics || [];

  // Determine active lyric index
  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
      break;
    }
  }

  // Auto scroll to active lyric
  useEffect(() => {
    if (!isOpen || activeIndex === -1) return;
    const activeEl = document.getElementById(`lyric-line-${activeIndex}`);
    if (activeEl && scrollContainerRef.current) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col bg-[#0d0d18] border border-cyan-500/40 rounded-2xl shadow-2xl neon-glow-cyan overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <AlignLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wider text-slate-100 font-cyber">
                KARAOKE HUD // SYNCED LYRICS
              </h2>
              <p className="text-xs text-cyan-400/80 font-mono-cyber truncate max-w-xs">
                {song ? `${song.title} — ${song.artist}` : 'NO TRACK PLAYING'}
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

        {/* Translation Toggles */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#090912] border-b border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-cyan-400" />
            <span className="font-mono-cyber">Subtitles:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRomaji(!showRomaji)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono-cyber transition-all ${
                showRomaji
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-400 border border-transparent'
              }`}
            >
              Romaji
            </button>
            <button
              onClick={() => setShowEnglish(!showEnglish)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono-cyber transition-all ${
                showEnglish
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'bg-slate-800/60 text-slate-400 border border-transparent'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Scrollable lyrics list */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-5 text-center min-h-[300px]"
        >
          {lyrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
              <Sparkles className="w-8 h-8 opacity-40 text-cyan-400" />
              <p className="text-sm font-cyber tracking-wider">
                NO EMBEDDED LYRICS AVAILABLE FOR THIS TRACK
              </p>
              <p className="text-xs font-mono-cyber text-slate-600">
                Play one of the built-in Cyber Anime tracks to experience real-time synchronized karaoke!
              </p>
            </div>
          ) : (
            lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={idx}
                  id={`lyric-line-${idx}`}
                  onClick={() => audioEngine.seek(line.time)}
                  className={`cursor-pointer transition-all duration-300 p-3 rounded-xl ${
                    isActive
                      ? 'bg-cyan-950/40 border border-cyan-500/50 scale-105 neon-glow-cyan'
                      : 'opacity-40 hover:opacity-80 hover:bg-slate-900/40'
                  }`}
                >
                  <p
                    className={`text-base sm:text-lg font-bold transition-colors ${
                      isActive ? 'text-cyan-300 neon-text-cyan' : 'text-slate-300'
                    }`}
                  >
                    {line.text}
                  </p>
                  {showRomaji && line.romaji && (
                    <p className="text-xs sm:text-sm font-mono-cyber text-cyan-200/80 mt-1">
                      {line.romaji}
                    </p>
                  )}
                  {showEnglish && line.en && (
                    <p className="text-xs text-pink-300/80 italic mt-0.5">
                      "{line.en}"
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#090912] border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 font-mono-cyber">
            Click any lyric row to jump playback to that timestamp
          </p>
        </div>
      </div>
    </div>
  );
};
