// Cyber Anime Web Audio Synthesizer & Sound Effects Generator

// Convert an AudioBuffer to a standard WAV Blob URL
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data subchunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave and scale channel data
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Generate Cyber Anime Track 1: "NEO-TOKYO OVERDRIVE" (Synthwave / Cyberpunk, 128 BPM, ~60s looped)
export function generateNeoTokyoTrack(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bpm = 128;
  const beatDuration = 60 / bpm; // ~0.46875s
  const numBars = 32; // ~60 seconds
  const totalLength = Math.floor(sampleRate * beatDuration * 4 * numBars);
  const buffer = ctx.createBuffer(2, totalLength, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Bass frequencies in F minor: F1 (43.65), Ab1 (51.91), Bb1 (58.27), Eb1 (38.89)
  const bassNotes = [43.65, 51.91, 58.27, 38.89];
  // Melody notes in F pentatonic minor: F4 (349.2), Ab4 (415.3), Bb4 (466.16), C5 (523.25), Eb5 (622.25)
  const melodyNotes = [349.23, 415.30, 466.16, 523.25, 622.25, 523.25, 466.16, 415.30];

  for (let i = 0; i < totalLength; i++) {
    const t = i / sampleRate;
    const currentBar = Math.floor(t / (beatDuration * 4));
    const beatInBar = (t / beatDuration) % 4;
    const sixteenth = Math.floor((t / (beatDuration / 4)) % 16);

    let l = 0;
    let r = 0;

    // 1. Kick Drum (on beats 0, 1, 2, 3)
    const kickTime = (t % beatDuration);
    if (kickTime < 0.22) {
      const kickFreq = 140 * Math.exp(-kickTime * 28) + 45;
      const kickEnv = Math.exp(-kickTime * 18);
      const kickSample = Math.sin(2 * Math.PI * kickFreq * kickTime) * kickEnv * 0.45;
      l += kickSample;
      r += kickSample;
    }

    // 2. Snare / Cyber Clap (on beats 1 and 3)
    const snareTime = ((t + beatDuration) % (beatDuration * 2));
    if (snareTime < 0.25) {
      const noise = (Math.random() * 2 - 1) * Math.exp(-snareTime * 22);
      const tone = Math.sin(2 * Math.PI * 220 * snareTime) * Math.exp(-snareTime * 30);
      const snareSample = (noise * 0.3 + tone * 0.15);
      l += snareSample;
      r += snareSample;
    }

    // 3. Hi-Hat (16th notes with velocity swing)
    const hatTime = (t % (beatDuration / 4));
    if (hatTime < 0.06) {
      const isOffbeat = (sixteenth % 2 === 1);
      const hatEnv = Math.exp(-hatTime * 60) * (isOffbeat ? 0.14 : 0.07);
      const hatNoise = (Math.random() * 2 - 1) * hatEnv;
      l += hatNoise * 0.9;
      r += hatNoise * 1.1;
    }

    // 4. Rolling Synthwave Bassline (16th note groove)
    const chordIndex = currentBar % bassNotes.length;
    const bassFreq = bassNotes[chordIndex];
    const bassTime = (t % (beatDuration / 4));
    const bassEnv = Math.exp(-bassTime * 12);
    // Sawtooth-like synthesis using harmonics
    let bassSample = 0;
    for (let h = 1; h <= 4; h++) {
      bassSample += (Math.sin(2 * Math.PI * bassFreq * h * t) / h);
    }
    bassSample *= bassEnv * 0.22;
    l += bassSample;
    r += bassSample;

    // 5. Arpeggio / Lead Melody (starts at bar 4)
    if (currentBar >= 2) {
      const noteIndex = (sixteenth + currentBar * 2) % melodyNotes.length;
      const leadFreq = melodyNotes[noteIndex];
      const leadTime = (t % (beatDuration / 4));
      const leadEnv = Math.exp(-leadTime * 8);
      
      const osc1 = Math.sin(2 * Math.PI * leadFreq * t);
      const osc2 = Math.sin(2 * Math.PI * (leadFreq * 1.004) * t); // slight detune
      const leadSample = (osc1 + osc2) * leadEnv * 0.14;

      // Stereo delay simulation
      l += leadSample * 1.1;
      r += leadSample * 0.8;
    }

    // Soft master limiter / saturation
    left[i] = Math.tanh(l);
    right[i] = Math.tanh(r);
  }

  return buffer;
}

// Generate Cyber Anime Track 2: "AETHER ZERO // MECHA STRIKE" (Anime Boss / Electro 140 BPM, ~55s)
export function generateMechaStrikeTrack(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bpm = 140;
  const beatDuration = 60 / bpm;
  const numBars = 32;
  const totalLength = Math.floor(sampleRate * beatDuration * 4 * numBars);
  const buffer = ctx.createBuffer(2, totalLength, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // D minor / Phrygian aggressive anime battle notes
  const chords = [73.42, 65.41, 87.31, 82.41]; // D2, C2, F2, E2
  const leadArp = [293.66, 311.13, 349.23, 440.00, 523.25, 587.33, 440.00, 349.23];

  for (let i = 0; i < totalLength; i++) {
    const t = i / sampleRate;
    const currentBar = Math.floor(t / (beatDuration * 4));
    const sixteenth = Math.floor((t / (beatDuration / 4)) % 16);

    let l = 0;
    let r = 0;

    // Hard Gamer Kick
    const kickTime = (t % (beatDuration / 2)); // Double-time kick during battle!
    if (kickTime < 0.18) {
      const kickFreq = 160 * Math.exp(-kickTime * 35) + 50;
      const kickSample = Math.sin(2 * Math.PI * kickFreq * kickTime) * Math.exp(-kickTime * 20) * 0.42;
      l += kickSample;
      r += kickSample;
    }

    // Heavy Industrial Saw Bass
    const bassFreq = chords[currentBar % chords.length];
    const bassTime = (t % (beatDuration / 4));
    const sawEnv = Math.exp(-bassTime * 10);
    let sawSample = (Math.sin(2 * Math.PI * bassFreq * t) +
      0.5 * Math.sin(2 * Math.PI * bassFreq * 2 * t) +
      0.3 * Math.sin(2 * Math.PI * bassFreq * 3 * t)) * sawEnv * 0.25;
    
    // Slight sidechain ducking
    if (kickTime < 0.08) sawSample *= 0.4;
    l += sawSample;
    r += sawSample;

    // High Tech Arpeggiator (16th notes)
    const arpFreq = leadArp[sixteenth % leadArp.length];
    const arpTime = (t % (beatDuration / 4));
    const arpEnv = Math.exp(-arpTime * 14);
    const arpSquare = (Math.sin(2 * Math.PI * arpFreq * t) > 0 ? 0.1 : -0.1) * arpEnv;
    
    // Ping-pong stereo effect
    const pan = Math.sin(t * 4);
    l += arpSquare * (1 + pan * 0.4);
    r += arpSquare * (1 - pan * 0.4);

    // Cyber glitch bursts on every 4th bar
    if (currentBar % 4 === 3 && sixteenth >= 12) {
      const glitch = (Math.random() * 2 - 1) * 0.2;
      l += glitch;
      r -= glitch;
    }

    left[i] = Math.tanh(l);
    right[i] = Math.tanh(r);
  }

  return buffer;
}

// Generate Cyber Anime Track 3: "MIDNIGHT RAIN // SHIBUYA LO-FI" (Chill Lo-fi, 82 BPM, ~60s)
export function generateMidnightLofiTrack(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bpm = 82;
  const beatDuration = 60 / bpm;
  const numBars = 20;
  const totalLength = Math.floor(sampleRate * beatDuration * 4 * numBars);
  const buffer = ctx.createBuffer(2, totalLength, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Warm Rhodes chords: Ebmaj9, Gm7, Fm9, Bb13
  const chordNotes = [
    [155.56, 196.00, 233.08, 293.66], // Ebmaj9
    [196.00, 233.08, 293.66, 349.23], // Gm7
    [174.61, 207.65, 261.63, 311.13], // Fm9
    [116.54, 174.61, 233.08, 293.66]  // Bb13
  ];

  for (let i = 0; i < totalLength; i++) {
    const t = i / sampleRate;
    const currentBar = Math.floor(t / (beatDuration * 4));
    const chord = chordNotes[currentBar % chordNotes.length];

    let l = 0;
    let r = 0;

    // 1. Vinyl Dust & Rain Ambience
    const rain = (Math.random() * 2 - 1) * 0.015;
    const vinylClick = (Math.random() < 0.0003) ? (Math.random() * 0.08) : 0;
    l += rain + vinylClick;
    r += rain - vinylClick;

    // 2. Soft Lo-fi Thump Kick (beats 0 and 2.5)
    const kickTime1 = (t % (beatDuration * 4));
    const kickTime2 = ((t - beatDuration * 2.5 + beatDuration * 4) % (beatDuration * 4));
    const kt = Math.min(kickTime1, kickTime2);
    if (kt < 0.25) {
      const kf = 90 * Math.exp(-kt * 20) + 38;
      const kick = Math.sin(2 * Math.PI * kf * kt) * Math.exp(-kt * 14) * 0.35;
      l += kick;
      r += kick;
    }

    // 3. Lo-fi Snare / Rimshot (on beats 1 and 3)
    const snareTime = ((t + beatDuration) % (beatDuration * 2));
    if (snareTime < 0.18) {
      const sNoise = (Math.random() * 2 - 1) * Math.exp(-snareTime * 25) * 0.15;
      const sBody = Math.sin(2 * Math.PI * 180 * snareTime) * Math.exp(-snareTime * 35) * 0.12;
      l += sNoise + sBody;
      r += sNoise + sBody;
    }

    // 4. Lush Electric Piano (Rhodes vibrato)
    const vibrato = Math.sin(2 * Math.PI * 4.5 * t) * 0.02;
    const chordTime = (t % (beatDuration * 2));
    const chordEnv = Math.exp(-chordTime * 1.5) * 0.08;
    for (let c = 0; c < chord.length; c++) {
      const f = chord[c] * (1 + vibrato);
      const tone = Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2 * t);
      l += tone * chordEnv;
      r += tone * chordEnv;
    }

    // 5. Deep Sub Bass
    const rootNote = chord[0] / 2; // Sub octave
    const bassTone = Math.sin(2 * Math.PI * rootNote * t) * 0.18;
    l += bassTone;
    r += bassTone;

    left[i] = Math.tanh(l);
    right[i] = Math.tanh(r);
  }

  return buffer;
}

// Gamer Soundboard Web Audio SFX Player
export function playGamerSound(ctx: AudioContext, soundName: string, masterGain?: GainNode) {
  const dest = masterGain || ctx.destination;
  const now = ctx.currentTime;

  switch (soundName) {
    case 'levelup': {
      // 8-bit Level Up fanfare arpeggio
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.18, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.24);
      });
      break;
    }

    case 'laser': {
      // Sci-fi Cyber Laser Zap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.27);
      break;
    }

    case 'coin': {
      // Classic Arcade Coin Chime (B5 to E6)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.setValueAtTime(0.25, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.46);
      break;
    }

    case 'cyberding': {
      // Holographic HUD alert
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(1200, now);
      osc2.frequency.setValueAtTime(1800, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.37);
      osc2.stop(now + 0.37);
      break;
    }

    case 'victory': {
      // Anime Battle Victory Jingle
      const chords = [
        { freqs: [523.25, 659.25, 783.99], time: 0, dur: 0.15 },      // C
        { freqs: [587.33, 739.99, 880.00], time: 0.16, dur: 0.15 },   // D
        { freqs: [659.25, 830.61, 987.77], time: 0.32, dur: 0.15 },   // E
        { freqs: [783.99, 987.77, 1174.66, 1567.98], time: 0.48, dur: 0.7 } // G major octave
      ];
      chords.forEach(({ freqs, time, dur }) => {
        freqs.forEach(f => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + time);
          gain.gain.setValueAtTime(0.12, now + time);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now + time);
          osc.stop(now + time + dur + 0.05);
        });
      });
      break;
    }
  }
}
