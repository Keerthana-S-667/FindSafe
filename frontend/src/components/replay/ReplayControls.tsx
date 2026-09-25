import React from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Gauge } from 'lucide-react';

interface Props {
  isPlaying: boolean;
  currentIndex: number;
  totalEvents: number;
  playbackSpeed: number;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  onSpeedChange: (speed: number) => void;
}

export const ReplayControls: React.FC<Props> = ({
  isPlaying,
  currentIndex,
  totalEvents,
  playbackSpeed,
  onPlayPause,
  onPrev,
  onNext,
  onRestart,
  onSpeedChange
}) => {
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Playback Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRestart}
          className="p-2 rounded-lg bg-surface-950 border border-surface-700 hover:bg-surface-700 text-surface-300 hover:text-surface-50 transition-colors"
          title="Restart Replay"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg bg-surface-950 border border-surface-700 hover:bg-surface-700 text-surface-300 hover:text-surface-50 disabled:opacity-40 transition-colors"
          title="Previous Event"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onPlayPause}
          className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-surface-950 font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isPlaying ? 'Pause Replay' : 'Play Replay'}</span>
        </button>

        <button
          onClick={onNext}
          disabled={currentIndex >= totalEvents - 1}
          className="p-2 rounded-lg bg-surface-950 border border-surface-700 hover:bg-surface-700 text-surface-300 hover:text-surface-50 disabled:opacity-40 transition-colors"
          title="Next Event"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar & Counter */}
      <div className="flex-1 w-full max-w-xs mx-4 space-y-1">
        <div className="flex justify-between items-center text-xs text-surface-300">
          <span>Replay Progress</span>
          <span className="font-mono font-bold text-surface-50">Event {currentIndex + 1} of {totalEvents}</span>
        </div>
        <div className="h-2 bg-surface-950 rounded-full overflow-hidden border border-surface-700">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / (totalEvents || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Playback Speed Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-surface-300 flex items-center gap-1">
          <Gauge className="w-3.5 h-3.5" /> Speed:
        </span>
        {[0.5, 1, 2, 4].map((spd) => (
          <button
            key={spd}
            onClick={() => onSpeedChange(spd)}
            className={`px-2 py-0.5 rounded text-xs font-semibold font-mono transition-colors ${
              playbackSpeed === spd
                ? 'bg-brand-500 text-surface-950'
                : 'bg-surface-950 border border-surface-700 text-surface-300 hover:text-surface-50'
            }`}
          >
            {spd}x
          </button>
        ))}
      </div>
    </div>
  );
};
