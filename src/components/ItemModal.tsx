import { useState, useEffect } from 'react';
import { X, Lock, Trash2 } from 'lucide-react';
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

export function ItemModal({ item, open, onOpenChange, onReviewAdded }: ItemModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  const ADMIN_EMAIL = 'admin@gmail.com';
  const MAX_CHARS = 200;

  useEffect(() => {
    if (item && open) {
      loadReviews();
      checkAuth();
    }
  }, [item, open]);

  useEffect(() => {
    if (currentUser && item) {
      checkIfAlreadyReviewed(currentUser.email || '');
    } else {
      setHasReviewed(false);
    }
  }, [currentUser, item]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user ?? null);
  };

  const loadReviews = async () => {
    if (!item) return;
    const data = await getReviewsByItemId(Number(item.id));
    setReviews(data);
  };

  const checkIfAlreadyReviewed = async (userEmail: string) => {
    const userName = userEmail.split('@')[0];
    const { data } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_name', userName)
      .eq('item_id', Number(item!.id))
      .maybeSingle();

    setHasReviewed(!!data);
  };

  const handleSubmit = async () => {
    if (!item || !currentUser) return;
    if (newRating === 0) return toast.error('Vyber hodnocení!');
    if (!newText.trim()) return toast.error('Napiš text!');
    if (newText.length > MAX_CHARS) return toast.error('Moc dlouhé!');

    setIsSubmitting(true);
    const authorName = currentUser.email?.split('@')[0] || 'Uživatel';

    try {
      await addReview(Number(item.id), authorName, newRating, newText.trim());
      toast.success('Uloženo!');
      setNewRating(0);
      setNewText('');
      setHasReviewed(true);
      await loadReviews();
      onReviewAdded();
    } catch (err: any) {
      if (err?.code === '23505') {
        toast.error('Recenzi jsi již přidal!');
        setHasReviewed(true);
      } else {
        toast.error('Něco se pokazilo, zkus to znovu.');
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat tuto recenzi?')) return;

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Chyba při mazání');
    } else {
      toast.success('Smazáno');
      loadReviews();
      onReviewAdded();
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-border bg-card p-0 shadow-2xl">

        {/* HEADER IMAGE */}
        <div className="relative h-64 w-full overflow-hidden bg-muted">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="h-full w-full object-cover opacity-80"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl" style={{ background: item.color }}>
              {item.emoji}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-50 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-red-600 transition-colors text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-6 left-6">
            <Badge className="bg-violet-600 mb-2 uppercase text-[10px] tracking-widest border-none text-white">
              {catLabels[item.cat]}
            </Badge>
            <DialogTitle className="text-3xl font-bold uppercase tracking-tight text-white">
              {item.title}
            </DialogTitle>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-16rem)]">
          <div className="p-8">

            {/* RATING SUMMARY */}
            <div className="mb-8 flex items-center gap-6 rounded-xl bg-muted/50 p-5 border border-border">
              <div className="text-5xl font-black text-violet-500">
                {Number(item.avg_rating || 0).toFixed(1)}
              </div>
              <div>
                <StarRating rating={Number(item.avg_rating || 0)} size="lg" />
                <div className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">
                  {item.review_count || 0} recenzí
                </div>
              </div>
            </div>

            {/* FORM */}
            {!currentUser ? (
              <div className="mb-10 text-center py-6 border border-dashed border-border rounded-xl bg-muted/20">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest flex items-center justify-center gap-2">
                  <Lock className="h-3 w-3" /> Přihlaš se pro hodnocení
                </p>
              </div>
            ) : hasReviewed ? (
              <div className="mb-10 text-center py-6 border border-dashed border-violet-500/30 rounded-xl bg-violet-600/5">
                <p className="text-xs text-violet-500 uppercase font-bold tracking-widest">
                  Recenzi jsi již přidal
                </p>
              </div>
            ) : (
              <div className="mb-10 space-y-4 rounded-xl bg-muted/30 p-6 border border-border">
                <StarRating rating={newRating} size="lg" interactive onRatingChange={setNewRating} />
                <div className="relative">
                  <Textarea
                    placeholder="Co si o tom myslíš?"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    maxLength={MAX_CHARS}
                    className="rounded-xl min-h-[80px] text-sm break-all"
                  />
                  <div className="absolute bottom-2 right-3 text-[9px] text-muted-foreground">
                    {newText.length}/{MAX_CHARS}
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-violet-600 hover:bg-violet-500 font-bold uppercase tracking-widest transition-all active:scale-95"
                >
                  {isSubmitting ? 'Ukládám...' : 'Odeslat hodnocení'}
                </Button>
              </div>
            )}

            <Separator className="mb-8" />

            {/* REVIEWS */}
            <div className="space-y-4">
              <h3 className="font-bold uppercase text-lg tracking-tight">Recenze</h3>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground text-xs uppercase font-bold text-center py-6 border border-border rounded-xl">
                  Zatím žádné recenze
                </p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-muted/20 p-5 transition-colors hover:bg-muted/40">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center font-bold text-xs uppercase text-white">
                          {r.user_name?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-tight">
                            {r.user_name}
                          </div>
                          <div className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">
                            {new Date(r.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StarRating rating={r.rating} size="sm" />
                        {currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && (
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Smazat recenzi"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic break-all whitespace-pre-wrap leading-relaxed">
                      "{r.text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
