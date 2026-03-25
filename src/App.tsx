import { useState, useEffect, useMemo } from 'react';
import { Search, Moon, Sun, Film, Gamepad2, BookOpen, Trophy, LogIn, LogOut } from 'lucide-react';
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
import { AuthModal } from '@/components/AuthModal';
import { SuggestModal } from '@/components/SuggestModal';
import { getItems, subscribeToAllReviews, supabase } from '@/lib/supabase';
import type { Item, Category, SortOption } from '@/types';
import './App.css';

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [category, setCategory] = useState<Category>('all');
  const [genre, setGenre] = useState<string>('all');
  const [sort, setSort] = useState<SortOption>('rating');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await getItems();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    
    // Sledování uživatele
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const reviewSub = subscribeToAllReviews(() => loadData());
    return () => {
      authSub.unsubscribe();
      reviewSub.unsubscribe();
    };
  }, []);

  const genres = useMemo(() => {
    const filtered = category === 'all' ? items : items.filter(i => i.cat === category);
    return [...new Set(filtered.map(i => i.genre))].sort();
  }, [items, category]);

  const top5 = useMemo(() => {
    return [...items].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 5);
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (category !== 'all') result = result.filter(i => i.cat === category);
    if (genre !== 'all') result = result.filter(i => i.genre === genre);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => i.title.toLowerCase().includes(q) || i.genre.toLowerCase().includes(q));
    }
    if (sort === 'rating') result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    else if (sort === 'name') result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'reviews') result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    return result;
  }, [items, category, genre, sort, search]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        
        <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2 font-black text-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              <span>🎬</span> ReviewHub
            </div>

            <div className="hidden lg:flex items-center gap-1 rounded-full bg-muted p-1">
              {['all', 'film', 'game', 'book'].map((id) => (
                <button
                  key={id}
                  onClick={() => { setCategory(id as Category); setGenre('all'); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === id ? 'bg-violet-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {id !== 'all' && id.charAt(0).toUpperCase() + id.slice(1)}
                  {id === 'all' && 'Vše'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => { setDarkMode(!darkMode); document.documentElement.classList.toggle('light'); }}>
                {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" />}
              </Button>
              {user ? (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="text-muted-foreground">
                    <LogOut className="h-4 w-4 mr-2" /> Odhlásit
                  </Button>
                  <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.email?.[0].toUpperCase()}
                  </div>
                </div>
              ) : (
                <Button onClick={() => setAuthModalOpen(true)} className="bg-violet-600 hover:bg-violet-500 rounded-full">
                  <LogIn className="h-4 w-4 mr-2" /> Přihlásit
                </Button>
              )}
            </div>
          </div>
        </nav>

        <header className="px-4 py-16 text-center">
          <h1 className="text-5xl font-black mb-4 md:text-7xl">ReviewHub</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg mb-8">Komunitní recenze filmů, her a knih.</p>
          
          {user && (
            <Button size="lg" onClick={() => setSuggestModalOpen(true)} className="rounded-full bg-foreground text-background font-bold px-8">
              + Přidat nový kousek
            </Button>
          )}
        </header>

        {top5.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 mb-16">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><Trophy className="text-amber-500" /> SÍŇ SLÁVY</h2>
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
              {top5.map((item, i) => (
                <Top5Card key={item.id} item={item} rank={i + 1} onClick={() => { setSelectedItem(item); setModalOpen(true); }} />
              ))}
            </div>
          </section>
        )}

        <main className="mx-auto max-w-7xl px-4 pb-20">
          <div className="flex flex-col md:flex-row gap-6 mb-12 justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              <Badge className="cursor-pointer" variant={genre === 'all' ? 'default' : 'outline'} onClick={() => setGenre('all')}>Vše</Badge>
              {genres.map(g => (
                <Badge key={g} className="cursor-pointer" variant={genre === g ? 'default' : 'outline'} onClick={() => setGenre(g)}>{g}</Badge>
              ))}
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">⭐ Hodnocení</SelectItem>
                <SelectItem value="name">🔤 Název</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredItems.map(item => (
              <ItemCard key={item.id} item={item} onClick={() => { setSelectedItem(item); setModalOpen(true); }} />
            ))}
          </div>
        </main>

        <ItemModal item={selectedItem} open={modalOpen} onOpenChange={setModalOpen} onReviewAdded={loadData} />
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        <SuggestModal open={suggestModalOpen} onOpenChange={setSuggestModalOpen} />
        <Toaster richColors />
      </div>
    </div>
  );
}
