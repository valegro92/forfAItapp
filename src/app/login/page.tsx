'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
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
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Errore durante l\'accesso');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1a1f3a] px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[#1e293b] rounded-lg shadow-2xl p-8 border border-[#2dd4bf]/20">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#2dd4bf] to-[#06b6d4] rounded-lg mb-4">
              <span className="text-xl font-bold text-[#0f172a]">AI</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">ForfAIt</h1>
            <p className="text-[#2dd4bf] text-sm font-medium">
              La Cassetta degli AI-trezzi
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tua@email.com"
                required
                className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf] transition"
              />
            </div>

            {/* Code Input */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                Codice di Accesso
              </label>
              <input
                id="code"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="••••••"
                required
                className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf] transition"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] text-[#0f172a] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#2dd4bf]/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#334155]">
            <p className="text-center text-xs text-gray-500">
              Riservato agli iscritti de{' '}
              <span className="text-[#2dd4bf]">La Cassetta degli AI-trezzi</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
