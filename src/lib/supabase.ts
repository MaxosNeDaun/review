import { createClient } from '@supabase/supabase-js';

// --- KONFIGURACE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- TYPY (Sjednoceno s tvým SQL) ---
export interface Item {
  id: string;
  title: string;
  description: string;
  cat: 'film' | 'game' | 'book';
  genre: string;
  color: string;
  image_url: string;
  avg_rating?: number;
  review_count?: number;
  created_at?: string;
}

export interface Review {
  id: string;
  item_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

// --- FUNKCE PRO ITEMS ---

export async function getItems(): Promise<Item[]> {
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (itemsError) return [];

  const { data: reviews } = await supabase.from('reviews').select('item_id, rating');

  return (items as any[]).map((item) => {
    const itemReviews = (reviews || []).filter((r) => r.item_id === item.id);
    const avg = itemReviews.length > 0
      ? itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length
      : 0;

    return {
      ...item,
      avg_rating: Number(avg.toFixed(1)),
      review_count: itemReviews.length,
    };
  });
}

export async function deleteItem(itemId: string): Promise<boolean> {
  const { error } = await supabase.from('items').delete().eq('id', itemId);
  return !error;
}

// --- FUNKCE PRO RECENZE (Chybějící exporty pro ItemModal) ---

export async function getReviewsByItemId(itemId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });

  return error ? [] : (data as Review[]);
}

export async function addReview(itemId: string, author: string, rating: number, comment: string) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([{ item_id: itemId, author_name: author, rating, comment }])
    .select()
    .single();
  return error ? null : data;
}

export async function deleteReview(reviewId: string): Promise<boolean> {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);
  return !error;
}

// --- REALTIME (Chybějící export pro App.tsx) ---

export function subscribeToAllReviews(callback: () => void) {
  return supabase
    .channel('public:reviews')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
      callback();
    })
    .subscribe();
}

// --- AUTH & ROLE ---

export async function getUserRole(userId: string): Promise<'admin' | 'user'> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role || 'user';
}
