import { StarRating } from './StarRating';
import type { Item } from '@/types';

interface Top5CardProps {
  item: Item;
  rank: number;
  onClick: () => void;
}

export function Top5Card({ item, rank, onClick }: Top5CardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative min-w-[170px] max-w-[170px] cursor-pointer snap-start overflow-hidden rounded-2xl border border-border transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-lg"
    >
      <div className="relative h-48 w-full">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center text-5xl"
            style={{ background: item.color || '#1e293b' }}
          >
            {item.emoji}
          </div>
        )}

        {/* Gradient for text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Rank badge */}
        <div className="absolute left-0 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-r-full bg-violet-600 text-xs font-bold text-white">
          {rank}
        </div>

        {/* Title + rating */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h4 className="mb-1 line-clamp-1 text-sm font-bold uppercase tracking-tight text-white">
            {item.title}
          </h4>
          <div className="flex items-center gap-2">
            <StarRating rating={item.avg_rating || 0} size="sm" />
            <span className="text-xs font-bold text-amber-400">
              {(item.avg_rating || 0).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
