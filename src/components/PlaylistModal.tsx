import React, { useState } from 'react';
import { ListMusic, Plus, Trash2, X, Music, Check } from 'lucide-react';
import { Playlist, Song } from '../types/audio';
import { dbStorage } from '../services/indexedDbStorage';
import { audioEngine } from '../services/audioEngine';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  allSongs: Song[];
  onPlaylistsChange: (playlists: Playlist[]) => void;
  onSelectPlaylistSong: (song: Song) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  playlists,
  allSongs,
  onPlaylistsChange,
  onSelectPlaylistSong,
}) => {
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(
    playlists[0]?.id || null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAddingTracks, setIsAddingTracks] = useState(false);

  if (!isOpen) return null;

  const currentPlaylist = playlists.find((p) => p.id === activePlaylistId) || playlists[0];

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}`,
      name: newTitle.trim(),
      description: newDesc.trim() || 'Custom Cyber Anime Playlist',
      songIds: [],
      createdAt: Date.now(),
    };

    await dbStorage.savePlaylist(newPlaylist);
    const updated = [...playlists, newPlaylist];
    onPlaylistsChange(updated);
    setActivePlaylistId(newPlaylist.id);
    setIsCreating(false);
    setNewTitle('');
    setNewDesc('');
    audioEngine.playSFX('cyberding');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dbStorage.deletePlaylist(id);
    const updated = playlists.filter((p) => p.id !== id);
    onPlaylistsChange(updated);
    if (activePlaylistId === id) {
      setActivePlaylistId(updated[0]?.id || null);
    }
  };

  const toggleSongInPlaylist = async (songId: string) => {
    if (!currentPlaylist) return;
    const exists = currentPlaylist.songIds.includes(songId);
    let updatedSongIds = [];
    if (exists) {
      updatedSongIds = currentPlaylist.songIds.filter((id) => id !== songId);
    } else {
      updatedSongIds = [...currentPlaylist.songIds, songId];
    }

    const updatedPl: Playlist = {
      ...currentPlaylist,
      songIds: updatedSongIds,
    };

    await dbStorage.savePlaylist(updatedPl);
    const nextList = playlists.map((p) => (p.id === currentPlaylist.id ? updatedPl : p));
    onPlaylistsChange(nextList);
    audioEngine.playSFX('coin');
  };

  const playlistSongs = currentPlaylist
    ? allSongs.filter((s) => currentPlaylist.songIds.includes(s.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#0d0d18] border border-cyan-500/40 rounded-2xl shadow-2xl neon-glow-cyan overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wider text-slate-100 font-cyber">
                PLAYLIST MATRIX // CUSTOM COLLECTIONS
              </h2>
              <p className="text-xs text-cyan-400/80 font-mono-cyber">
                {playlists.length} PLAYLISTS SAVED IN INDEXED DB
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

        {/* Content Body: Sidebar list + Playlist Details */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Playlist List */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 p-4 overflow-y-auto shrink-0 bg-[#090910]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 font-mono-cyber uppercase">
                Playlists
              </span>
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            </div>

            {isCreating && (
              <div className="p-3 mb-3 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-2">
                <input
                  type="text"
                  placeholder="Playlist Name"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="px-3 py-1 bg-cyan-500 text-black text-[11px] font-bold rounded hover:bg-cyan-400"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {playlists.map((pl) => {
                const isActive = pl.id === currentPlaylist?.id;
                return (
                  <div
                    key={pl.id}
                    onClick={() => {
                      setActivePlaylistId(pl.id);
                      setIsAddingTracks(false);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                      isActive
                        ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs truncate font-cyber tracking-wider">{pl.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono-cyber">
                        {pl.songIds.length} tracks
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(pl.id, e)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded opacity-60 hover:opacity-100"
                      title="Delete Playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Playlist Content */}
          <div className="flex-1 p-5 overflow-y-auto">
            {currentPlaylist ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-xl font-bold font-cyber text-slate-100 tracking-wider">
                      {currentPlaylist.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono-cyber mt-0.5">
                      {currentPlaylist.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingTracks(!isAddingTracks)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-cyber tracking-wider rounded-lg transition-all ${
                      isAddingTracks
                        ? 'bg-pink-500 text-white'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                    }`}
                  >
                    {isAddingTracks ? 'Done Selecting' : '+ Add / Remove Tracks'}
                  </button>
                </div>

                {isAddingTracks ? (
                  <div>
                    <p className="text-xs text-slate-400 font-mono-cyber mb-3">
                      Select tracks to include in this playlist:
                    </p>
                    <div className="space-y-1.5 max-h-96 overflow-y-auto">
                      {allSongs.map((song) => {
                        const included = currentPlaylist.songIds.includes(song.id);
                        return (
                          <div
                            key={song.id}
                            onClick={() => toggleSongInPlaylist(song.id)}
                            className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition-all ${
                              included
                                ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  included
                                    ? 'bg-cyan-500 border-cyan-400 text-black'
                                    : 'border-slate-700'
                                }`}
                              >
                                {included && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <div className="truncate">
                                <span className="text-xs font-semibold text-slate-200 block truncate">
                                  {song.title}
                                </span>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {song.artist}
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] font-mono-cyber text-slate-500 shrink-0">
                              {Math.floor(song.duration / 60)}:
                              {Math.floor(song.duration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    {playlistSongs.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <Music className="w-10 h-10 mx-auto mb-2 opacity-30 text-cyan-400" />
                        <p className="text-sm font-cyber tracking-wider">
                          THIS PLAYLIST IS CURRENTLY EMPTY
                        </p>
                        <button
                          onClick={() => setIsAddingTracks(true)}
                          className="mt-3 px-4 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-cyber tracking-wider hover:bg-cyan-500/30"
                        >
                          Add Tracks Now
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {playlistSongs.map((song, idx) => (
                          <div
                            key={song.id}
                            onClick={() => {
                              onSelectPlaylistSong(song);
                              onClose();
                            }}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 hover:bg-cyan-950/40 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer group transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-mono-cyber text-slate-500 w-5 text-right">
                                {(idx + 1).toString().padStart(2, '0')}
                              </span>
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                                  {song.title}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {song.artist}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-[11px] font-mono-cyber text-slate-400">
                                {Math.floor(song.duration / 60)}:
                                {Math.floor(song.duration % 60).toString().padStart(2, '0')}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSongInPlaylist(song.id);
                                }}
                                className="text-slate-600 hover:text-red-400 p-1"
                                title="Remove from playlist"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p>Select or create a playlist to view tracks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
