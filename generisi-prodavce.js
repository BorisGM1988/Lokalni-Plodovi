/**
 * generisi-prodavce.js
 * ---------------------------------------------------------
 * Ova skripta pravi statičke, SEO-prijateljske stranice za
 * svakog prodavca (npr. /prodavac/pcelarstvo-jovanovic-42.html)
 * i ažurira sitemap.xml da uključuje sve stranice sajta.
 *
 * Zašto: umesto da Google/posetilac čeka JavaScript da povuče
 * podatke o prodavcu (kao na moj-profil.html?userId=42), ova
 * skripta unapred napravi gotov HTML sa pravim imenom, opisom
 * i title/meta tagovima za svakog prodavca.
 *
 * Kako se pokreće:
 *   node generisi-prodavce.js
 *
 * Ne treba nikakav dodatni paket (koristi ugrađeni fetch iz
 * Node.js 18+), samo obično "node" mora biti instaliran.
 * ---------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'https://lokalni-backend-production.up.railway.app';
const SITE_URL = 'https://lokalniplodovi.rs';
const OUTPUT_DIR = path.join(__dirname, 'prodavac');

// ── Fiksne stranice sajta (ručno održavane) ──────────────
const STATICNE_STRANICE = [
  { loc: '/', priority: '1.0' },
  { loc: '/povrce.html', priority: '0.9' },
  { loc: '/voce.html', priority: '0.9' },
  { loc: '/mlecni.html', priority: '0.9' },
  { loc: '/meso.html', priority: '0.9' },
  { loc: '/med.html', priority: '0.9' },
  { loc: '/jaja.html', priority: '0.9' },
  { loc: '/zdravlje.html', priority: '0.9' },
  { loc: '/Prodavci.html', priority: '0.8' },
  { loc: '/mapa.html', priority: '0.7' },
  { loc: '/o-nama.html', priority: '0.6' },
  { loc: '/kontakt.html', priority: '0.6' },
  { loc: '/uputstvo-za-prodavce.html', priority: '0.6' },
  { loc: '/roadmap.html', priority: '0.5' },
  { loc: '/politika-privatnosti.html', priority: '0.4' },
  { loc: '/uslovi-koriscenja.html', priority: '0.4' },
];

// ── Stranice proizvoda (proizvodjaci/*.html) ─────────────
const PROIZVOD_STRANICE = [
  'proizvodjaci/blitva.html', 'proizvodjaci/boranija.html', 'proizvodjaci/cvekla.html',
  'proizvodjaci/grasak.html', 'proizvodjaci/krastavac.html', 'proizvodjaci/krompir.html',
  'proizvodjaci/kupus.html', 'proizvodjaci/luk.html', 'proizvodjaci/paprika.html',
  'proizvodjaci/paradajz.html', 'proizvodjaci/pasulj.html', 'proizvodjaci/patlidzan.html',
  'proizvodjaci/rotkvice.html', 'proizvodjaci/sargarepa.html', 'proizvodjaci/spanac.html',
  'proizvodjaci/tikvice.html',
  'proizvodjaci/med/bagremov.html', 'proizvodjaci/med/borov.html', 'proizvodjaci/med/kestenov.html',
  'proizvodjaci/med/lipov.html', 'proizvodjaci/med/livadski.html', 'proizvodjaci/med/propolis.html',
  'proizvodjaci/med/sace.html', 'proizvodjaci/med/sumski.html',
  'proizvodjaci/meso/cvarci.html', 'proizvodjaci/meso/kobasica.html', 'proizvodjaci/meso/kulen.html',
  'proizvodjaci/meso/prsuta.html', 'proizvodjaci/meso/slanina.html', 'proizvodjaci/meso/svezemeso.html',
  'proizvodjaci/mleko/jogurt.html', 'proizvodjaci/mleko/kajmak.html', 'proizvodjaci/mleko/maslac.html',
  'proizvodjaci/mleko/mleko.html', 'proizvodjaci/mleko/pavlaka.html', 'proizvodjaci/mleko/sir.html',
  'proizvodjaci/mleko/surutka.html',
  'proizvodjaci/voce/borovnica.html', 'proizvodjaci/voce/breskva.html', 'proizvodjaci/voce/dunja.html',
  'proizvodjaci/voce/grozdje.html', 'proizvodjaci/voce/jabuka.html', 'proizvodjaci/voce/jagoda.html',
  'proizvodjaci/voce/kajsija.html', 'proizvodjaci/voce/kruska.html', 'proizvodjaci/voce/kupina.html',
  'proizvodjaci/voce/lubenica.html', 'proizvodjaci/voce/malina.html', 'proizvodjaci/voce/sljiva.html',
  'proizvodjaci/voce/tresnje.html', 'proizvodjaci/voce/visnja.html',
];

// ── Pomoćna funkcija: pretvara "Pčelarstvo Jovanović" u "pcelarstvo-jovanovic" ──
function napraviSlug(ime) {
  const zamene = { č: 'c', ć: 'c', š: 's', đ: 'dj', ž: 'z', Č: 'c', Ć: 'c', Š: 's', Đ: 'dj', Ž: 'z' };
  return (ime || 'prodavac')
    .split('').map(k => zamene[k] || k).join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── HTML template za jednu statičku stranicu prodavca ────
function napraviHtml(p) {
  const ime = p.ime || 'Prodavac';
  const lokacija = p.lokacija || 'Srbija';
  const nisa = p.glavnaNisa || '';
  const opisPun = p.opis || `${ime} iz mesta ${lokacija} nudi domaće proizvode direktno sa imanja.`;
  const opisMeta = escapeHtml(opisPun.substring(0, 155));
  const slika = p.slika && p.slika.trim() !== '' ? p.slika : 'https://lokalniplodovi.rs/placeholder-prodavac.svg';
  const url = `${SITE_URL}/prodavac/${napraviSlug(ime)}-${p.id}.html`;

  return `<!DOCTYPE html>
<html lang="sr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${escapeHtml(ime)} – LokalniPlodovi</title>
<meta name="description" content="${opisMeta}"/>
<link rel="canonical" href="${url}"/>
<meta property="og:title" content="${escapeHtml(ime)} – LokalniPlodovi"/>
<meta property="og:description" content="${opisMeta}"/>
<meta property="og:image" content="${escapeHtml(slika)}"/>
<meta property="og:type" content="profile"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{--zelena:#2e7d32;--zelena-tamna:#1b5e20;--krem:#faf7f0;--krem-tamna:#f0ece0;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:var(--krem);color:#333;line-height:1.6;}
  header{background:linear-gradient(135deg,var(--zelena-tamna) 0%,var(--zelena) 100%);padding:1.2rem 1.5rem;}
  header a{color:#fff;font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;text-decoration:none;}
  .wrap{max-width:720px;margin:2.5rem auto;padding:0 1.2rem;}
  .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);}
  .card img{width:100%;height:280px;object-fit:cover;display:block;background:var(--krem-tamna);}
  .card-body{padding:1.8rem;}
  h1{font-family:'Playfair Display',serif;color:var(--zelena-tamna);font-size:1.8rem;margin-bottom:0.4rem;}
  .lokacija{color:#777;font-size:0.95rem;margin-bottom:1rem;}
  .nisa-badge{display:inline-block;background:var(--krem-tamna);color:var(--zelena-tamna);padding:0.3rem 0.8rem;border-radius:20px;font-size:0.85rem;margin-bottom:1rem;}
  .opis{margin-bottom:1.6rem;color:#444;}
  .btn{display:inline-block;background:var(--zelena);color:#fff;padding:0.8rem 1.6rem;border-radius:10px;text-decoration:none;font-weight:600;}
  .btn:hover{background:var(--zelena-tamna);}
  footer{text-align:center;color:#999;font-size:0.85rem;padding:2rem 1rem;}
</style>
</head>
<body>
<header><a href="/index.html">LokalniPlodovi</a></header>
<div class="wrap">
  <div class="card">
    <img src="${escapeHtml(slika)}" alt="${escapeHtml(ime)} – ${escapeHtml(lokacija)}" loading="lazy">
    <div class="card-body">
      <h1>${escapeHtml(ime)}</h1>
      <div class="lokacija">📍 ${escapeHtml(lokacija)}</div>
      ${nisa ? `<span class="nisa-badge">🌱 ${escapeHtml(nisa)}</span>` : ''}
      <p class="opis">${escapeHtml(opisPun)}</p>
      <a class="btn" href="/moj-profil.html?userId=${escapeHtml(String(p.id))}">Pogledaj celu tezgu i pošalji poruku →</a>
    </div>
  </div>
</div>
<footer>© 2026 LokalniPlodovi • Domaći proizvodi direktno od proizvođača</footer>
</body>
</html>`;
}

// ── Glavna funkcija ───────────────────────────────────────
async function pokreni() {
  console.log('Povlačim spisak prodavaca sa backend-a...');
  const response = await fetch(`${BACKEND_URL}/svi-prodavci`);
  if (!response.ok) {
    throw new Error(`Backend je vratio grešku: ${response.status}`);
  }
  const prodavci = await response.json();
  console.log(`Nađeno ${prodavci.length} prodavaca.`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const prodavacUrls = [];

  for (const p of prodavci) {
    if (!p.id || !p.ime) continue; // preskoči nepotpune zapise
    const slug = napraviSlug(p.ime);
    const fajlIme = `${slug}-${p.id}.html`;
    const html = napraviHtml(p);
    fs.writeFileSync(path.join(OUTPUT_DIR, fajlIme), html, 'utf8');
    prodavacUrls.push(`/prodavac/${fajlIme}`);
  }

  console.log(`Napravljeno ${prodavacUrls.length} statičkih stranica u /prodavac/`);

  // ── Generiši sitemap.xml ──
  const sveUrls = [
    ...STATICNE_STRANICE.map(s => ({ loc: s.loc, priority: s.priority })),
    ...PROIZVOD_STRANICE.map(l => ({ loc: `/${l}`, priority: '0.6' })),
    ...prodavacUrls.map(l => ({ loc: l, priority: '0.65' })),
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sveUrls.map(u => `  <url><loc>${SITE_URL}${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;

  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemapXml, 'utf8');
  console.log(`sitemap.xml ažuriran — ukupno ${sveUrls.length} stranica.`);
}

pokreni().catch(err => {
  console.error('Greška pri generisanju:', err);
  process.exit(1);
});
