import React, { useRef, useEffect } from 'react';
import { BackgroundVideo } from '../types/audio';
import { X, Maximize2, RefreshCw } from 'lucide-react';

interface GamerVideoPlayerProps {
  activeVideo: BackgroundVideo | null;
  displayMode: 'backdrop' | 'centerpiece' | 'pip';
  videoOpacity: number;
  showScanlines: boolean;
  autoCycle: boolean;
  onNextVideo: () => void;
  onClosePip?: () => void;
  className?: string;
}

export const GamerVideoPlayer: React.FC<GamerVideoPlayerProps> = ({
  activeVideo,
  displayMode,
  videoOpacity,
  showScanlines,
  autoCycle,
  onNextVideo,
  onClosePip,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().catch((e) => {
        console.warn('Video auto-play prevented:', e);
      });
    }
  }, [activeVideo?.blobUrl]);

  if (!activeVideo) return null;

  // Handle Backdrop Mode (Full container / screen behind GamerPlayerScreen)
  if (displayMode === 'backdrop') {
    return (
      <div
        className={`absolute inset-0 pointer-events-none overflow-hidden z-0 ${className}`}
        style={{ opacity: videoOpacity }}
      >
        <video
          ref={videoRef}
          src={activeVideo.blobUrl}
          autoPlay
          muted
          playsInline
          loop={!autoCycle}
          onEnded={() => {
            if (autoCycle) onNextVideo();
          }}
          className="w-full h-full object-cover"
        />
        {showScanlines && (
          <div className="absolute inset-0 crt-scanlines opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-transparent to-[#0a0a12]/80" />
      </div>
    );
  }

  // Handle Centerpiece Mode (Replaces album cover artwork)
  if (displayMode === 'centerpiece') {
    return (
      <div
        className={`relative w-full h-full rounded-xl overflow-hidden bg-black border-2 border-cyan-400/60 shadow-2xl ${className}`}
        style={{ opacity: videoOpacity }}
      >
        <video
          ref={videoRef}
          src={activeVideo.blobUrl}
          autoPlay
          muted
          playsInline
          loop={!autoCycle}
          onEnded={() => {
            if (autoCycle) onNextVideo();
          }}
          className="w-full h-full object-cover"
        />
        {showScanlines && (
          <div className="absolute inset-0 crt-scanlines opacity-50 pointer-events-none" />
        )}
      </div>
    );
  }

  // Handle Picture-in-Picture (PiP) Floating Monitor Mode
  if (displayMode === 'pip') {
    return (
      <div
        className={`fixed bottom-20 right-5 z-40 w-64 sm:w-80 rounded-xl overflow-hidden border border-cyan-500/60 shadow-2xl bg-[#090912] neon-glow-cyan transition-all ${className}`}
      >
        {/* PiP Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d0d18] border-b border-cyan-500/30 text-[10px] font-mono-cyber text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="truncate">{activeVideo.name}</span>
          </div>
          <div className="flex items-center gap-1">
            {autoCycle && (
              <RefreshCw className="w-2.5 h-2.5 text-pink-400 animate-spin mr-1" />
            )}
            {onClosePip && (
              <button
                onClick={onClosePip}
                className="text-slate-400 hover:text-white p-0.5"
                title="Close PiP"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Video Area */}
        <div className="relative aspect-video bg-black" style={{ opacity: videoOpacity }}>
          <video
            ref={videoRef}
            src={activeVideo.blobUrl}
            autoPlay
            muted
            playsInline
            loop={!autoCycle}
            onEnded={() => {
              if (autoCycle) onNextVideo();
            }}
            className="w-full h-full object-cover"
          />
          {showScanlines && (
            <div className="absolute inset-0 crt-scanlines opacity-50 pointer-events-none" />
          )}
        </div>
      </div>
    );
  }

  return null;
};
