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
        className="relative h-44 overflow-hidden flex items-center justify-center bg-slate-900"
        style={{ background: !item.image_url || imageError ? item.color : undefined }}
      >
        {item.image_url && !imageError ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-6xl transition-transform duration-500 group-hover:scale-110">
            {item.emoji || catEmojis[item.cat]}
          </div>
        )}
        
        {/* Gradient overlay - dělá text pod obrázkem čitelnější */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
        
        {/* Category badge */}
        <Badge
          className="absolute right-3 top-3 bg-violet-600/90 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md border-none shadow-lg"
        >
          {catLabels[item.cat]}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 text-base font-black uppercase tracking-tight text-slate-100 group-hover:text-violet-400 transition-colors">
          {item.title}
        </h3>
        
        <div className="flex items-center justify-between mb-2">
           <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
            {item.genre}
          </p>
          <div className="flex items-center gap-1 text-violet-500 font-bold text-xs">
            {Number(item.avg_rating || 0).toFixed(1)}
          </div>
        </div>
        
        <p className="mb-4 line-clamp-2 text-xs text-slate-500 leading-relaxed italic">
          {item.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/50 pt-3">
          <StarRating rating={item.avg_rating || 0} size="sm" />
          
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
            <MessageSquare className="h-3 w-3 text-slate-700" />
            <span>{item.review_count || 0} recenzí</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
