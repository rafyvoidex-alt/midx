import React from 'react';
import { Play, Pause, Download, Trash2, Clock, Music } from 'lucide-react';
import { GenerationHistoryItem } from '../types/tts.ts';

interface AudioHistoryDrawerProps {
  history: GenerationHistoryItem[];
  currentPlayingId: string | null;
  isPlaying: boolean;
  onPlayItem: (item: GenerationHistoryItem) => void;
  onDownloadItem: (item: GenerationHistoryItem) => void;
  onClearHistory: () => void;
}

export const AudioHistoryDrawer: React.FC<AudioHistoryDrawerProps> = ({
  history,
  currentPlayingId,
  isPlaying,
  onPlayItem,
  onDownloadItem,
  onClearHistory,
}) => {
  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 text-center">
        <Music className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-slate-400">Generation Reel Empty</h4>
        <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
          Synthesize any text prompt or screenplay above to start collecting your high-resolution audio master reel.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-semibold text-slate-200">
            Generation Master Reel ({history.length} take{history.length > 1 ? 's' : ''})
          </h3>
        </div>
        <button
          type="button"
          onClick={onClearHistory}
          className="text-slate-500 hover:text-slate-300 text-[11px] flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-800 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear Reel</span>
        </button>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {history.map((item) => {
          const isCurrent = currentPlayingId === item.id && isPlaying;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                isCurrent
                  ? 'border-sky-500/60 bg-sky-950/20 shadow-sm'
                  : 'border-slate-800/70 bg-slate-950/40 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-750">
                    {item.mode === 'screenplay' ? 'Screenplay' : 'Single'}
                  </span>
                  <span className="text-xs font-semibold text-slate-200 truncate">{item.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate font-sans">{item.text}</p>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                  <span>Voice: {item.voiceName}</span>
                  <span>·</span>
                  <span>Duration: ~{item.duration.toFixed(1)}s</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onPlayItem(item)}
                  className="p-2 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 transition-colors cursor-pointer"
                  title={isCurrent ? 'Pause' : 'Play Take'}
                  aria-label={isCurrent ? 'Pause' : 'Play Take'}
                >
                  {isCurrent ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onDownloadItem(item)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700/80 transition-colors cursor-pointer"
                  title="Download WAV"
                  aria-label="Download WAV"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
