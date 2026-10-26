import { Song } from '../types/audio';
import { dbStorage } from './indexedDbStorage';

// Quick client-side ID3v2 parser for Title, Artist, Album, and Cover Art
export async function parseAudioMetadata(file: File): Promise<{
  title: string;
  artist: string;
  album: string;
  year?: number;
  genre?: string;
  coverArt?: string;
  duration: number;
}> {
  // First, get duration via temporary audio object
  const duration = await getAudioDuration(file);

  // Default fallbacks from filename
  const cleanName = file.name.replace(/\.[^/.]+$/, '');
  let detectedTitle = cleanName;
  let detectedArtist = 'Unknown Artist';
  let detectedAlbum = 'Local Imports';

  if (cleanName.includes(' - ')) {
    const parts = cleanName.split(' - ');
    detectedArtist = parts[0].trim();
    detectedTitle = parts.slice(1).join(' - ').trim();
  } else if (cleanName.includes('_')) {
    const parts = cleanName.split('_');
    if (parts.length > 1) {
      detectedArtist = parts[0].trim();
      detectedTitle = parts.slice(1).join(' ').trim();
    }
  }

  // Attempt ID3v2 read on first 256KB of file
  try {
    const slice = file.slice(0, 256 * 1024);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check "ID3" magic bytes
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const parsed = extractBasicId3(bytes);
      if (parsed.title) detectedTitle = parsed.title;
      if (parsed.artist) detectedArtist = parsed.artist;
      if (parsed.album) detectedAlbum = parsed.album;
      if (parsed.coverUrl) {
        return {
          title: detectedTitle,
          artist: detectedArtist,
          album: detectedAlbum,
          duration,
          coverArt: parsed.coverUrl,
        };
      }
    }
  } catch (err) {
    console.warn('ID3 parsing skipped:', err);
  }

  return {
    title: detectedTitle,
    artist: detectedArtist,
    album: detectedAlbum,
    duration,
  };
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const tempAudio = new Audio();
    tempAudio.preload = 'metadata';

    const onMeta = () => {
      cleanup();
      resolve(tempAudio.duration || 180);
    };

    const onError = () => {
      cleanup();
      resolve(180); // fallback 3 minutes
    };

    const cleanup = () => {
      tempAudio.removeEventListener('loadedmetadata', onMeta);
      tempAudio.removeEventListener('error', onError);
      URL.revokeObjectURL(url);
    };

    tempAudio.addEventListener('loadedmetadata', onMeta);
    tempAudio.addEventListener('error', onError);
    tempAudio.src = url;
  });
}

// Basic ID3 frame extractor
function extractBasicId3(bytes: Uint8Array): {
  title?: string;
  artist?: string;
  album?: string;
  coverUrl?: string;
} {
  const result: { title?: string; artist?: string; album?: string; coverUrl?: string } = {};
  const decoder = new TextDecoder('utf-8');

  // Helper to scan for 4-letter frame IDs
  const str = String.fromCharCode.apply(null, Array.from(bytes.slice(0, 8000)));

  const parseFrameText = (frameId: string): string | undefined => {
    const idx = str.indexOf(frameId);
    if (idx === -1) return undefined;
    const len = (bytes[idx + 4] << 24) | (bytes[idx + 5] << 16) | (bytes[idx + 6] << 8) | bytes[idx + 7];
    if (len > 0 && len < 500 && idx + 10 + len <= bytes.length) {
      const raw = bytes.slice(idx + 11, idx + 10 + len);
      return decoder.decode(raw).replace(/\0/g, '').trim();
    }
    return undefined;
  };

  const title = parseFrameText('TIT2');
  const artist = parseFrameText('TPE1');
  const album = parseFrameText('TALB');

  if (title) result.title = title;
  if (artist) result.artist = artist;
  if (album) result.album = album;

  return result;
}

// Process imported files and save to DB
export async function importAudioFiles(files: FileList | File[]): Promise<Song[]> {
  const importedSongs: Song[] = [];
  const fileArray = Array.from(files);

  for (const file of fileArray) {
    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name)) {
      continue;
    }

    try {
      const meta = await parseAudioMetadata(file);
      const songId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const blobUrl = URL.createObjectURL(file);

      const newSong: Song = {
        id: songId,
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        duration: meta.duration,
        audioUrl: blobUrl,
        coverArt: meta.coverArt || '',
        genre: 'Local Audio',
        isLocal: true,
        addedAt: Date.now(),
        file: file,
      };

      await dbStorage.saveLocalSong(newSong, file);
      importedSongs.push(newSong);
    } catch (err) {
      console.error('Failed to import audio file:', file.name, err);
    }
  }

  return importedSongs;
}
