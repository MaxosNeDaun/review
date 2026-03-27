import { Card } from '@/components/ui/card';
import { StarRating } from './StarRating';
import type { Item } from '@/types';

interface Top5CardProps {
  item: Item;
  rank: number;
  onClick: () => void;
}

export function Top5Card({ item, rank, onClick }: Top5CardProps) {
  return (
    <Card
      onClick={onClick}
      className="group relative min-w-[180px] cursor-pointer snap-start border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/50 dark:border-slate-800 dark:bg-slate-900/50"
    >
      {/* Rank badge - ten zůstává barevný, vypadá to skvěle v obou módech */}
      <div className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
        {rank}
      </div>

      {/* Emoji/Ikona */}
      <div className="mb-2 text-4xl transition-transform group-hover:scale-110">
        {item.emoji || '🎬'}
      </div>
      
      {/* Název - v Light Modu tmavý (slate-900), v Dark Modu světlý (slate-200) */}
      <h4 className="mb-1 line-clamp-1 text-sm font-black uppercase tracking-tight text-slate-900 dark:text-slate-200">
        {item.title}
      </h4>
      
      {/* Hodnocení */}
      <div className="flex items-center gap-2">
        <StarRating rating={item.avg_rating || 0} size="sm" />
        <span className="text-xs font-bold text-amber-500 dark:text-amber-400">
          {(item.avg_rating || 0).toFixed(1)}
        </span>
      </div>

      {/* Decentní spodní linka při hoveru */}
      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-500 transition-all duration-300 group-hover:w-full" />
    </Card>
  );
}
