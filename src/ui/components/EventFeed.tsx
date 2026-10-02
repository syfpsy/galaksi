import React, { useState } from 'react';
import { Bell, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import { GameEventRecord } from '../../engine/types';
import { sound } from '../sound';

interface EventFeedProps {
  events: GameEventRecord[];
}

const EventFeedComponent: React.FC<EventFeedProps> = ({ events }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const recentEvents = [...events].reverse().slice(0, isExpanded ? 30 : 1);

  if (events.length === 0) return null;

  return (
    <>
      {/* Compact Ticker Trigger Pill (Docked next to Left Rail, zero bottom dock overlap) */}
      <div className="absolute bottom-2 left-16 z-20 select-none pointer-events-auto">
        <button
          onClick={() => {
            sound.playClick();
            setIsExpanded(!isExpanded);
          }}
          className={`h-[30px] px-2.5 rounded-sm border font-mono text-xs flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer shadow-md ${
            isExpanded
              ? 'bg-[#081829] border-cyan-400 text-cyan-200'
              : 'bg-[#06101c]/90 border-[#1c3647] hover:border-cyan-500/70 text-slate-300 hover:text-white'
          }`}
          title="Sektör Telsiz ve Olay Akışını Görüntüle"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
          <span className="font-bold text-[10.5px] uppercase tracking-wider text-cyan-300">Telsiz</span>
          <span className="text-[9.5px] px-1.5 py-0.5 rounded-xs bg-[#030911] border border-cyan-500/50 text-cyan-300 font-bold">
            {events.length}
          </span>
          {!isExpanded && recentEvents[0] && (
            <span className="text-[10px] text-slate-400 truncate max-w-[120px] hidden xl:inline">
              {recentEvents[0].description}
            </span>
          )}
          {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronUp className="w-3 h-3 text-slate-400" />}
        </button>
      </div>

      {/* Floating Expanded Event Drawer (Pops up above the pill without blocking the bottom dock) */}
      {isExpanded && (
        <div className="absolute bottom-11 left-16 z-30 select-none w-80 max-w-[90vw] pointer-events-auto animate-in slide-in-from-bottom-2 duration-150">
          <div className="stellaris-outliner border border-[#1c3647] rounded-sm shadow-2xl overflow-hidden bg-[#06101c]/98 backdrop-blur-md">
            {/* Header */}
            <div className="px-3 py-2 stellaris-outliner-header flex items-center justify-between border-b border-[#1c3647]">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="font-mono text-[11px] text-cyan-300 font-bold uppercase tracking-wider">
                  Sektör Telsiz Akışı
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Kapat"
              >
                ✕
              </button>
            </div>

            {/* Events Scrollable Body */}
            <div className="p-2 divide-y divide-[#18374b]/50 text-xs font-mono max-h-56 overflow-y-auto scrollbar-none">
              {recentEvents.map((evt) => {
                const timeSec = Math.floor(evt.timeMs / 1000);
                const m = Math.floor(timeSec / 60);
                const s = timeSec % 60;
                const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

                return (
                  <div key={evt.id} className="py-1.5 flex items-start gap-2 text-slate-300">
                    <span className="text-cyan-400/70 text-[10px] shrink-0">[{timeStr}]</span>
                    <span className="text-[11px] leading-snug break-words">{evt.description}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const EventFeed = React.memo(EventFeedComponent);
