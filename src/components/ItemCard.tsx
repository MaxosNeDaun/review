import { Star } from 'lucide-react';
import type { Item } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ItemCardProps {
  item: Item;
  onClick: () => void;
}

const catLabels: Record<string, string> = {
  film: 'Film',
  game: 'Hra',
  book: 'Kniha',
};

export function ItemCard({ item, onClick }: ItemCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* COVER */}
      <div className="relative h-64 w-full overflow-hidden bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070&auto=format&fit=crop';
            }}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-5xl"
            style={{ backgroundColor: item.color || '#1e293b' }}
          >
            {item.emoji}
          </div>
        )}

        {/* Gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Overlay text */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-2 mb-2">
            <Badge className="bg-violet-600 text-white border-none text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
              {catLabels[item.cat] || item.cat}
            </Badge>
            <Badge variant="outline" className="text-white border-white/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
              {item.genre}
            </Badge>
          </div>
          <h3 className="text-lg font-bold uppercase tracking-tight text-white line-clamp-1">
            {item.title}
          </h3>
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="flex items-center justify-between p-4 bg-card">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-base font-bold text-foreground">
            {Number(item.avg_rating || 0).toFixed(1)}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {item.review_count || 0} recenzí
          </span>
        </div>
      </div>

      {/* Hover accent line */}
      <div className="absolute bottom-0 h-0.5 w-0 bg-violet-600 transition-all duration-300 group-hover:w-full" />
    </div>
  );
}
