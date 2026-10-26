import React, { useRef, useState } from 'react';
import {
  Film,
  X,
  Upload,
  Trash2,
  Play,
  CheckCircle,
  Smartphone,
  Eye,
  Sliders,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import { BackgroundVideo } from '../types/audio';
import { dbStorage } from '../services/indexedDbStorage';
import { audioEngine } from '../services/audioEngine';

interface VideoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: BackgroundVideo[];
  activeVideoId: string | null;
  onSelectVideo: (videoId: string | null) => void;
  onVideosChange: (videos: BackgroundVideo[]) => void;
  displayMode: 'backdrop' | 'centerpiece' | 'pip';
  onChangeDisplayMode: (mode: 'backdrop' | 'centerpiece' | 'pip') => void;
  videoOpacity: number;
  onChangeOpacity: (opacity: number) => void;
  autoCycle: boolean;
  onToggleAutoCycle: () => void;
  showScanlines: boolean;
  onToggleScanlines: () => void;
}

export const VideoSelectorModal: React.FC<VideoSelectorModalProps> = ({
  isOpen,
  onClose,
  videos,
  activeVideoId,
  onSelectVideo,
  onVideosChange,
  displayMode,
  onChangeDisplayMode,
  videoOpacity,
  onChangeOpacity,
  autoCycle,
  onToggleAutoCycle,
  showScanlines,
  onToggleScanlines,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const singleSlotInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Max 10 slots
  const MAX_VIDEOS = 10;
  const slots = Array.from({ length: MAX_VIDEOS }, (_, i) => videos[i] || null);

  const handleBatchVideoUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    const remainingSlots = MAX_VIDEOS - videos.length;
    if (remainingSlots <= 0) {
      setErrorMsg('You already have 10 videos loaded. Delete one to add another.');
      setIsProcessing(false);
      return;
    }

    const filesToAdd = Array.from(fileList).slice(0, remainingSlots);
    const newVideos: BackgroundVideo[] = [];

    for (const file of filesToAdd) {
      if (!file.type.startsWith('video/')) continue;
      const id = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const blobUrl = URL.createObjectURL(file);
      const vidObj: BackgroundVideo = {
        id,
        name: file.name.replace(/\.[^/.]+$/, ''),
        blobUrl,
        size: file.size,
        addedAt: Date.now(),
      };

      try {
        await dbStorage.saveBackgroundVideo(vidObj, file);
        newVideos.push(vidObj);
      } catch (err) {
        console.error('Error saving video:', err);
      }
    }

    const updated = [...videos, ...newVideos];
    onVideosChange(updated);
    if (!activeVideoId && updated.length > 0) {
      onSelectVideo(updated[0].id);
    }
    setIsProcessing(false);
    audioEngine.playSFX('levelup');
  };

  const handleSingleSlotUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || selectedSlotIndex === null) return;
    const file = fileList[0];
    if (!file.type.startsWith('video/')) return;

    setIsProcessing(true);
    const id = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const blobUrl = URL.createObjectURL(file);
    const vidObj: BackgroundVideo = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ''),
      blobUrl,
      size: file.size,
      addedAt: Date.now(),
    };

    await dbStorage.saveBackgroundVideo(vidObj, file);

    const currentVideos = [...videos];
    if (selectedSlotIndex < currentVideos.length) {
      // Replace existing
      const oldVid = currentVideos[selectedSlotIndex];
      await dbStorage.deleteBackgroundVideo(oldVid.id);
      currentVideos[selectedSlotIndex] = vidObj;
    } else {
      // Add new
      currentVideos.push(vidObj);
    }

    onVideosChange(currentVideos);
    onSelectVideo(vidObj.id);
    setIsProcessing(false);
    setSelectedSlotIndex(null);
    audioEngine.playSFX('coin');
  };

  const handleDeleteVideo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dbStorage.deleteBackgroundVideo(id);
    const updated = videos.filter((v) => v.id !== id);
    onVideosChange(updated);
    if (activeVideoId === id) {
      onSelectVideo(updated[0]?.id || null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0c0c18] border border-cyan-500/50 rounded-2xl shadow-2xl neon-glow-cyan overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#090912]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wider text-slate-100 font-cyber">
                  DEVICE VIDEO SYNC // 10-SLOT AMV ENGINE
                </h2>
                <span className="text-[11px] font-mono-cyber text-pink-400 font-bold bg-pink-950/40 border border-pink-500/30 px-2 py-0.5 rounded-full">
                  MUTED 0dB AUDIO
                </span>
              </div>
              <p className="text-xs text-cyan-400/80 font-mono-cyber">
                PLAY UP TO 10 VIDEOS FROM YOUR PHONE SILENTLY IN SYNC WITH MUSIC
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

        {/* Top Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-[#0a0a14] border-b border-slate-800 text-xs">
          {/* Display Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono-cyber">Display:</span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => onChangeDisplayMode('backdrop')}
                className={`px-2.5 py-1 rounded text-[11px] font-cyber tracking-wider font-bold transition-all ${
                  displayMode === 'backdrop'
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Full Backdrop
              </button>
              <button
                onClick={() => onChangeDisplayMode('centerpiece')}
                className={`px-2.5 py-1 rounded text-[11px] font-cyber tracking-wider font-bold transition-all ${
                  displayMode === 'centerpiece'
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Centerpiece Art
              </button>
              <button
                onClick={() => onChangeDisplayMode('pip')}
                className={`px-2.5 py-1 rounded text-[11px] font-cyber tracking-wider font-bold transition-all ${
                  displayMode === 'pip'
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                PiP Monitor
              </button>
            </div>
          </div>

          {/* Opacity slider */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono-cyber">
              Opacity: {Math.round(videoOpacity * 100)}%
            </span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={videoOpacity}
              onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAutoCycle}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono-cyber transition-all ${
                autoCycle
                  ? 'bg-pink-600/30 text-pink-300 border-pink-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Automatically advance to next video when current video finishes"
            >
              <RefreshCw className={`w-3 h-3 ${autoCycle ? 'animate-spin' : ''}`} />
              Auto-Cycle 10
            </button>

            <button
              onClick={onToggleScanlines}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono-cyber transition-all ${
                showScanlines
                  ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              CRT Scanlines
            </button>
          </div>
        </div>

        {/* Video Slots Grid (10 Slots) */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-cyber tracking-wider text-slate-300 uppercase">
                Video Rack: {videos.length} / 10 Slots Occupied
              </span>
              <span className="text-xs text-slate-500 font-mono-cyber">·</span>
              <span className="text-xs text-cyan-400 font-mono-cyber">
                All videos play 100% silent while music plays
              </span>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={videos.length >= MAX_VIDEOS}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-cyber font-bold tracking-wider transition-all shadow-md ${
                videos.length >= MAX_VIDEOS
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20 hover:scale-105'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Choose from Phone / Device
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono-cyber">
              {errorMsg}
            </div>
          )}

          {/* 10-Slot Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {slots.map((video, idx) => {
              const isSlotActive = video && video.id === activeVideoId;
              return (
                <div
                  key={idx}
                  className={`relative rounded-xl border p-2 flex flex-col justify-between transition-all ${
                    isSlotActive
                      ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/20'
                      : video
                      ? 'bg-[#0e0e1a] border-slate-800 hover:border-slate-700'
                      : 'bg-[#090912]/60 border-dashed border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  {/* Slot Number Label */}
                  <div className="flex items-center justify-between text-[10px] font-mono-cyber text-slate-400 mb-1.5">
                    <span className="font-bold text-cyan-400">SLOT {(idx + 1).toString().padStart(2, '0')}</span>
                    {isSlotActive && (
                      <span className="text-pink-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>

                  {video ? (
                    <div
                      className="cursor-pointer group"
                      onClick={() => {
                        onSelectVideo(video.id);
                        audioEngine.playSFX('cyberding');
                      }}
                    >
                      {/* Video Thumbnail */}
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-2 border border-slate-800">
                        <video
                          src={video.blobUrl}
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Play className="w-6 h-6 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow" />
                        </div>
                      </div>

                      {/* Video Details */}
                      <div className="mb-2">
                        <p className="text-xs font-bold text-slate-200 truncate font-cyber group-hover:text-cyan-300">
                          {video.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono-cyber">
                          {(video.size ? (video.size / (1024 * 1024)).toFixed(1) : '1.0')} MB
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSlotIndex(idx);
                            singleSlotInputRef.current?.click();
                          }}
                          className="text-[10px] text-slate-400 hover:text-cyan-300 font-mono-cyber"
                        >
                          Replace
                        </button>
                        <button
                          onClick={(e) => handleDeleteVideo(video.id, e)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Empty Slot */
                    <button
                      onClick={() => {
                        setSelectedSlotIndex(idx);
                        singleSlotInputRef.current?.click();
                      }}
                      className="flex-1 flex flex-col items-center justify-center py-6 text-center cursor-pointer hover:bg-slate-900/40 rounded-lg transition-colors group"
                    >
                      <div className="p-2.5 rounded-full bg-slate-900 border border-slate-800 group-hover:border-cyan-500/50 mb-2">
                        <Upload className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <span className="text-[11px] font-cyber font-bold text-slate-400 group-hover:text-cyan-300">
                        Add Video {idx + 1}
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono-cyber">
                        Gallery / Camera
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => handleBatchVideoUpload(e.target.files)}
          />
          <input
            ref={singleSlotInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleSingleSlotUpload(e.target.files)}
          />
        </div>

        {/* Footer info & close */}
        <div className="p-4 bg-[#090912] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-cyber">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Tip: Pick your favorite anime edits, gameplay clips, or AMVs from your phone!
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeVideoId && (
              <button
                onClick={() => onSelectVideo(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-mono-cyber"
              >
                Disable Video Backdrop
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold font-cyber tracking-wider uppercase text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
            >
              Done & Watch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
