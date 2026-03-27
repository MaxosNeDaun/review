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

  // === TADY NASTAV SVŮJ EMAIL ===
  const MY_ADMIN_EMAIL = 'admin@gmail.com'; 

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
    
    // Debug: Otevři F12 v prohlížeči a uvidíš, jestli jsi přihlášen správně
    if (session?.user) {
      console.log("Přihlášen jako:", session.user.email);
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
    if (!confirm('Smazat recenzi?')) return;
    
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    
    if (error) {
      toast.error('Nepodařilo se smazat');
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
            <img src={item.image_url} alt={item.title} className="h-full w-full object-cover opacity-70" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl" style={{ background: item.color }}>
              {item.emoji || catEmojis[item.cat]}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
          <button onClick={() => onOpenChange(false)} className="absolute right-4 top-4 z-50 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-red-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-6">
            <Badge className="bg-violet-600 mb-2 uppercase text-[10px] tracking-widest">{catLabels[item.cat]}</Badge>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">{item.title}</DialogTitle>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-16rem)]">
          <div className="p-8">
            
            {/* PRŮMĚR */}
            <div className="mb-8 flex items-center gap-6 rounded-2xl bg-slate-900/50 p-6 border border-slate-800">
              <div className="text-5xl font-black text-violet-500">{Number(item.avg_rating || 0).toFixed(1)}</div>
              <div>
                <StarRating rating={Number(item.avg_rating || 0)} size="lg" />
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{item.review_count || 0} RECENZÍ</div>
              </div>
            </div>

            {/* FORMULÁŘ */}
            {currentUser ? (
              <div className="mb-10 space-y-4 rounded-2xl bg-violet-600/5 p-6 border border-violet-500/20">
                <StarRating rating={newRating} size="lg" interactive onRatingChange={setNewRating} />
                <div className="relative">
                  <Textarea 
                    placeholder="Tvůj názor..." 
                    value={newText} 
                    onChange={(e) => setNewText(e.target.value)} 
                    maxLength={MAX_CHARS}
                    className="bg-slate-950 border-slate-800 rounded-xl min-h-[80px] text-sm break-all"
                  />
                  <div className="absolute bottom-2 right-3 text-[9px] text-slate-600">{newText.length}/{MAX_CHARS}</div>
                </div>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-violet-600 hover:bg-violet-500 font-bold uppercase tracking-widest">
                  {isSubmitting ? 'Posílám...' : 'Uložit hodnocení'}
                </Button>
              </div>
            ) : (
              <div className="mb-10 text-center py-4 border border-dashed border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest flex items-center justify-center gap-2">
                  <Lock className="h-3 w-3" /> Přihlas se pro hodnocení
                </p>
              </div>
            )}

            <Separator className="mb-8 bg-slate-800" />

            {/* SEZNAM RECENZÍ */}
            <div className="space-y-4">
              <h3 className="font-black italic uppercase text-lg">Poslední ohlasy</h3>
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center font-bold text-xs uppercase">{r.author_name[0]}</div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-tight text-slate-200">{r.author_name}</div>
                        <div className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <StarRating rating={r.rating} size="sm" />
                      
                      {/* TLAČÍTKO SMAZAT - POUZE PRO ADMINA */}
                      {currentUser?.email?.toLowerCase() === MY_ADMIN_EMAIL.toLowerCase() && (
                        <button 
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 italic break-all whitespace-pre-wrap">"{r.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
