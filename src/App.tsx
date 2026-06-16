import { useState, useEffect, useMemo } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { AuthModal } from '@/components/AuthModal';
import { getItems, subscribeToAllReviews, supabase } from '@/lib/supabase';
import type { Item, Category, SortOption } from '@/types';
import './App.css';

const GENRES = ['Akční', 'Drama', 'Fantasy', 'Horor', 'Sci-Fi'];

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [category, setCategory] = useState<Category>('all');
  const [genre, setGenre] = useState<string>('all');
  const [sort, setSort] = useState<SortOption>('rating');

  const loadData = async () => {
    const data = await getItems();
    setItems(data);
  };

  // Always dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    loadData();

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    const reviewSub = subscribeToAllReviews(() => loadData());
    return () => {
      authSub.unsubscribe();
      reviewSub.unsubscribe();
    };
  }, []);



  const top5All = useMemo(() => {
    return [...items]
      .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
      .slice(0, 5);
  }, [items]);

  const top5Films = useMemo(() => {
    return [...items]
      .filter(i => i.cat === 'film')
      .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
      .slice(0, 5);
  }, [items]);

  const top5Games = useMemo(() => {
    return [...items]
      .filter(i => i.cat === 'game')
      .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
      .slice(0, 5);
  }, [items]);

  const top5Books = useMemo(() => {
    return [...items]
      .filter(i => i.cat === 'book')
      .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
      .slice(0, 5);
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (category !== 'all') result = result.filter(i => i.cat === category);
    if (genre !== 'all') result = result.filter(i => i.genre === genre);

    if (sort === 'rating') result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    else if (sort === 'name') result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'reviews') result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    return result;
  }, [items, category, genre, sort]);

  const openItem = (item: Item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen dark">
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">

        {/* NAV */}
        <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <span className="font-black text-xl uppercase tracking-tighter text-foreground">
              ReviewHub
            </span>

            <div className="hidden lg:flex items-center gap-1 rounded-full bg-muted p-1">
              {['all', 'film', 'game', 'book'].map((id) => (
                <button
                  key={id}
                  onClick={() => { setCategory(id as Category); setGenre('all'); }}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${category === id ? 'bg-violet-600 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {id === 'all' ? 'Vše' : id === 'film' ? 'Filmy' : id === 'game' ? 'Hry' : 'Knihy'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="text-muted-foreground hover:text-red-500">
                    <LogOut className="h-4 w-4 mr-2" /> Odhlásit
                  </Button>
                  <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                </div>
              ) : (
                <Button onClick={() => setAuthModalOpen(true)} className="bg-violet-600 hover:bg-violet-500 rounded-full px-6 font-bold">
                  <LogIn className="h-4 w-4 mr-2" /> Přihlásit
                </Button>
              )}
            </div>
          </div>
        </nav>

        {/* HEADER */}
        <header className="px-4 py-20 text-center">
          <h1 className="text-6xl font-black mb-4 tracking-tight md:text-8xl">
           <span className="text-violet-600">Recenze</span>
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl font-medium">
            Komunitní hodnocení
          </p>
        </header>

        {/* TOP 5 */}
        <div className="mx-auto max-w-7xl px-4 mb-20">

          {category === 'all' && top5All.length > 0 && (
            <section>
              <h2 className="text-2xl font-black mb-8">
                TOP 5
              </h2>
              <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                {top5All.map((item, i) => (
                  <Top5Card key={item.id} item={item} rank={i + 1} onClick={() => openItem(item)} />
                ))}
              </div>
            </section>
          )}

          {category === 'film' && top5Films.length > 0 && (
            <section>
              <h2 className="text-2xl font-black mb-8">
                TOP 5 Filmy
              </h2>
              <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                {top5Films.map((item, i) => (
                  <Top5Card key={item.id} item={item} rank={i + 1} onClick={() => openItem(item)} />
                ))}
              </div>
            </section>
          )}

          {category === 'game' && top5Games.length > 0 && (
            <section>
              <h2 className="text-2xl font-black mb-8">
                TOP 5 Hry
              </h2>
              <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                {top5Games.map((item, i) => (
                  <Top5Card key={item.id} item={item} rank={i + 1} onClick={() => openItem(item)} />
                ))}
              </div>
            </section>
          )}

          {category === 'book' && top5Books.length > 0 && (
            <section>
              <h2 className="text-2xl font-black mb-8">
                TOP 5 Knihy
              </h2>
              <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                {top5Books.map((item, i) => (
                  <Top5Card key={item.id} item={item} rank={i + 1} onClick={() => openItem(item)} />
                ))}
              </div>
            </section>
          )}

        </div>

        {/* MAIN GRID */}
        <main className="mx-auto max-w-7xl px-4 pb-20">
          <div className="flex flex-col md:flex-row gap-6 mb-12 justify-between items-center border-t border-border/50 pt-12">
            <div className="flex gap-2 flex-wrap">
              <Badge
                className="cursor-pointer px-4 py-2 rounded-full text-sm font-bold"
                variant={genre === 'all' ? 'default' : 'outline'}
                onClick={() => setGenre('all')}
              >
                Všechny žánry
              </Badge>
              {GENRES.map(g => (
                <Badge
                  key={g}
                  className="cursor-pointer px-4 py-2 rounded-full text-sm font-bold"
                  variant={genre === g ? 'default' : 'outline'}
                  onClick={() => setGenre(g)}
                >
                  {g}
                </Badge>
              ))}
            </div>

            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-56 rounded-xl bg-muted/50 border-none h-11 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Hodnocení</SelectItem>
                <SelectItem value="name">Název</SelectItem>
                <SelectItem value="reviews">Počet recenzí</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {filteredItems.map(item => (
              <ItemCard key={item.id} item={item} onClick={() => openItem(item)} />
            ))}
          </div>
        </main>

        <ItemModal item={selectedItem} open={modalOpen} onOpenChange={setModalOpen} onReviewAdded={loadData} />
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        <Toaster position="bottom-right" richColors />
      </div>
    </div>
  );
}
