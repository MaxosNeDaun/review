// ============================================
// TYPY PRO REVIEWHUB - FINÁLNÍ VERZE (BEZ EMOJI)
// ============================================

export type Category = 'film' | 'game' | 'book' | 'all';

export interface Item {
  // UUID ze Supabase je vždy string
  id: string; 
  cat: 'film' | 'game' | 'book';
  title: string;
  genre: string;
  color: string;
  description: string;
  image_url?: string;
  created_at?: string;
  // Computed fields (vypočítané v supabase.ts)
  avg_rating?: number;
  review_count?: number;
  // Emoji smazáno, aby neházelo chyby, když ho v DB nemáš
}

export interface Review {
  id: string;
  item_id: string;
  // Sjednoceno na názvy, které máš v SQL tabulce
  author_name: string; 
  rating: number;
  comment: string;
  created_at: string;
}

// Pomocný typ, pokud někde v kódu stále používáš staré názvy
// (Umožní to hladký přechod bez přepisování celého ItemModal.tsx)
export interface ReviewWithLegacy extends Review {
  user_name?: string; 
  text?: string;
}

export interface ReviewWithItem extends Review {
  items: Item;
}

export type SortOption = 'rating' | 'name' | 'reviews';

export interface FilterState {
  category: Category;
  genre: string;
  sort: SortOption;
  search: string;
}
