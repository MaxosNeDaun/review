import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './StarRating';
import type { Item } from '@/types';

interface ItemCardProps {
  item: Item;
  onClick: () => void;
}

const catLabels: Record<string, string> = {
  film: 'Film',
  game: 'Hra',
  book: 'Kniha',
};

const catEmojis: Record<string, string> = {
  film: '🎬',
  game: '🎮',
  book: '📚',
};

export function ItemCard({ item, onClick }: ItemCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer overflow-hidden border border-slate-800 bg-slate-900/50 transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/10"
    >
      {/* Image Container */}
      <div
        className="relative h-44 overflow-hidden"
        style={{ background: item.color }}
      >
        {item.image_url && !imageError ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">
            {item.emoji}
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        
        {/* Category badge */}
        <Badge
          className="absolute right-3 top-3 bg-violet-600/90 text-xs font-semibold text-white backdrop-blur-sm hover:bg-violet-600"
        >
          {catLabels[item.cat]}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 text-base font-bold text-slate-100">
          {item.title}
        </h3>
        
        <p className="mb-2 text-xs font-medium text-violet-400">
          {catEmojis[item.cat]} {item.genre}
        </p>
        
        <p className="mb-3 line-clamp-2 text-sm text-slate-400">
          {item.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <StarRating rating={item.avg_rating || 0} size="sm" />
          
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MessageSquare className="h-3 w-3" />
            <span>{item.review_count || 0}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
