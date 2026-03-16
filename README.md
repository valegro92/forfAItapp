# ForfAIt — Il tuo cruscotto forfettario

Strumento riservato agli iscritti de **La Cassetta degli AI-trezzi**.

## Cosa fa

- **Netto Spendibile**: calcola quanto puoi davvero spendere dopo tasse e contributi
- **Scorporo Fattura**: scorporo inverso compenso/contributo con testo pronto per la fattura
- **Scadenziario**: scadenze fiscali automatiche (giugno/novembre)
- **Grafici**: andamento mensile incassi
- **Tutte le casse**: Gestione Separata, Inarcassa, ENPAM, CIPAG, Cassa Forense e altre 10+

## Deploy su Vercel

### 1. Prepara il repository

```bash
cd forfait-app
git init
git add .
git commit -m "ForfAIt v1.0"
```

Pusha su GitHub (repo privato consigliato):
```bash
gh repo create forfait-app --private --push --source=.
```

### 2. Collega a Vercel

1. Vai su [vercel.com](https://vercel.com)
2. "Add New Project" → Importa il repo GitHub
3. Framework: Next.js (auto-detected)
4. **Environment Variables** — aggiungi queste:

| Variabile | Valore | Descrizione |
|-----------|--------|-------------|
| `JWT_SECRET` | Una stringa random lunga (min 32 chars) | Segreto per i token di sessione |
| `MONTHLY_CODE` | Il codice che cambi ogni mese | Es: `cassetta-marzo-2026` |
| `ALLOWED_EMAILS` | Lista email separata da virgole | Es: `mario@test.it,giulia@test.it` |

5. Clicca "Deploy"

### 3. Gestione mensile

Ogni mese:
1. Vai su Vercel → Settings → Environment Variables
2. Cambia il valore di `MONTHLY_CODE`
3. Vercel riapplica automaticamente al prossimo deploy

Per aggiungere nuovi iscritti:
1. Aggiungi l'email a `ALLOWED_EMAILS` (separata da virgola)
2. Re-deploy (basta un commit vuoto o redeploy dal dashboard Vercel)

### Generare un JWT_SECRET

```bash
openssl rand -base64 32
```

## Sviluppo locale

```bash
npm install
cp .env.example .env.local
# Modifica .env.local con i tuoi valori
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Next.js 14** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS** (dark theme)
- **Recharts** (grafici)
- **Lucide React** (icone)
- **Jose** (JWT authentication)

## Struttura

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Login (email + codice mensile)
│   ├── dashboard/page.tsx    # Dashboard BI completa
│   ├── api/auth/route.ts     # API autenticazione
│   ├── layout.tsx            # Layout root
│   └── globals.css           # Stili globali
├── components/
│   └── Impostazioni.tsx      # Pannello impostazioni completo
├── lib/
│   ├── fiscal-engine.ts      # Motore di calcolo fiscale
│   └── auth.ts               # Utility JWT
└── middleware.ts              # Protezione route /dashboard
```

## Note

- I dati fiscali sono salvati nel browser (localStorage) di ogni utente
- Non sostituisce la consulenza del commercialista
- Creato da Valentino Grossi per La Cassetta degli AI-trezzi
