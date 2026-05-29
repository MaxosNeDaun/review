import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Účet byl vytvořen. Zkontroluj email pro potvrzení.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border p-8 rounded-2xl w-full max-w-md relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-6 text-foreground text-center">
          {isRegister ? 'Vytvořit účet' : 'Vítejte zpět'}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-violet-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Heslo</label>
            <input
              type="password"
              required
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-violet-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Pracuji...' : isRegister ? 'Zaregistrovat se' : 'Přihlásit se'}
          </button>
        </form>

        <p className="mt-6 text-center text-muted-foreground text-sm">
          {isRegister ? 'Již máte účet?' : 'Nemáte účet?'}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="ml-2 text-violet-500 hover:underline font-medium"
          >
            {isRegister ? 'Přihlaste se' : 'Zaregistrujte se'}
          </button>
        </p>
      </div>
    </div>
  );
}
