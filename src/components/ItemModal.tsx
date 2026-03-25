import { useState, useEffect } from 'react';
import { X, Send, Calendar, Lock } from 'lucide-react'; // Tyto ikony jsou nyní použity níže
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
    if (newRating === 0) return toast.error('Vyber hodnocení (hvězdičky)');
    if (!newText.trim()) return toast.error('Napiš text recenze');
    if (newText.length > MAX_CHARS) return toast.error(`Max. ${MAX_CHARS} znaků.`);

    setIsSubmitting(true);
    const authorName = currentUser.email?.split('@')[0] || 'Uživatel';

    const review = await addReview(String(item.id), authorName, newRating, newText.trim());

    if (review) {
      toast.success('Recenze byla přidána!');
      setNewRating(0);
      setNewText('');
      await loadReviews();
      onReviewAdded();
    }
    setIsSubmitting(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-slate-800 bg-slate-950 p-0 text-white">
        
        {/* HEADER S OBRÁZKEM */}
        <div className="relative h-64 overflow-hidden flex items-center justify-center bg-slate-900">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.title} 
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-7xl drop-shadow-lg">
              {item.emoji || catEmojis[item.cat]}
            </span>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-red-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="max-h-[calc(90vh-16rem)]">
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-3xl font-black text-white italic">
                {item.title.toUpperCase()}
              </DialogTitle>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge className="bg-violet-600 text-white border-none font-bold">
                  {catEmojis[item.cat]} {catLabels[item.cat].toUpperCase()}
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-400 font-bold">
                  {item.genre.toUpperCase()}
                </Badge>
              </div>
            </DialogHeader>

            <div className="mb-8 flex items-center gap-6 rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <div className="text-5xl font-black text-violet-500">
                {Number(item.avg_rating || 0).toFixed(1)}
              </div>
              <div>
                <StarRating rating={Number(item.avg_rating || 0)} size="lg" />
                <p className="mt-1 text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Celkem {item.review_count || 0} recenzí
                </p>
              </div>
            </div>

            {/* SEKCE PŘIDÁNÍ RECENZE */}
            <div className="mb-8 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest flex items-center gap-2 text-violet-400">
                <Send className="h-4 w-4" /> Tvůj verdikt
              </h3>
              
              {currentUser ? (
                <div className="space-y-4">
                  <StarRating rating={newRating} size="lg" interactive onRatingChange={setNewRating} />
                  <div className="relative">
                    <Textarea
                      placeholder="Co na to říkáš? (max. 200 znaků)"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      maxLength={MAX_CHARS}
                      className="min-h-[100px] border-slate-800 bg-slate-950 text-slate-200 focus:ring-violet-500 pb-8 rounded-xl"
                    />
                    <div className={`absolute bottom-2 right-3 text-[10px] font-bold ${newText.length >= MAX_CHARS ? 'text-red-500' : 'text-slate-600'}`}>
                      {newText.length} / {MAX_CHARS}
                    </div>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-6 rounded-xl transition-all"
                  >
                    {isSubmitting ? 'Odesílám...' : 'Publikovat'}
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 mb-3">
                    <Lock className="h-6 w-6 text-slate-500" /> {/* Zde je použit Lock */}
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase mb-4">Pro hodnocení se musíš přihlásit</p>
                  <Button variant="outline" className="border-slate-700 hover:bg-slate-800 rounded-full text-xs font-bold" onClick={() => onOpenChange(false)}>
                    PŘIHLÁSIT SE
                  </Button>
                </div>
              )}
            </div>

            <Separator className="my-8 bg-slate-800" />

            {/* SEKCE RECENZÍ */}
            <div className="space-y-6">
              <h3 className="text-lg font-black uppercase tracking-tight">Recenze od lidí</h3>
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                   {[1,2].map(i => <div key={i} className="h-24 bg-slate-900 rounded-xl" />)}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl">
                  <p className="text-slate-600 text-sm font-bold uppercase">Zatím ticho. Buď první!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-black text-[10px]">
                            {review.author_name?.[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="block text-xs font-black text-slate-200 uppercase">{review.author_name}</span>
                            <span className="text-[9px] uppercase font-bold text-slate-600 flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {/* Zde je použit Calendar */}
                              {new Date(review.created_at).toLocaleDateString('cs-CZ')}
                            </span>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed italic">"{review.comment}"</p>
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
