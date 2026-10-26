import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  AlignLeft,
  Moon,
  ListMusic,
  ArrowLeft,
  Activity,
  Zap,
  Disc,
  Headphones,
  Flame,
  Radio,
  Star,
  Film,
  Music,
  Layers,
  Folder,
  Upload,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import { Song, VisualizerMode, RepeatMode, BackgroundVideo, LibraryViewTab } from '../types/audio';
import { CyberVisualizer } from './CyberVisualizer';
import { audioEngine } from '../services/audioEngine';

interface GamerPlayerScreenProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isNightcore: boolean;
  isSlowedReverb: boolean;
  isSpatial3D: boolean;
  isFavorite: boolean;
  backgroundVideos: BackgroundVideo[];
  activeVideoId: string | null;
  autoCycleVideos: boolean;
  onOpenVideoSelector: () => void;
  onNextVideo: () => void;
  onPrevVideo: () => void;
  onSelectVideo: (videoId: string | null) => void;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleNightcore: () => void;
  onToggleSlowedReverb: () => void;
  onToggleSpatial3D: () => void;
  onToggleFavorite: () => void;
  onBackToLibrary: () => void;
  onNavigateToCategory: (category: LibraryViewTab) => void;
  onOpenEqualizer: () => void;
  onOpenSoundboard: () => void;
  onOpenLyrics: () => void;
  onOpenSleepTimer: () => void;
  onOpenPlaylists: () => void;
}

