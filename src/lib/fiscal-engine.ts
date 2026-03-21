/**
 * Fiscal Calculation Engine for Forfettario Tax System
 * Handles all calculations for income, taxes, contributions, and cash flow management
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FiscalProfile {
  annoAperturaPIVA: number;
  aliquotaImposta: 5 | 15; // 5% first 5 years, 15% ordinary
  codiceATECO: string;
  coefficienteRedditivita: number; // e.g., 0.78
  gestionePrevidenziale: 
    | 'separata' 
    | 'artigiani' 
    | 'commercianti' 
    | 'inarcassa' 
    | 'enpam' 
    | 'cipag' 
    | 'eppi' 
    | 'enpap' 
    | 'cnpadc' 
    | 'cassa_forense'
    | 'enpab'
    | 'enpav'
    | 'inpgi'
    | 'altra_cassa';
  aliquotaPrevidenziale: number; // e.g., 0.2607
  accontiImpostaVersati: number;
  accontiPrevidenzaVersati: number;
  cuscinettoPercentuale: number; // 0-30
  bloccaFondiGiorni: number; // 0-90
  baseCuscinetto: 'incassi' | 'accantonamento';
  riservaPersonale: number;
  saldoInizialeCC: number;
}

export interface Incasso {
  id: string;
  importoLordo: number;
  dataIncasso: string; // ISO date
  descrizione?: string;
  cliente?: string;
}

export interface CostoFisso {
  id: string;
  nome: string;
  importo: number;
  frequenza: 'mensile' | 'annuale';
  categoria: 'tool' | 'commercialista' | 'altro';
}

export interface ScadenzaFiscale {
  tipo: 
    | 'saldo_imposta' 
    | 'acconto1_imposta' 
    | 'acconto2_imposta' 
    | 'saldo_inps' 
    | 'acconto1_inps' 
    | 'acconto2_inps';
  importo: number;
  dataScadenza: string;
  pagato: boolean;
}

export interface NettoSpendibile {
  totaleIncassi: number;
  redditoImponibile: number;
  impostaSostitutiva: number;
  contributiPrevidenziali: number;
  totaleDaAccantonare: number;
  cuscinetto: number;
  scadenzeBloccate: number;
  costiAnnuali: number;
  nettoSpendibile: number;
  percentualeSoglia85k: number;
  proiezioneAnnoSuccessivo: number;
}

export interface ScorporoInput {
  totaleDaPagare: number;
  marcaDaBollo: number;
  aliquotaContributo: number;
}

export interface ScorporoResult {
  compensoSenzaBollo: number;
  compensoProfessionale: number;
  contributoPrevidenziale: number;
  totaleFattura: number;
  totaleDaPagare: number;
}

export interface AtecoCodice {
  codice: string;
  descrizione: string;
  coefficiente: number;
}

// ============================================================================
// ATECO CODES DATABASE
// ============================================================================

export const CODICI_ATECO: AtecoCodice[] = [
  // IT Services & Software
  { codice: '62.01.00', descrizione: 'Sviluppo software', coefficiente: 0.78 },
  { codice: '62.02.00', descrizione: 'Consulenza informatica', coefficiente: 0.78 },
  { codice: '62.03.00', descrizione: 'Gestione impianti informatici', coefficiente: 0.78 },
  { codice: '62.09.00', descrizione: 'Altre attività informatiche', coefficiente: 0.78 },
  
  // Professional Services
  { codice: '69.10.00', descrizione: 'Attività legali', coefficiente: 0.78 },
  { codice: '69.20.01', descrizione: 'Servizi contabili', coefficiente: 0.78 },
  { codice: '69.20.02', descrizione: 'Revisione legale', coefficiente: 0.78 },
  { codice: '70.21.10', descrizione: 'Consulenza aziendale', coefficiente: 0.72 },
  { codice: '70.22.00', descrizione: 'Consulenza gestionale', coefficiente: 0.72 },
  
  // Design & Creative
  { codice: '71.11.00', descrizione: 'Servizi di architettura', coefficiente: 0.78 },
  { codice: '71.12.00', descrizione: 'Ingegneria e progettazione', coefficiente: 0.78 },
  { codice: '74.10.11', descrizione: 'Design industriale', coefficiente: 0.78 },
  { codice: '74.10.12', descrizione: 'Design grafico', coefficiente: 0.72 },
  { codice: '74.10.13', descrizione: 'Design d\'interni', coefficiente: 0.72 },
  
  // Advertising & Marketing
  { codice: '73.11.00', descrizione: 'Agenzie di pubblicità', coefficiente: 0.72 },
  { codice: '73.12.00', descrizione: 'Media planning e buying', coefficiente: 0.72 },
  { codice: '73.20.00', descrizione: 'Ricerca di mercato', coefficiente: 0.72 },
  
  // Education & Training
  { codice: '85.41.00', descrizione: 'Scuole di formazione', coefficiente: 0.67 },
  { codice: '85.59.00', descrizione: 'Corsi di formazione', coefficiente: 0.67 },
  
  // Real Estate
  { codice: '68.10.00', descrizione: 'Compravendita immobili', coefficiente: 0.67 },
  { codice: '68.20.00', descrizione: 'Affitto immobili', coefficiente: 0.67 },
  { codice: '68.32.00', descrizione: 'Gestione proprietà immobiliari', coefficiente: 0.67 },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Round to 2 decimal places for currency
 */
