import { useState, useEffect, useMemo } from 'react';
import { Search, Moon, Sun, Film, Gamepad2, BookOpen, Trophy, LogIn, LogOut, ShieldCheck } from 'lucide-react';
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
import { toast } from 'sonner';
import { ItemCard } from '@/components/ItemCard';
import { ItemModal } from '@/components/ItemModal';
import { Top5Card } from '@/components/Top5Card';
import { AuthModal } from '@/components/AuthModal';
import { 
  getItems, 
  subscribeToAllReviews, 
  supabase, 
  getUserRole, 
  getPendingItems, 
  approveItem, 
  makeUserAdmin 
} from '@/lib/supabase';
import type { Item, Category, SortOption } from '@/types';
import './App.css';

export default function App() {
  // --- ZÁKLADNÍ STATE ---
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // --- AUTH & ADMIN STATE ---
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingItems, setPendingItems] = useState<Item[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  
  // --- FILTRY ---
  const [category, setCategory] = useState<Category>('all');
  const [genre, setGenre] = useState<string>('all');
  const [sort, setSort] = useState<SortOption>('rating');
  const [search, setSearch] = useState('');

  // --- NAČÍTÁNÍ DAT ---
  const loadData = async () => {
    setLoading(true);
    const data = await getItems();
    setItems(data);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const role = await getUserRole(session.user.id);
      setIsAdmin(role === 'admin');
      if (role === 'admin') {
        const pending = await getPendingItems();
        setPendingItems(pending);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getUserRole(session.user.id).then(role => setIsAdmin(role === 'admin'));
      } else {
        setIsAdmin(false);
      }
    });

    const reviewSub = subscribeToAllReviews(() => loadData());
    return () => {
      authSub.unsubscribe();
      reviewSub.unsubscribe();
    };
  }, []);

  // --- MEMOIZOVANÉ VÝPOČTY (Opravuje TS6133) ---
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
        
        {/* NAVIGACE */}
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
                  {id === 'all' ? 'Vše' : id === 'film' ? <Film className="inline h-4 w-4 mr-1"/> : id === 'game' ? <Gamepad2 className="inline h-4 w-4 mr-1"/> : <BookOpen className="inline h-4 w-4 mr-1"/>}
                  {id !== 'all' && id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Hledat..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 pl-9 rounded-full bg-muted/50 border-none h-9" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setDarkMode(!darkMode); document.documentElement.classList.toggle('light'); }}>
                {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-violet-600" />}
              </Button>
              {user ? (
                <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="text-muted-foreground hover:text-red-500">
                  <LogOut className="h-4 w-4 mr-2" /> Odhlásit
                </Button>
              ) : (
                <Button onClick={() => setAuthModalOpen(true)} className="bg-violet-600 hover:bg-violet-500 rounded-full">Přihlásit</Button>
              )}
            </div>
          </div>
        </nav>

        {/* HERO SEKCE */}
        <header className="px-4 py-16 text-center">
          <h1 className="text-5xl font-black mb-4 md:text-7xl">Hodnoť. Sdílej. <span className="text-violet-500">Bav se.</span></h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg mb-8">Nejlepší komunitní databáze pro filmy, hry a knihy.</p>
          
          {user && (
            <Button size="lg" className="rounded-full bg-foreground text-background font-bold px-8 transition-transform hover:scale-105">
              + Navrhnout novou pecku
            </Button>
          )}

          {/* ADMIN DASHBOARD */}
          {isAdmin && (
            <div className="mt-12 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl max-w-5xl mx-auto text-left backdrop-blur-md">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-red-500 font-black flex items-center gap-2 uppercase tracking-widest"><ShieldCheck /> Admin Panel ({pendingItems.length})</h2>
                <div className="flex gap-2 w-full md:w-auto">
                  <Input placeholder="Email nového admina..." value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className="bg-background h-9 text-sm" />
                  <Button size="sm" variant="destructive" onClick={async () => { await makeUserAdmin(newAdminEmail); toast.success('Admin role přidělena!'); setNewAdminEmail(''); }}>Povýšit</Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pendingItems.map(item => (
                  <div key={item.id} className="bg-background/50 p-4 rounded-xl flex justify-between items-center border border-border">
                    <span className="font-bold truncate mr-2">{item.title}</span>
                    <Button size="sm" className="bg-green-600 hover:bg-green-500 shrink-0" onClick={async () => { await approveItem(String(item.id)); loadData(); toast.success('Schváleno!'); }}>Schválit</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* TOP 5 SÍŇ SLÁVY */}
        {top5.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 mb-16">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><Trophy className="text-amber-500 h-8 w-8" /> SÍŇ SLÁVY</h2>
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
              {top5.map((item, i) => (
                <Top5Card key={item.id} item={item} rank={i + 1} onClick={() => { setSelectedItem(item); setModalOpen(true); }} />
              ))}
            </div>
          </section>
        )}

        {/* FILTRY A SEZNAM */}
        <main className="mx-auto max-w-7xl px-4 pb-20">
          <div className="flex flex-col md:flex-row gap-6 mb-12 justify-between items-start md:items-center">
            <div className="flex gap-2 flex-wrap">
              <Badge className="cursor-pointer px-4 py-1.5 rounded-full" variant={genre === 'all' ? 'default' : 'outline'} onClick={() => setGenre('all')}>Všechny žánry</Badge>
              {genres.map(g => (
                <Badge key={g} className="cursor-pointer px-4 py-1.5 rounded-full" variant={genre === g ? 'default' : 'outline'} onClick={() => setGenre(g)}>{g}</Badge>
              ))}
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-56 rounded-xl bg-muted/30 border-none"><SelectValue placeholder="Seřadit dle..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">⭐ Nejlepší hodnocení</SelectItem>
                <SelectItem value="name">🔤 Podle názvu</SelectItem>
                <SelectItem value="reviews">💬 Počtu recenzí</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
               {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} onClick={() => { setSelectedItem(item); setModalOpen(true); }} />
              ))}
            </div>
          )}
        </main>

        {/* MODALY */}
        <ItemModal item={selectedItem} open={modalOpen} onOpenChange={setModalOpen} onReviewAdded={loadData} />
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        <Toaster position="bottom-right" richColors />
      </div>
    </div>
  );
}
