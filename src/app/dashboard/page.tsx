'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Settings, LogOut, Plus, Copy, Check, Calendar, TrendingUp, Wallet,
  Calculator, AlertTriangle, ChevronDown, Home, FileText, Clock, Cog
} from 'lucide-react';
import {
  calcolaNettoSpendibile, calcolaScorporo, generaScadenze,
  getIncassiMensili, calcolaBolli, CODICI_ATECO, getAtecoCoefficiente,
  type FiscalProfile, type Incasso, type CostoFisso, type NettoSpendibile, type ScadenzaFiscale, type BolliSummary
} from '@/lib/fiscal-engine';
import Impostazioni from '@/components/Impostazioni';

const GESTION_OPTIONS = [
  { value: 'separata', label: 'Gestione Separata INPS' },
  { value: 'artigiani', label: 'Artigiani (INPS)' },
  { value: 'commercianti', label: 'Commercianti (INPS)' },
  { value: 'inarcassa', label: 'Inarcassa (Ingegneri e Architetti)' },
  { value: 'enpam', label: 'ENPAM (Medici)' },
  { value: 'cipag', label: 'CIPAG (Geometri)' },
  { value: 'eppi', label: 'EPPI (Periti Industriali)' },
  { value: 'enpap', label: 'ENPAP (Psicologi)' },
  { value: 'cnpadc', label: 'CNPADC (Dottori Commercialisti)' },
  { value: 'cassa_forense', label: 'Cassa Forense (Avvocati)' },
  { value: 'enpab', label: 'ENPAB (Biologi)' },
  { value: 'enpav', label: 'ENPAV (Veterinari)' },
  { value: 'inpgi', label: 'INPGI (Giornalisti)' },
  { value: 'altra_cassa', label: 'Altra cassa (manuale)' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fiscal profile state
  const [profile, setProfile] = useState<FiscalProfile | null>(null);
  const [incassi, setIncassi] = useState<Incasso[]>([]);
  const [costi, setCosti] = useState<CostoFisso[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'anno' | 'aliquota' | 'ateco' | 'gestione' | 'previdenziale'>('anno');
  const [onboardingData, setOnboardingData] = useState({
    annoAperturaPIVA: new Date().getFullYear(),
    aliquotaImposta: 5 as 5 | 15,
    codiceATECO: '62.01.00',
    gestionePrevidenziale: 'separata' as FiscalProfile['gestionePrevidenziale'],
    aliquotaPrevidenziale: 0.2607,
  });
  const [atecoSearch, setAtecoSearch] = useState('');
  const [filteredAtecoCodici, setFilteredAtecoCodici] = useState(CODICI_ATECO);

  // Dashboard data
  const [netto, setNetto] = useState<NettoSpendibile | null>(null);
  const [scadenze, setScadenze] = useState<ScadenzaFiscale[]>([]);
  const [mensiliData, setMensiliData] = useState<any[]>([]);
  const [bolliSummary, setBolliSummary] = useState<BolliSummary | null>(null);
  const [bolliPagati, setBolliPagati] = useState(false);

  // Form states
  const [newIncasso, setNewIncasso] = useState({ importo: '', data: '', descrizione: '', cliente: '' });
  const [scorporoInput, setScorporoInput] = useState({ totaleDaPagare: '', marcaDaBollo: '2', aliquotaContributo: '0.04' });
  const [scorporoResult, setScorporoResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Format number for Italian locale
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('forfait-token');
    if (!token) {
      router.push('/login');
      return;
    }

    const savedProfile = localStorage.getItem('forfait-profile');
    const savedIncassi = localStorage.getItem('forfait-incassi');
    const savedCosti = localStorage.getItem('forfait-costi');

    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfile(parsedProfile);

      const parsedIncassi = savedIncassi ? JSON.parse(savedIncassi) : [];
      const parsedCosti = savedCosti ? JSON.parse(savedCosti) : [];

      setIncassi(parsedIncassi);
      setCosti(parsedCosti);
      setShowOnboarding(false);
    } else {
      setShowOnboarding(true);
    }

    setLoading(false);
  }, [router]);

  // Calculate fiscal data whenever profile or data changes
  useEffect(() => {
    if (profile && incassi) {
      const nettoCals = calcolaNettoSpendibile(profile, incassi, costi);
      setNetto(nettoCals);

      const scadenzeList = generaScadenze(selectedYear, profile, incassi);
      setScadenze(scadenzeList);

      const mensili = getIncassiMensili(incassi, selectedYear);
      setMensiliData(mensili);

      // Calculate bolli
      const bolli = calcolaBolli(incassi, selectedYear);
      const savedBolliPagati = localStorage.getItem(`forfait-bolli-pagati-${selectedYear}`);
      const isPagato = savedBolliPagati === 'true';
      bolli.bolliPagati = isPagato;
      setBolliSummary(bolli);
      setBolliPagati(isPagato);
    }
  }, [profile, incassi, costi, selectedYear]);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    const newProfile: FiscalProfile = {
      ...onboardingData,
      accontiImpostaVersati: 0,
      accontiPrevidenzaVersati: 0,
      cuscinettoPercentuale: 10,
      bloccaFondiGiorni: 45,
      baseCuscinetto: 'incassi',
      riservaPersonale: 0,
      saldoInizialeCC: 0,
      coefficienteRedditivita: getAtecoCoefficiente(onboardingData.codiceATECO),
    };

    setProfile(newProfile);
    localStorage.setItem('forfait-profile', JSON.stringify(newProfile));
    localStorage.setItem('forfait-incassi', JSON.stringify([]));
    localStorage.setItem('forfait-costi', JSON.stringify([]));
    setShowOnboarding(false);
  };

  // Handle adding incasso
  const handleAddIncasso = () => {
    if (!newIncasso.importo || !newIncasso.data) return;

    const incasso: Incasso = {
      id: Date.now().toString(),
      importoLordo: parseFloat(newIncasso.importo),
      dataIncasso: newIncasso.data,
      descrizione: newIncasso.descrizione,
      cliente: newIncasso.cliente,
    };

    const updatedIncassi = [...incassi, incasso];
    setIncassi(updatedIncassi);
    localStorage.setItem('forfait-incassi', JSON.stringify(updatedIncassi));
    setNewIncasso({ importo: '', data: '', descrizione: '', cliente: '' });
  };

  // Handle scorporo calculation
  const handleCalcolaScorporo = () => {
    if (!scorporoInput.totaleDaPagare) return;

    const result = calcolaScorporo({
      totaleDaPagare: parseFloat(scorporoInput.totaleDaPagare),
      marcaDaBollo: parseFloat(scorporoInput.marcaDaBollo),
      aliquotaContributo: parseFloat(scorporoInput.aliquotaContributo),
    });

    setScorporoResult(result);
  };

  // Copy to clipboard
  const handleCopyScorporo = () => {
    if (!scorporoResult) return;

    const text = `Prestazione professionale\t€${formatCurrency(scorporoResult.compensoProfessionale)}\nContributo previdenziale\t€${formatCurrency(scorporoResult.contributoPrevidenziale)}\nRimborso imposta di bollo\t€${formatCurrency(2)}`;
    navigator.clipboard.writeText(text);
    setCopiedField('scorporo');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Toggle scadenza payment status
  const handleToggleScadenzaPagato = (index: number) => {
    const updated = [...scadenze];
    updated[index].pagato = !updated[index].pagato;
    setScadenze(updated);
  };

  // Toggle bolli payment status
  const handleToggleBolliPagati = () => {
    const newValue = !bolliPagati;
    setBolliPagati(newValue);
    localStorage.setItem(`forfait-bolli-pagati-${selectedYear}`, String(newValue));
    if (bolliSummary) {
      setBolliSummary({ ...bolliSummary, bolliPagati: newValue });
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('forfait-token');
    localStorage.removeItem('forfait-profile');
    document.cookie = 'forfait-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-[#2dd4bf] border-t-transparent rounded-full"></div>
          </div>
          <p className="mt-4 text-gray-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Onboarding wizard UI
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2dd4bf] to-[#06b6d4] rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-[#0f172a]">AI</span>
              </div>
              <h1 className="text-2xl font-bold text-white">ForfAIt</h1>
            </div>

            <h2 className="text-xl font-bold text-white mb-6">Configurazione Profilo</h2>

            {onboardingStep === 'anno' && (
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-3">
                  Anno apertura P.IVA
                </label>
                <select
                  value={onboardingData.annoAperturaPIVA}
                  onChange={(e) => setOnboardingData({ ...onboardingData, annoAperturaPIVA: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-white mb-4"
                >
                  {Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <button
                  onClick={() => setOnboardingStep('aliquota')}
                  className="w-full bg-[#2dd4bf] text-[#0f172a] py-2 rounded font-semibold hover:bg-[#06b6d4] transition"
                >
                  Continua
                </button>
              </div>
            )}

            {onboardingStep === 'aliquota' && (
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-3">
                  Aliquota Imposta Sostitutiva
                </label>
                <div className="space-y-3 mb-4">
                  {[5, 15].map(val => (
                    <label key={val} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={onboardingData.aliquotaImposta === val}
                        onChange={() => setOnboardingData({ ...onboardingData, aliquotaImposta: val as 5 | 15 })}
                        className="w-4 h-4"
                      />
                      <span className="text-white">{val}% {val === 5 ? '(primi 5 anni)' : '(ordinaria)'}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOnboardingStep('anno')}
                    className="flex-1 bg-[#334155] text-white py-2 rounded font-semibold hover:bg-[#475569] transition"
                  >
                    Indietro
                  </button>
                  <button
                    onClick={() => setOnboardingStep('ateco')}
                    className="flex-1 bg-[#2dd4bf] text-[#0f172a] py-2 rounded font-semibold hover:bg-[#06b6d4] transition"
                  >
                    Continua
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === 'ateco' && (
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-3">
                  Codice ATECO
                </label>
                <input
                  type="text"
                  placeholder="Cerca per codice o descrizione..."
                  value={atecoSearch}
                  onChange={(e) => {
                    setAtecoSearch(e.target.value);
                    const filtered = CODICI_ATECO.filter(a =>
                      a.codice.includes(e.target.value) || a.descrizione.toLowerCase().includes(e.target.value.toLowerCase())
                    );
                    setFilteredAtecoCodici(filtered);
                  }}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-white mb-3"
                />
                <div className="max-h-48 overflow-y-auto bg-[#0f172a] border border-[#334155] rounded mb-4">
                  {filteredAtecoCodici.map(ateco => (
                    <button
                      key={ateco.codice}
                      onClick={() => {
                        setOnboardingData({ ...onboardingData, codiceATECO: ateco.codice });
                        setAtecoSearch('');
                      }}
                      className="w-full text-left px-3 py-2 text-white hover:bg-[#1e293b] border-b border-[#334155] text-sm"
                    >
                      <div className="font-mono text-[#2dd4bf]">{ateco.codice}</div>
                      <div className="text-[#94a3b8] text-xs">{ateco.descrizione}</div>
                    </button>
                  ))}
                </div>
                <div className="mb-4 p-2 bg-[#0f172a] rounded border border-[#334155]">
                  <div className="text-sm text-[#2dd4bf]">{onboardingData.codiceATECO}</div>
                  <div className="text-xs text-[#94a3b8]">
                    {CODICI_ATECO.find(a => a.codice === onboardingData.codiceATECO)?.descrizione}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOnboardingStep('aliquota')}
                    className="flex-1 bg-[#334155] text-white py-2 rounded font-semibold hover:bg-[#475569] transition"
                  >
                    Indietro
                  </button>
                  <button
                    onClick={() => setOnboardingStep('gestione')}
                    className="flex-1 bg-[#2dd4bf] text-[#0f172a] py-2 rounded font-semibold hover:bg-[#06b6d4] transition"
                  >
                    Continua
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === 'gestione' && (
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-3">
                  Gestione Previdenziale
                </label>
                <select
                  value={onboardingData.gestionePrevidenziale}
                  onChange={(e) => setOnboardingData({ ...onboardingData, gestionePrevidenziale: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-white mb-4"
                >
                  {GESTION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOnboardingStep('ateco')}
                    className="flex-1 bg-[#334155] text-white py-2 rounded font-semibold hover:bg-[#475569] transition"
                  >
                    Indietro
                  </button>
                  <button
                    onClick={() => setOnboardingStep('previdenziale')}
                    className="flex-1 bg-[#2dd4bf] text-[#0f172a] py-2 rounded font-semibold hover:bg-[#06b6d4] transition"
                  >
                    Continua
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === 'previdenziale' && (
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-3">
                  Aliquota Previdenziale (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={onboardingData.aliquotaPrevidenziale}
                  onChange={(e) => setOnboardingData({ ...onboardingData, aliquotaPrevidenziale: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-white mb-2"
                />
                <p className="text-xs text-[#94a3b8] mb-4">
                  Hint: Gestione Separata ~26%, Commercianti ~24%, Artigiani ~24%
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOnboardingStep('gestione')}
                    className="flex-1 bg-[#334155] text-white py-2 rounded font-semibold hover:bg-[#475569] transition"
                  >
                    Indietro
                  </button>
                  <button
                    onClick={handleOnboardingComplete}
                    className="flex-1 bg-[#2dd4bf] text-[#0f172a] py-2 rounded font-semibold hover:bg-[#06b6d4] transition"
                  >
                    Inizia
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-[#334155] bg-[#1e293b]/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#2dd4bf] to-[#06b6d4] rounded-lg">
                <span className="text-lg font-bold text-[#0f172a]">AI</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ForfAIt</h1>
                <p className="text-xs text-[#2dd4bf]">La Cassetta degli AI-trezzi</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-white text-sm hover:border-[#2dd4bf] transition"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
              <button
                className="p-2 text-gray-400 hover:text-white transition"
                title="Impostazioni"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white transition"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex gap-8 border-t border-[#334155] pt-4">
            {[
              { id: 'dashboard', label: '📊 Dashboard', icon: Home },
              { id: 'scorporo', label: '🧮 Scorporo', icon: Calculator },
              { id: 'scadenze', label: '📅 Scadenze', icon: Calendar },
              { id: 'impostazioni', label: '⚙️ Impostazioni', icon: Cog },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 border-b-2 transition font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-[#2dd4bf] text-white'
                    : 'border-transparent text-[#94a3b8] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Hero Card - Netto Spendibile */}
            {netto && (
              <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-8">
                <p className="text-[#94a3b8] text-sm font-medium mb-2">NETTO SPENDIBILE</p>
                <h2 className="text-5xl font-bold text-white mb-6">
                  €{formatCurrency(Math.max(0, netto.nettoSpendibile))}
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#94a3b8] text-sm">Reddito imponibile verso soglia €85.000</span>
                    <span className="text-white font-semibold">{netto.percentualeSoglia85k.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[#0f172a] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] h-2 rounded-full"
                      style={{ width: `${Math.min(100, netto.percentualeSoglia85k)}%` }}
                    />
                  </div>
                  <p className="text-[#94a3b8] text-xs mt-2">
                    di €85.000 • {netto.percentualeSoglia85k.toFixed(1)}% raggiunto
                  </p>
                </div>
              </div>
            )}

            {/* Three stat cards */}
            {netto && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
                  <p className="text-[#94a3b8] text-sm font-medium mb-2">Entrate {selectedYear}</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    €{formatCurrency(netto.totaleIncassi)}
                  </p>
                </div>

                <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
                  <p className="text-[#94a3b8] text-sm font-medium mb-2">Da Accantonare</p>
                  <p className="text-3xl font-bold text-amber-400">
                    €{formatCurrency(netto.totaleDaAccantonare)}
                  </p>
                  <p className="text-[#94a3b8] text-xs mt-2">
                    Tasse: €{formatCurrency(netto.impostaSostitutiva)} + Contributi: €{formatCurrency(netto.contributiPrevidenziali)}
                  </p>
                </div>

                <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
                  <p className="text-[#94a3b8] text-sm font-medium mb-2">Proiezione {selectedYear + 1}</p>
                  <p className="text-3xl font-bold text-purple-400">
                    €{formatCurrency(netto.proiezioneAnnoSuccessivo)}
                  </p>
                </div>
              </div>
            )}

            {/* Charts and recent incomes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Chart */}
              <div className="lg:col-span-2 bg-[#1e293b] rounded-lg border border-[#334155] p-6">
                <h3 className="text-white font-semibold mb-4">Grafico Andamento Mensile</h3>
                {mensiliData.length > 0 && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mensiliData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="mese" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                        labelStyle={{ color: '#2dd4bf' }}
                        formatter={(value) => `€${formatCurrency(value as number)}`}
                      />
                      <Bar dataKey="totale" fill="#2dd4bf" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Recent incomes */}
              <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
                <h3 className="text-white font-semibold mb-4">Ultimi Incassi</h3>
                <div className="space-y-3">
                  {incassi.slice(-5).reverse().map(inc => (
                    <div key={inc.id} className="pb-3 border-b border-[#334155] last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-white font-medium text-sm">
                          €{formatCurrency(inc.importoLordo)}
                        </span>
                        <span className="text-[#94a3b8] text-xs">
                          {new Date(inc.dataIncasso).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      {inc.cliente && (
                        <p className="text-[#94a3b8] text-xs">{inc.cliente}</p>
                      )}
                      {inc.descrizione && (
                        <p className="text-[#94a3b8] text-xs">{inc.descrizione}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Add income form */}
            <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
              <h3 className="text-white font-semibold mb-4">Aggiungi Incasso</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input
                  type="number"
                  placeholder="Importo (€)"
                  value={newIncasso.importo}
                  onChange={(e) => setNewIncasso({ ...newIncasso, importo: e.target.value })}
                  className="px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-white placeholder-[#64748b] text-sm"
                />
                <input
                  type="date"
                  value={newIncasso.data}
                  onChange={(e) => setNewIncasso({ ...newIncasso, data: e.target.value })}
                  className="px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-white text-sm"
                />
                <input
                  type="text"
                  placeholder="Descrizione"
                  value={newIncasso.descrizione}
                  onChange={(e) => setNewIncasso({ ...newIncasso, descrizione: e.target.value })}
                  className="px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-white placeholder-[#64748b] text-sm"
                />
                <input
                  type="text"
                  placeholder="Cliente (opzionale)"
                  value={newIncasso.cliente}
                  onChange={(e) => setNewIncasso({ ...newIncasso, cliente: e.target.value })}
                  className="px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-white placeholder-[#64748b] text-sm"
                />
                <button
                  onClick={handleAddIncasso}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded transition flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Salva
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCORPORO */}
        {activeTab === 'scorporo' && (
          <div className="space-y-6">
            <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Scorporo Fattura Forfettario</h2>
              <p className="text-[#94a3b8] text-sm mb-6">
                Inserisci la cifra finale che il cliente paga. Il calcolatore scorpora automaticamente compenso e contributo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                    Totale da pagare dal cliente (€)
                  </label>
                  <input
                    type="number"
                    value={scorporoInput.totaleDaPagare}
                    onChange={(e) => setScorporoInput({ ...scorporoInput, totaleDaPagare: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                    Marca da bollo (€)
                  </label>
                  <input
                    type="number"
                    value={scorporoInput.marcaDaBollo}
                    onChange={(e) => setScorporoInput({ ...scorporoInput, marcaDaBollo: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                    Aliquota contributo (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={scorporoInput.aliquotaContributo}
                    onChange={(e) => setScorporoInput({ ...scorporoInput, aliquotaContributo: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleCalcolaScorporo}
                className="bg-[#2dd4bf] text-[#0f172a] px-6 py-2 rounded font-semibold hover:bg-[#06b6d4] transition"
              >
                Calcola Scorporo
              </button>
            </div>

            {/* Results */}
            {scorporoResult && (
              <>
                <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Risultati Calcolo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-3 border-b border-[#334155]">
                        <span className="text-[#94a3b8]">Compenso professionale</span>
                        <span className="text-white font-semibold">€{formatCurrency(scorporoResult.compensoProfessionale)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-[#334155]">
                        <span className="text-[#94a3b8]">Contributo previdenziale</span>
                        <span className="text-white font-semibold">€{formatCurrency(scorporoResult.contributoPrevidenziale)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-[#334155]">
                        <span className="text-[#94a3b8]">Totale fattura (compenso + contributo)</span>
                        <span className="text-white font-semibold">€{formatCurrency(scorporoResult.totaleFattura)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[#94a3b8]">Totale da pagare (incluso bollo)</span>
                        <span className="text-[#2dd4bf] font-bold">€{formatCurrency(scorporoResult.totaleDaPagare)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-[#0f172a] rounded p-4 border border-[#334155]">
                        <p className="text-[#94a3b8] text-xs font-medium mb-3">Testo pronto per la fattura</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-[#94a3b8]">
                            <span>Prestazione professionale</span>
                            <span className="font-mono">€{formatCurrency(scorporoResult.compensoProfessionale)}</span>
                          </div>
                          <div className="flex justify-between text-[#94a3b8]">
                            <span>Contributo previdenziale</span>
                            <span className="font-mono">€{formatCurrency(scorporoResult.contributoPrevidenziale)}</span>
                          </div>
                          <div className="flex justify-between text-[#94a3b8]">
                            <span>Rimborso imposta di bollo</span>
                            <span className="font-mono">€2,00</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleCopyScorporo}
                        className="w-full bg-[#334155] hover:bg-[#475569] text-white py-2 rounded font-semibold transition flex items-center justify-center gap-2"
                      >
                        {copiedField === 'scorporo' ? (
                          <>
                            <Check size={16} />
                            Copiato!
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            Copia
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: SCADENZE */}
        {activeTab === 'scadenze' && (
          <div className="space-y-6">
            <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Scadenziario Fiscale {selectedYear}</h2>

              {netto && (
                <div className="mb-6 p-4 bg-[#0f172a] rounded border border-[#334155]">
                  <p className="text-[#94a3b8] text-sm">Totale da versare quest'anno</p>
                  <p className="text-2xl font-bold text-[#2dd4bf]">€{formatCurrency(netto.totaleDaAccantonare)}</p>
                </div>
              )}

              <div className="space-y-3">
                {scadenze.map((scadenza, idx) => {
                  const dataScadenza = new Date(scadenza.dataScadenza);
                  const oggi = new Date();
                  const isOverdue = dataScadenza < oggi && !scadenza.pagato;
                  const isUpcoming = dataScadenza >= oggi && !scadenza.pagato;

                  let bgColor = 'bg-[#1e293b]';
                  let borderColor = 'border-[#334155]';

                  if (scadenza.pagato) {
                    borderColor = 'border-emerald-600';
                  } else if (isOverdue) {
                    borderColor = 'border-red-600';
                  } else if (isUpcoming) {
                    borderColor = 'border-amber-600';
                  }

                  return (
                    <div key={idx} className={`border rounded-lg p-4 ${bgColor} ${borderColor} flex items-center justify-between`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-semibold text-sm">
                            {dataScadenza.toLocaleDateString('it-IT')}
                          </span>
                          <span className="text-[#94a3b8] text-xs px-2 py-1 bg-[#0f172a] rounded">
                            {scadenza.tipo.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          {isOverdue && (
                            <span className="text-red-400 text-xs flex items-center gap-1">
                              <AlertTriangle size={14} />
                              SCADUTO
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="text-amber-400 text-xs">IN SCADENZA</span>
                          )}
                          {scadenza.pagato && (
                            <span className="text-emerald-400 text-xs">PAGATO</span>
                          )}
                        </div>
                        <p className="text-[#94a3b8] text-sm">€{formatCurrency(scadenza.importo)}</p>
                      </div>
                      <button
                        onClick={() => handleToggleScadenzaPagato(idx)}
                        className={`px-4 py-2 rounded font-semibold text-sm transition ${
                          scadenza.pagato
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
                        }`}
                      >
                        {scadenza.pagato ? 'Pagato ✓' : 'Segna come pagato'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOLLI TRACKER */}
            {bolliSummary && (
              <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText size={20} className="text-[#2dd4bf]" />
                    Tracker Marche da Bollo {selectedYear}
                  </h2>
                  <button
                    onClick={handleToggleBolliPagati}
                    className={`px-4 py-2 rounded font-semibold text-sm transition ${
                      bolliPagati
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
                    }`}
                  >
                    {bolliPagati ? 'Versato ✓' : 'Segna come versato'}
                  </button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#0f172a] rounded p-4 border border-[#334155]">
                    <p className="text-[#94a3b8] text-xs font-medium mb-1">Fatture con bollo</p>
                    <p className="text-2xl font-bold text-white">{bolliSummary.numeroBolliDovuti}</p>
                    <p className="text-[#94a3b8] text-xs mt-1">fatture &gt; €77,47</p>
                  </div>
                  <div className="bg-[#0f172a] rounded p-4 border border-[#334155]">
                    <p className="text-[#94a3b8] text-xs font-medium mb-1">Totale bolli da versare</p>
                    <p className={`text-2xl font-bold ${bolliPagati ? 'text-emerald-400' : 'text-amber-400'}`}>
                      €{formatCurrency(bolliSummary.importoTotaleBolli)}
                    </p>
                    <p className="text-[#94a3b8] text-xs mt-1">€2,00 × {bolliSummary.numeroBolliDovuti} fatture</p>
                  </div>
                  <div className="bg-[#0f172a] rounded p-4 border border-[#334155]">
                    <p className="text-[#94a3b8] text-xs font-medium mb-1">Scadenza versamento</p>
                    <p className="text-2xl font-bold text-white">{bolliSummary.scadenzaVersamento}</p>
                    <p className="text-[#94a3b8] text-xs mt-1">anno di riferimento {selectedYear}</p>
                  </div>
                </div>

                {/* Payment procedure */}
                <div className="bg-[#0f172a] rounded-lg border border-[#334155] p-5 mb-6">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-400" />
                    Come versare i bolli virtuali
                  </h3>
                  <div className="space-y-3 text-sm text-[#94a3b8]">
                    <div className="flex gap-3">
                      <span className="text-[#2dd4bf] font-bold min-w-[24px]">1.</span>
                      <span>Accedi al tuo cassetto fiscale su <span className="text-[#2dd4bf] font-medium">Agenzia delle Entrate</span> oppure usa il tuo software di contabilità</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-[#2dd4bf] font-bold min-w-[24px]">2.</span>
                      <span>Compila il modello <span className="text-white font-semibold">F24 telematico</span> (non cartaceo)</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-[#2dd4bf] font-bold min-w-[24px]">3.</span>
                      <div>
                        <span>Nella sezione &quot;Erario&quot; inserisci:</span>
                        <div className="mt-2 bg-[#1e293b] rounded p-3 border border-[#334155] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[#94a3b8]">Codice tributo</span>
                            <span className="text-white font-mono font-bold">2501</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#94a3b8]">Periodo di riferimento</span>
                            <span className="text-white font-mono font-bold">{selectedYear}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#94a3b8]">Importo a debito</span>
                            <span className="text-white font-mono font-bold">€{formatCurrency(bolliSummary.importoTotaleBolli)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-[#2dd4bf] font-bold min-w-[24px]">4.</span>
                      <span>Invia l&apos;F24 entro il <span className="text-white font-semibold">{bolliSummary.scadenzaVersamento}</span></span>
                    </div>
                  </div>
                </div>

                {/* List of invoices with bollo */}
                {bolliSummary.fattureConBollo.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3 text-sm">Fatture soggette a bollo ({bolliSummary.numeroBolliDovuti})</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {bolliSummary.fattureConBollo.map((bollo, idx) => (
                        <div key={bollo.incassoId} className="flex items-center justify-between bg-[#0f172a] rounded p-3 border border-[#334155]">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-[#2dd4bf] font-mono text-xs">#{idx + 1}</span>
                              <span className="text-white font-medium text-sm">€{formatCurrency(bollo.importoLordo)}</span>
                              <span className="text-[#94a3b8] text-xs">
                                {new Date(bollo.dataIncasso).toLocaleDateString('it-IT')}
                              </span>
                            </div>
                            {bollo.cliente && (
                              <p className="text-[#94a3b8] text-xs mt-1 ml-8">{bollo.cliente}{bollo.descrizione ? ` — ${bollo.descrizione}` : ''}</p>
                            )}
                          </div>
                          <span className="text-amber-400 text-xs font-medium">€2,00</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bolliSummary.numeroBolliDovuti === 0 && (
                  <p className="text-[#94a3b8] text-sm text-center py-4">
                    Nessuna fattura superiore a €77,47 nel {selectedYear}. Nessun bollo da versare.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: IMPOSTAZIONI */}
        {activeTab === 'impostazioni' && profile && (
          <Impostazioni
            profile={profile}
            costi={costi}
            onSave={(updatedProfile) => {
              setProfile(updatedProfile);
              localStorage.setItem('forfait-profile', JSON.stringify(updatedProfile));
            }}
            onSaveCosti={(updatedCosti) => {
              setCosti(updatedCosti);
              localStorage.setItem('forfait-costi', JSON.stringify(updatedCosti));
            }}
          />
        )}
      </main>
    </div>
  );
}