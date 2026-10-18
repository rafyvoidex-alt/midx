import React, { useEffect, useRef } from 'react';
import { studioAudio } from '../utils/audioEngine.ts';

interface AudioVisualizerProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  currentTime,
  duration,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = studioAudio.getAnalyser();

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
      bgGrad.addColorStop(1, 'rgba(11, 15, 25, 0.8)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle horizontal center grid line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barCount = 48;
        const barWidth = (width / barCount) * 0.75;
        const gap = (width / barCount) * 0.25;

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * (bufferLength * 0.7));
          const value = dataArray[index] || 0;
          const percent = value / 255;
          const barHeight = Math.max(3, percent * (height * 0.85));

          const x = i * (barWidth + gap) + gap / 2;
          const y = (height - barHeight) / 2;

          // Gradient color: Cyan to Emerald to Violet
          const barGrad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          barGrad.addColorStop(0, '#38bdf8'); // sky-400
          barGrad.addColorStop(0.5, '#34d399'); // emerald-400
          barGrad.addColorStop(1, '#818cf8'); // indigo-400

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      } else {
        // Idle ambient subtle waveform
        const barCount = 48;
        const barWidth = (width / barCount) * 0.75;
        const gap = (width / barCount) * 0.25;
        const time = Date.now() * 0.002;

        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(time + i * 0.2) * 0.5 + 0.5;
          const barHeight = 4 + wave * 6;
          const x = i * (barWidth + gap) + gap / 2;
          const y = (height - barHeight) / 2;

          ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isPlaying]);

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(progress * duration);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/70 p-3 shadow-inner">
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2 px-1">
        <span className="flex items-center gap-1.5">
          <span className={`inline-block w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span>{isPlaying ? 'LIVE OUTPUT' : 'STANDBY'}</span>
        </span>
        <span className="tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div
        className="relative cursor-pointer group"
        onClick={handleScrub}
        role="slider"
        aria-label="Audio scrubber"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration || 1}
        tabIndex={0}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={76}
          className="w-full h-18 rounded-lg block"
        />

        {/* Progress scrub overlay */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-sky-500/15 pointer-events-none border-r-2 border-sky-400 transition-all duration-75"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
