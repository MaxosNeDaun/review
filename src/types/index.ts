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
  author_name: string; 
  rating: number;
  comment: string;
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
