// Verificador de enlaces (10/10/2026). Falla (exit 1) si algún enlace, ancla o imagen incumple las reglas del proyecto.
// Sin dependencias: lee los .html de la raíz con expresiones regulares simples.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEL = 'tel:+50687071228';
const WA_BASE = 'https://api.whatsapp.com/send?phone=50687071228&text=';

const errores = [];
let totalTel = 0, totalWa = 0, totalAncla = 0, totalImg = 0, totalSrcset = 0;
const pendientes = [];
const estricto = process.argv.includes('--estricto'); // npm run publicar: los pendientes también hacen fallar

const decodificarHtml = (s) => s.replace(/&amp;/g, '&');
const atributo = (etiqueta, nombre) => {
  const m = etiqueta.match(new RegExp(`\\s${nombre}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[2] ?? m[3]) : null;
};

for (const archivo of readdirSync(RAIZ).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(RAIZ, archivo), 'utf8');
  const falla = (msg) => errores.push(`${archivo}: ${msg}`);

  const ids = [...html.matchAll(/\sid\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
  const vistos = new Set();
  for (const id of ids) {
    if (vistos.has(id)) falla(`id duplicado "${id}"`);
    vistos.add(id);
  }

  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const etiqueta = m[0];
    const crudo = atributo(etiqueta, 'href');
    if (crudo === null) { falla(`<a> sin href: ${etiqueta}`); continue; }
    const href = decodificarHtml(crudo);

    if (href.trim() === '' || href === '#') { falla(`href vacío o "#": ${etiqueta}`); continue; }

    if (href.startsWith('tel:')) {
      totalTel++;
      if (href !== TEL) falla(`tel: incorrecto "${href}" (debe ser ${TEL})`);
    } else if (/whatsapp\.com|wa\.me/i.test(href)) {
      totalWa++;
      if (!href.startsWith(WA_BASE)) { falla(`WhatsApp con número o formato incorrecto: ${href}`); }
      else {
        const texto = href.slice(WA_BASE.length);
        if (!texto) falla(`WhatsApp sin texto prellenado: ${href}`);
        else {
          let ok = false;
          try { ok = encodeURIComponent(decodeURIComponent(texto)) === texto; } catch { ok = false; }
          if (!ok) falla(`texto de WhatsApp mal codificado: ${texto}`);
        }
      }
      if (!/target="_blank"/.test(etiqueta) || !/rel="[^"]*noopener[^"]*noreferrer[^"]*"/.test(etiqueta))
        falla(`enlace WhatsApp sin target="_blank" y rel="noopener noreferrer": ${href}`);
    } else if (href.startsWith('#')) {
      totalAncla++;
      if (!ids.includes(href.slice(1))) falla(`ancla sin destino "${href}"`);
    } else if (/^https?:\/\//i.test(href)) {
      if (!/rel="[^"]*noopener[^"]*noreferrer[^"]*"/.test(etiqueta)) falla(`enlace externo sin rel="noopener noreferrer": ${href}`);
    } else if (!existsSync(join(RAIZ, href.split('#')[0]))) {
      falla(`enlace local roto "${href}"`);
    }
  }

  // Cualquier número distinto escrito como phone=
  for (const m of html.matchAll(/phone=(\d+)/g)) if (m[1] !== '50687071228') falla(`phone= distinto: ${m[1]}`);

  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    totalImg++;
    const alt = atributo(m[0], 'alt');
    if (alt === null || alt.trim() === '') falla(`imagen sin alt: ${m[0]}`);
    if (atributo(m[0], 'width') === null || atributo(m[0], 'height') === null) falla(`imagen sin width/height: ${m[0]}`);
    const src = atributo(m[0], 'src');
    if (src && !/^https?:|^data:/.test(src) && !existsSync(join(RAIZ, src))) falla(`imagen inexistente "${src}"`);
  }

  for (const m of html.matchAll(/<link\b[^>]*\shref="([^"]+)"/gi))
    if (!/^https?:/.test(m[1]) && !existsSync(join(RAIZ, m[1]))) falla(`recurso <link> inexistente "${m[1]}"`);
  for (const m of html.matchAll(/<script\b[^>]*\ssrc="([^"]+)"/gi))
    if (!/^https?:/.test(m[1]) && !existsSync(join(RAIZ, m[1]))) falla(`script inexistente "${m[1]}"`);

  // Cada archivo de srcset (<source> e <img>) debe existir
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/g))
    for (const parte of m[1].split(',')) {
      const ruta = parte.trim().split(/\s+/)[0];
      if (!ruta || /^https?:/.test(ruta)) continue;
      totalSrcset++;
      if (!existsSync(join(RAIZ, ruta))) falla(`srcset apunta a un archivo inexistente "${ruta}"`);
    }

  // Símbolos del sprite SVG
  for (const m of html.matchAll(/<use\b[^>]*\shref="#([^"]+)"/g))
    if (!ids.includes(m[1])) falla(`<use> sin símbolo "#${m[1]}"`);

  // La imagen para compartir debe existir en disco, aunque su URL absoluta dependa del dominio final
  for (const m of html.matchAll(/property="og:image"\s+content="https?:\/\/[^/]+\/([^"]+)"/g))
    if (!existsSync(join(RAIZ, m[1]))) falla(`og:image apunta a un archivo inexistente "${m[1]}"`);

  // Avisos de publicación (solo fallan con --estricto)
  for (const m of html.matchAll(/\[PENDIENTE\][^<]*/g)) pendientes.push(`${archivo}: ${m[0].trim()}`);
}
for (const f of ['index.html', 'robots.txt', 'sitemap.xml']) {
  if (existsSync(join(RAIZ, f)) && readFileSync(join(RAIZ, f), 'utf8').includes('generadores.electrotecniacyc.com'))
    pendientes.push(`${f}: usa generadores.electrotecniacyc.com; confirmar el subdominio final`);
}
if (!/rel="canonical"/.test(readFileSync(join(RAIZ, 'index.html'), 'utf8'))) pendientes.push('index.html: falta <link rel="canonical"> (se agrega con el dominio final)');

console.log(`Revisado: ${totalTel} tel:, ${totalWa} WhatsApp, ${totalAncla} anclas internas, ${totalImg} imágenes, ${totalSrcset} archivos de srcset.`);
if (pendientes.length) {
  console.log(`\n${estricto ? '✗' : '⚠'} ${pendientes.length} pendiente(s) antes de publicar:`);
  for (const p of pendientes) console.log('  - ' + p);
  if (estricto) errores.push(`${pendientes.length} pendiente(s) sin resolver (ver arriba)`);
}
if (errores.length) {
  console.error(`\n✗ ${errores.length} problema(s):`);
  for (const e of errores) console.error('  - ' + e);
  process.exit(1);
}
console.log('✓ Todos los enlaces e imágenes cumplen las reglas.');
