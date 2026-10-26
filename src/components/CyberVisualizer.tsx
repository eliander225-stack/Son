import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { VisualizerMode } from '../types/audio';

interface CyberVisualizerProps {
  mode: VisualizerMode;
  isPlaying: boolean;
  className?: string;
  showScanlines?: boolean;
}

export const CyberVisualizer: React.FC<CyberVisualizerProps> = ({
  mode,
  isPlaying,
  className = '',
  showScanlines = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const peaksRef = useRef<number[]>([]);
  const bassGlowRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI Canvas Resizing
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(container);

    const bufferLength = 128;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    if (peaksRef.current.length !== bufferLength) {
      peaksRef.current = new Array(bufferLength).fill(0);
    }

    let angle = 0;

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);

      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear with dark cyber trailing effect
      ctx.fillStyle = 'rgba(10, 10, 18, 0.35)';
      ctx.fillRect(0, 0, width, height);

      if (isPlaying) {
        audioEngine.getFrequencyData(freqData);
        audioEngine.getTimeDomainData(timeData);

        // Calculate Bass Energy for dynamic visual pulse
        let bassSum = 0;
        for (let i = 0; i < 8; i++) {
          bassSum += freqData[i];
        }
        const currentBass = bassSum / 8 / 255;
        bassGlowRef.current = bassGlowRef.current * 0.8 + currentBass * 0.2;
      } else {
        // Idle gentle animation when paused
        angle += 0.025;
        bassGlowRef.current = 0.05;
        for (let i = 0; i < bufferLength; i++) {
          freqData[i] = Math.max(0, Math.sin(angle + i * 0.12) * 25 + 20);
          timeData[i] = 128 + Math.sin(angle * 2 + i * 0.08) * 10;
        }
      }

      // Draw mode
      switch (mode) {
        case 'bars':
          renderBars(ctx, width, height, freqData);
          break;
        case 'circle':
          renderCircle(ctx, width, height, freqData);
          break;
        case 'wave':
          renderWave(ctx, width, height, timeData);
          break;
        case 'matrix':
          renderMatrix(ctx, width, height, freqData);
          break;
      }
    };

    // Bars visualizer (Enhanced Frequency Spectrum)
    const renderBars = (
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      data: Uint8Array
    ) => {
      const barCount = Math.min(54, Math.floor(w / 10));
      const totalSpacing = w / barCount;
      const barWidth = Math.max(3, totalSpacing - 3);

      for (let i = 0; i < barCount; i++) {
        // Logarithmic distribution to emphasize punchy sub-bass & vocals
        const logIndex = Math.floor(Math.pow(i / barCount, 1.35) * (data.length / 2));
        const val = data[logIndex] || 0;
        const percent = val / 255;
        const barHeight = Math.max(3, percent * (h * 0.82));

        const x = i * totalSpacing + 2;
        const y = h - barHeight - 16; // room for bottom frequency line

        // Gradient from Neon Cyan at base through Electric Violet to Neon Pink at top
        const grad = c.createLinearGradient(x, h - 16, x, y);
        grad.addColorStop(0, '#06b6d4'); // Cyan
        grad.addColorStop(0.5, '#8b5cf6'); // Violet
        grad.addColorStop(1, '#ec4899'); // Neon Pink

        c.fillStyle = grad;
        c.fillRect(x, y, barWidth, barHeight);

        // Mirror floor reflection (dimmed)
        const reflectHeight = barHeight * 0.22;
        const reflectGrad = c.createLinearGradient(x, h - 16, x, h - 16 + reflectHeight);
        reflectGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        reflectGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        c.fillStyle = reflectGrad;
        c.fillRect(x, h - 16, barWidth, reflectHeight);

        // Peak Hold indicator with gravity physics
        if (barHeight > peaksRef.current[i]) {
          peaksRef.current[i] = barHeight;
        } else {
          peaksRef.current[i] = Math.max(3, peaksRef.current[i] - 1.4);
        }

        const peakY = h - peaksRef.current[i] - 19;
        c.fillStyle = '#ffffff';
        c.fillRect(x, Math.max(0, peakY), barWidth, 2);
      }

      // Bottom Frequency Range Markers
      c.fillStyle = 'rgba(100, 116, 139, 0.6)';
      c.font = '9px "JetBrains Mono", monospace';
      c.fillText('SUB-BASS', 8, h - 4);
      c.fillText('MID BASS', w * 0.25, h - 4);
      c.fillText('VOCALS', w * 0.52, h - 4);
      c.fillText('HIGHS', w * 0.85, h - 4);

      // Baseline line
      c.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, h - 16);
      c.lineTo(w, h - 16);
      c.stroke();
    };

    // Circular Holographic Audio Core
    const renderCircle = (
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      data: Uint8Array
    ) => {
      const centerX = w / 2;
      const centerY = h / 2;
      const baseRadius = Math.min(w, h) * 0.22;
      const numPoints = 64;

      angle += 0.008;

      c.save();
      c.translate(centerX, centerY);

      // Bass Reactive Outer Aura
      const bassPulse = bassGlowRef.current * 40;
      const auraGrad = c.createRadialGradient(0, 0, baseRadius * 0.5, 0, 0, baseRadius + bassPulse + 20);
      auraGrad.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
      auraGrad.addColorStop(0.7, 'rgba(236, 72, 153, 0.15)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      c.fillStyle = auraGrad;
      c.beginPath();
      c.arc(0, 0, baseRadius + bassPulse + 25, 0, Math.PI * 2);
      c.fill();

      // Inner Rotating Ring
      c.rotate(angle);
      c.beginPath();
      c.arc(0, 0, baseRadius * 0.85, 0, Math.PI * 2);
      c.strokeStyle = '#06b6d4';
      c.lineWidth = 2;
      c.stroke();

      // Frequency Spikes radiating outward
      for (let i = 0; i < numPoints; i++) {
        const rad = (i / numPoints) * Math.PI * 2;
        const dataIdx = Math.floor((i / numPoints) * 45);
        const val = (data[dataIdx] || 0) / 255;
        const spikeLen = Math.max(4, val * 60 + bassPulse * 0.5);

        const x1 = Math.cos(rad) * baseRadius;
        const y1 = Math.sin(rad) * baseRadius;
        const x2 = Math.cos(rad) * (baseRadius + spikeLen);
        const y2 = Math.sin(rad) * (baseRadius + spikeLen);

        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.strokeStyle = i % 2 === 0 ? '#22d3ee' : '#ec4899';
        c.lineWidth = 2.2;
        c.stroke();
      }

      // Center glowing core text
      c.rotate(-angle);
      c.fillStyle = '#ffffff';
      c.font = 'bold 10px "JetBrains Mono", monospace';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('DSP CORE', 0, 0);

      c.restore();
    };

    // Oscilloscope Waveform Ribbon
    const renderWave = (
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      data: Uint8Array
    ) => {
      c.lineWidth = 3;
      c.strokeStyle = '#22d3ee';
      c.shadowColor = '#06b6d4';
      c.shadowBlur = 14;

      c.beginPath();
      const sliceWidth = w / data.length;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128.0;
        const y = (v * h) / 2;

        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
        x += sliceWidth;
      }

      c.lineTo(w, h / 2);
      c.stroke();
      c.shadowBlur = 0;

      // Secondary glowing pink harmonic ribbon
      c.lineWidth = 1.8;
      c.strokeStyle = 'rgba(236, 72, 153, 0.75)';
      c.beginPath();
      x = 0;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128.0;
        const y = (v * h) / 2 + Math.sin(i * 0.25 + angle * 2) * 8;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
        x += sliceWidth;
      }
      c.stroke();
    };

    // Matrix Neon Rain Spectrogram
    const renderMatrix = (
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      data: Uint8Array
    ) => {
      const cols = Math.min(36, Math.floor(w / 14));
      const colWidth = w / cols;

      for (let i = 0; i < cols; i++) {
        const dataIdx = Math.floor((i / cols) * 50);
        const heightFactor = ((data[dataIdx] || 0) / 255) * h * 0.88;
        const x = i * colWidth + 3;
        const dotCount = Math.floor(heightFactor / 8);

        for (let d = 0; d < dotCount; d++) {
          const y = h - d * 9 - 10;
          if (d >= dotCount - 2) {
            c.fillStyle = '#ffffff';
          } else if (i % 2 === 0) {
            c.fillStyle = '#06b6d4';
          } else {
            c.fillStyle = '#ec4899';
          }
          c.fillRect(x, y, colWidth - 6, 5);
        }
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [mode, isPlaying]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl bg-[#090912] border border-cyan-500/30 ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      {showScanlines && (
        <div className="absolute inset-0 crt-scanlines opacity-50 pointer-events-none" />
      )}
    </div>
  );
};
