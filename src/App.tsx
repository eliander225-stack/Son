import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Song, Playlist, RepeatMode, BackgroundVideo, LibraryViewTab } from './types/audio';
import { DEFAULT_TRACKS } from './data/defaultTracks';
import { audioEngine } from './services/audioEngine';
import {
  audioBufferToWavBlob,
  generateNeoTokyoTrack,
  generateMechaStrikeTrack,
  generateMidnightLofiTrack,
} from './services/cyberAudioSynth';
import { dbStorage } from './services/indexedDbStorage';
import { CyberHeader } from './components/CyberHeader';
import { MusicLibraryScreen } from './components/MusicLibraryScreen';
import { GamerPlayerScreen } from './components/GamerPlayerScreen';
import { BottomPlayerBar } from './components/BottomPlayerBar';
import { EqualizerModal } from './components/EqualizerModal';
import { SoundboardModal } from './components/SoundboardModal';
import { LyricsModal } from './components/LyricsModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { PlaylistModal } from './components/PlaylistModal';
import { ImportModal } from './components/ImportModal';
import { VideoSelectorModal } from './components/VideoSelectorModal';
import { ExportApkModal } from './components/ExportApkModal';

export default function App() {
  const [songs, setSongs] = useState<Song[]>(DEFAULT_TRACKS);
  const [currentSong, setCurrentSong] = useState<Song | null>(DEFAULT_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(60);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');

  const [isNightcore, setIsNightcore] = useState<boolean>(false);
  const [isSlowedReverb, setIsSlowedReverb] = useState<boolean>(false);
  const [isSpatial3D, setIsSpatial3D] = useState<boolean>(false);

  const [favorites, setFavorites] = useState<string[]>(['track_neotokyo_01', 'track_lofi_03']);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentView, setCurrentView] = useState<'library' | 'player'>('library');
  const [libraryTab, setLibraryTab] = useState<LibraryViewTab>('pistas');

  // Phone / Device Videos (up to 10 videos playing without audio)
  const [backgroundVideos, setBackgroundVideos] = useState<BackgroundVideo[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [videoDisplayMode, setVideoDisplayMode] = useState<'backdrop' | 'centerpiece' | 'pip'>('backdrop');
  const [videoOpacity, setVideoOpacity] = useState<number>(0.4);
  const [autoCycleVideos, setAutoCycleVideos] = useState<boolean>(true);
  const [videoScanlines, setVideoScanlines] = useState<boolean>(true);
  const [isVideoSelectorOpen, setIsVideoSelectorOpen] = useState<boolean>(false);

  // Modals
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportApkOpen, setIsExportApkOpen] = useState(false);

  // Sleep Timer countdown
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);

  // Audio queue
  const currentQueueRef = useRef<Song[]>(DEFAULT_TRACKS);

  // Initialize synthesized audio URL cache for default tracks
  const synthUrlsRef = useRef<Record<string, string>>({});

  const getAudioUrlForSong = useCallback((song: Song): string => {
    if (song.audioUrl) return song.audioUrl;
    if (synthUrlsRef.current[song.id]) return synthUrlsRef.current[song.id];

    const ctx = audioEngine.getAudioContext();
    if (!ctx) return '';

    let buffer: AudioBuffer;
    if (song.id === 'track_neotokyo_01') {
      buffer = generateNeoTokyoTrack(ctx);
    } else if (song.id === 'track_mecha_02') {
      buffer = generateMechaStrikeTrack(ctx);
    } else {
      buffer = generateMidnightLofiTrack(ctx);
    }

    const wavBlob = audioBufferToWavBlob(buffer);
    const url = URL.createObjectURL(wavBlob);
    synthUrlsRef.current[song.id] = url;
    song.audioUrl = url;
    return url;
  }, []);

  // Load stored DB songs, playlists, favorites, and 10 phone videos on mount
  useEffect(() => {
    const initDb = async () => {
      try {
        const localSongs = await dbStorage.loadAllLocalSongs();
        const storedPlaylists = await dbStorage.loadPlaylists();
        const storedFavs = await dbStorage.getAllFavorites();
        const storedVideos = await dbStorage.loadAllBackgroundVideos();

        if (storedFavs.length > 0) {
          setFavorites(storedFavs);
        }

        if (storedVideos.length > 0) {
          setBackgroundVideos(storedVideos);
          setActiveVideoId(storedVideos[0].id);
        }

        if (storedPlaylists.length > 0) {
          setPlaylists(storedPlaylists);
        } else {
          const defaultPl: Playlist = {
            id: 'pl_cyber_favorites',
            name: 'Cyberpunk Battle & Overdrive',
            description: 'High energy anime combat and night city driving tracks',
            songIds: ['track_neotokyo_01', 'track_mecha_02'],
            createdAt: Date.now(),
          };
          await dbStorage.savePlaylist(defaultPl);
          setPlaylists([defaultPl]);
        }

        const mergedSongs = [...DEFAULT_TRACKS, ...localSongs];
        setSongs(mergedSongs);
        currentQueueRef.current = mergedSongs;
      } catch (err) {
        console.warn('IndexedDB initial load error:', err);
      }
    };

    initDb();
  }, []);

  // Hook audioEngine events
  useEffect(() => {
    audioEngine.onTimeUpdate = (curr, dur) => {
      setCurrentTime(curr);
      if (dur > 0) setDuration(dur);
    };

    audioEngine.onPlayStateChange = (playing) => {
      setIsPlaying(playing);
    };

    audioEngine.onEnded = () => {
      handleNextTrack();
    };
  }, [repeatMode, isShuffle, currentSong, songs]);

  // Video cycle handlers
  const handleNextVideo = useCallback(() => {
    if (backgroundVideos.length <= 1) return;
    const currentIndex = backgroundVideos.findIndex((v) => v.id === activeVideoId);
    const nextIndex = (currentIndex + 1) % backgroundVideos.length;
    setActiveVideoId(backgroundVideos[nextIndex].id);
  }, [backgroundVideos, activeVideoId]);

  const handlePrevVideo = useCallback(() => {
    if (backgroundVideos.length <= 1) return;
    const currentIndex = backgroundVideos.findIndex((v) => v.id === activeVideoId);
    const prevIndex = (currentIndex - 1 + backgroundVideos.length) % backgroundVideos.length;
    setActiveVideoId(backgroundVideos[prevIndex].id);
  }, [backgroundVideos, activeVideoId]);

  // Handle Play Song
  const playSong = async (song: Song, songList?: Song[]) => {
    if (songList) {
      currentQueueRef.current = songList;
    }
    setCurrentSong(song);

    const url = getAudioUrlForSong(song);
    await audioEngine.loadAndPlay(url, 0);

    // Auto-advance background video on new song
    if (autoCycleVideos && backgroundVideos.length > 1) {
      handleNextVideo();
    }
  };

  // Toggle Play/Pause
  const togglePlayPause = async () => {
    if (!currentSong) {
      if (songs.length > 0) {
        await playSong(songs[0]);
      }
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
    } else {
      if (!currentSong.audioUrl && !synthUrlsRef.current[currentSong.id]) {
        const url = getAudioUrlForSong(currentSong);
        await audioEngine.loadAndPlay(url, currentTime);
      } else {
        await audioEngine.play();
      }
    }
  };

  // Next Track
  const handleNextTrack = useCallback(async () => {
    const queue = currentQueueRef.current;
    if (queue.length === 0 || !currentSong) return;

    if (repeatMode === 'one') {
      audioEngine.seek(0);
      await audioEngine.play();
      return;
    }

    let nextIndex = 0;
    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      if (currentIndex === -1) {
        nextIndex = 0;
      } else if (currentIndex < queue.length - 1) {
        nextIndex = currentIndex + 1;
      } else {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          audioEngine.pause();
          return;
        }
      }
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      await playSong(nextSong);
    }
  }, [currentSong, isShuffle, repeatMode, getAudioUrlForSong]);

  // Previous Track
  const handlePrevTrack = async () => {
    const queue = currentQueueRef.current;
    if (queue.length === 0 || !currentSong) return;

    if (currentTime > 3) {
      audioEngine.seek(0);
      return;
    }

    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    const prevSong = queue[prevIndex];
    if (prevSong) {
      await playSong(prevSong);
    }
  };

  // Seek
  const handleSeek = (seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
  };

  // Volume
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setIsMuted(false);
    audioEngine.setVolume(vol);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  // Shuffle & Repeat
  const handleToggleShuffle = () => {
    setIsShuffle(!isShuffle);
    audioEngine.playSFX('cyberding');
  };

  const handleToggleRepeat = () => {
    const nextMode: RepeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    setRepeatMode(nextMode);
    audioEngine.playSFX('cyberding');
  };

  // FX Toggles
  const handleToggleNightcore = () => {
    const state = audioEngine.toggleNightcore();
    setIsNightcore(state);
    if (state) {
      setIsSlowedReverb(false);
      audioEngine.playSFX('levelup');
    }
  };

  const handleToggleSlowedReverb = () => {
    const state = audioEngine.toggleSlowedReverb();
    setIsSlowedReverb(state);
    if (state) {
      setIsNightcore(false);
      audioEngine.playSFX('coin');
    }
  };

  const handleToggleSpatial3D = () => {
    const state = audioEngine.toggleSpatial3D();
    setIsSpatial3D(state);
    audioEngine.playSFX('cyberding');
  };

  // Favorites
  const handleToggleFavorite = async (songId?: string) => {
    const targetId = songId || currentSong?.id;
    if (!targetId) return;

    const isFav = await dbStorage.toggleFavorite(targetId);
    if (isFav) {
      setFavorites([...favorites, targetId]);
      audioEngine.playSFX('coin');
    } else {
      setFavorites(favorites.filter((id) => id !== targetId));
    }
  };

  // Delete Local Song
  const handleDeleteLocalSong = async (id: string) => {
    await dbStorage.deleteLocalSong(id);
    const updated = songs.filter((s) => s.id !== id);
    setSongs(updated);
    currentQueueRef.current = updated;
    if (currentSong?.id === id) {
      audioEngine.pause();
      setCurrentSong(updated[0] || null);
    }
  };

  // Import complete handler
  const handleImportComplete = (newSongs: Song[]) => {
    const combined = [...songs, ...newSongs];
    setSongs(combined);
    currentQueueRef.current = combined;
  };

  // Sleep Timer Countdown effect
  useEffect(() => {
    if (sleepTimerSeconds === null) return;

    const interval = setInterval(() => {
      setSleepTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          audioEngine.fadeOutAndStop();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerSeconds]);

  const isCurrentFav = !!(currentSong && favorites.includes(currentSong.id));

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a12] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* 3-Zone Top Bar */}
      <CyberHeader
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenSoundboard={() => setIsSoundboardOpen(true)}
        onOpenPlaylists={() => setIsPlaylistOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenExportApk={() => setIsExportApkOpen(true)}
      />

      {/* Main View Area (no padding bottom in player mode so it fits 100% in viewport) */}
      <main className={`flex-1 flex flex-col ${currentView === 'library' ? 'pb-24' : 'overflow-hidden'}`}>
        {currentView === 'library' ? (
          <MusicLibraryScreen
            songs={songs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            favorites={favorites}
            playlists={playlists}
            activeTab={libraryTab}
            onTabChange={(tab) => setLibraryTab(tab)}
            onPlaySong={(song, list) => playSong(song, list)}
            onTogglePlayPause={togglePlayPause}
            onToggleFavorite={(id) => handleToggleFavorite(id)}
            onDeleteLocalSong={handleDeleteLocalSong}
            onOpenImport={() => setIsImportOpen(true)}
            onOpenGamerPlayer={() => setCurrentView('player')}
            onOpenEqualizer={() => setIsEqualizerOpen(true)}
            onOpenPlaylistModal={() => setIsPlaylistOpen(true)}
          />
        ) : (
          <GamerPlayerScreen
            currentSong={currentSong}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            isShuffle={isShuffle}
            repeatMode={repeatMode}
            isNightcore={isNightcore}
            isSlowedReverb={isSlowedReverb}
            isSpatial3D={isSpatial3D}
            isFavorite={isCurrentFav}
            backgroundVideos={backgroundVideos}
            activeVideoId={activeVideoId}
            autoCycleVideos={autoCycleVideos}
            onOpenVideoSelector={() => setIsVideoSelectorOpen(true)}
            onNextVideo={handleNextVideo}
            onPrevVideo={handlePrevVideo}
            onSelectVideo={(id) => setActiveVideoId(id)}
            onTogglePlayPause={togglePlayPause}
            onNext={handleNextTrack}
            onPrev={handlePrevTrack}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
            onToggleShuffle={handleToggleShuffle}
            onToggleRepeat={handleToggleRepeat}
            onToggleNightcore={handleToggleNightcore}
            onToggleSlowedReverb={handleToggleSlowedReverb}
            onToggleSpatial3D={handleToggleSpatial3D}
            onToggleFavorite={() => handleToggleFavorite()}
            onBackToLibrary={() => setCurrentView('library')}
            onNavigateToCategory={(cat) => {
              setLibraryTab(cat);
              setCurrentView('library');
            }}
            onOpenEqualizer={() => setIsEqualizerOpen(true)}
            onOpenSoundboard={() => setIsSoundboardOpen(true)}
            onOpenLyrics={() => setIsLyricsOpen(true)}
            onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
            onOpenPlaylists={() => setIsPlaylistOpen(true)}
          />
        )}
      </main>

      {/* Persistent Bottom Mini Player (visible when in Library view) */}
      {currentView === 'library' && (
        <BottomPlayerBar
          currentSong={currentSong}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          onTogglePlayPause={togglePlayPause}
          onNext={handleNextTrack}
          onPrev={handlePrevTrack}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onOpenGamerPlayer={() => setCurrentView('player')}
          onNavigateToCategory={(cat) => {
            setLibraryTab(cat);
            setCurrentView('library');
          }}
        />
      )}

      {/* Video Selector Modal (10 Phone / Device Videos Sync) */}
      <VideoSelectorModal
        isOpen={isVideoSelectorOpen}
        onClose={() => setIsVideoSelectorOpen(false)}
        videos={backgroundVideos}
        activeVideoId={activeVideoId}
        onSelectVideo={(id) => setActiveVideoId(id)}
        onVideosChange={(vids) => setBackgroundVideos(vids)}
        displayMode={videoDisplayMode}
        onChangeDisplayMode={(mode) => setVideoDisplayMode(mode)}
        videoOpacity={videoOpacity}
        onChangeOpacity={(op) => setVideoOpacity(op)}
        autoCycle={autoCycleVideos}
        onToggleAutoCycle={() => setAutoCycleVideos(!autoCycleVideos)}
        showScanlines={videoScanlines}
        onToggleScanlines={() => setVideoScanlines(!videoScanlines)}
      />

      {/* Tool Modals */}
      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
      />

      <SoundboardModal
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
      />

      <LyricsModal
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        song={currentSong}
        currentTime={currentTime}
      />

      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        activeTimerSeconds={sleepTimerSeconds}
        onSetTimer={(secs) => setSleepTimerSeconds(secs)}
      />

      <PlaylistModal
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        playlists={playlists}
        allSongs={songs}
        onPlaylistsChange={(nextPl) => setPlaylists(nextPl)}
        onSelectPlaylistSong={(song) => playSong(song)}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={handleImportComplete}
      />

      <ExportApkModal
        isOpen={isExportApkOpen}
        onClose={() => setIsExportApkOpen(false)}
      />
    </div>
  );
}
