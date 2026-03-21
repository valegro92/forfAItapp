'use client';

import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Scale,
  Wallet,
  Plus,
  Trash2,
  Save,
  Building2,
  Search,
} from 'lucide-react';
import {
  FiscalProfile,
  CostoFisso,
  CODICI_ATECO,
} from '@/lib/fiscal-engine';

interface ImpostazioniProps {
  profile: FiscalProfile;
  costi: CostoFisso[];
  onSave: (profile: FiscalProfile) => void;
  onSaveCosti: (costi: CostoFisso[]) => void;
}

const GESTIONI_PREVIDENZIALI = [
  { id: 'separata', label: 'Gestione Separata INPS', rate: 26.07 },
  { id: 'artigiani', label: 'Artigiani (INPS)', rate: 24 },
  { id: 'commercianti', label: 'Commercianti (INPS)', rate: 24.48 },
  { id: 'inarcassa', label: 'Inarcassa (Ingegneri e Architetti)', rate: 14.5 },
  { id: 'enpam', label: 'ENPAM (Medici)', rate: null },
  { id: 'cipag', label: 'CIPAG (Geometri)', rate: null },
  { id: 'eppi', label: 'EPPI (Periti Industriali)', rate: null },
  { id: 'enpap', label: 'ENPAP (Psicologi)', rate: null },
  { id: 'cnpadc', label: 'CNPADC (Dottori Commercialisti)', rate: null },
  { id: 'cassa_forense', label: 'Cassa Forense (Avvocati)', rate: null },
  { id: 'enpab', label: 'ENPAB (Biologi)', rate: null },
  { id: 'enpav', label: 'ENPAV (Veterinari)', rate: null },
  { id: 'inpgi', label: 'INPGI (Giornalisti)', rate: null },
  { id: 'altra_cassa', label: 'Altra cassa (manuale)', rate: null },
];

const CATEGORIE_COSTI = [
  'tool',
  'commercialista',
  'altro',
];

