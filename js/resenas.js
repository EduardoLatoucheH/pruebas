// Reseñas de Google (11/10/2026). Pide /api/resenas y, solo si hay reseñas, muestra la sección y el ítem del menú.
// Todo el texto entra con textContent (nunca innerHTML).
(function () {
  var seccion = document.getElementById('opiniones');
  var lista = document.getElementById('opiniones-lista');
  if (!seccion || !lista || !window.fetch) return;

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto) n.textContent = texto;
    return n;
  }

  function pintar(datos) {
    var resenas = datos && Array.isArray(datos.resenas) ? datos.resenas.slice(0, 3) : [];
    if (!resenas.length) return;
    resenas.forEach(function (r) {
      var item = el('li', 'resena');
      var est = el('span', 'estrellas', '★★★★★');
      est.setAttribute('role', 'img');
      est.setAttribute('aria-label', '5 de 5 estrellas');
      item.appendChild(est);
      item.appendChild(el('p', 'resena-txt', '“' + r.texto + '”'));
      var pie = el('p', 'resena-autor');
      if (r.autorUrl && /^https:\/\/www\.google\.com\/maps\/contrib\//.test(r.autorUrl)) {
        var a = el('a', null, r.autor);
        a.href = r.autorUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        pie.appendChild(a);
      } else {
        pie.appendChild(el('b', null, r.autor));
      }
      if (r.fecha) pie.appendChild(document.createTextNode(' · ' + r.fecha));
      item.appendChild(pie);
      lista.appendChild(item);
    });
    seccion.hidden = false;
    var menu = document.getElementById('menu-opiniones');
    if (menu) menu.hidden = false;
  }

  fetch('/api/resenas', { headers: { Accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(pintar)
    .catch(function () { /* sin reseñas: la sección sigue oculta */ });
})();
