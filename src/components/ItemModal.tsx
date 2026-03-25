import { useState, useEffect } from 'react';
import { X, Send, Trash2, User, Calendar, Lock } from 'lucide-react';
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
import { getReviewsByItemId, addReview, deleteReview, supabase, getUserRole } from '@/lib/supabase';
import { toast } from 'sonner'; // Používám sonner pro konzistenci s App.tsx
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
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (item && open) {
      loadReviews();
      checkAuth();
    }
  }, [item, open]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    setCurrentUser(user);
    
    if (user) {
      const role = await getUserRole(user.id);
      setIsAdmin(role === 'admin');
    } else {
      setIsAdmin(false);
    }
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
    
    if (newRating === 0) {
      toast.error('Vyber hodnocení (hvězdičky)');
      return;
    }

    if (!newText.trim()) {
      toast.error('Napiš text recenze');
      return;
    }

    setIsSubmitting(true);
    
    // Použijeme email uživatele jako jméno autora
    const authorName = currentUser.email?.split('@')[0] || 'Uživatel';

    const review = await addReview(
      String(item.id),
      authorName,
      newRating,
      newText.trim()
    );

    if (review) {
      toast.success('Recenze byla přidána!');
      setNewRating(0);
      setNewText('');
      await loadReviews();
      onReviewAdded();
    } else {
      toast.error('Nepodařilo se přidat recenzi.');
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (reviewId: string) => {
    if (!isAdmin) return;
    
    const success = await deleteReview(reviewId);
    if (success) {
      toast.success('Recenze smazána');
      await loadReviews();
      onReviewAdded();
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-slate-800 bg-slate-950 p-0 text-white">
        <div className="relative h-56 overflow-hidden flex items-center justify-center text-7xl bg-slate-900">
          {item.emoji || catEmojis[item.cat]}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-red-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="max-h-[calc(90vh-14rem)]">
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-3xl font-black text-white">
                {item.title}
              </DialogTitle>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge className="bg-violet-600 text-white border-none">
                  {catEmojis[item.cat]} {catLabels[item.cat]}
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-400">
                  {item.genre}
                </Badge>
              </div>
            </DialogHeader>

            <p className="mb-6 text-slate-400 leading-relaxed text-lg">
              {item.description}
            </p>

            <div className="mb-8 flex items-center gap-6 rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <div className="text-5xl font-black text-violet-500">
                {Number(item.avg_rating || 0).toFixed(1)}
              </div>
              <div>
                <StarRating rating={Number(item.avg_rating || 0)} size="lg" />
                <p className="mt-1 text-sm text-slate-500 font-medium">
                  CELKEM {item.review_count || 0} RECENZÍ
                </p>
              </div>
            </div>

            {/* SEKCE PŘIDÁNÍ RECENZE */}
            <div className="mb-8 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <h3 className="mb-4 text-lg font-bold flex items-center gap-2">
                <Send className="h-5 w-5 text-violet-500" /> Přidat hodnocení
              </h3>
              
              {currentUser ? (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm text-slate-400">Jak se ti to líbilo?</p>
                    <StarRating
                      rating={newRating}
                      size="lg"
                      interactive
                      onRatingChange={setNewRating}
                    />
                  </div>

                  <Textarea
                    placeholder="Napiš krátkou recenzi..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    className="min-h-[100px] border-slate-800 bg-slate-950 text-slate-200 focus:ring-violet-500"
                  />

                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-6 rounded-xl transition-all active:scale-95"
                  >
                    {isSubmitting ? 'Odesílám...' : 'Publikovat recenzi'}
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 mb-3">
                    <Lock className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-sm mb-4">Pro přidání recenze se musíš přihlásit.</p>
                  <Button variant="outline" className="border-slate-700 hover:bg-slate-800" onClick={() => onOpenChange(false)}>
                    Zavřít a přihlásit se
                  </Button>
                </div>
              )}
            </div>

            <Separator className="my-8 bg-slate-800" />

            {/* SEKCE RECENZÍ */}
            <div>
              <h3 className="mb-6 text-xl font-bold flex items-center gap-2">
                💬 Diskuze ({reviews.length})
              </h3>

              {isLoading ? (
                <div className="space-y-4">
                   {[1,2].map(i => <div key={i} className="h-24 w-full animate-pulse bg-slate-900 rounded-xl" />)}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                  <p className="italic text-slate-500">Zatím žádné recenze. Buď první!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition-hover hover:border-slate-700"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-500 font-bold text-xs">
                            {review.author_name?.[0].toUpperCase() || 'A'}
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-slate-200">
                              {review.author_name || 'Anonym'}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                              <Calendar className="h-3 w-3" />
                              {new Date(review.created_at).toLocaleDateString('cs-CZ')}
                            </span>
                          </div>
                        </div>
                        
                        {/* TLACITKO SMAZAT - POUZE PRO ADMINY */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(String(review.id))}
                            className="p-2 text-slate-600 transition-colors hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                            title="Smazat recenzi"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <StarRating rating={review.rating} size="sm" className="mb-3" />
                      
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {review.comment}
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