function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Parse ISO date string and return Date object
 */
function parseISODate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Check if a date falls within blocked funds window
 * @param dataScadenza - deadline date
 * @param bloccaFondiGiorni - number of days to block
 * @returns true if deadline is within the blocked period
 */
function isScadenzaBloccata(dataScadenza: string, bloccaFondiGiorni: number): boolean {
  if (bloccaFondiGiorni === 0) return false;
  
  const today = new Date();
  const scadenza = parseISODate(dataScadenza);
  const diffMs = scadenza.getTime() - today.getTime();
  const diffGiorni = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return diffGiorni <= bloccaFondiGiorni && diffGiorni > 0;
}

/**
 * Calculate total costs (annualized if necessary)
 */
function calcolaCostiAnnuali(costi: CostoFisso[]): number {
  return roundCurrency(
    costi.reduce((total, costo) => {
      const importoAnnuale = costo.frequenza === 'mensile' 
        ? costo.importo * 12 
        : costo.importo;
      return total + importoAnnuale;
    }, 0)
  );
}

/**
 * Get the current year
 */
function getCurrentYear(): number {
  return new Date().getFullYear();
}

// ============================================================================
// MAIN CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate net spendable amount based on fiscal profile and incomes
 * 
 * Formula:
 * REDDITO_IMPONIBILE = totale_incassi × coefficiente_redditivita
 * IMPOSTA_SOSTITUTIVA = REDDITO_IMPONIBILE × aliquota_imposta
 * CONTRIBUTI = REDDITO_IMPONIBILE × aliquota_previdenziale
 * TOTALE_DA_ACCANTONARE = IMPOSTA + CONTRIBUTI - acconti_versati
 * CUSCINETTO = based on baseCuscinetto setting
 * NETTO = saldoInizialeCC + totaleIncassi - TOTALE_DA_ACCANTONARE - cuscinetto - scadenzeBloccate - riservaPersonale - costiAnnuali
 */
export function calcolaNettoSpendibile(
  profile: FiscalProfile,
  incassi: Incasso[],
  costi: CostoFisso[]
): NettoSpendibile {
  // 1. Calculate total income
  const totaleIncassi = roundCurrency(
    incassi.reduce((sum, incasso) => sum + incasso.importoLordo, 0)
  );

  // 2. Calculate taxable income
  const redditoImponibile = roundCurrency(totaleIncassi * profile.coefficienteRedditivita);

  // 3. Calculate substitute tax
  const impostaSostitutiva = roundCurrency(redditoImponibile * (profile.aliquotaImposta / 100));

  // 4. Calculate social security contributions
  const contributiPrevidenziali = roundCurrency(redditoImponibile * profile.aliquotaPrevidenziale);

  // 5. Calculate total to accrue (taxes + contributions - already paid installments)
  const totaleDaAccantonare = roundCurrency(
    impostaSostitutiva + contributiPrevidenziali - profile.accontiImpostaVersati - profile.accontiPrevidenzaVersati
  );

  // 6. Calculate cushion (reserve based on either incomes or accrual)
  let cuscinetto = 0;
  if (profile.cuscinettoPercentuale > 0) {
    const baseCalcolo = profile.baseCuscinetto === 'incassi' ? totaleIncassi : totaleDaAccantonare;
    cuscinetto = roundCurrency(baseCalcolo * (profile.cuscinettoPercentuale / 100));
  }

  // 7. Calculate blocked funds (simplified - would need full scadenze list in real scenario)
  const scadenzeBloccate = 0; // Default: calculated separately with full scadenze data

  // 8. Calculate annual costs
  const costiAnnuali = calcolaCostiAnnuali(costi);

  // 9. Calculate net spendable
  const nettoSpendibile = roundCurrency(
    profile.saldoInizialeCC +
    totaleIncassi -
    totaleDaAccantonare -
    cuscinetto -
    scadenzeBloccate -
    profile.riservaPersonale -
    costiAnnuali
  );

  // 10. Calculate percentage of 85k threshold
  const soglia85k = 85000;
  const percentualeSoglia85k = roundCurrency((redditoImponibile / soglia85k) * 100);

  // 11. Project for next year (current income annualized if partial year data)
  const currentYear = getCurrentYear();
  const annoAppertura = profile.annoAperturaPIVA;
  const mesiImpresa = (currentYear - annoAppertura) * 12 + new Date().getMonth() + 1;
  const proiezioneAnnoSuccessivo = mesiImpresa < 12 
    ? roundCurrency(redditoImponibile * (12 / mesiImpresa))
    : redditoImponibile;

  return {
    totaleIncassi,
    redditoImponibile,
    impostaSostitutiva,
    contributiPrevidenziali,
    totaleDaAccantonare,
    cuscinetto,
    scadenzeBloccate,
    costiAnnuali,
    nettoSpendibile,
    percentualeSoglia85k,
    proiezioneAnnoSuccessivo,
  };
}

