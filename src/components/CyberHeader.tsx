import React from 'react';
import { FolderOpen, Smartphone } from 'lucide-react';
import { LiaMp3Logo } from './LiaMp3Logo';

interface CyberHeaderProps {
  currentView: 'library' | 'player';
  onNavigate: (view: 'library' | 'player') => void;
  onOpenEqualizer: () => void;
  onOpenSoundboard: () => void;
  onOpenPlaylists: () => void;
  onOpenImport: () => void;
  onOpenExportApk: () => void;
}

export const CyberHeader: React.FC<CyberHeaderProps> = ({
  currentView,
  onNavigate,
  onOpenEqualizer,
  onOpenSoundboard,
  onOpenPlaylists,
  onOpenImport,
  onOpenExportApk,
}) => {
  return (
    <header className="flex items-center justify-between gap-6 px-4 sm:px-6 py-2.5 border-b border-cyan-900/30 bg-[#090912]/90 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Brand Wordmark with Glowing Play Triangle */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('library');
        }}
        className="shrink-0 hover:opacity-90 transition-opacity"
      >
        <LiaMp3Logo size="md" />
      </a>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-cyber tracking-wider font-semibold text-slate-300">
        <button
          onClick={() => onNavigate('library')}
          className={`hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'library' ? 'text-cyan-400 underline underline-offset-4 font-bold' : ''
          }`}
        >
          Biblioteca
        </button>
        <button
          onClick={() => onNavigate('player')}
          className={`hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'player' ? 'text-cyan-400 underline underline-offset-4 font-bold' : ''
          }`}
        >
          Reproductor
        </button>
        <button
          onClick={onOpenEqualizer}
          className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
        >
          Ecualizador
        </button>
        <button
          onClick={onOpenSoundboard}
          className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
        >
          Sonidos
        </button>
        <button
          onClick={onOpenPlaylists}
          className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
        >
          Listas
        </button>
      </nav>

      {/* Zone 3: Action Buttons (APK Export & Scan) */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenExportApk}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-cyber font-bold tracking-wider text-pink-300 bg-pink-950/60 hover:bg-pink-900/60 border border-pink-500/50 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-md shadow-pink-500/20"
          title="Descargar APK o Instalar en Android"
        >
          <Smartphone className="w-3.5 h-3.5 text-pink-400" />
          <span>APK Android</span>
        </button>

        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-cyber font-bold tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-md shadow-cyan-400/20"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Escanear Música</span>
        </button>
      </div>
    </header>
  );
};
