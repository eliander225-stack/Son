import { EQPreset } from '../types/audio';
import { playGamerSound } from './cyberAudioSynth';

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: Record<EQPreset, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  BassBoost: [7, 6, 4, 2, 0, 0, 0, 1, 2, 3],
  AnimeVocal: [-2, -1, 0, 2, 5, 6, 5, 3, 2, 1],
  CyberSynth: [5, 4, 2, -1, -2, 2, 4, 6, 7, 6],
  GamerEDM: [6, 5, 2, 0, -1, 1, 3, 5, 7, 8],
  JRock: [3, 2, 1, 0, 2, 4, 5, 6, 4, 3],
  LoFiChill: [4, 5, 3, 1, 0, -2, -3, -4, -6, -8],
  Custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private panner: StereoPannerNode | null = null;

  // Reverb simulation nodes
  private reverbDelay: DelayNode | null = null;
  private reverbFeedback: GainNode | null = null;
  private reverbWetGain: GainNode | null = null;

  // Nightcore & Slowed State
  private isNightcore = false;
  private isSlowedReverb = false;
  private isSpatial3D = false;
  private spatialAngle = 0;
  private spatialInterval: number | null = null;

  private currentPreset: EQPreset = 'Flat';
  private eqGains: number[] = [...EQ_PRESETS.Flat];

  public onTimeUpdate?: (currentTime: number, duration: number) => void;
  public onEnded?: () => void;
  public onPlayStateChange?: (isPlaying: boolean) => void;

  constructor() {
    // Lazy initialize on first interaction
  }

  public init() {
    if (this.ctx && this.audioEl) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.audioEl = new Audio();
    this.audioEl.crossOrigin = 'anonymous';
    this.audioEl.preload = 'auto';

    // Hook events
    this.audioEl.addEventListener('timeupdate', () => {
      if (this.audioEl && this.onTimeUpdate) {
        this.onTimeUpdate(this.audioEl.currentTime, this.audioEl.duration || 0);
      }
    });

    this.audioEl.addEventListener('ended', () => {
      if (this.onEnded) this.onEnded();
    });

    this.audioEl.addEventListener('play', () => {
      if (this.onPlayStateChange) this.onPlayStateChange(true);
    });

    this.audioEl.addEventListener('pause', () => {
      if (this.onPlayStateChange) this.onPlayStateChange(false);
    });

    // Create Audio Nodes
    this.sourceNode = this.ctx.createMediaElementSource(this.audioEl);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.82;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;

    // Create Stereo Panner (for spatial audio / 8D effect)
    if (this.ctx.createStereoPanner) {
      this.panner = this.ctx.createStereoPanner();
      this.panner.pan.value = 0;
    }

    // Build 10-Band EQ filters
    this.eqFilters = EQ_FREQUENCIES.map((freq, index) => {
      const filter = this.ctx!.createBiquadFilter();
      if (index === 0) {
        filter.type = 'lowshelf';
      } else if (index === EQ_FREQUENCIES.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.value = 1.4;
      }
      filter.frequency.value = freq;
      filter.gain.value = 0;
      return filter;
    });

    // Build Reverb Delay Chain for Slowed + Reverb
    this.reverbDelay = this.ctx.createDelay();
    this.reverbDelay.delayTime.value = 0.28;

    this.reverbFeedback = this.ctx.createGain();
    this.reverbFeedback.gain.value = 0.45;

    this.reverbWetGain = this.ctx.createGain();
    this.reverbWetGain.gain.value = 0; // dry initially

    this.reverbDelay.connect(this.reverbFeedback);
    this.reverbFeedback.connect(this.reverbDelay);
    this.reverbDelay.connect(this.reverbWetGain);

    // Chain audio graph:
    // source -> EQ[0] -> ... -> EQ[9] -> [Dry + Wet Reverb] -> Panner -> Analyser -> MasterGain -> Destination
    let prevNode: AudioNode = this.sourceNode;
    for (const filter of this.eqFilters) {
      prevNode.connect(filter);
      prevNode = filter;
    }

    const lastFilter = prevNode;

    // Connect Reverb loop
    lastFilter.connect(this.reverbDelay);

    // Merge into panner
    const bus = this.panner || this.analyser;
    lastFilter.connect(bus);
    this.reverbWetGain.connect(bus);

    if (this.panner) {
      this.panner.connect(this.analyser);
    }

    this.analyser.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  public async loadAndPlay(url: string, startTime = 0): Promise<void> {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (!this.audioEl) return;

    this.audioEl.src = url;
    this.audioEl.currentTime = startTime;
    this.applyEffects();

    try {
      await this.audioEl.play();
    } catch (e) {
      console.warn('Auto-play blocked or audio load error:', e);
    }
  }

  public async play(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    if (this.audioEl) {
      await this.audioEl.play();
    }
  }

  public pause(): void {
    if (this.audioEl) {
      this.audioEl.pause();
    }
  }

  public seek(seconds: number): void {
    if (this.audioEl) {
      this.audioEl.currentTime = seconds;
    }
  }

  public setVolume(volume: number): void {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
  }

  public setPlaybackRate(rate: number): void {
    if (this.audioEl) {
      this.audioEl.playbackRate = Math.max(0.5, Math.min(2.5, rate));
    }
  }

  public toggleNightcore(): boolean {
    this.isNightcore = !this.isNightcore;
    if (this.isNightcore) {
      this.isSlowedReverb = false; // mutually exclusive
    }
    this.applyEffects();
    return this.isNightcore;
  }

  public toggleSlowedReverb(): boolean {
    this.isSlowedReverb = !this.isSlowedReverb;
    if (this.isSlowedReverb) {
      this.isNightcore = false; // mutually exclusive
    }
    this.applyEffects();
    return this.isSlowedReverb;
  }

  public toggleSpatial3D(): boolean {
    this.isSpatial3D = !this.isSpatial3D;
    if (this.isSpatial3D) {
      this.startSpatialOscillation();
    } else {
      this.stopSpatialOscillation();
    }
    return this.isSpatial3D;
  }

  private startSpatialOscillation() {
    if (this.spatialInterval) clearInterval(this.spatialInterval);
    this.spatialInterval = window.setInterval(() => {
      if (!this.panner || !this.isSpatial3D) return;
      this.spatialAngle += 0.04;
      const panVal = Math.sin(this.spatialAngle) * 0.85; // smooth 8D panning
      this.panner.pan.value = panVal;
    }, 50);
  }

  private stopSpatialOscillation() {
    if (this.spatialInterval) {
      clearInterval(this.spatialInterval);
      this.spatialInterval = null;
    }
    if (this.panner) {
      this.panner.pan.value = 0;
    }
  }

  private applyEffects() {
    if (!this.audioEl) return;

    if (this.isNightcore) {
      this.audioEl.playbackRate = 1.25;
      if (this.reverbWetGain && this.ctx) {
        this.reverbWetGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    } else if (this.isSlowedReverb) {
      this.audioEl.playbackRate = 0.85;
      if (this.reverbWetGain && this.ctx) {
        this.reverbWetGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      }
    } else {
      this.audioEl.playbackRate = 1.0;
      if (this.reverbWetGain && this.ctx) {
        this.reverbWetGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    }
  }

  // Graphic Equalizer methods
  public setEQPreset(preset: EQPreset): void {
    this.currentPreset = preset;
    const values = EQ_PRESETS[preset];
    this.setAllEQGains(values);
  }

  public setBandGain(index: number, dbGain: number): void {
    if (index >= 0 && index < this.eqFilters.length && this.ctx) {
      this.eqFilters[index].gain.setValueAtTime(dbGain, this.ctx.currentTime);
      this.eqGains[index] = dbGain;
      this.currentPreset = 'Custom';
    }
  }

  public setAllEQGains(gains: number[]): void {
    this.eqGains = [...gains];
    if (this.ctx) {
      this.eqFilters.forEach((filter, idx) => {
        if (gains[idx] !== undefined) {
          filter.gain.setValueAtTime(gains[idx], this.ctx!.currentTime);
        }
      });
    }
  }

  public getEQGains(): number[] {
    return [...this.eqGains];
  }

  public getCurrentPreset(): EQPreset {
    return this.currentPreset;
  }

  // Visualizer data extraction
  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array as unknown as Uint8Array<ArrayBuffer>);
    }
  }

  public getTimeDomainData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(array as unknown as Uint8Array<ArrayBuffer>);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getAudioContext(): AudioContext | null {
    if (!this.ctx) this.init();
    return this.ctx;
  }

  // Play Sound Effect
  public playSFX(sfx: string): void {
    const ctx = this.getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      playGamerSound(ctx, sfx, this.masterGain || undefined);
    }
  }

  // Fade out for sleep timer
  public fadeOutAndStop(durationSeconds = 4): Promise<void> {
    return new Promise(resolve => {
      if (!this.masterGain || !this.ctx || !this.audioEl) {
        this.pause();
        resolve();
        return;
      }
      const currentGain = this.masterGain.gain.value;
      this.masterGain.gain.setValueAtTime(currentGain, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + durationSeconds);
      setTimeout(() => {
        this.pause();
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setValueAtTime(currentGain, this.ctx.currentTime); // restore
        }
        resolve();
      }, durationSeconds * 1000);
    });
  }

  public getCurrentTime(): number {
    return this.audioEl?.currentTime || 0;
  }

  public getDuration(): number {
    return this.audioEl?.duration || 0;
  }

  public isCurrentlyPlaying(): boolean {
    return !!(this.audioEl && !this.audioEl.paused && !this.audioEl.ended);
  }

  public getNightcoreState(): boolean {
    return this.isNightcore;
  }

  public getSlowedReverbState(): boolean {
    return this.isSlowedReverb;
  }

  public getSpatial3DState(): boolean {
    return this.isSpatial3D;
  }
}

export const audioEngine = new AudioEngine();
