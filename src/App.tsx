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

function App() {
  // --- STATE ---
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
    
    // Načtení admin dat, pokud je uživatel admin
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const role = await getUserRole(session.user.id);
      if (role === 'admin') {
        const pending = await getPendingItems();
        setPendingItems(pending);
      }
    }
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session?.user ?? null);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session?.user ?? null);
    });

    const reviewSub = subscribeToAllReviews(() => {
      loadItems();
    });

    return () => {
      authSub.unsubscribe();
      reviewSub.unsubscribe();
    };
  }, []);

  // --- ADMIN AKCE ---
  const handleApprove = async (itemId: string) => {
    const success = await approveItem(itemId);
    if (success) {
      toast.success('Položka schválena!');
      loadItems();
    }
  };

  const handleMakeAdmin = async () => {
    if (!newAdminEmail) return;
    const success = await makeUserAdmin(newAdminEmail);
    if (success) {
      toast.success(`Uživatel ${newAdminEmail} je nyní adminem.`);
      setNewAdminEmail('');
    }
  };

  // --- FILTROVÁNÍ ---
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
    if (sort === 'rating') result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    else if (sort === 'name') result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'reviews') result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    return result;
  }, [items, category, genre, sort, search]);

  const top5 = useMemo(() => {
    return [...items].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 5);
  }, [items]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('light');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎬</span>
              <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-xl font-black text-transparent">
                ReviewHub
              </span>
            </div>

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

              {user ? (
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Badge variant="outline" className="hidden sm:flex border-red-500 text-red-500 gap-1 bg-red-500/5">
                      <ShieldCheck className="h-3 w-3" /> Admin
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => supabase.auth.signOut()} className="rounded-full">
                    <LogOut className="h-4 w-4" />
                  </Button>
                  <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.email?.[0].toUpperCase()}
                  </div>
                </div>
              ) : (
                <Button onClick={() => setAuthModalOpen(true)} className="rounded-full bg-violet-600 hover:bg-violet-500">
                  <LogIn className="h-4 w-4 mr-2" /> Přihlásit
                </Button>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="px-4 py-20 text-center">
          <h1 className="mb-6 text-5xl font-black md:text-7xl">
            Objevuj. Hodnoť. <span className="text-violet-500">Sdílej.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Tvůj hlas rozhoduje o tom, co stojí za to sledovat, hrát nebo číst.
          </p>
          
          {user && (
            <div className="mt-8">
              <Button size="lg" className="rounded-full bg-white text-black hover:bg-slate-200 font-bold px-8">
                + Navrhnout novou pecku
              </Button>
            </div>
          )}
        </section>

        {/* Admin Dashboard */}
        {isAdmin && pendingItems.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pb-12">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-red-500 font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
                    <ShieldCheck className="h-4 w-4" /> Čeká na schválení
                  </h2>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Email nového admina..." 
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="h-8 text-xs w-48"
                    />
                    <Button size="sm" onClick={handleMakeAdmin} variant="destructive">Povýšit</Button>
                  </div>
               </div>
               <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                 {pendingItems.map(item => (
                   <div key={item.id} className="bg-background border p-4 rounded-xl flex justify-between items-center">
                     <span className="font-bold">{item.title}</span>
                     <Button size="sm" onClick={() => handleApprove(String(item.id))} className="bg-green-600 hover:bg-green-500">Schválit</Button>
                   </div>
                 ))}
               </div>
            </div>
          </section>
        )}

        {/* Main Grid */}
        <main className="mx-auto max-w-7xl px-4 pb-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => { setSelectedItem(item); setModalOpen(true); }}
              />
            ))}
          </div>
        </main>

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
      </div>
    </div>
  );
}

export default App; // DŮLEŽITÉ: Export default opraví chybu v main.tsx
