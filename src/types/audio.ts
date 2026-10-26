export interface LyricLine {
  time: number; // in seconds
  text: string;
  romaji?: string;
  en?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  audioUrl: string; // Blob URL or synthesized buffer
  coverArt: string;
  genre: string;
  bpm?: number;
  year?: number;
  lyrics?: LyricLine[];
  isLocal: boolean;
  file?: File;
  addedAt: number;
  isFavorite?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverArt?: string;
  songIds: string[];
  createdAt: number;
}

export interface BackgroundVideo {
  id: string;
  name: string;
  blobUrl: string;
  duration?: number;
  size?: number;
  addedAt: number;
}

export type LibraryViewTab = 'pistas' | 'albumes' | 'generos' | 'carpetas' | 'favoritos';

export type VisualizerMode = 'bars' | 'circle' | 'wave' | 'matrix';

export type EQPreset =
  | 'Flat'
  | 'BassBoost'
  | 'AnimeVocal'
  | 'CyberSynth'
  | 'GamerEDM'
  | 'JRock'
  | 'LoFiChill'
  | 'Custom';

export type RepeatMode = 'off' | 'all' | 'one';

