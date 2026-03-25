import { useState, useEffect, useMemo } from 'react';
import { Search, Moon, Sun, Film, Gamepad2, BookOpen, Trophy, LogIn, LogOut, User, ShieldCheck } from 'lucide-react';
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
import { AuthModal } from '@/components/AuthModal'; // Budeme potřebovat tuto novou komponentu
import { getItems, subscribeToAllReviews, supabase, getUserRole } from '@/lib/supabase';
import type { Item, Category, SortOption } from '@/types';
import './App.css';

function App() {
  // --- STATE ---
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // --- AUTH STATE ---
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // --- FILTERS STATE ---
  const [category, setCategory] = useState<Category>('all');
  const [genre, setGenre] = useState<string>('all');
  const [sort, setSort] = useState<SortOption>('rating');
  const [search, setSearch] = useState('');

  // --- LOGIKA NAČÍTÁNÍ ---
  const loadItems = async () => {
    setLoading(true);
    const data = await getItems();
    setItems(data);
    setLoading(false);
  };

  const checkUser = async (currentUser: any) => {
    setUser(currentUser);
    if (currentUser) {
      const role = await getUserRole(currentUser.id);
      setIsAdmin(role === 'admin');
    } else {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    loadItems();

    // Sledování přihlášení
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session?.user ?? null);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session?.user ?? null);
    });

    // Realtime recenze
    const reviewSub = subscribeToAllReviews(() => {
      loadItems();
    });

    return () => {
      authSub.unsubscribe();
      reviewSub.unsubscribe();
    };
  }, []);

  // --- FILTROVÁNÍ (useMemo) ---
  const genres = useMemo(() => {
    const filtered = category === 'all' ? items : items.filter(i => i.cat === category);
    return [...new Set(filtered.map(i => i.genre))].sort();
  }, [items, category]);

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (category !== 'all') result = result.filter(i => i.cat === category);
    if (genre !== 'all') result = result.filter(i => i.genre === genre);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => 
        i.title.toLowerCase().includes(q) || i.genre.toLowerCase().includes(q)
      );
    }
    // Sort
    if (sort === 'rating') result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    else if (sort === 'name') result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'reviews') result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    return result;
  }, [items, category, genre, sort, search]);

  const top5 = useMemo(() => {
    return [...items].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 5);
  }, [items]);

  // --- POMOCNÉ FUNKCE ---
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('light');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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

            {/* Desktop Category buttons */}
            <div className="hidden items-center gap-1 rounded-full bg-muted p-1 lg:flex">
              {['all', 'film', 'game', 'book'].map((id) => (
                <button
                  key={id}
                  onClick={() => { setCategory(id as Category); setGenre('all'); }}
                  className={`flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    category === id ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {id === 'film' && <Film className="mr-1 h-4 w-4" />}
                  {id === 'game' && <Gamepad2 className="mr-1 h-4 w-4" />}
                  {id === 'book' && <BookOpen className="mr-1 h-4 w-4" />}
                  {id === 'all' ? 'Vše' : id.charAt(0).toUpperCase() + id.slice(1) + 'y'}
                </button>
              ))}
            </div>

            {/* Right side - Search & Auth */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Hledat..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-40 pl-9 lg:w-56 rounded-full bg-muted/50 border-none"
                />
              </div>

              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-violet-600" />}
              </Button>

              <div className="h-8 w-[1px] bg-border/50 mx-1 hidden sm:block"></div>

              {user ? (
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Badge variant="outline" className="hidden sm:flex border-red-500 text-red-500 gap-1 px-2 py-1 bg-red-500/5">
                      <ShieldCheck className="h-3 w-3" /> Admin
                    </Badge>
                  )}
                  <Button variant="ghost" className="hidden sm:flex gap-2 text-muted-foreground" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" /> Odhlásit
                  </Button>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {user.email?.[0].toUpperCase()}
                  </div>
                </div>
              ) : (
                <Button onClick={() => setAuthModalOpen(true)} className="rounded-full bg-violet-600 hover:bg-violet-500 gap-2 shadow-lg shadow-violet-500/20">
                  <LogIn className="h-4 w-4" /> <span className="hidden sm:inline">Přihlásit</span>
                </Button>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 py-20 text-center">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(124,58,237,0.15),transparent)]"></div>
          <h1 className="mb-6 text-5xl font-black tracking-tight md:text-7xl">
            Objevuj. Hodnoť.{' '}
            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent">
              Sdílej.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Komunitní platforma pro milovníky příběhů. Tvůj hlas rozhoduje o tom, co stojí za to sledovat, hrát nebo číst.
          </p>
          {isAdmin && (
            <div className="mt-8">
              <Button size="lg" className="bg-white text-black hover:bg-slate-200 rounded-full font-bold px-8">
                + Přidat nový kousek
              </Button>
            </div>
          )}
        </section>

        {/* Top 5 Section */}
        {top5.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pb-12">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-400" />
                <h2 className="text-xl font-bold italic tracking-tight uppercase">Síň slávy</h2>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
              {top5.map((item, index) => (
                <Top5Card
                  key={item.id}
                  item={item}
                  rank={index + 1}
                  onClick={() => { setSelectedItem(item); setModalOpen(true); }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Main Content & Filters */}
        <main className="mx-auto max-w-7xl px-4 pb-24">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setGenre('all')}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  genre === 'all' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Všechny žánry
              </button>
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                    genre === g ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-full md:w-56 rounded-xl border-border bg-background">
                <SelectValue placeholder="Seřadit podle..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">⭐ Nejlépe hodnocené</SelectItem>
                <SelectItem value="name">🔤 Abecedně (A-Z)</SelectItem>
                <SelectItem value="reviews">💬 Podle počtu diskuzí</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          <div className="mb-8 flex items-center gap-3 border-l-4 border-violet-600 pl-4">
             <h2 className="text-2xl font-black uppercase tracking-wider">
               {category === 'all' ? 'Všechny kousky' : category === 'film' ? 'Filmové hity' : category === 'game' ? 'Herní pecky' : 'Knižní bestsellery'}
             </h2>
             <Badge className="bg-muted text-muted-foreground font-mono">{filteredItems.length}</Badge>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[400px] animate-pulse rounded-2xl bg-muted/50" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-6xl">🏜️</div>
              <h3 className="text-xl font-bold">Tady nic není...</h3>
              <p className="text-muted-foreground">Zkus změnit filtry nebo vyhledávání.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => { setSelectedItem(item); setModalOpen(true); }}
                />
              ))}
            </div>
          )}
        </main>

        {/* Modaly a doplňky */}
        <ItemModal
          item={selectedItem}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onReviewAdded={loadItems}
        />
        
        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
        />

        <Toaster position="top-center" richColors />
        
        <footer className="border-t border-border/50 py-12 px-4">
           <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-sm">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="text-xl">🎬</span> ReviewHub
              </div>
              <p>© 2026 Vytvořeno pro komunitu milovníků kultury</p>
           </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
