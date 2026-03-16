'use client';

import Link from 'next/link';
import { Calculator, BarChart3, Calendar, Building2, ArrowRight, Shield, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950" style={{ backgroundColor: '#0f172a' }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-slate-800" style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-white font-bold text-xl">ForfAIt</span>
          </div>
          <Link href="/login">
            <button className="px-6 py-2 rounded-lg font-medium text-slate-950 bg-white hover:bg-slate-100 transition-colors">
              Accedi
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className={`text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-block mb-6 px-4 py-2 rounded-full border border-slate-700" style={{ backgroundColor: '#1e293b' }}>
            <span className="text-sm text-slate-300">🧰 Uno strumento de La Cassetta degli AI-trezzi</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Sai davvero <br className="hidden sm:inline" />
            quanto puoi spendere?
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            Il tuo cruscotto fiscale per il Regime Forfettario. Calcola il netto spendibile, scorpora le fatture, pianifica le scadenze. Tutto in un unico posto.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/login">
              <button className="px-8 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-teal-500/50" style={{
                background: 'linear-gradient(135deg, #2dd4bf, #14b8a6)'
              }}>
                Accedi al tuo cruscotto <ArrowRight size={20} />
              </button>
            </Link>
          </div>
          
          <p className="text-sm text-slate-500">Riservato agli iscritti della newsletter</p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-white text-center mb-2">
            Il problema non sono le tasse.
          </h2>
          <p className="text-2xl text-center">
            È <span style={{ color: '#2dd4bf' }} className="font-bold">non sapere quanto puoi spendere.</span>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '💰',
              title: 'Incassi una fattura',
              description: 'Ma una parte non è tua — è per tasse e contributi'
            },
            {
              icon: '👁️',
              title: 'Non vedi quanto mettere da parte',
              description: 'Senza un calcolo preciso, rischi di spendere troppo'
            },
            {
              icon: '⚡',
              title: 'Poi arriva giugno',
              description: 'Saldo + acconti. E scopri che quei soldi non c\'erano.'
            }
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-xl border border-slate-700 transition-all hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10" style={{ backgroundColor: '#1e293b' }}>
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-white font-semibold mb-2">{item.title}</h3>
              <p className="text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-white">
            Tutto quello che ti serve, niente di più
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              icon: BarChart3,
              title: 'Netto Spendibile',
              description: 'Sai in tempo reale quanto puoi davvero spendere, al netto di tasse, contributi e imprevisti.'
            },
            {
              icon: Calculator,
              title: 'Scorporo Fattura',
              description: 'Inserisci il totale del cliente, ottieni compenso e contributo. Con il testo pronto da copiare in fattura.'
            },
            {
              icon: Calendar,
              title: 'Scadenziario',
              description: 'Le tue scadenze fiscali calcolate in automatico: giugno e novembre, saldo e acconti.'
            },
            {
              icon: Building2,
              title: 'Tutte le Casse',
              description: 'Gestione Separata, Inarcassa, ENPAM, Cassa Forense... configura la tua cassa previdenziale.'
            }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="p-8 rounded-xl border border-slate-700 transition-all hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10" style={{ backgroundColor: '#1e293b' }}>
                <div className="mb-4 inline-block p-3 rounded-lg" style={{ backgroundColor: 'rgba(45, 212, 191, 0.1)' }}>
                  <Icon size={28} style={{ color: '#2dd4bf' }} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-white">
            Come funziona
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Configura',
              description: 'Imposta il tuo codice ATECO, la cassa previdenziale e l\'aliquota.'
            },
            {
              step: '2',
              title: 'Registra',
              description: 'Aggiungi i tuoi incassi man mano che arrivano.'
            },
            {
              step: '3',
              title: 'Controlla',
              description: 'Il cruscotto ti mostra in tempo reale quanto puoi spendere.'
            }
          ].map((item, idx) => (
            <div key={idx} className="relative">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-6 flex items-center justify-center font-bold text-lg" style={{ backgroundColor: '#2dd4bf', color: '#0f172a' }}>
                  {item.step}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.description}</p>
              </div>
              {idx < 2 && (
                <div className="hidden md:block absolute top-6 -right-4 text-teal-600">
                  <ChevronRight size={24} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-12 rounded-2xl border-2 relative overflow-hidden" style={{
          backgroundColor: '#1e293b',
          borderColor: '#2dd4bf',
          boxShadow: '0 0 30px rgba(45, 212, 191, 0.1)'
        }}>
          <div className="relative z-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Pronto a vedere i tuoi numeri veri?
            </h2>
            <Link href="/login">
              <button className="px-8 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 mx-auto transition-all hover:shadow-lg hover:shadow-teal-500/50 mb-4" style={{
                background: 'linear-gradient(135deg, #2dd4bf, #14b8a6)'
              }}>
                Accedi al tuo cruscotto ForfAIt <ArrowRight size={20} />
              </button>
            </Link>
            <p className="text-slate-400 text-sm">
              Strumento gratuito per gli iscritti de La Cassetta degli AI-trezzi
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-white font-bold">F</span>
                </div>
                <span className="text-white font-bold">ForfAIt</span>
              </div>
              <p className="text-slate-500 text-sm">
                Uno strumento de La Cassetta degli AI-trezzi
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm mb-2">
                Creato da <span className="font-semibold">Valentino Grossi</span>
              </p>
              <p className="text-slate-500 text-xs">
                Non sostituisce la consulenza del commercialista.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-center gap-6 text-sm">
            <a href="#" className="text-slate-400 hover:text-slate-300 transition-colors">
              Privacy
            </a>
            <a href="#" className="text-slate-400 hover:text-slate-300 transition-colors">
              Termini
            </a>
          </div>

          <div className="text-center mt-8 text-slate-600 text-xs">
            <p>© 2026 ForfAIt. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}