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
      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900"
    >
      {/* OBRÁZEK / COVER */}
      <div className="relative h-64 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.title} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070&auto=format&fit=crop';
            }}
          />
        ) : (
          <div 
            className="flex h-full w-full items-center justify-center text-6xl shadow-inner"
            style={{ backgroundColor: item.color || '#1e293b' }}
          >
            {item.emoji || '🎬'}
          </div>
        )}
        
        {/* GRADIENT PŘES OBRÁZEK - zajišťuje čitelnost bílého textu i v light modu */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
        
        {/* TEXTY NA OBRÁZKU (Vždy bílé díky gradientu) */}
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex gap-2 mb-2">
            <Badge className="bg-violet-600 text-white border-none text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
              {catLabels[item.cat] || item.cat}
            </Badge>
            <Badge variant="outline" className="text-white border-white/30 backdrop-blur-md text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
              {item.genre}
            </Badge>
          </div>
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-white drop-shadow-lg line-clamp-1">
            {item.title}
          </h3>
        </div>
      </div>

      {/* SPODNÍ INFO LIŠTA (Adaptivní barvy) */}
      <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900/90">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center bg-yellow-400/10 p-1.5 rounded-lg">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          </div>
          <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {Number(item.avg_rating || 0).toFixed(1)}
          </span>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
            {item.review_count || 0}
          </span>
          <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
            Recenzí
          </span>
        </div>
      </div>

      {/* HOVER EFEKT - LINKA NA SPODKU */}
      <div className="absolute bottom-0 h-1 w-0 bg-violet-600 transition-all duration-300 group-hover:w-full" />
    </div>
  );
}
