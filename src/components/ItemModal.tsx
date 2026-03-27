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
  const [currentUser, setCurrentUser] = useState<any>(null);

  // TVŮJ ADMIN EMAIL
  const ADMIN_EMAIL = 'admin@gmail.com';
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
    const data = await getReviewsByItemId(String(item.id));
    setReviews(data);
  };

  const handleSubmit = async () => {
    if (!item || !currentUser) return;
    if (newRating === 0) return toast.error('Vyber hodnocení!');
    if (!newText.trim()) return toast.error('Napiš text!');
    if (newText.length > MAX_CHARS) return toast.error('Moc dlouhé!');

    setIsSubmitting(true);
    const authorName = currentUser.email?.split('@')[0] || 'Uživatel';

    const review = await addReview(String(item.id), authorName, newRating, newText.trim());

    if (review) {
      toast.success('Uloženo!');
      setNewRating(0);
      setNewText('');
      await loadReviews();
      onReviewAdded();
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-slate-800 bg-slate-950 p-0 text-white shadow-2xl">
        
        {/* HEADER */}
        <div className="relative h-64 w-full overflow-hidden bg-slate-900">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.title} 
              className="h-full w-full object-cover opacity-70" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl" style={{ background: item.color }}>
              {item.emoji || catEmojis[item.cat]}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
          <button 
            onClick={() => onOpenChange(false)} 
            className="absolute right-4 top-4 z-50 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-6">
            <Badge className="bg-violet-600 mb-2 uppercase text-[10px] tracking-widest border-none text-white">
              {catLabels[item.cat]}
            </Badge>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
              {item.title}
            </DialogTitle>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-16rem)]">
          <div className="p-8">
            
            {/* HODNOCENÍ */}
            <div className="mb-8 flex items-center gap-6 rounded-2xl bg-slate-900/50 p-6 border border-slate-800 shadow-inner">
              <div className="text-5xl font-black text-violet-500">
                {Number(item.avg_rating || 0).toFixed(1)}
              </div>
              <div>
                <StarRating rating={Number(item.avg_rating || 0)} size="lg" />
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">
                  {item.review_count || 0} RECENZÍ
                </div>
              </div>
            </div>

            {/* FORMULÁŘ */}
            {currentUser ? (
              <div className="mb-10 space-y-4 rounded-2xl bg-violet-600/5 p-6 border border-violet-500/20 shadow-sm">
                <StarRating rating={newRating} size="lg" interactive onRatingChange={setNewRating} />
                <div className="relative">
                  <Textarea 
                    placeholder="Co si o tom myslíš?" 
                    value={newText} 
                    onChange={(e) => setNewText(e.target.value)} 
                    maxLength={MAX_CHARS}
                    className="bg-slate-950 border-slate-800 rounded-xl min-h-[80px] text-sm break-all focus:ring-violet-500"
                  />
                  <div className="absolute bottom-2 right-3 text-[9px] text-slate-600">
                    {newText.length}/{MAX_CHARS}
                  </div>
                </div>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting} 
                  className="w-full bg-violet-600 hover:bg-violet-500 font-bold uppercase tracking-widest text-white transition-all active:scale-95"
                >
                  {isSubmitting ? 'UKLÁDÁM...' : 'ODESLAT HODNOCENÍ'}
                </Button>
              </div>
            ) : (
              <div className="mb-10 text-center py-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest flex items-center justify-center gap-2">
                  <Lock className="h-3 w-3" /> PŘIHLAŠ SE PRO HODNOCENÍ
                </p>
              </div>
            )}

            <Separator className="mb-8 bg-slate-800" />

            {/* RECENZE KOMUNITY */}
            <div className="space-y-4">
              <h3 className="font-black italic uppercase text-lg tracking-tight">Recenze</h3>
              {reviews.length === 0 ? (
                <p className="text-slate-600 text-xs uppercase font-bold text-center py-6 border border-slate-900 rounded-2xl italic">
                  Zatím žádné recenze
                </p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 transition-colors hover:bg-slate-900/50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center font-bold text-xs uppercase text-white">
                          {r.author_name?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-tight text-slate-200">
                            {r.author_name}
                          </div>
                          <div className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">
                            {new Date(r.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <StarRating rating={r.rating} size="sm" />
                        
                        {/* SMAZÁNÍ - VIDITELNÉ JEN PRO ADMINA */}
                        {currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && (
                          <button 
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Smazat recenzi"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 italic break-all whitespace-pre-wrap leading-relaxed">
                      "{r.comment}"
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
