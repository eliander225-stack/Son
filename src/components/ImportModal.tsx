import React, { useState, useRef } from 'react';
import { Upload, FolderPlus, FileAudio, X, CheckCircle, AlertCircle, HardDrive } from 'lucide-react';
import { importAudioFiles } from '../services/audioScanner';
import { Song } from '../types/audio';
import { audioEngine } from '../services/audioEngine';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (songs: Song[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setImportedCount(null);

    try {
      const songs = await importAudioFiles(fileList);
      setIsProcessing(false);
      setImportedCount(songs.length);
      audioEngine.playSFX('levelup');
      onImportComplete(songs);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error(err);
      setIsProcessing(false);
      setErrorMsg('Failed to process one or more audio files.');
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0d0d18] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl neon-glow-cyan">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wider text-slate-100 font-cyber">
                SYSTEM // SCAN LOCAL MUSIC DB
              </h2>
              <p className="text-xs text-cyan-400/80 font-mono-cyber">
                INDEXED STORAGE & ID3 METADATA PARSER
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

        {/* Dropzone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/30 neon-glow-cyan'
              : 'border-slate-700 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-slate-900/70'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={`w-12 h-12 mb-3 transition-transform ${isDragging ? 'scale-110 text-cyan-400' : 'text-slate-400'}`} />
          <h3 className="text-base font-bold text-slate-200 font-cyber tracking-wider mb-1">
            DRAG & DROP AUDIO FILES HERE
          </h3>
          <p className="text-xs text-slate-400 text-center font-mono-cyber max-w-sm mb-4">
            Supports MP3, WAV, FLAC, OGG, M4A, AAC. Extracts title, artist, album and artwork automatically.
          </p>

          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-cyber tracking-wider rounded-lg transition-colors shadow-md shadow-cyan-500/20"
            >
              <FileAudio className="w-4 h-4" />
              Select Files
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-cyber tracking-wider rounded-lg transition-colors border border-slate-700"
            >
              <FolderPlus className="w-4 h-4 text-cyan-400" />
              Scan Entire Folder
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {/* Folder input */}
          <input
            ref={folderInputRef}
            type="file"
            {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Status updates */}
        {isProcessing && (
          <div className="mt-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-3 text-cyan-300 font-mono-cyber text-xs">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>Scanning and indexing audio tracks into database...</span>
          </div>
        )}

        {importedCount !== null && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 font-mono-cyber text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Successfully imported {importedCount} track(s) into local library!</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-3 text-red-300 font-mono-cyber text-xs">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* IndexedDB privacy note */}
        <div className="mt-5 p-3 rounded-xl bg-[#090910] border border-slate-800 text-[11px] text-slate-400 font-mono-cyber flex items-start gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            Privacy guaranteed: Audio files are stored locally in your browser's IndexedDB storage and never uploaded to any remote server.
          </span>
        </div>
      </div>
    </div>
  );
};
