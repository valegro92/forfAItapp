'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Errore durante l'accesso");
        setLoading(false);
        return;
      }

      // Store token in localStorage as backup
      localStorage.setItem('forfait-token', data.token);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Errore di connessione. Riprova più tardi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#292524] px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[#2D2D2D] rounded-xl shadow-2xl p-8 border border-[#454545]">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#2DD4A8] rounded-lg mb-4">
              <span className="text-xl font-bold text-[#2D2D2D]">AI</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">ForfAIt</h1>
            <p className="text-[#2DD4A8] text-sm font-medium">
              La Cassetta degli AI-trezzi
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#A9A8A7] mb-2">
                Inserisci la tua email di Substack
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="la-tua@email.it"
                required
                className="w-full px-4 py-2.5 bg-[#292524] border border-[#454545] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#2DD4A8] focus:ring-1 focus:ring-[#2DD4A8] transition"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg text-[#F87171] text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-2.5 px-4 bg-[#2DD4A8] text-[#2D2D2D] font-semibold rounded-lg hover:bg-[#5EEAD2] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Verifico...' : 'Accedi'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#454545]">
            <p className="text-center text-sm text-[#A9A8A7] mb-3">
              Non sei ancora abbonato?
            </p>
            <a
              href="https://cassettadegliaitrezzi.it"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-2 px-4 border border-[#0D9488] text-[#2DD4A8] rounded-lg text-sm hover:bg-[#0D9488]/20 transition"
            >
              Scopri L&apos;Officina →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
