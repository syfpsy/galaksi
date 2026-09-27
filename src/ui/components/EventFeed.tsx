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
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 select-none max-w-xl w-full px-4">
      <div className="bg-space-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-xl overflow-hidden">
        {/* Toggle Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-800/60"
        >
          <div className="flex items-center gap-2 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyber-cyan animate-pulse" />
            <span className="font-mono text-[11px] text-cyber-cyan font-bold uppercase tracking-wider">
              Sektör Telsiz Akışı
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span>{events.length} Olay</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Events Ticker */}
        <div className={`p-2 divide-y divide-slate-800/60 text-xs font-mono max-h-48 overflow-y-auto ${isExpanded ? 'block' : 'max-h-8'}`}>
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
