import { createClient } from '@supabase/supabase-js';
// Oprava TS1484: Přidáno slovo 'type' pro kompatibilitu s verbatimModuleSyntax
import { type Item, type Review } from '../types'; 

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- ITEMS FUNKCE ---

export async function getItems(): Promise<Item[]> {
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (itemsError) {
    console.error('Chyba při načítání items:', itemsError.message);
    return [];
  }

  const { data: reviews } = await supabase.from('reviews').select('item_id, rating');

  return (items as any[]).map((item) => {
    const itemReviews = (reviews || []).filter((r) => r.item_id === item.id);
    const avg = itemReviews.length > 0
      ? itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length
      : 0;

    return {
      ...item,
      emoji: item.emoji || '⭐', 
      avg_rating: Number(avg.toFixed(1)),
      review_count: itemReviews.length,
    };
  });
}

export async function deleteItem(itemId: string): Promise<boolean> {
  const { error } = await supabase.from('items').delete().eq('id', itemId);
  return !error;
}

// --- RECENZE FUNKCE ---

// Oprava TS2305: Přidán chybějící export addReview pro ItemModal.tsx
export async function addReview(
  itemId: string, 
  author: string, 
  rating: number, 
  comment: string
): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .insert([{ 
      item_id: itemId, 
      author_name: author, 
      rating: rating, 
      comment: comment 
    }])
    .select()
    .single();

  if (error) {
    console.error('Chyba při přidávání recenze:', error.message);
    return null;
  }
  return data as Review;
}

export async function getReviewsByItemId(itemId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });

  return error ? [] : (data as Review[]);
}

export async function deleteReview(reviewId: string): Promise<boolean> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  return !error;
}

export function subscribeToAllReviews(callback: () => void) {
  return supabase
    .channel('public:reviews')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
      callback();
    })
    .subscribe();
}

// --- AUTH & ADMIN ROLE ---

export async function getUserRole(userId: string): Promise<'admin' | 'user'> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role || 'user';
}
