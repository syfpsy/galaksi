import React, { useState } from 'react';
import { Bell, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import { GameEventRecord } from '../../engine/types';

interface EventFeedProps {
  events: GameEventRecord[];
}

export const EventFeed: React.FC<EventFeedProps> = ({ events }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const recentEvents = [...events].reverse().slice(0, isExpanded ? 30 : 1);

  if (events.length === 0) return null;

  return (
    <div className="absolute bottom-16 left-6 z-20 select-none max-w-sm w-full">
      <div className="stellaris-outliner border border-[#1c3647] rounded-sm shadow-xl overflow-hidden">
        {/* Toggle Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1.5 stellaris-outliner-header flex items-center justify-between text-xs cursor-pointer hover:brightness-110"
        >
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#3ca8d1] animate-pulse" />
            <span className="font-mono text-[11px] text-[#3ca8d1] font-bold uppercase tracking-wider">
              Sektör Telsiz Akışı
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
            <span>{events.length} Olay</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Events Ticker */}
        <div className={`p-2 divide-y divide-[#18374b]/60 text-xs font-mono max-h-48 overflow-y-auto ${isExpanded ? 'block' : 'max-h-8'}`}>
          {recentEvents.map((evt) => {
            const timeSec = Math.floor(evt.timeMs / 1000);
            const m = Math.floor(timeSec / 60);
            const s = timeSec % 60;
            const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            return (
              <div key={evt.id} className="py-1 flex items-start gap-2 text-slate-300">
                <span className="text-slate-500 text-[10px] shrink-0">[{timeStr}]</span>
                <span className="truncate">{evt.description}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