/**
 * Calculate invoice breakdown (scorporo) from total to be paid
 * 
 * Formula:
 * compenso_senza_bollo = totale - bollo
 * compenso_professionale = ROUND(compenso_senza_bollo / (1 + aliquota_contributo), 2)
 * contributo = ROUND(compenso_senza_bollo - compenso_professionale, 2)
 */
export function calcolaScorporo(input: ScorporoInput): ScorporoResult {
  const { totaleDaPagare, marcaDaBollo, aliquotaContributo } = input;

  // Remove stamp duty
  const compensoSenzaBollo = roundCurrency(totaleDaPagare - marcaDaBollo);

  // Calculate professional fee (reverse calculation with contribution rate)
  const compensoProfessionale = roundCurrency(
    compensoSenzaBollo / (1 + aliquotaContributo)
  );

  // Calculate contribution (what remains after professional fee)
  const contributoPrevidenziale = roundCurrency(
    compensoSenzaBollo - compensoProfessionale
  );

  // Total invoice (professional fee + contribution)
  const totaleFattura = roundCurrency(
    compensoProfessionale + contributoPrevidenziale
  );

  return {
    compensoSenzaBollo,
    compensoProfessionale,
    contributoPrevidenziale,
    totaleFattura,
    totaleDaPagare,
  };
}

/**
 * Generate fiscal deadlines for the given year
 * 
 * Standard deadlines:
 * - June 30: balance tax from previous year + balance INPS + 1st installment (40%)
 * - November 30: 2nd tax installment (60%) + 2nd INPS installment (60%)
 */
export function generaScadenze(
  anno: number,
  profile: FiscalProfile,
  incassi: Incasso[]
): ScadenzaFiscale[] {
  const scadenze: ScadenzaFiscale[] = [];

  // Calculate base amounts from current year data
  const totaleIncassi = roundCurrency(
    incassi
      .filter(inc => new Date(inc.dataIncasso).getFullYear() === anno)
      .reduce((sum, inc) => sum + inc.importoLordo, 0)
  );

  const redditoImponibile = roundCurrency(totaleIncassi * profile.coefficienteRedditivita);
  const impostaSostitutiva = roundCurrency(redditoImponibile * (profile.aliquotaImposta / 100));
  const contributi = roundCurrency(redditoImponibile * profile.aliquotaPrevidenziale);

  // June 30 deadline
  const saldoImpostaPrecedente = 0; // Would need previous year data
  const saldoInpsPrecedente = 0; // Would need previous year data
  const acconto1Imposta = roundCurrency(impostaSostitutiva * 0.4);
  const acconto1Inps = roundCurrency(contributi * 0.4);

  scadenze.push(
    {
      tipo: 'saldo_imposta',
      importo: saldoImpostaPrecedente,
      dataScadenza: `${anno}-06-30`,
      pagato: false,
    },
    {
      tipo: 'saldo_inps',
      importo: saldoInpsPrecedente,
      dataScadenza: `${anno}-06-30`,
      pagato: false,
    },
    {
      tipo: 'acconto1_imposta',
      importo: acconto1Imposta,
      dataScadenza: `${anno}-06-30`,
      pagato: false,
    },
    {
      tipo: 'acconto1_inps',
      importo: acconto1Inps,
      dataScadenza: `${anno}-06-30`,
      pagato: false,
    }
  );

  // November 30 deadline
  const acconto2Imposta = roundCurrency(impostaSostitutiva * 0.6);
  const acconto2Inps = roundCurrency(contributi * 0.6);

  scadenze.push(
    {
      tipo: 'acconto2_imposta',
      importo: acconto2Imposta,
      dataScadenza: `${anno}-11-30`,
      pagato: false,
    },
    {
      tipo: 'acconto2_inps',
      importo: acconto2Inps,
      dataScadenza: `${anno}-11-30`,
      pagato: false,
    }
  );

  return scadenze;
}

