export type Category = 'film' | 'game' | 'book' | 'all';

export interface Item {
  id: string;
  cat: 'film' | 'game' | 'book';
  title: string;
  emoji: string; 
  genre: string;
  color: string;
  description: string;
  image_url?: string;
  created_at?: string;
  avg_rating?: number;
  review_count?: number;
}

export interface Review {
  id: string;
  item_id: string;
  user_name: string;       // ✅ opraveno z author_name
  author_name?: string;
  rating: number;
  text: string;            // ✅ opraveno z comment
  comment?: string;
  created_at: string;
  user_id?: string;
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