export default function Impostazioni({
  profile,
  costi,
  onSave,
  onSaveCosti,
}: ImpostazioniProps) {
  const [activeTab, setActiveTab] = useState('fiscali');
  const [localProfile, setLocalProfile] = useState<FiscalProfile>(
    JSON.parse(JSON.stringify(profile))
  );
  const [localCosti, setLocalCosti] = useState<CostoFisso[]>(
    JSON.parse(JSON.stringify(costi))
  );
  const [successMessage, setSuccessMessage] = useState('');
  const [attivoSearch, setAttivoSearch] = useState('');
  const [newCosto, setNewCosto] = useState({
    nome: '',
    importo: '',
    frequenza: 'mensile' as 'mensile' | 'annuale',
    categoria: 'altro' as 'tool' | 'commercialista' | 'altro',
  });
  const [livelloPrudenza, setLivelloPrudenza] = useState('bilanciato');

  const handleSave = () => {
    onSave(localProfile);
    setSuccessMessage('Impostazioni salvate con successo');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSaveCosti = () => {
    onSaveCosti(localCosti);
    setSuccessMessage('Costi salvati con successo');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const currentYear = new Date().getFullYear();
  const yearsOpened = currentYear - localProfile.annoAperturaPIVA;
  const isWithinFiveYears = yearsOpened < 5;
  const yearNumber = Math.min(yearsOpened + 1, 5);

  const getDefaultPrevRate = (gestione: string): number | null => {
    const g = GESTIONI_PREVIDENZIALI.find((x) => x.id === gestione);
    return g?.rate || null;
  };

  const costoMensileTotale = localCosti.reduce((acc, c) => {
    return acc + (c.frequenza === 'mensile' ? c.importo : c.importo / 12);
  }, 0);

  const costoAnnualeTotale = localCosti.reduce((acc, c) => {
    return acc + (c.frequenza === 'annuale' ? c.importo : c.importo * 12);
  }, 0);

  const handleAddCosto = () => {
    if (!newCosto.nome || !newCosto.importo) return;

    const costo: CostoFisso = {
      id: Date.now().toString(),
      nome: newCosto.nome,
      importo: parseFloat(newCosto.importo),
      frequenza: newCosto.frequenza,
      categoria: newCosto.categoria,
    };

    setLocalCosti([...localCosti, costo]);
    setNewCosto({
      nome: '',
      importo: '',
      frequenza: 'mensile',
      categoria: 'altro',
    });
  };

  const handleDeleteCosto = (id: string) => {
    setLocalCosti(localCosti.filter((c) => c.id !== id));
  };

  const attivoFiltered = CODICI_ATECO.filter(
    (a) =>
      a.codice.includes(attivoSearch.toUpperCase()) ||
      a.descrizione.toLowerCase().includes(attivoSearch.toLowerCase())
  );

  const selectedAttivo = CODICI_ATECO.find(
    (a) => a.codice === localProfile.codiceATECO
  );

  const impactSaldoIniziale =
    localProfile.saldoInizialeCC !== undefined
      ? localProfile.saldoInizialeCC
      : 0;

  return (
    <div className="min-h-screen bg-[#292524] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <Building2 className="w-8 h-8 text-[#2DD4A8]" />
          Impostazioni
        </h1>

        {successMessage && (
          <div className="mb-4 p-4 bg-[#2DD4A8]/20 border border-[#2DD4A8] text-[#2DD4A8] rounded-lg animate-fade-out">
            {successMessage}
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b border-[#2D2D2D]">
          <button
            onClick={() => setActiveTab('fiscali')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'fiscali'
                ? 'bg-[#2DD4A8] text-[#292524]'
                : 'text-[#A9A8A7] hover:text-white'
            }`}
          >
            Parametri Fiscali
          </button>
          <button
            onClick={() => setActiveTab('prudenza')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'prudenza'
                ? 'bg-[#2DD4A8] text-[#292524]'
                : 'text-[#A9A8A7] hover:text-white'
            }`}
          >
            Prudenza
          </button>
          <button
            onClick={() => setActiveTab('riserva')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'riserva'
                ? 'bg-[#2DD4A8] text-[#292524]'
                : 'text-[#A9A8A7] hover:text-white'
            }`}
          >
            Riserva
          </button>
          <button
            onClick={() => setActiveTab('costi')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'costi'
                ? 'bg-[#2DD4A8] text-[#292524]'
                : 'text-[#A9A8A7] hover:text-white'
            }`}
          >
            Costi Fissi
          </button>
        </div>

        {/* TAB 1: PARAMETRI FISCALI */}
        {activeTab === 'fiscali' && (
          <div className="space-y-6">
            <div className="bg-[#2D2D2D] p-6 rounded-lg">
              <label className="block text-sm font-semibold mb-2">
                Anno Apertura Partita IVA
              </label>
              <select
                value={localProfile.annoAperturaPIVA}
                onChange={(e) =>
                  setLocalProfile({
                    ...localProfile,
                    annoAperturaPIVA: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-[#292524] border border-[#2DD4A8] rounded text-white focus:outline-none focus:ring-2 focus:ring-[#2DD4A8]"
              >
                {Array.from({ length: 17 }, (_, i) => 2010 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <p className="text-[#A9A8A7] text-sm mt-2">
                {isWithinFiveYears
                  ? `Hai aperto nel ${localProfile.annoAperturaPIVA}: sei al ${yearNumber}° anno su 5 del regime agevolato al 5%`
                  : 'Hai superato i 5 anni del regime agevolato'}
              </p>
            </div>

            <div className="bg-[#2D2D2D] p-6 rounded-lg">
              <label className="block text-sm font-semibold mb-4">
                Aliquota Imposta Sostitutiva
              </label>
              <div className="space-y-2">
                <button
                  onClick={() =>
                    setLocalProfile({
                      ...localProfile,
                      aliquotaImposta: 5,
                    })
                  }
                  className={`w-full p-4 rounded border-2 text-left flex justify-between items-center transition-all ${
                    localProfile.aliquotaImposta === 5
                      ? 'border-[#2DD4A8] bg-[#2DD4A8]/10'
                      : 'border-[#454545] hover:border-[#2DD4A8]'
                  }`}
                >
                  <span>5% (primi 5 anni)</span>
                  {isWithinFiveYears && (
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-semibold">
                      Suggerito
                    </span>
                  )}
                </button>
                <button
                  onClick={() =>
                    setLocalProfile({
                      ...localProfile,
                      aliquotaImposta: 15,
                    })
                  }
                  className={`w-full p-4 rounded border-2 text-left transition-all ${
                    localProfile.aliquotaImposta === 15
                      ? 'border-[#2DD4A8] bg-[#2DD4A8]/10'
                      : 'border-[#454545] hover:border-[#2DD4A8]'
                  }`}
                >
                  15% (ordinaria)
                </button>
              </div>
            </div>

            <div className="bg-[#2D2D2D] p-6 rounded-lg">
              <label className="block text-sm font-semibold mb-2">
                Codice ATECO
              </label>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 w-5 h-5 text-[#A9A8A7]" />
                <input
                  type="text"
                  placeholder="Cerca per codice o descrizione..."
                  value={attivoSearch}
                  onChange={(e) => setAttivoSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#292524] border border-[#2DD4A8] rounded text-white focus:outline-none focus:ring-2 focus:ring-[#2DD4A8]"
                />
              </div>

              {selectedAttivo && (
                <div className="mb-4 p-3 bg-[#292524] border border-[#2DD4A8] rounded text-sm">
                  <div className="font-semibold">
                    {selectedAttivo.codice} - {selectedAttivo.descrizione}
                  </div>
                  <div className="text-[#A9A8A7] text-xs mt-1">
                    Coefficiente: {selectedAttivo.coefficiente}%
                  </div>
                </div>
              )}

              <div className="max-h-48 overflow-y-auto bg-[#292524] border border-[#454545] rounded">
                {attivoFiltered.map((a) => (
                  <button
                    key={a.codice}
                    onClick={() => {
                      setLocalProfile({
                        ...localProfile,
                        codiceATECO: a.codice,
                        coefficienteRedditivita: a.coefficiente,
                      });
                      setAttivoSearch('');
                    }}
                    className={`w-full px-4 py-2 text-left text-sm border-b border-[#454545] hover:bg-[#2DD4A8]/10 transition-colors ${
                      localProfile.codiceATECO === a.codice
                        ? 'bg-[#2DD4A8]/20 border-l-2 border-l-[#2DD4A8]'
                        : ''
                    }`}
                  >
                    <div className="font-semibold">{a.codice}</div>
                    <div className="text-[#A9A8A7] text-xs">
                      {a.descrizione}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[#A9A8A7] text-sm mt-3">
                Il coefficiente determina quale percentuale del fatturato è
                considerata reddito imponibile
              </p>
            </div>

            <div className="bg-[#2D2D2D] p-6 rounded-lg">
              <label className="block text-sm font-semibold mb-2">
                Gestione Previdenziale
              </label>
              <select
                value={localProfile.gestionePrevidenziale}
                onChange={(e) => {
                  const gestione = e.target.value as FiscalProfile['gestionePrevidenziale'];
                  const defaultRate = getDefaultPrevRate(gestione);
                  setLocalProfile({
                    ...localProfile,
                    gestionePrevidenziale: gestione,
                    aliquotaPrevidenziale:
                      defaultRate || localProfile.aliquotaPrevidenziale,
                  });
                }}
                className="w-full px-4 py-2 bg-[#292524] border border-[#2DD4A8] rounded text-white focus:outline-none focus:ring-2 focus:ring-[#2DD4A8]"
              >
                {GESTIONI_PREVIDENZIALI.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-[#2D2D2D] p-6 rounded-lg">
              <label className="block text-sm font-semibold mb-2">
                Aliquota Previdenziale (%)
              </label>
              <input
                type="number"
                value={localProfile.aliquotaPrevidenziale}
                onChange={(e) =>
                  setLocalProfile({
                    ...localProfile,
                    aliquotaPrevidenziale: parseFloat(e.target.value),
                  })
                }
                min="0"
                max="100"
                step="0.01"
                className="w-full px-4 py-2 bg-[#292524] border border-[#2DD4A8] rounded text-white focus:outline-none focus:ring-2 focus:ring-[#2DD4A8]"
              />
              {getDefaultPrevRate(localProfile.gestionePrevidenziale) && (
                <p className="text-[#A9A8A7] text-sm mt-2">
                  Default per {GESTIONI_PREVIDENZIALI.find((g) => g.id === localProfile.gestionePrevidenziale)?.label}:{' '}
                  {getDefaultPrevRate(localProfile.gestionePrevidenziale)}%
                </p>
              )}
              {!getDefaultPrevRate(localProfile.gestionePrevidenziale) && (
                <p className="text-[#A9A8A7] text-sm mt-2">
                  Inserisci l'aliquota della tua cassa
                </p>
              )}
            </div>

            <div className="bg-[#2D2D2D] p-6 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold">Acconti Già Versati</h3>
              <div>
                <label className="block text-xs text-[#A9A8A7] mb-1">
                  Acconti imposta sostitutiva versati (€)
                </label>
                <input
                  type="number"
                  value={localProfile.accontiImpostaVersati || 0}
                  onChange={(e) =>
                    setLocalProfile({
                      ...localProfile,
                      accontiImpostaVersati: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-[#292524] border border-[#2DD4A8] rounded text-white focus:outline-none focus:ring-2 focus:ring-[#2DD4A8]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A9A8A7] mb-1">
                  Acconti previdenza versati (€)
                </label>
                <input
                  type="number"
                  value={localProfile.accontiPrevidenzaVersati || 0}
                  onChange={(e) =>
                    setLocalProfile({
                      ...localProfile,
                      accontiPrevidenzaVersati: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-[#292524] border border-[#2DD4A8] rounded text-white focus:outline-none focus:ring-2 focus:ring-[#2DD4A8]"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3 bg-gradient-to-r from-[#2DD4A8] to-[#1dd4bf] text-[#292524] font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Salva Impostazioni Fiscali
            </button>
          </div>
        )}

        {/* TAB 2: PRUDENZA */}
        {activeTab === 'prudenza' && (
          <div className="space-y-6">
            <div className="bg-[#2D2D2D] p-6 rounded-lg">
              <label className="block text-sm font-semibold mb-4">
                Livello di Prudenza
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: 'prudente',
                    label: '🛡️ Prudente',
                    values: { cuscinetto: 15, giorni: 60, baseCuscinetto: 'incassi' as const },
                  },
                  {
                    id: 'bilanciato',
                    label: '⚖️ Bilanciato',
                    values: { cuscinetto: 10, giorni: 45, baseCuscinetto: 'incassi' as const },
                  },
                  {
                    id: 'spinto',
                    label: '🚀 Spinto',
                    values: { cuscinetto: 5, giorni: 30, baseCuscinetto: 'accantonamento' as const },
                  },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setLivelloPrudenza(preset.id);
                      setLocalProfile({
                        ...localProfile,
                        cuscinettoPercentuale: preset.values.cuscinetto,
                        bloccaFondiGiorni: preset.values.giorni,
                        baseCuscinetto: preset.values.baseCuscinetto,
                      });
                    }}
                    className={`w-full p-4 rounded border-2 text-left transition-all ${
                      livelloPrudenza === preset.id
                        ? 'border-[#2DD4A8] bg-[#2DD4A8]/10'
                        : 'border-[#454545] hover:border-[#2DD4A8]'
                    } ${preset.id === 'bilanciato' ? 'ring-2 ring-[#2DD4A8]' : ''}`}
                  >
                    <div className="font-semibold">{preset.label}</div>
                    <div className="text-sm text-[#A9A8A7] mt-1">
                      {preset.values.cuscinetto}%, {preset.values.giorni}gg,
                      sugli {preset.values.baseCuscinetto}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#2D2D2D] p-6 rounded-lg">
              <label className="block text-sm font-semibold mb-4">
                Cuscinetto Anti-imprevisti: {localProfile.cuscinettoPercentuale}%
              </label>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={localProfile.cuscinettoPercentuale}
                onChange={(e) =>
                  setLocalProfile({
                    ...localProfile,
                    cuscinettoPercentuale: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-[#454545] rounded-lg appearance-none cursor-pointer accent-[#2DD4A8]"
              />
            </div>

            <div className="bg-[#2D2D2D] p-6 rounded-lg">
              <label className="block text-sm font-semibold mb-4">
                Blocca Fondi Prima delle Scadenze: {localProfile.bloccaFondiGiorni} giorni
              </label>
              <input
                type="range"
                min="0"
                max="90"
                step="1"
                value={localProfile.bloccaFondiGiorni}
                onChange={(e) =>
                  setLocalProfile({
                    ...localProfile,
                    bloccaFondiGiorni: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-[#454545] rounded-lg appearance-none cursor-pointer accent-[#2DD4A8]"
              />
            </div>

            <div className="bg-[#2D2D2D] p-6 rounded-lg">
              <label className="block text-sm font-semibold mb-4">
                Base di Calcolo Cuscinetto
              </label>
              <div className="space-y-2">
                {[
                  {
                    value: 'incassi' as const,
                    label: 'Sugli incassi (più prudente)',
                    desc: 'Trattiene una % degli incassi totali',
                  },
                  {
                    value: 'accantonamento' as const,
                    label: "Sull'accantonamento (più realistico)",
                    desc: "Trattiene una % dell'importo da accantonare",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setLocalProfile({
                        ...localProfile,
                        baseCuscinetto: option.value,
                      })
                    }
                    className={`w-full p-4 rounded border-2 text-left transition-all ${
                      localProfile.baseCuscinetto === option.value
                        ? 'border-[#2DD4A8] bg-[#2DD4A8]/10'
                        : 'border-[#454545] hover:border-[#2DD4A8]'
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm text-[#A9A8A7] mt-1">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3 bg-gradient-to-r from-[#2DD4A8] to-[#1dd4bf] text-[#292524] font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Salva Impostazioni Prudenza
            </button>
          </div>
        )}

        {/* TAB 3: RISERVA */}
        {activeTab === 'riserva' && (
          <div className="space-y-6">
            <div className="bg-[#2D2D2D] p-6 rounded-lg">
              <label className="block text-sm font-semibold mb-2">
                Riserva Personale (€)
              </label>
              <input
                type="number"
                value={localProfile.riservaPersonale || 0}
                onChange={(e) =>
                  setLocalProfile({
                    ...localProfile,
                    riservaPersonale: parseFloat(e.target.value),
                  })
                }
                min="0"
                step="100"
                className="w-full px-4 py-2 bg-[#292524] border border-[#2DD4A8] rounded text-white focus:outline-none focus:ring-2 focus:ring-[#2DD4A8]"
              />
              <p className="text-[#A9A8A7] text-sm mt-2">
                Importo fisso escluso dallo spendibile. Utile per fondo emergenza
                o risparmio.
              </p>
            </div>

            <div className="bg-[#2D2D2D] p-6 rounded-lg">
              <label className="block text-sm font-semibold mb-2">
                Saldo Iniziale Conto Corrente (€)
              </label>
              <input
                type="number"
                value={localProfile.saldoInizialeCC || 0}
                onChange={(e) =>
                  setLocalProfile({
                    ...localProfile,
                    saldoInizialeCC: parseFloat(e.target.value),
                  })
                }
                step="100"
                className="w-full px-4 py-2 bg-[#292524] border border-[#2DD4A8] rounded text-white focus:outline-none focus:ring-2 focus:ring-[#2DD4A8]"
              />
              <p className="text-[#A9A8A7] text-sm mt-2">
                Il saldo del tuo conto a inizio anno. Viene sommato agli incassi
                per calcolare il netto.
              </p>
              <div className="mt-4 p-3 bg-[#292524] border border-[#2DD4A8]/30 rounded text-sm">
                <span className="text-[#A9A8A7]">Impatto sullo spendibile: </span>
                <span className="text-[#2DD4A8] font-semibold">
                  +€{impactSaldoIniziale.toLocaleString('it-IT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3 bg-gradient-to-r from-[#2DD4A8] to-[#1dd4bf] text-[#292524] font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Salva Impostazioni Riserva
            </button>
          </div>
        )}

        {/* TAB 4: COSTI FISSI */}
        {activeTab === 'costi' && (
          <div className="space-y-6">
            {localCosti.length > 0 && (
              <div className="bg-[#2D2D2D] p-6 rounded-lg space-y-3">
                {localCosti.map((costo) => (
                  <div
                    key={costo.id}
                    className="flex items-center justify-between bg-[#292524] p-4 rounded border border-[#454545]"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{costo.nome}</div>
                      <div className="text-sm text-[#A9A8A7]">
                        €{costo.importo.toFixed(2)} • {costo.frequenza} • {costo.categoria}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCosto(costo.id)}
                      className="ml-4 p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-[#2D2D2D] p-6 rounded-lg">
              <h3 className="text-sm font-semibold mb-4">Aggiungi Costo Fisso</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome costo"
                  value={newCosto.nome}
                  onChange={(e) =>
                    setNewCosto({ ...newCosto, nome: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-[#292524] border border-[#2DD4A8] rounded text-white focus:outline-none focus:ring-2 focus:ring-[#2DD4A8] placeholder-[#9CA3AF]"
                />

                <input
                  type="number"
                  placeholder="Importo (€)"
                  value={newCosto.importo}
                  onChange={(e) =>
                    setNewCosto({ ...newCosto, importo: e.target.value })
                  }
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 bg-[#292524] border border-[#2DD4A8] rounded text-white focus:outline-none focus:ring-2 focus:ring-[#2DD4A8] placeholder-[#9CA3AF]"
                />

                <div className="flex gap-2">
                  {(['mensile', 'annuale'] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setNewCosto({ ...newCosto, frequenza: freq })}
                      className={`flex-1 py-2 rounded border transition-all ${
                        newCosto.frequenza === freq
                          ? 'border-[#2DD4A8] bg-[#2DD4A8]/10'
                          : 'border-[#454545] hover:border-[#2DD4A8]'
                      }`}
                    >
                      {freq === 'mensile' ? 'Mensile' : 'Annuale'}
                    </button>
                  ))}
                </div>

                <select
                  value={newCosto.categoria}
                  onChange={(e) =>
                    setNewCosto({
                      ...newCosto,
                      categoria: e.target.value as 'tool' | 'commercialista' | 'altro',
                    })
                  }
                  className="w-full px-4 py-2 bg-[#292524] border border-[#2DD4A8] rounded text-white focus:outline-none focus:ring-2 focus:ring-[#2DD4A8]"
                >
                  <option value="tool">Tool/Software</option>
                  <option value="commercialista">Commercialista</option>
                  <option value="altro">Altro</option>
                </select>

                <button
                  onClick={handleAddCosto}
                  disabled={!newCosto.nome || !newCosto.importo}
                  className="w-full py-2 bg-[#2DD4A8] text-[#292524] font-semibold rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Aggiungi Costo
                </button>
              </div>
            </div>

            {localCosti.length > 0 && (
              <div className="bg-[#2D2D2D] p-6 rounded-lg border-2 border-[#2DD4A8]/30">
                <div className="text-sm text-[#A9A8A7]">
                  Costo mensile totale:{' '}
                  <span className="text-[#2DD4A8] font-semibold">
                    €{costoMensileTotale.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-[#A9A8A7] mt-1">
                  Costo annuale:{' '}
                  <span className="text-[#2DD4A8] font-semibold">
                    €{costoAnnualeTotale.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSaveCosti}
              className="w-full py-3 bg-gradient-to-r from-[#2DD4A8] to-[#1dd4bf] text-[#292524] font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Salva Costi Fissi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}