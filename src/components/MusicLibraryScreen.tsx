import React, { useState } from 'react';
import {
  Play,
  Pause,
  Music,
  FolderOpen,
  Search,
  Star,
  Trash2,
  HardDrive,
  Radio,
  Clock,
  Sparkles,
  Disc,
  Layers,
  Folder,
} from 'lucide-react';
import { Song, Playlist, LibraryViewTab } from '../types/audio';

interface MusicLibraryScreenProps {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  favorites: string[];
  playlists: Playlist[];
  activeTab?: LibraryViewTab;
  onTabChange?: (tab: LibraryViewTab) => void;
  onPlaySong: (song: Song, songList?: Song[]) => void;
  onTogglePlayPause: () => void;
  onToggleFavorite: (songId: string) => void;
  onDeleteLocalSong: (songId: string) => void;
  onOpenImport: () => void;
  onOpenGamerPlayer: () => void;
  onOpenEqualizer: () => void;
  onOpenPlaylistModal: () => void;
}

export const MusicLibraryScreen: React.FC<MusicLibraryScreenProps> = ({
  songs,
  currentSong,
  isPlaying,
  favorites,
  playlists,
  activeTab = 'pistas',
  onTabChange,
  onPlaySong,
  onTogglePlayPause,
  onToggleFavorite,
  onDeleteLocalSong,
  onOpenImport,
  onOpenGamerPlayer,
  onOpenEqualizer,
  onOpenPlaylistModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalTab, setInternalTab] = useState<LibraryViewTab>(activeTab);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  const currentTab = onTabChange ? activeTab : internalTab;
  const setTab = (tab: LibraryViewTab) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
    setSelectedGenre(null);
    setSelectedAlbum(null);
  };

  // Group songs by Album
  const albumsMap = songs.reduce((acc, song) => {
    const key = song.album || 'Sin Álbum';
    if (!acc[key]) {
      acc[key] = {
        name: key,
        artist: song.artist,
        coverArt: song.coverArt,
        songs: [],
      };
    }
    acc[key].songs.push(song);
    return acc;
  }, {} as Record<string, { name: string; artist: string; coverArt: string; songs: Song[] }>);

  // Group songs by Genre
  const genresMap = songs.reduce((acc, song) => {
    const key = song.genre || 'Otros';
    if (!acc[key]) {
      acc[key] = {
        name: key,
        songs: [],
      };
    }
    acc[key].songs.push(song);
    return acc;
  }, {} as Record<string, { name: string; songs: Song[] }>);

  // Filter songs based on search, tab, selected genre/album
  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.album.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.genre.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (currentTab === 'carpetas') return song.isLocal;
    if (currentTab === 'favoritos') return favorites.includes(song.id);
    if (selectedGenre) return song.genre === selectedGenre;
    if (selectedAlbum) return song.album === selectedAlbum;

    return true;
  });

  const totalDuration = songs.reduce((acc, curr) => acc + curr.duration, 0);
  const totalMinutes = Math.floor(totalDuration / 60);
  const localCount = songs.filter((s) => s.isLocal).length;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full">
      {/* Top Banner / System Status */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0d0d1c] via-[#121226] to-[#160d26] border border-cyan-500/30 p-4 sm:p-5 mb-5 shadow-lg">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-cyber font-bold tracking-widest text-cyan-400 uppercase">
                SYSTEM // BASE DE DATOS DE MÚSICA
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-[11px] font-mono-cyber text-pink-400">AUDIO ENGINE ACTIVO</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white font-cyber tracking-wider">
              EXPLORADOR DE PISTAS, ÁLBUMES Y GÉNEROS
            </h1>
            <p className="text-xs text-slate-400 font-mono-cyber">
              {songs.length} pistas cargadas · {Object.keys(albumsMap).length} álbumes · {Object.keys(genresMap).length} géneros
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenImport}
              className="flex items-center gap-2 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-cyber font-bold text-xs tracking-wider rounded-lg shadow-md shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Escanear Archivos / Carpetas
            </button>
            <button
              onClick={onOpenGamerPlayer}
              className="flex items-center gap-2 px-3.5 py-2 bg-pink-600/30 hover:bg-pink-600/40 border border-pink-500/50 text-pink-200 font-cyber font-bold text-xs tracking-wider rounded-lg transition-all hover:scale-105"
            >
              <Disc className="w-3.5 h-3.5 text-pink-400" />
              Ver Reproductor Gamer
            </button>
          </div>
        </div>
      </div>

      {/* Primary Category Selector Strip (Pistas, Álbumes, Géneros, Carpetas, Favoritos) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
        {/* Navigation Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0d0d18] border border-slate-800 rounded-xl overflow-x-auto shrink-0">
          <button
            onClick={() => setTab('pistas')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-cyber tracking-wider font-bold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'pistas'
                ? 'bg-cyan-500 text-black shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Pistas ({songs.length})</span>
          </button>

          <button
            onClick={() => setTab('albumes')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-cyber tracking-wider font-bold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'albumes'
                ? 'bg-cyan-500 text-black shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Álbumes ({Object.keys(albumsMap).length})</span>
          </button>

          <button
            onClick={() => setTab('generos')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-cyber tracking-wider font-bold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'generos'
                ? 'bg-cyan-500 text-black shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Géneros ({Object.keys(genresMap).length})</span>
          </button>

          <button
            onClick={() => setTab('carpetas')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-cyber tracking-wider font-bold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'carpetas'
                ? 'bg-cyan-500 text-black shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Carpetas / Local ({localCount})</span>
          </button>

          <button
            onClick={() => setTab('favoritos')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-cyber tracking-wider font-bold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'favoritos'
                ? 'bg-cyan-500 text-black shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span>Favoritos ({favorites.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar pistas, artistas, álbumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0d0d18] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono-cyber"
          />
        </div>
      </div>

      {/* ALBUMS VIEW */}
      {currentTab === 'albumes' && !selectedAlbum && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 mb-6">
          {Object.values(albumsMap).map((album) => (
            <div
              key={album.name}
              onClick={() => setSelectedAlbum(album.name)}
              className="group p-3 rounded-xl bg-[#0d0d18] border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all hover:scale-[1.02] shadow-md flex flex-col"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-black mb-2.5 border border-slate-800">
                {album.coverArt ? (
                  <img
                    src={album.coverArt}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-cyan-400">
                    <Disc className="w-10 h-10 opacity-60" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-8 h-8 text-cyan-400 fill-cyan-400 drop-shadow" />
                </div>
              </div>
              <h3 className="text-xs font-bold font-cyber text-slate-100 truncate group-hover:text-cyan-300">
                {album.name}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono-cyber truncate">
                {album.artist}
              </p>
              <span className="text-[10px] text-pink-400 font-mono-cyber mt-1">
                {album.songs.length} pistas
              </span>
            </div>
          ))}
        </div>
      )}

      {/* GENRES VIEW */}
      {currentTab === 'generos' && !selectedGenre && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          {Object.values(genresMap).map((genre) => (
            <div
              key={genre.name}
              onClick={() => setSelectedGenre(genre.name)}
              className="p-4 rounded-xl bg-gradient-to-br from-[#0e0e1a] to-[#141428] border border-cyan-500/20 hover:border-cyan-400/50 cursor-pointer transition-all hover:scale-[1.02] shadow-md flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-mono-cyber text-cyan-400 uppercase tracking-widest block">
                  GÉNERO
                </span>
                <h3 className="text-sm font-bold font-cyber text-slate-100 group-hover:text-cyan-300 truncate">
                  {genre.name}
                </h3>
                <span className="text-xs text-slate-400 font-mono-cyber">
                  {genre.songs.length} canciones
                </span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-slate-800 text-cyan-400 group-hover:text-cyan-300 group-hover:border-cyan-500/40">
                <Play className="w-4 h-4 fill-current" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Filter Pill if drilled down */}
      {(selectedAlbum || selectedGenre) && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono-cyber text-cyan-300">
          <span>Filtrando por: <strong>{selectedAlbum || selectedGenre}</strong></span>
          <button
            onClick={() => {
              setSelectedAlbum(null);
              setSelectedGenre(null);
            }}
            className="ml-auto underline text-slate-400 hover:text-white"
          >
            Quitar Filtro
          </button>
        </div>
      )}

      {/* Song List Table (always shown for pistas, carpetas, favoritos, and when drilling into album/genre) */}
      {(currentTab === 'pistas' || currentTab === 'carpetas' || currentTab === 'favoritos' || selectedAlbum || selectedGenre) && (
        <div className="flex-1 bg-[#0d0d18] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          {filteredSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center text-slate-500">
              <Radio className="w-10 h-10 text-cyan-400/50 mb-2" />
              <h3 className="text-sm font-bold text-slate-300 font-cyber tracking-wider">
                NO HAY PISTAS EN ESTA CARPETA / VISTA
              </h3>
              <p className="text-xs text-slate-400 max-w-sm font-mono-cyber mt-1 mb-3">
                {currentTab === 'carpetas'
                  ? 'No hay canciones locales escaneadas aún. ¡Haz clic en "Escanear Archivos" para cargar tu música!'
                  : 'Prueba cambiando de filtro o busca otro término.'}
              </p>
              {currentTab === 'carpetas' && (
                <button
                  onClick={onOpenImport}
                  className="px-3.5 py-1.5 bg-cyan-500 text-black text-xs font-bold font-cyber rounded-lg hover:bg-cyan-400 transition-colors"
                >
                  Escanear Archivos / Carpetas
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-mono-cyber text-slate-400 uppercase bg-[#090912]">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Título & Artista</th>
                    <th className="py-2.5 px-3 hidden md:table-cell">Álbum</th>
                    <th className="py-2.5 px-3 hidden sm:table-cell">Género</th>
                    <th className="py-2.5 px-3 text-right">Duración</th>
                    <th className="py-2.5 px-3 w-20 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredSongs.map((song, index) => {
                    const isCurrent = currentSong?.id === song.id;
                    const isFav = favorites.includes(song.id);

                    return (
                      <tr
                        key={song.id}
                        onClick={() => onPlaySong(song, filteredSongs)}
                        className={`cursor-pointer transition-colors group ${
                          isCurrent
                            ? 'bg-cyan-950/30 hover:bg-cyan-950/50'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          {isCurrent ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTogglePlayPause();
                              }}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              {isPlaying ? (
                                <Pause className="w-3.5 h-3.5 fill-cyan-400" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-cyan-400" />
                              )}
                            </button>
                          ) : (
                            <span className="font-mono-cyber text-slate-500 group-hover:hidden tabular-nums text-[11px]">
                              {(index + 1).toString().padStart(2, '0')}
                            </span>
                          )}
                          <Play className="w-3.5 h-3.5 text-cyan-400 hidden group-hover:block mx-auto" />
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-8 h-8 rounded overflow-hidden shrink-0 border border-slate-800 bg-slate-900">
                              {song.coverArt ? (
                                <img
                                  src={song.coverArt}
                                  alt={song.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-cyan-400">
                                  <Music className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p
                                className={`font-cyber font-bold tracking-wider text-xs truncate ${
                                  isCurrent ? 'text-cyan-300 neon-text-cyan' : 'text-slate-100 group-hover:text-cyan-300'
                                }`}
                              >
                                {song.title}
                              </p>
                              <p className="text-[10px] font-mono-cyber text-slate-400 truncate">
                                {song.artist}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-slate-400 hidden md:table-cell truncate max-w-xs font-mono-cyber text-[10px]">
                          {song.album}
                        </td>

                        <td className="py-2.5 px-3 text-slate-400 hidden sm:table-cell text-[10px] font-mono-cyber">
                          <span className="text-slate-300">{song.genre}</span>
                          {song.bpm && <span className="text-slate-500 ml-1.5">· {song.bpm} BPM</span>}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono-cyber text-slate-400 tabular-nums text-[11px]">
                          {formatDuration(song.duration)}
                        </td>

                        <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onToggleFavorite(song.id)}
                              className={`p-1 rounded transition-colors ${
                                isFav ? 'text-yellow-400' : 'text-slate-600 hover:text-slate-300'
                              }`}
                              title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-yellow-400' : ''}`} />
                            </button>

                            {song.isLocal && (
                              <button
                                onClick={() => onDeleteLocalSong(song.id)}
                                className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                                title="Eliminar pista local"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
