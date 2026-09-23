// ══════════════════════════════════════════
// AUTOMATSKE MANJE VERZIJE CLOUDINARY SLIKA (štedi bandwidth)
// Sve Cloudinary slike koje se prikazuju na stranici dobijaju
// w_800,c_limit,q_auto,f_auto. Slike koje već imaju transformaciju se ne diraju.
// ══════════════════════════════════════════
(function () {
  const RE = /(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)(?![a-z]{1,3}_)/;
  function popravi(img) {
    const s = img.getAttribute('src');
    if (s && RE.test(s)) img.setAttribute('src', s.replace(RE, '$1w_800,c_limit,q_auto,f_auto/'));
  }
  function pregledaj(cvor) {
    if (cvor.nodeType !== 1) return;
    if (cvor.tagName === 'IMG') popravi(cvor);
    if (cvor.querySelectorAll) cvor.querySelectorAll('img').forEach(popravi);
  }
  new MutationObserver(function (lista) {
    lista.forEach(function (m) {
      if (m.type === 'attributes') popravi(m.target);
      else m.addedNodes.forEach(pregledaj);
    });
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  document.querySelectorAll('img').forEach(popravi);
})();
