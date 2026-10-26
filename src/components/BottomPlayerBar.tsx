import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Volume2,
  VolumeX,
  Music,
  Disc,
  Layers,
  Folder,
} from 'lucide-react';
import { Song, LibraryViewTab } from '../types/audio';

interface BottomPlayerBarProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onOpenGamerPlayer: () => void;
  onNavigateToCategory?: (category: LibraryViewTab) => void;
}

export const BottomPlayerBar: React.FC<BottomPlayerBarProps> = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onOpenGamerPlayer,
  onNavigateToCategory,
}) => {
  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a14]/95 backdrop-blur-md border-t border-cyan-500/30 px-3 sm:px-4 py-2 shadow-2xl">
      {/* Top micro progress line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] bg-slate-800 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = clickX / rect.width;
          onSeek(ratio * duration);
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 shadow-sm shadow-cyan-400/50 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Song Meta */}
        <div
          onClick={onOpenGamerPlayer}
          className="flex items-center gap-2.5 min-w-0 max-w-xs cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-cyan-500/30 bg-black">
            {currentSong.coverArt ? (
              <img
                src={currentSong.coverArt}
                alt={currentSong.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 text-cyan-400">
                <Music className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="truncate">
            <p className="text-xs font-bold font-cyber tracking-wider text-slate-100 group-hover:text-cyan-300 truncate">
              {currentSong.title}
            </p>
            <p className="text-[10px] font-mono-cyber text-slate-400 truncate">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Center: Controls & Category Shortcuts */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onPrev}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Anterior"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={onTogglePlayPause}
              className="p-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black shadow-md shadow-cyan-400/30 transition-transform active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 fill-black ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Siguiente"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Quick Category Buttons in mini-player */}
          {onNavigateToCategory && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-cyber text-slate-400">
              <button
                onClick={() => onNavigateToCategory('pistas')}
                className="hover:text-cyan-300 transition-colors"
              >
                Pistas
              </button>
              <span>·</span>
              <button
                onClick={() => onNavigateToCategory('albumes')}
                className="hover:text-cyan-300 transition-colors"
              >
                Álbumes
              </button>
              <span>·</span>
              <button
                onClick={() => onNavigateToCategory('generos')}
                className="hover:text-cyan-300 transition-colors"
              >
                Géneros
              </button>
              <span>·</span>
              <button
                onClick={() => onNavigateToCategory('carpetas')}
                className="hover:text-cyan-300 transition-colors"
              >
                Carpetas
              </button>
            </div>
          )}
        </div>

        {/* Right: Volume & Expand Button */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onToggleMute}
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
            />
          </div>

          <button
            onClick={onOpenGamerPlayer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-cyber font-bold tracking-wider transition-colors"
            title="Abrir pantalla Gamer HUD"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gamer HUD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
