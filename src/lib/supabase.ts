import { createClient } from '@supabase/supabase-browser';
import type { Item } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Chybí konfigurace pro Supabase v .env souboru!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Načte všechny položky z databáze včetně jejich recenzí
 * a spočítá průměrné hodnocení a počet recenzí pro frontend.
 */
export const getItems = async (): Promise<Item[]> => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        reviews (
          rating
        )
      `)
      .order('id', { ascending: true });

    if (error) {
      console.error('Chyba při stahování dat ze Supabase:', error.message);
      return [];
    }

    if (!data) return [];

    // Transformace dat: spočítáme průměrné hodnocení a počet recenzí na frontendu
    return data.map((item: any) => {
      const itemReviews = item.reviews || [];
      const review_count = itemReviews.length;
      
      // Spočítáme průměr (pokud nejsou recenze, vrátíme 0)
      const totalRating = itemReviews.reduce((sum: number, r: any) => sum + r.rating, 0);
      const avg_rating = review_count > 0 ? Number((totalRating / review_count).toFixed(1)) : 0;

      // Vrátíme vyčištěný objekt odpovídající typu Item
      return {
        id: item.id,
        cat: item.cat,
        title: item.title,
        emoji: item.emoji,
        genre: item.genre,
        color: item.color,
        description: item.description,
        image_url: item.image_url,
        created_at: item.created_at,
        review_count,
        avg_rating
      };
    });
  } catch (err) {
    console.error('Neočekávaná chyba ve funkci getItems:', err);
    return [];
  }
};

/**
 * Přihlášení k real-time odběru změn v tabulce recenzí.
 * Při jakékoliv změně (INSERT, UPDATE, DELETE) zavolá callback pro znovunačtení dat.
 */
export const subscribeToAllReviews = (onUpdate: () => void) => {
  return supabase
    .channel('public:reviews')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reviews'
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();
};
