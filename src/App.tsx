import { useState, useEffect, useMemo } from 'react';
import { Search, Moon, Sun, Film, Gamepad2, BookOpen, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toaster } from '@/components/ui/sonner';
import { ItemCard } from '@/components/ItemCard';
import { ItemModal } from '@/components/ItemModal';
import { Top5Card } from '@/components/Top5Card';
import { getItems, subscribeToAllReviews } from '@/lib/supabase';
import type { Item, Category, SortOption } from '@/types';
import './App.css';

function App() {
  // State
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  
  // Filters
  const [category, setCategory] = useState<Category>('all');
  const [genre, setGenre] = useState<string>('all');
  const [sort, setSort] = useState<SortOption>('rating');
  const [search, setSearch] = useState('');

  // Load items
  const loadItems = async () => {
    setLoading(true);
    const data = await getItems();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();

    // Subscribe to realtime updates
    const subscription = subscribeToAllReviews(() => {
      loadItems();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Get unique genres for current category
  const genres = useMemo(() => {
    const filtered = category === 'all' 
      ? items 
      : items.filter(i => i.cat === category);
    const uniqueGenres = [...new Set(filtered.map(i => i.genre))].sort();
    return uniqueGenres;
  }, [items, category]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by category
    if (category !== 'all') {
      result = result.filter(i => i.cat === category);
    }

    // Filter by genre
    if (genre !== 'all') {
      result = result.filter(i => i.genre === genre);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => 
        i.title.toLowerCase().includes(q) ||
        i.genre.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sort === 'rating') {
      result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    } else if (sort === 'name') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'reviews') {
      result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    }

    return result;
  }, [items, category, genre, sort, search]);

  // Top 5 items
  const top5 = useMemo(() => {
    return [...items]
      .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
      .slice(0, 5);
  }, [items]);

  // Category buttons
  const catButtons: { id: Category; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Vše', icon: null },
    { id: 'film', label: 'Filmy', icon: <Film className="mr-1 h-4 w-4" /> },
    { id: 'game', label: 'Hry', icon: <Gamepad2 className="mr-1 h-4 w-4" /> },
    { id: 'book', label: 'Knihy', icon: <BookOpen className="mr-1 h-4 w-4" /> },
  ];

  // Handle category change
  const handleCategoryChange = (newCat: Category) => {
    setCategory(newCat);
    setGenre('all'); // Reset genre when changing category
  };

  // Open modal
  const openModal = (item: Item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  // Toggle theme
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('light');
  };

  // Category labels for display
  const catLabels: Record<string, string> = {
    all: 'Všechny položky',
    film: 'Filmy',
    game: 'Hry',
    book: 'Knihy',
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎬</span>
              <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-xl font-black text-transparent">
                ReviewHub
              </span>
            </div>

            {/* Category buttons */}
            <div className="hidden items-center gap-1 rounded-full bg-muted p-1 md:flex">
              {catButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => handleCategoryChange(btn.id)}
                  className={`flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    category === btn.id
                      ? 'bg-violet-600 text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Hledat..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-40 pl-9 lg:w-56"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile category buttons */}
          <div className="flex items-center gap-1 overflow-x-auto border-t border-border/50 p-2 md:hidden">
            {catButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleCategoryChange(btn.id)}
                className={`flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  category === btn.id
                    ? 'bg-violet-600 text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-violet-500/10 to-transparent px-4 py-16 text-center">
          <h1 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">
            Objevuj. Hodnoť.{' '}
            <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              Sdílej.
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Tvůj ultimátní průvodce světem filmů, her a knih. Přidej recenzi a pomoz ostatním vybrat si.
          </p>
        </section>

        {/* Top 5 */}
        {top5.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pb-8">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold">Top 5 nejlépe hodnocené</h2>
              <Badge className="bg-violet-600">HOT</Badge>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {top5.map((item, index) => (
                <Top5Card
                  key={item.id}
                  item={item}
                  rank={index + 1}
                  onClick={() => openModal(item)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="mx-auto max-w-7xl px-4 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setGenre('all')}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                genre === 'all'
                  ? 'border-violet-600 bg-violet-600 text-white'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              Všechny žánry
            </button>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  genre === g
                    ? 'border-violet-600 bg-violet-600 text-white'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                {g}
              </button>
            ))}
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="ml-auto w-44">
                <SelectValue placeholder="Seřadit podle..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">⭐ Dle hodnocení</SelectItem>
                <SelectItem value="name">🔤 Dle názvu</SelectItem>
                <SelectItem value="reviews">💬 Dle počtu recenzí</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Grid */}
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h2 className="text-lg font-bold">{catLabels[category]}</h2>
            <Badge variant="secondary">{filteredItems.length}</Badge>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-4">😔</p>
              <p className="text-muted-foreground">Žádné výsledky</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => openModal(item)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          <p>© 2026 ReviewHub — Vytvořeno s ❤️ pro milovníky filmů, her a knih</p>
        </footer>

        {/* Modal */}
        <ItemModal
          item={selectedItem}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onReviewAdded={loadItems}
        />

        {/* Toast notifications */}
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
}

export default App;
