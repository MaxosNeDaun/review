// ============================================
// TYPY PRO REVIEWHUB - OPRAVENO PRO SUPABASE
// ============================================

export type Category = 'film' | 'game' | 'book' | 'all';

export interface Item {
  // Změněno na string | number, aby to vzalo UUID ze Supabase i tvoje testovací ID
  id: string | number; 
  cat: 'film' | 'game' | 'book';
  title: string;
  emoji: string;
  genre: string;
  color: string;
  description: string;
  image_url?: string;
  created_at?: string;
  // Computed fields
  avg_rating?: number;
  review_count?: number;
}

export interface Review {
  id: string | number; // UUID je string, ale tvoje staré typy chtěly number
  item_id: string | number;
  // Přidáme obě varianty názvů, aby TypeScript nehlásil chybu v ItemModal.tsx
  user_name: string; 
  author_name?: string; // Volitelné pro SQL kompatibilitu
  rating: number;
  text: string;
  comment?: string;     // Volitelné pro SQL kompatibilitu
  created_at: string;
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
