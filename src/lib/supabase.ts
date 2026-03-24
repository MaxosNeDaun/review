// ============================================
// SUPABASE CLIENT
// ============================================
import { createClient } from '@supabase/supabase-js';
import type { Item, Review } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// FUNKCE PRO PRÁCI S ITEMS
// ============================================

export async function getItems(): Promise<Item[]> {
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: true });

  if (itemsError) {
    console.error('Error fetching items:', itemsError);
    return [];
  }

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('item_id, rating');

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
    return items || [];
  }

  const itemsWithStats = (items || []).map((item) => {
    const itemReviews = (reviews || []).filter((r) => r.item_id === item.id);
    const avgRating =
      itemReviews.length > 0
        ? itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length
        : 0;

    return {
      ...item,
      avg_rating: avgRating,
      review_count: itemReviews.length,
    };
  });

  return itemsWithStats;
}

export async function getItemById(id: string): Promise<Item | null> {
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();

  if (itemError) {
    console.error('Error fetching item:', itemError);
    return null;
  }

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('rating')
    .eq('item_id', id);

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
    return item;
  }

  const avgRating =
    (reviews || []).length > 0
      ? (reviews || []).reduce((sum, r) => sum + r.rating, 0) / (reviews || []).length
      : 0;

  return {
    ...item,
    avg_rating: avgRating,
    review_count: (reviews || []).length,
  };
}

// ============================================
// FUNKCE PRO PRÁCI S RECENZEMI
// ============================================

export async function getReviewsByItemId(itemId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data || [];
}

/**
 * PŘIDÁNÍ RECENZE - OPRAVENO
 */
export async function addReview(
  itemId: string,
  authorName: string,
  rating: number,
  comment: string
): Promise<Review | null> {
  // Tady mapujeme parametry na přesné názvy sloupců v SQL (author_name a comment)
  const { data, error } = await supabase
    .from('reviews')
    .insert([
      {
        item_id: itemId,
        author_name: authorName, // SQL sloupec
        rating: rating,
        comment: comment,       // SQL sloupec
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding review:', error);
    return null;
  }

  return data;
}

/**
 * SMAZÁNÍ RECENZE - OPRAVENO
 */
export async function deleteReview(reviewId: string): Promise<boolean> {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    // Pokud zde vidíš chybu, pravděpodobně nemáš v Supabase nastavenou DELETE Policy!
    console.error('Error deleting review:', error);
    return false;
  }

  return true;
}

// ============================================
// REALTIME (ponecháno beze změny)
// ============================================

export function subscribeToReviews(itemId: string, callback: (review: Review) => void) {
  return supabase
    .channel(`reviews:item_id=eq.${itemId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reviews', filter: `item_id=eq.${itemId}` },
      (payload) => callback(payload.new as Review)
    )
    .subscribe();
}

export function subscribeToAllReviews(callback: () => void) {
  return supabase
    .channel('all-reviews')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reviews' },
      () => callback()
    )
    .subscribe();
}
