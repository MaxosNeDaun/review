// ============================================
// TYPY PRO REVIEWHUB
// ============================================

export type Category = 'film' | 'game' | 'book' | 'all';

export interface Item {
  id: number;
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
  id: number;
  item_id: number;
  user_name: string;
  rating: number;
  text: string;
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
