import { createClient } from '@supabase/supabase-js';
import type { Item, Review } from '@/types';

// Načtení environmentálních proměnných (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// 1. AUTH & UŽIVATELSKÉ ROLE
// ============================================

/**
 * Zjistí roli aktuálně přihlášeného uživatele z tabulky 'profiles'
 */
export async function getUserRole(userId: string): Promise<'admin' | 'user' | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Chyba při získávání role:', error);
    return null;
  }
  return data?.role as 'admin' | 'user';
}

/**
 * Získá aktuálně přihlášeného uživatele a jeho roli najednou
 */
export async function getCurrentUserWithRole() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const role = await getUserRole(user.id);
  return { ...user, role };
}

// ============================================
// 2. FUNKCE PRO ITEMS (FILMY, HRY, KNIHY)
// ============================================

export async function getItems(): Promise<Item[]> {
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (itemsError) {
    console.error('Error fetching items:', itemsError);
    return [];
  }

  // Načtení hodnocení pro výpočet průměru
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('item_id, rating');

  if (reviewsError) return items || [];

  return (items || []).map((item) => {
    const itemReviews = (reviews || []).filter((r) => r.item_id === item.id);
    const avgRating = itemReviews.length > 0
        ? itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length
        : 0;

    return {
      ...item,
      avg_rating: avgRating,
      review_count: itemReviews.length,
    };
  });
}

/**
 * PŘIDÁNÍ POLOŽKY (Jen pro Admina)
 */
export async function addItem(item: Partial<Item>): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .insert([item])
    .select()
    .single();

  if (error) {
    console.error('Error adding item:', error);
    return null;
  }
  return data;
}

/**
 * SMAZÁNÍ POLOŽKY (Jen pro Admina)
 */
export async function deleteItem(itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting item:', error);
    return false;
  }
  return true;
}

// ============================================
// 3. FUNKCE PRO RECENZE
// ============================================

export async function getReviewsByItemId(itemId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });

  return error ? [] : data || [];
}

export async function addReview(
  itemId: string,
  authorName: string,
  rating: number,
  comment: string
): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .insert([
      {
        item_id: itemId,
        author_name: authorName,
        rating: rating,
        comment: comment,
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

// ============================================
// 4. REALTIME ODBĚRY
// ============================================

export function subscribeToReviews(itemId: string, callback: (review: Review) => void) {
  return supabase
    .channel(`reviews:${itemId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'reviews', filter: `item_id=eq.${itemId}` },
      (payload) => callback(payload.new as Review)
    )
    .subscribe();
}
