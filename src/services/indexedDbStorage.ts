import { Song, Playlist, BackgroundVideo } from '../types/audio';

const DB_NAME = 'CyberAnimeMusicDB';
const DB_VERSION = 2;
const STORE_SONGS = 'songs';
const STORE_PLAYLISTS = 'playlists';
const STORE_FAVORITES = 'favorites';
const STORE_VIDEOS = 'background_videos';

export class IndexedDbStorage {
  private db: IDBDatabase | null = null;

  public async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_SONGS)) {
          db.createObjectStore(STORE_SONGS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_PLAYLISTS)) {
          db.createObjectStore(STORE_PLAYLISTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
          db.createObjectStore(STORE_FAVORITES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_VIDEOS)) {
          db.createObjectStore(STORE_VIDEOS, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Save imported song with file blob data
  public async saveLocalSong(song: Song, fileBlob: Blob): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SONGS], 'readwrite');
      const store = tx.objectStore(STORE_SONGS);
      
      const record = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        genre: song.genre,
        year: song.year,
        bpm: song.bpm,
        coverArt: song.coverArt,
        isLocal: true,
        addedAt: song.addedAt || Date.now(),
        fileBlob: fileBlob,
      };

      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Load all local stored songs and reconstruct blob URLs
  public async loadAllLocalSongs(): Promise<Song[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SONGS], 'readonly');
      const store = tx.objectStore(STORE_SONGS);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result || [];
        const songs: Song[] = results.map(item => {
          const blobUrl = URL.createObjectURL(item.fileBlob);
          return {
            id: item.id,
            title: item.title,
            artist: item.artist,
            album: item.album,
            duration: item.duration || 180,
            audioUrl: blobUrl,
            coverArt: item.coverArt,
            genre: item.genre || 'Electronic',
            year: item.year,
            bpm: item.bpm,
            isLocal: true,
            addedAt: item.addedAt,
          };
        });
        resolve(songs);
      };

      req.onerror = () => reject(req.error);
    });
  }

  // Delete a local song
  public async deleteLocalSong(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_SONGS], 'readwrite');
      const store = tx.objectStore(STORE_SONGS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Save Playlists
  public async savePlaylist(playlist: Playlist): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_PLAYLISTS], 'readwrite');
      const store = tx.objectStore(STORE_PLAYLISTS);
      const req = store.put(playlist);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async loadPlaylists(): Promise<Playlist[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_PLAYLISTS], 'readonly');
      const store = tx.objectStore(STORE_PLAYLISTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async deletePlaylist(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_PLAYLISTS], 'readwrite');
      const store = tx.objectStore(STORE_PLAYLISTS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Toggle favorite
  public async toggleFavorite(songId: string): Promise<boolean> {
    const db = await this.getDb();
    const isFav = await this.isFavorite(songId);
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FAVORITES], 'readwrite');
      const store = tx.objectStore(STORE_FAVORITES);
      if (isFav) {
        const req = store.delete(songId);
        req.onsuccess = () => resolve(false);
        req.onerror = () => reject(req.error);
      } else {
        const req = store.put({ id: songId, addedAt: Date.now() });
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      }
    });
  }

  public async isFavorite(songId: string): Promise<boolean> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FAVORITES], 'readonly');
      const store = tx.objectStore(STORE_FAVORITES);
      const req = store.get(songId);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => reject(req.error);
    });
  }

  public async getAllFavorites(): Promise<string[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FAVORITES], 'readonly');
      const store = tx.objectStore(STORE_FAVORITES);
      const req = store.getAll();
      req.onsuccess = () => {
        const res = (req.result || []).map((item: { id: string }) => item.id);
        resolve(res);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Save Background Video
  public async saveBackgroundVideo(video: BackgroundVideo, fileBlob: Blob): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_VIDEOS], 'readwrite');
      const store = tx.objectStore(STORE_VIDEOS);
      const record = {
        id: video.id,
        name: video.name,
        duration: video.duration || 0,
        size: video.size || fileBlob.size,
        addedAt: video.addedAt || Date.now(),
        fileBlob: fileBlob,
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Load all background videos and re-create Blob URLs
  public async loadAllBackgroundVideos(): Promise<BackgroundVideo[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_VIDEOS], 'readonly');
      const store = tx.objectStore(STORE_VIDEOS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result || [];
        const videos: BackgroundVideo[] = results.map(item => {
          const url = URL.createObjectURL(item.fileBlob);
          return {
            id: item.id,
            name: item.name,
            duration: item.duration,
            size: item.size,
            addedAt: item.addedAt,
            blobUrl: url,
          };
        });
        resolve(videos);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Delete Background Video
  public async deleteBackgroundVideo(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_VIDEOS], 'readwrite');
      const store = tx.objectStore(STORE_VIDEOS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const dbStorage = new IndexedDbStorage();
