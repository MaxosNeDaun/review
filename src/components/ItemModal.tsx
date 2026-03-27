import { useState, useEffect } from 'react';
import { X, Send, Calendar, Lock, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StarRating } from './StarRating';
import { getReviewsByItemId, addReview, supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Item, Review } from '@/types';

interface ItemModalProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewAdded: () => void;
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

export function ItemModal({ item, open, onOpenChange, onReviewAdded }: ItemModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const MAX_CHARS = 200;
  // ZDE ZADEJ SVŮJ ADMIN EMAIL
  const ADMIN_EMAIL = 'tvuj@email.cz';

  useEffect(() => {
    if (item && open) {
      loadReviews();
      checkAuth();
    }
  }, [item, open]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user ?? null);
  };

  const loadReviews = async () => {
    if (!item) return;
    setIsLoading(true);
    const data = await getReviewsByItemId(String(item.id));
    setReviews(data);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!item || !currentUser) return;
    if (newRating === 0) return toast.error('Vyber hodnocení!');
    if (!newText.trim()) return toast.error('Napiš text recenze!');
    if (newText.length > MAX_CHARS) return toast.error('Příliš dlouhý text!');

    setIsSubmitting(true);
    const authorName = currentUser.email?.split('@')[0] || 'Uživatel';

    const review = await addReview(String(item.id), authorName, newRating, newText.trim());

    if (review) {
      toast.success('Recenze uložena!');
      setNewRating(0);
      setNewText('');
      await loadReviews();
      onReviewAdded();
    }
    setIsSubmitting(false);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Opravdu chceš tuto recenzi smazat?')) return;

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      toast.error('Chyba při mazání: ' + error.message);
    } else {
      toast.success('Recenze smazána');
      await loadReviews();
      onReviewAdded();
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-slate-800 bg-slate-950 p-0 text-white shadow-2xl">
        
        {/* HEADER S OBRÁZKEM */}
        <div className="relative h-72 w-full overflow-hidden bg-slate-900">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.title} 
              className="h-full w-full object-cover opacity-80"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-8xl" style={{ background: item.color }}>
              {item.emoji || catEmojis[item.cat]}
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 transition-all"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex gap-2 mb-3">
              <Badge className="bg-violet-600 font-bold uppercase tracking-wider">{catLabels[item.cat]}</Badge>
              <Badge variant="outline" className="text-white border-white/20 backdrop-blur-md uppercase tracking-wider">{item.genre}</Badge>
            </div>
            <DialogTitle className="text-4xl font-black text-white drop-shadow-md uppercase italic leading-tight">
              {item.title}
            </DialogTitle>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-18rem)]">
          <div className="p-8">
            
            {/* STATS */}
            <div className="mb-10 flex items-center justify-between rounded-3xl bg-slate-900/50 border border-slate-800 p-8 shadow-inner">
              <div className="flex items-center gap-6">
                <div className="text-6xl font-black text-violet-500 leading-none">
                  {Number(item.avg_rating || 0).toFixed(1)}
                </div>
                <div>
                  <StarRating rating={Number(item.avg_rating || 0)} size="lg" />
                  <p className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {item.review_count || 0} HLASŮ CELKEM
                  </p>
                </div>
              </div>
            </div>

            {/* FORMULÁŘ */}
            <div className="mb-10 p-6 rounded-3xl bg-violet-600/5 border border-violet-500/20">
              <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 text-violet-400">
                <Send className="h-3 w-3" /> Tvůj názor
              </h3>
              
              {currentUser ? (
                <div className="space-y-6">
                  <StarRating rating={newRating} size="lg" interactive onRatingChange={setNewRating} />
                  
                  <div className="relative">
                    <Textarea
                      placeholder="Napiš krátkou recenzi..."
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      maxLength={MAX_CHARS}
                      className="min-h-[100px] rounded-2xl border-slate-800 bg-slate-950 text-slate-200 focus:ring-violet-500 pb-10 resize-none break-all"
                    />
                    <div className={`absolute bottom-3 right-4 text-[9px] font-black ${newText.length >= MAX_CHARS ? 'text-red-500' : 'text-slate-600'}`}>
                      {newText.length} / {MAX_CHARS}
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-violet-600 hover:bg-violet-500 h-14 rounded-2xl font-black text-sm tracking-widest shadow-xl transition-all active:scale-95 text-white"
                  >
                    {isSubmitting ? 'ODESÍLÁM...' : 'POSLAT HODNOCENÍ'}
                  </Button>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 mb-4">
                    <Lock className="h-5 w-5 text-slate-600" />
                  </div>
                  <p className="text-slate-500 font-bold mb-4 uppercase text-[9px] tracking-widest italic">Přihlas se pro hodnocení</p>
                </div>
              )}
            </div>

            <Separator className="mb-10 bg-slate-800/50" />

            {/* VÝPIS RECENZÍ */}
            <div className="space-y-6">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white/90">Komunita říká</h3>
              
              {isLoading ? (
                <div className="space-y-4">
                   {[1,2].map(i => <div key={i} className="h-28 animate-pulse bg-slate-900 rounded-3xl" />)}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-3xl">
                  <p className="text-slate-700 font-bold uppercase tracking-widest text-[10px]">Zatím žádné recenze.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 overflow-hidden transition-all hover:bg-slate-900/60 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-black text-[10px]">
                            {review.author_name?.[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-black text-slate-100 uppercase text-[10px] truncate">
                              {review.author_name}
                            </span>
                            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                              <Calendar className="h-3 w-3" />
                              {new Date(review.created_at).toLocaleDateString('cs-CZ')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <StarRating rating={review.rating} size="sm" />
                          
                          {/* ADMIN SMAZÁNÍ */}
                          {currentUser?.email === ADMIN_EMAIL && (
                            <button 
                              onClick={() => handleDeleteReview(review.id)}
                              className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-slate-400 leading-relaxed font-medium italic text-sm break-all whitespace-pre-wrap">
                        "{review.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
