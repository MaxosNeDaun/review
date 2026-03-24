import { useState, useEffect } from 'react';
import { X, Send, Trash2, User, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StarRating } from './StarRating';
import { getReviewsByItemId, addReview, deleteReview } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
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
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (item && open) {
      loadReviews();
    }
  }, [item, open]);

  const loadReviews = async () => {
    if (!item) return;
    setIsLoading(true);
    // item.id je v DB typu UUID (string)
    const data = await getReviewsByItemId(String(item.id));
    setReviews(data);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!item) return;
    
    if (newRating === 0) {
      toast({
        title: '⚠️ Vyber hodnocení',
        description: 'Prosím, vyber počet hvězdiček.',
        variant: 'destructive',
      });
      return;
    }

    if (!newText.trim()) {
      toast({
        title: '⚠️ Napiš komentář',
        description: 'Prosím, napiš svůj názor.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Voláme addReview s daty pro SQL sloupce: author_name a comment
    const review = await addReview(
      String(item.id),
      userName.trim() || 'Anonym',
      newRating,
      newText.trim()
    );

    if (review) {
      toast({
        title: '✅ Recenze přidána!',
        description: 'Děkujeme za tvůj názor.',
      });
      setNewRating(0);
      setNewText('');
      setUserName('');
      await loadReviews();
      onReviewAdded();
    } else {
      toast({
        title: '❌ Chyba',
        description: 'Nepodařilo se přidat recenzi. Zkus to znovu.',
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  // OPRAVA: reviewId musí být string, protože v DB je to UUID
  const handleDelete = async (reviewId: string) => {
    const success = await deleteReview(reviewId);
    if (success) {
      toast({
        title: '🗑️ Recenze smazána',
      });
      await loadReviews();
      onReviewAdded();
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-slate-800 bg-slate-900 p-0">
        <div
          className="relative h-56 overflow-hidden flex items-center justify-center text-7xl bg-slate-800"
        >
          {/* Pokud máš v item objektu emoji, použijeme ho, jinak ikonu podle kategorie */}
          {item.emoji || catEmojis[item.cat]}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-red-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="max-h-[calc(90vh-14rem)]">
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold text-slate-100">
                {item.title}
              </DialogTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                  {catEmojis[item.cat]} {catLabels[item.cat]}
                </Badge>
                <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                  {item.genre}
                </Badge>
              </div>
            </DialogHeader>

            <p className="mb-6 text-slate-400 leading-relaxed">
              {item.description}
            </p>

            <div className="mb-6 flex items-center gap-4 rounded-xl bg-slate-800/50 p-4">
              <div className="text-4xl font-bold text-violet-400">
                {Number(item.avg_rating || 0).toFixed(1)}
              </div>
              <div>
                <StarRating rating={Number(item.avg_rating || 0)} size="lg" />
                <p className="mt-1 text-sm text-slate-500">
                  {item.review_count || 0} recenzí
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-slate-200">
                ✍️ Přidat recenzi
              </h3>
              
              <div className="space-y-3">
                <Input
                  placeholder="Tvoje jméno (nepovinné)"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-500"
                />
                
                <div>
                  <p className="mb-2 text-sm text-slate-400">Tvé hodnocení:</p>
                  <StarRating
                    rating={newRating}
                    size="lg"
                    interactive
                    onRatingChange={setNewRating}
                  />
                </div>

                <Textarea
                  placeholder="Napiš svůj názor..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="min-h-[100px] border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-500"
                />

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:from-violet-500 hover:to-fuchsia-400"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Odesílání...' : 'Odeslat recenzi'}
                </Button>
              </div>
            </div>

            <Separator className="my-6 bg-slate-800" />

            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-200">
                💬 Recenze ({reviews.length})
              </h3>

              {isLoading ? (
                <p className="text-slate-500">Načítání recenzí...</p>
              ) : reviews.length === 0 ? (
                <p className="italic text-slate-500">
                  Zatím žádné recenze. Buď první!
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div
                      key={String(review.id)}
                      className="rounded-lg border border-slate-800 bg-slate-800/30 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-300">
                            {/* OPRAVA: SQL sloupec je author_name nebo user_name? 
                                Pokud jsi nepoužil ten poslední SQL rename, nech tu author_name */}
                            {review.author_name || review.user_name || 'Anonym'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(review.created_at).toLocaleDateString('cs-CZ')}
                          </span>
                          <button
                            onClick={() => handleDelete(String(review.id))}
                            className="text-slate-500 transition-colors hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <StarRating rating={review.rating} size="sm" className="mb-2" />
                      
                      <p className="text-sm text-slate-400">
                        {/* OPRAVA: SQL sloupec je comment nebo text? */}
                        {review.comment || review.text}
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
