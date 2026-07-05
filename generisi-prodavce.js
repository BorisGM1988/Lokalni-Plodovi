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
// i "ПГ ПРОТИЋ" u "pg-protic" (podržava i ćirilicu i latinicu)
function napraviSlug(ime) {
  const cirilicaLatinica = {
    а:'a', б:'b', в:'v', г:'g', д:'d', ђ:'dj', е:'e', ж:'z', з:'z', и:'i',
    ј:'j', к:'k', л:'l', љ:'lj', м:'m', н:'n', њ:'nj', о:'o', п:'p', р:'r',
    с:'s', т:'t', ћ:'c', у:'u', ф:'f', х:'h', ц:'c', ч:'c', џ:'dz', ш:'s',
    А:'a', Б:'b', В:'v', Г:'g', Д:'d', Ђ:'dj', Е:'e', Ж:'z', З:'z', И:'i',
    Ј:'j', К:'k', Л:'l', Љ:'lj', М:'m', Н:'n', Њ:'nj', О:'o', П:'p', Р:'r',
    С:'s', Т:'t', Ћ:'c', У:'u', Ф:'f', Х:'h', Ц:'c', Ч:'c', Џ:'dz', Ш:'s',
  };
  const latinicaKvacice = { č: 'c', ć: 'c', š: 's', đ: 'dj', ž: 'z', Č: 'c', Ć: 'c', Š: 's', Đ: 'dj', Ž: 'z' };
  const zamene = { ...cirilicaLatinica, ...latinicaKvacice };

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
<meta name="robots" content="index, follow"/>
<link rel="canonical" href="${url}"/>
<meta property="og:title" content="${escapeHtml(ime)} – LokalniPlodovi"/>
<meta property="og:description" content="${opisMeta}"/>
<meta property="og:image" content="${escapeHtml(slika)}"/>
<meta property="og:type" content="profile"/>
<meta property="og:url" content="${url}"/>
<link rel="icon" type="image/x-icon" href="/favicon.ico"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
<link rel="stylesheet" href="/mobile.css">
<style>
  :root{--zelena:#2e7d32;--zelena-svetla:#4caf50;--zelena-tamna:#1b5e20;--zlatna:#f5a623;--zlatna-svetla:#ffd166;--zemlja:#5d4037;--krem:#faf7f0;--krem-tamna:#f0ece0;--tekst:#2c2c2c;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:var(--krem);color:var(--tekst);min-height:100vh;display:flex;flex-direction:column;line-height:1.6;}

  header{background:linear-gradient(135deg,var(--zelena-tamna) 0%,var(--zelena) 100%);color:#fff;position:sticky;top:0;z-index:1000;box-shadow:0 4px 20px rgba(0,0,0,0.18);}
  nav{max-width:1400px;margin:0 auto;padding:1.1rem 2rem;display:flex;justify-content:space-between;align-items:center;}
  .logo{display:flex;align-items:center;gap:0.5rem;text-decoration:none;}
  .logo-icon{width:38px;height:38px;background:rgba(255,255,255,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem;border:1.5px solid rgba(255,255,255,0.3);}
  .logo-text{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;color:#fff;}
  .logo-text span{color:var(--zlatna-svetla);}
  nav ul{display:flex;list-style:none;gap:0.2rem;align-items:center;}
  nav ul li a{color:rgba(255,255,255,0.88);text-decoration:none;font-size:0.88rem;font-weight:500;padding:0.45rem 0.85rem;border-radius:50px;transition:all 0.2s;}
  nav ul li a:hover{background:rgba(255,255,255,0.15);color:#fff;}
  .hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;}
  .hamburger span{width:26px;height:2.5px;background:#fff;border-radius:3px;display:block;}

  .breadcrumb{max-width:900px;margin:1.5rem auto 0;padding:0 1.5rem;font-size:0.85rem;color:#888;}
  .breadcrumb a{color:var(--zelena);text-decoration:none;}

  .wrap{max-width:900px;margin:1.5rem auto 3rem;padding:0 1.5rem;flex:1;width:100%;}
  .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);}
  .card img{width:100%;height:320px;object-fit:cover;display:block;background:var(--krem-tamna);}
  .card-body{padding:2rem;}
  h1{font-family:'Playfair Display',serif;color:var(--zelena-tamna);font-size:2rem;margin-bottom:0.4rem;}
  .lokacija{color:#777;font-size:0.95rem;margin-bottom:1rem;}
  .nisa-badge{display:inline-block;background:var(--krem-tamna);color:var(--zelena-tamna);padding:0.3rem 0.8rem;border-radius:20px;font-size:0.85rem;margin-bottom:1rem;}
  .opis{margin-bottom:1.6rem;color:#444;}
  .btn{display:inline-block;background:var(--zelena);color:#fff;padding:0.9rem 1.8rem;border-radius:10px;text-decoration:none;font-weight:600;}
  .btn:hover{background:var(--zelena-tamna);}

  footer{background:var(--zemlja);color:#fff;text-align:center;padding:3rem 1.5rem 2rem;margin-top:auto;}
  footer a{color:#c8e6c9;text-decoration:none;}
  footer a:hover{text-decoration:underline;}
  .footer-logo{font-family:'Playfair Display',serif;font-size:1.5rem;margin-bottom:0.5rem;}

  @media (max-width:768px){
    .hamburger{display:flex;}
    nav ul{display:none;position:absolute;top:62px;left:0;right:0;background:rgba(27,94,32,0.97);backdrop-filter:blur(12px);flex-direction:column;padding:1.2rem 1.5rem 1.8rem;gap:0.4rem;z-index:999;border-bottom:1px solid rgba(255,255,255,0.1);}
    nav ul.open{display:flex;}
    .card img{height:220px;}
  }
</style>
</head>
<body>

<header>
  <nav>
    <a href="/index.html" class="logo">
      <div class="logo-icon">🌿</div>
      <span class="logo-text">Lokalni<span>Plodovi</span></span>
    </a>
    <button class="hamburger" onclick="document.getElementById('nav-menu').classList.toggle('open')" aria-label="Meni">
      <span></span><span></span><span></span>
    </button>
    <ul id="nav-menu">
      <li><a href="/index.html">Početna</a></li>
      <li><a href="/Prodavci.html">Svi prodavci</a></li>
      <li><a href="/mapa.html">Mapa</a></li>
      <li><a href="/blog.html">Blog</a></li>
      <li id="moj-profil-li" style="display:none;"><a href="/moj-profil.html" id="moj-profil-link">Moj profil</a></li>
      <li id="odjavi-se-li" style="display:none;"><a href="#" onclick="localStorage.clear(); window.location.href='/index.html';">Odjavi se</a></li>
      <li id="prijavi-se-li"><a href="/login.html">Prijavi se</a></li>
      <li id="postani-prodavac-li"><a href="/registracija.html">Registruj se</a></li>
    </ul>
  </nav>
</header>

<script>
  (function() {
    const token = localStorage.getItem('token');
    const tip = localStorage.getItem('tip');
    if (token) {
      document.getElementById('moj-profil-li').style.display = 'list-item';
      document.getElementById('odjavi-se-li').style.display = 'list-item';
      document.getElementById('prijavi-se-li').style.display = 'none';
      document.getElementById('postani-prodavac-li').style.display = 'none';
      const link = document.getElementById('moj-profil-link');
      if (link) link.href = (tip === 'kupac') ? '/kupac-profil.html' : '/moj-profil.html';
    }
  })();
</script>

<nav class="breadcrumb" aria-label="breadcrumb">
  <a href="/index.html">Početna</a> › <a href="/Prodavci.html">Svi prodavci</a> › <strong style="color:var(--tekst);">${escapeHtml(ime)}</strong>
</nav>

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

<footer>
  <div style="max-width:1400px;margin:0 auto;">
    <div class="footer-logo">LokalniPlodovi</div>
    <p style="opacity:0.85;margin-bottom:1.5rem;">Prirodno • Sezonski • Direktno sa imanja Srbije</p>
    <p style="opacity:0.75;margin-bottom:0.7rem;">© 2026 LokalniPlodovi • Sva prava zadržana</p>
    <p>
      <a href="/politika-privatnosti.html">Politika privatnosti</a> •
      <a href="/uslovi-koriscenja.html">Uslovi korišćenja</a>
    </p>
  </div>
</footer>

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