/**
 * Get monthly income summary for chart visualization
 */
export function getIncassiMensili(
  incassi: Incasso[],
  anno: number
): { mese: string; totale: number }[] {
  const mesiNomi = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const result: { mese: string; totale: number }[] = [];

  // Initialize all months with zero
  for (let mese = 0; mese < 12; mese++) {
    result.push({ mese: mesiNomi[mese], totale: 0 });
  }

  // Sum incomes by month
  incassi.forEach(incasso => {
    const data = parseISODate(incasso.dataIncasso);
    if (data.getFullYear() === anno) {
      const mese = data.getMonth();
      result[mese].totale = roundCurrency(result[mese].totale + incasso.importoLordo);
    }
  });

  return result;
}

/**
 * Get ATECO coefficient by code
 */
export function getAtecoCoefficiente(codiceATECO: string): number {
  const ateco = CODICI_ATECO.find(a => a.codice === codiceATECO);
  return ateco?.coefficiente ?? 0.78; // Default to 0.78 if not found
}

/**
 * Get ATECO description by code
 */
export function getAtecoDescrizione(codiceATECO: string): string {
  const ateco = CODICI_ATECO.find(a => a.codice === codiceATECO);
  return ateco?.descrizione ?? 'Non specificato';
}

// ============================================================================
// BOLLI (REVENUE STAMPS) TRACKER
// ============================================================================

export interface BolloInfo {
  incassoId: string;
  importoLordo: number;
  dataIncasso: string;
  cliente?: string;
  descrizione?: string;
}

export interface BolliSummary {
  fattureConBollo: BolloInfo[];
  numeroBolliDovuti: number;
  importoTotaleBolli: number;
  scadenzaVersamento: string; // "30 aprile YYYY+1"
  annoRiferimento: number;
  bolliPagati: boolean;
}

/**
 * Calculate revenue stamps (marche da bollo) due for the year.
 *
 * Rule: €2 stamp duty on every invoice > €77.47 (art. 13.1 Tariffa DPR 642/1972)
 * Payment: via F24 telematico, codice tributo 2501, by April 30 of the following year
 */
export function calcolaBolli(incassi: Incasso[], anno: number): BolliSummary {
  const SOGLIA_BOLLO = 77.47;
  const IMPORTO_BOLLO = 2;

  const fattureConBollo: BolloInfo[] = incassi
    .filter(inc => {
      const dataAnno = new Date(inc.dataIncasso).getFullYear();
      return dataAnno === anno && inc.importoLordo > SOGLIA_BOLLO;
    })
    .map(inc => ({
      incassoId: inc.id,
      importoLordo: inc.importoLordo,
      dataIncasso: inc.dataIncasso,
      cliente: inc.cliente,
      descrizione: inc.descrizione,
    }));

  return {
    fattureConBollo,
    numeroBolliDovuti: fattureConBollo.length,
    importoTotaleBolli: roundCurrency(fattureConBollo.length * IMPORTO_BOLLO),
    scadenzaVersamento: `30 aprile ${anno + 1}`,
    annoRiferimento: anno,
    bolliPagati: false,
  };
}

/**
 * Search ATECO codes by keyword
 */
export function searchAtecoCodici(keyword: string): AtecoCodice[] {
  const lowerKeyword = keyword.toLowerCase();
  return CODICI_ATECO.filter(
    ateco =>
      ateco.codice.includes(keyword) ||
      ateco.descrizione.toLowerCase().includes(lowerKeyword)
  );
}