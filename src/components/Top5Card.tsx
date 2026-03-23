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
      className="group relative min-w-[180px] cursor-pointer snap-start border border-slate-800 bg-slate-900/50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/50"
    >
      {/* Rank badge */}
      <div className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-bold text-white shadow-lg">
        {rank}
      </div>

      <div className="mb-2 text-4xl">{item.emoji}</div>
      
      <h4 className="mb-1 line-clamp-1 text-sm font-bold text-slate-200">
        {item.title}
      </h4>
      
      <div className="flex items-center gap-2">
        <StarRating rating={item.avg_rating || 0} size="sm" />
        <span className="text-xs font-medium text-amber-400">
          {(item.avg_rating || 0).toFixed(1)}
        </span>
      </div>
    </Card>
  );
}
