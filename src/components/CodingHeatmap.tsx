import React from 'react';
import { format, eachDayOfInterval, subDays, startOfDay, isSameDay } from 'date-fns';
import { cn } from '../lib/utils';

interface CodingHeatmapProps {
  data: { [date: string]: number };
}

export const CodingHeatmap: React.FC<CodingHeatmapProps> = ({ data }) => {
  const today = new Date();
  const startDate = subDays(today, 364); // Last 1 year
  const days = eachDayOfInterval({ start: startDate, end: today });

  const getIntensity = (count: number) => {
    if (!count) return 'bg-white/5';
    if (count < 2) return 'bg-emerald-500/20';
    if (count < 4) return 'bg-emerald-500/40';
    if (count < 6) return 'bg-emerald-500/60';
    return 'bg-emerald-500';
  };

  return (
    <div className="glass p-8 rounded-[40px] border border-white/5">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Coding Activity
      </h3>
      
      <div className="flex flex-wrap gap-1.5">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const count = data[dateStr] || 0;
          return (
            <div
              key={dateStr}
              title={`${dateStr}: ${count} activities`}
              className={cn(
                "w-3 h-3 rounded-sm transition-all hover:scale-150 cursor-pointer",
                getIntensity(count)
              )}
            />
          );
        })}
      </div>
      
      <div className="mt-6 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-white/5" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
