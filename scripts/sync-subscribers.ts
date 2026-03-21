import { Redis } from '@upstash/redis';
import { readFileSync } from 'fs';
import { parse } from 'papaparse';

const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
  console.error('❌ Variabili ambiente KV_REST_API_URL e KV_REST_API_TOKEN richieste.');
  console.error('   Puoi trovarle nella dashboard Vercel → Storage → KV → Settings');
  console.error('   Esegui con: KV_REST_API_URL=... KV_REST_API_TOKEN=... npx tsx scripts/sync-subscribers.ts file.csv');
  process.exit(1);
}

const redis = new Redis({
  url: KV_REST_API_URL,
  token: KV_REST_API_TOKEN,
});

async function main() {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error('❌ Uso: npx tsx scripts/sync-subscribers.ts <percorso-csv-substack>');
    process.exit(1);
  }

  console.log(`📂 Leggo ${csvPath}...`);
  const csvContent = readFileSync(csvPath, 'utf-8');

  const { data } = parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  // Filtra solo i paganti
  const paid = (data as any[]).filter(row => row['Type'] === 'Paid');

  if (paid.length === 0) {
    console.log('⚠️  Nessun abbonato pagante trovato nel CSV.');
    console.log('   Se vuoi caricare TUTTI gli iscritti (anche free), modifica il filtro nello script.');
    process.exit(0);
  }

  console.log(`👥 Trovati ${paid.length} abbonati paganti su ${(data as any[]).length} totali.`);

  // Scadenza: 35 giorni da ora (mese + 5 giorni di margine)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 35);
  const expiresAtISO = expiresAt.toISOString();

  let loaded = 0;

  const pipeline = redis.pipeline();

  for (const row of paid) {
    const email = (row['Email'] || '').trim().toLowerCase();
    if (!email) continue;

    const name = row['Name'] || '';

    pipeline.set(
      `subscriber:${email}`,
      JSON.stringify({ name, expiresAt: expiresAtISO }),
      { ex: 35 * 24 * 60 * 60 } // TTL: 35 giorni
    );
    loaded++;
  }

  try {
    await pipeline.exec();
    console.log(`✅ Caricati ${loaded} abbonati su Upstash Redis (scadenza: ${expiresAtISO})`);
  } catch (err) {
    console.error('❌ Errore nel caricamento:', err);
  }

  console.log('\n🎉 Sync completato!');
  console.log(`   Prossimo sync consigliato: entro il ${new Date(expiresAt.getTime() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT')}`);
}

main().catch(console.error);