export const GamerPlayerScreen: React.FC<GamerPlayerScreenProps> = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  isNightcore,
  isSlowedReverb,
  isSpatial3D,
  isFavorite,
  backgroundVideos,
  activeVideoId,
  autoCycleVideos,
  onOpenVideoSelector,
  onNextVideo,
  onPrevVideo,
  onSelectVideo,
  onTogglePlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleNightcore,
  onToggleSlowedReverb,
  onToggleSpatial3D,
  onToggleFavorite,
  onBackToLibrary,
  onNavigateToCategory,
  onOpenEqualizer,
  onOpenSoundboard,
  onOpenLyrics,
  onOpenSleepTimer,
  onOpenPlaylists,
}) => {
  // Screen monitor mode: 'video' (shows phone video in screen) or 'visualizer' (shows canvas waveform)
  const [monitorMode, setMonitorMode] = useState<'video' | 'visualizer'>('video');
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showScanlines, setShowScanlines] = useState<boolean>(true);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const activeVideo = backgroundVideos.find((v) => v.id === activeVideoId) || backgroundVideos[0] || null;
  const currentVideoIndex = activeVideo ? backgroundVideos.findIndex((v) => v.id === activeVideo.id) : -1;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSpeedChange = (val: number) => {
    setPlaybackSpeed(val);
    audioEngine.setPlaybackRate(val);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2 sm:p-4 max-w-6xl mx-auto w-full h-[calc(100vh-4.2rem)] max-h-[calc(100vh-4.2rem)] overflow-hidden">
      {/* 1. COMPACT TOP STATUS STRIP */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#090912] border border-slate-800/80 shrink-0">
        <button
          onClick={onBackToLibrary}
          className="flex items-center gap-1.5 text-xs font-cyber tracking-wider font-bold text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">BIBLIOTECA // MÚSICA</span>
          <span className="sm:hidden">ATRÁS</span>
        </button>

        {/* Track Title Badge */}
        <div className="flex items-center gap-2 truncate max-w-xs sm:max-w-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <p className="text-xs font-cyber font-bold text-white truncate">
            {currentSong?.title || 'SELECCIONA UNA PISTA'}
          </p>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <p className="text-[11px] font-mono-cyber text-pink-400 truncate hidden sm:inline">
            {currentSong?.artist}
          </p>
        </div>

        {/* Quick Tools Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenLyrics}
            className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-cyber tracking-wider rounded border border-slate-700 flex items-center gap-1"
            title="Letras sincronizadas"
          >
            <AlignLeft className="w-3 h-3 text-cyan-400" />
            <span className="hidden md:inline">Letras</span>
          </button>
          <button
            onClick={onOpenEqualizer}
            className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-cyber tracking-wider rounded border border-slate-700 flex items-center gap-1"
            title="Ecualizador DSP"
          >
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span className="hidden md:inline">EQ</span>
          </button>
          <button
            onClick={onOpenSoundboard}
            className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-cyber tracking-wider rounded border border-slate-700 flex items-center gap-1"
            title="Efectos de sonido"
          >
            <Zap className="w-3 h-3 text-pink-400" />
            <span className="hidden md:inline">SFX</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CENTERPIECE STAGE: VINYL ARTWORK + PHONE VIDEO MONITOR (COMPACT VIEWPORT) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center my-1.5 flex-1 min-h-0">
        {/* Left: Compact Cyber Vinyl Disc */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative group w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-2xl p-2.5 bg-gradient-to-b from-[#141428] to-[#0c0c16] border border-cyan-500/30 shadow-xl neon-glow-cyan flex items-center justify-center shrink-0">
            {/* Spinning Vinyl Grooves */}
            <div
              className={`absolute inset-2.5 rounded-full border border-slate-700/60 ${
                isPlaying ? 'animate-spin-slow' : 'animate-spin-slow-paused'
              }`}
            >
              <div className="w-full h-full rounded-full border-2 border-dashed border-cyan-500/20" />
            </div>

            {/* Album Cover Art */}
            <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 md:w-38 md:h-38 rounded-xl overflow-hidden border-2 border-cyan-400/50 shadow-xl bg-black">
              {currentSong?.coverArt ? (
                <img
                  src={currentSong.coverArt}
                  alt={currentSong.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-cyan-400">
                  <Disc className="w-10 h-10 animate-pulse" />
                </div>
              )}
            </div>

            {/* Favorite Star */}
            <button
              onClick={onToggleFavorite}
              className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-black/60 border border-slate-700 hover:border-yellow-400 transition-colors"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'
                }`}
              />
            </button>
          </div>

          {/* Under Vinyl: Track Metadata Subtitle */}
          <div className="text-center mt-1.5 max-w-xs truncate">
            <p className="text-xs font-bold font-cyber text-slate-100 truncate">
              {currentSong?.album || 'Álbum'}
            </p>
            <p className="text-[10px] font-mono-cyber text-cyan-400 truncate">
              {currentSong?.genre} · {currentSong?.bpm || 128} BPM
            </p>
          </div>
        </div>

        {/* Right: DEDICATED CYBER VIDEO MONITOR (PANTALLA DE VIDEO DEL TELÉFONO EN OFF AUDIO) */}
        <div className="md:col-span-7 flex flex-col h-full max-h-64 sm:max-h-72 md:max-h-80 rounded-xl bg-[#0b0b14] border border-cyan-500/40 shadow-xl overflow-hidden">
          {/* Monitor Top Control Bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#08080e] border-b border-slate-800 text-xs shrink-0">
            {/* Monitor Mode Switcher */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMonitorMode('video')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-cyber tracking-wider font-bold transition-all ${
                  monitorMode === 'video'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-pink-300" />
                <span>PANTALLA VIDEO (OFF AUDIO)</span>
              </button>

              <button
                onClick={() => setMonitorMode('visualizer')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-cyber tracking-wider font-bold transition-all ${
                  monitorMode === 'visualizer'
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>ESPECTRO ONDA</span>
              </button>
            </div>

            {/* Video Slot Actions */}
            <div className="flex items-center gap-1.5">
              {monitorMode === 'video' && backgroundVideos.length > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-mono-cyber text-slate-400">
                  <button
                    onClick={onPrevVideo}
                    className="p-1 hover:text-cyan-300"
                    title="Video Anterior"
                  >
                    ◀
                  </button>
                  <span className="text-cyan-300 font-bold">
                    {currentVideoIndex + 1}/{backgroundVideos.length}
                  </span>
                  <button
                    onClick={onNextVideo}
                    className="p-1 hover:text-cyan-300"
                    title="Siguiente Video"
                  >
                    ▶
                  </button>
                </div>
              )}

              <button
                onClick={onOpenVideoSelector}
                className="px-2 py-0.5 bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/40 text-pink-300 rounded text-[10px] font-cyber font-bold tracking-wider transition-colors"
                title="Escoger hasta 10 videos de tu teléfono"
              >
                + 10 Videos Tlf
              </button>
            </div>
          </div>

          {/* Monitor Screen Body */}
          <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-0">
            {monitorMode === 'video' ? (
              activeVideo ? (
                /* Silent Fluid Video from Phone */
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoElementRef}
                    src={activeVideo.blobUrl}
                    autoPlay
                    muted
                    playsInline
                    loop={!autoCycleVideos}
                    onEnded={() => {
                      if (autoCycleVideos) onNextVideo();
                    }}
                    className="w-full h-full object-cover"
                  />

                  {/* Translucent Audio Reactive Waveform Overlay over Video */}
                  <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none opacity-60">
                    <CyberVisualizer
                      mode="wave"
                      isPlaying={isPlaying}
                      showScanlines={false}
                      className="w-full h-full bg-transparent border-0"
                    />
                  </div>

                  {/* Video Subtitle badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-mono-cyber text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                    <span className="truncate max-w-[150px]">{activeVideo.name}</span>
                    <span className="text-pink-400 font-bold">(OFF AUDIO)</span>
                  </div>

                  {showScanlines && (
                    <div className="absolute inset-0 crt-scanlines opacity-40 pointer-events-none" />
                  )}
                </div>
              ) : (
                /* Empty Video Screen State */
                <div className="p-4 text-center flex flex-col items-center justify-center">
                  <Film className="w-10 h-10 text-pink-400 opacity-60 mb-2" />
                  <p className="text-xs font-bold font-cyber text-slate-200 tracking-wider">
                    PANTALLA DE VIDEO (OFF AUDIO)
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono-cyber max-w-xs mt-0.5 mb-2.5">
                    Elige hasta 10 videos de tu teléfono que se reproducirán fluidos sin audio mientras escuchas música.
                  </p>
                  <button
                    onClick={onOpenVideoSelector}
                    className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-cyber font-bold tracking-wider shadow-md shadow-pink-600/30 transition-transform active:scale-95"
                  >
                    + Escoger Videos del Teléfono
                  </button>
                </div>
              )
            ) : (
              /* Canvas Visualizer Mode */
              <CyberVisualizer
                mode={visualizerMode}
                isPlaying={isPlaying}
                showScanlines={showScanlines}
                className="w-full h-full"
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. COMPACT AUDIO CONTROLS & TRANSPORT */}
      <div className="p-2 sm:p-3 rounded-xl bg-[#0d0d18] border border-slate-800 shrink-0 space-y-2">
        {/* Progress Scrubber */}
        <div className="space-y-1">
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer focus:outline-none"
              style={{
                background: `linear-gradient(to right, #06b6d4 ${progressPercent}%, #1e293b ${progressPercent}%)`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono-cyber text-slate-400 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>

        {/* Transport Row (Compact Single Row) */}
        <div className="flex items-center justify-between gap-2">
          {/* Shuffle & Repeat */}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleShuffle}
              className={`p-1.5 rounded transition-colors ${
                isShuffle
                  ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Aleatorio"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onToggleRepeat}
              className={`p-1.5 rounded transition-colors relative ${
                repeatMode !== 'off'
                  ? 'text-pink-400 bg-pink-950/40 border border-pink-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={`Repetir: ${repeatMode}`}
            >
              <Repeat className="w-3.5 h-3.5" />
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 text-[8px] font-bold font-mono-cyber bg-pink-500 text-white rounded-full w-3 h-3 flex items-center justify-center">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Center: Prev, Play/Pause, Next */}
          <div className="flex items-center gap-3">
            <button
              onClick={onPrev}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-400 transition-transform active:scale-95"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={onTogglePlayPause}
              className="p-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg shadow-cyan-400/30 transition-transform hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-400 transition-transform active:scale-95"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button onClick={onToggleMute} className="text-slate-400 hover:text-cyan-400">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
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
        </div>

        {/* Compact Gamer FX Pill Bar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[10px] font-cyber font-bold">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleNightcore}
              className={`px-2 py-1 rounded transition-all border ${
                isNightcore
                  ? 'bg-pink-600 text-white border-pink-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-pink-300'
              }`}
            >
              NIGHTCORE (+25%)
            </button>
            <button
              onClick={onToggleSlowedReverb}
              className={`px-2 py-1 rounded transition-all border ${
                isSlowedReverb
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-300'
              }`}
            >
              SLOWED + REVERB
            </button>
            <button
              onClick={onToggleSpatial3D}
              className={`px-2 py-1 rounded transition-all border ${
                isSpatial3D
                  ? 'bg-cyan-500 text-black border-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-300'
              }`}
            >
              3D SPATIAL (8D)
            </button>
          </div>

          <button
            onClick={onOpenSleepTimer}
            className="text-slate-400 hover:text-indigo-300 flex items-center gap-1 px-1.5 py-1"
          >
            <Moon className="w-3 h-3 text-indigo-400" />
            <span>Temporizador</span>
          </button>
        </div>
      </div>

      {/* 4. DEDICATED BOTTOM NAVIGATION DOCK: PISTAS, ÁLBUMES, GÉNEROS, CARPETAS, FAVORITOS */}
      <div className="pt-2 shrink-0">
        <div className="flex items-center justify-between gap-1 p-1 bg-[#090912] border border-cyan-500/30 rounded-xl shadow-lg">
          <span className="text-[10px] font-mono-cyber font-bold text-slate-500 px-2 hidden sm:inline uppercase">
            EXPLORAR:
          </span>

          <button
            onClick={() => onNavigateToCategory('pistas')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 font-cyber font-bold text-xs tracking-wider transition-all"
          >
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pistas</span>
          </button>

          <button
            onClick={() => onNavigateToCategory('albumes')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 font-cyber font-bold text-xs tracking-wider transition-all"
          >
            <Disc className="w-3.5 h-3.5 text-pink-400" />
            <span>Álbumes</span>
          </button>

          <button
            onClick={() => onNavigateToCategory('generos')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 font-cyber font-bold text-xs tracking-wider transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Géneros</span>
          </button>

          <button
            onClick={() => onNavigateToCategory('carpetas')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 font-cyber font-bold text-xs tracking-wider transition-all"
          >
            <Folder className="w-3.5 h-3.5 text-yellow-400" />
            <span>Carpetas</span>
          </button>

          <button
            onClick={() => onNavigateToCategory('favoritos')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 font-cyber font-bold text-xs tracking-wider transition-all"
          >
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span>Favoritos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
