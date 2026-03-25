import { createClient } from '@supabase/supabase-js';

// --- KONFIGURACE ---
// Ve Vite musí proměnné začínat VITE_. Pokud je nemáš v .env, dej sem přímo textové řetězce.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://TVOJE_ID.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'TVŮJ_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- TYPY (Definujeme přímo zde, aby to neházelo chyby) ---
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

// --- FUNKCE PRO DATA ---

/**
 * Načte všechny položky a vypočítá průměrné hodnocení z tabulky reviews
 */
export async function getItems(): Promise<Item[]> {
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (itemsError) {
    console.error('Chyba items:', itemsError.message);
    return [];
  }

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('item_id, rating');

  if (reviewsError) return items as Item[];

  return (items as Item[]).map((item) => {
    const itemReviews = reviews.filter((r) => r.item_id === item.id);
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

/**
 * Zjistí roli uživatele (admin/user) z tabulky profiles
 */
export async function getUserRole(userId: string): Promise<'admin' | 'user'> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) return 'user';
    return data.role as 'admin' | 'user';
  } catch {
    return 'user';
  }
}

// --- FUNKCE PRO ADMINA ---

export async function deleteItem(itemId: string): Promise<boolean> {
  const { error } = await supabase.from('items').delete().eq('id', itemId);
  return !error;
}

export async function addItem(item: Partial<Item>): Promise<boolean> {
  const { error } = await supabase.from('items').insert([item]);
  return !error;
}

// --- FUNKCE PRO RECENZE ---

export async function addReview(itemId: string, name: string, rating: number, text: string) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([{ 
      item_id: itemId, 
      author_name: name, 
      rating: rating, 
      comment: text 
    }])
    .select()
    .single();
  
  if (error) console.error('Chyba recenze:', error.message);
  return data;
}
