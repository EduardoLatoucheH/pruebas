// Auditoría de lenguaje (10/10/2026). npm run lenguaje
// Revisa lo que se puede medir del texto: título y descripción, H1, registro (usted), afirmaciones que no están confirmadas,
// precio, cobertura de palabras clave (las que ya posiciona el sitio actual), terminología y legibilidad.
// FALLA hace salir con error; AVISO es una recomendación.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');

const entidades = { '&amp;': '&', '&nbsp;': ' ', '&quot;': '"', '&lt;': '<', '&gt;': '>', '&#039;': "'" };
const decodificar = (s) => s.replace(/&[a-z#0-9]+;/gi, (e) => entidades[e] ?? e);
const sinTildes = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const cuerpo = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];
const visible = decodificar(
  cuerpo.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>|<!--[\s\S]*?-->/gi, ' ')
    .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const titulo = decodificar((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '');
const meta = (nombre) => decodificar((html.match(new RegExp(`<meta[^>]+(?:name|property)="${nombre}"[^>]+content="([^"]*)"`, 'i')) || [])[1] || '');
const descripcion = meta('description');
const textoCompleto = [titulo, descripcion, meta('og:title'), meta('og:description'), meta('og:image:alt'), visible].join(' \n ');

const resultados = [];
const anotar = (estado, regla, detalle) => resultados.push({ estado, regla, detalle });

// 1. Título
{
  const n = titulo.length, t = sinTildes(titulo);
  const claves = ['mantenimiento', 'plantas electricas', 'san jose', 'costa rica'].filter((k) => !t.includes(k));
  if (claves.length) anotar('FALLA', 'Título', `falta: ${claves.join(', ')} (son las palabras del título actual que posiciona)`);
  else if (n > 80) anotar('AVISO', 'Título', `${n} caracteres; Google corta alrededor de 60, aunque lo indexa completo`);
  else anotar('PASA', 'Título', `${n} caracteres, conserva "mantenimiento plantas eléctricas San José Costa Rica"`);
}
// 2. Descripción
{
  const n = descripcion.length, d = sinTildes(descripcion);
  const claves = ['generadores electricos', 'sistemas contra incendios', 'costa rica'].filter((k) => !d.includes(k));
  if (n < 70 || n > 160) anotar('AVISO', 'Descripción', `${n} caracteres (ideal 70–160)`);
  else if (claves.length) anotar('FALLA', 'Descripción', `falta: ${claves.join(', ')}`);
  else anotar('PASA', 'Descripción', `${n} caracteres, con servicios y país; no se corta`);
}
// 3. H1 único y con la frase clave
{
  const h1s = [...cuerpo.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decodificar(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim());
  if (h1s.length !== 1) anotar('FALLA', 'H1', `hay ${h1s.length}; debe haber exactamente uno`);
  else if (!sinTildes(h1s[0]).includes('generadores electricos y sistemas contra incendios en costa rica'))
    anotar('FALLA', 'H1', 'no contiene "generadores eléctricos y sistemas contra incendios en Costa Rica" (el H1 del sitio actual)');
  else anotar('PASA', 'H1', `uno solo, con la frase clave del sitio actual`);
}
// 4. Registro: siempre "usted" (compra B2B); sin voseo ni tuteo
{
  // \b de JavaScript no reconoce letras con tilde, así que se usan límites Unicode (si no, "Llamá" se escapa)
  const palabra = (formas) => new RegExp(`(?<!\\p{L})(${formas})(?!\\p{L})`, 'giu');
  const voseo = palabra('llam[aá]|escrib[ií]|consult[aá]|solicit[aá]|quer[eé]s|ten[eé]s|pod[eé]s|necesit[aá]s|mir[aá]|vos|sos|contanos|avisanos');
  const tuteo = palabra('ll[aá]manos|escr[ií]benos|tu|tus|puedes|quieres|necesitas|cont[aá]ctanos');
  const malos = [...new Set([...(textoCompleto.match(voseo) || []), ...(textoCompleto.match(tuteo) || [])].map((s) => s.toLowerCase()))];
  if (malos.length) anotar('FALLA', 'Registro (usted)', `formas de vos o tú: ${malos.join(', ')}`);
  else anotar('PASA', 'Registro (usted)', 'sin voseo ni tuteo; trato de usted en todo el texto');
}
// 5. Afirmaciones que no están confirmadas
{
  const prohibido = /(?<!\p{L})(garantiz\p{L}*|24\s*\/\s*7|24 horas|inmediat\p{L}*|respuesta r[aá]pida|el mejor|l[ií]der\p{L}*|n[uú]mero uno|certificad\p{L}*|autorizad\p{L}*|distribuidor\p{L}*|precios? (?:bajos?|econ[oó]micos?)|generac)(?!\p{L})/giu;
  const halladas = [...new Set(textoCompleto.match(prohibido) || [])];
  if (halladas.length) anotar('FALLA', 'Afirmaciones sin confirmar', halladas.join(', '));
  else anotar('PASA', 'Afirmaciones sin confirmar', 'sin garantías, 24/7, "inmediato", certificaciones, marcas autorizadas ni superlativos');
}
// 6. Precio: un solo monto, siempre con IVA
{
  const montos = [...textoCompleto.matchAll(/₡\s?([\d.]+)(\s*\+\s*IVA)?/g)];
  const valores = [...new Set(montos.map((m) => m[1]))];
  const sinIva = montos.filter((m) => !m[2]).length;
  if (!montos.length) anotar('AVISO', 'Precio', 'no aparece el precio de la inspección');
  else if (valores.length > 1) anotar('FALLA', 'Precio', `montos distintos: ${valores.join(' / ')}`);
  else if (sinIva) anotar('FALLA', 'Precio', `${sinIva} mención(es) sin "+ IVA"`);
  else anotar('PASA', 'Precio', `₡${valores[0]} + IVA, igual en ${montos.length} lugares (verificar contra el dueño)`);
}
// 7. Cobertura de palabras clave
{
  const t = sinTildes(visible + ' ' + titulo + ' ' + descripcion);
  // 11/10/2026: el dueño pidió textos más cortos (tarjetas de generadores e incendios); se retiraron 'plantas de emergencia', 'bombas' y 'transferencias'.
  const criticas = ['mantenimientos preventivos', 'reparacion', 'generadores electricos', 'plantas electricas',
    'sistemas contra incendios', 'pruebas hidrostaticas', 'inspeccion y diagnostico', 'planes de mantenimiento', 'san jose', 'hatillo', 'costa rica', '40 anos'];
  const secundarias = ['computo forense', 'recuperacion de datos', 'laptops', 'compresores', 'aire acondicionado'];
  const faltaC = criticas.filter((k) => !t.includes(k)), faltaS = secundarias.filter((k) => !t.includes(k));
  if (faltaC.length) anotar('FALLA', 'Palabras clave (servicios y lugar)', `faltan: ${faltaC.join(', ')}`);
  else anotar('PASA', 'Palabras clave (servicios y lugar)', `${criticas.length} de ${criticas.length} presentes`);
  if (faltaS.length) anotar('AVISO', 'Palabras clave (otros servicios)', `faltan: ${faltaS.join(', ')} (el sitio actual las usa)`);
  else anotar('PASA', 'Palabras clave (otros servicios)', `${secundarias.length} de ${secundarias.length} presentes`);
}
// 8. Terminología consistente
{
  const t = sinTildes(visible);
  const singular = (t.match(/contra incendio(?!s)/g) || []).length;
  const sinTilde = (visible.match(/\b(electrica|electricas|electrico|electricos|diesel|garantia|cotizacion|inspeccion|diagnostico|reparacion)\b/g) || []);
  if (singular) anotar('FALLA', 'Terminología', `"contra incendio" en singular ${singular} vez/veces; usar "sistemas contra incendios"`);
  else if (sinTilde.length) anotar('FALLA', 'Ortografía', `sin tilde: ${[...new Set(sinTilde)].join(', ')}`);
  else anotar('PASA', 'Terminología y ortografía', '"sistemas contra incendios" siempre en plural; tildes correctas');
}
// 9. Mensajes de WhatsApp: en español, de usted, distintos por contexto
{
  const textos = [...html.matchAll(/send\?phone=\d+&amp;text=([^"]+)"/g)].map((m) => decodeURIComponent(m[1]));
  const repetidos = textos.filter((x, i) => textos.indexOf(x) !== i);
  const sinSaludo = textos.filter((x) => !/^Hola/.test(x));
  if (repetidos.length) anotar('FALLA', 'Mensajes de WhatsApp', `repetidos: ${[...new Set(repetidos)].join(' | ')}`);
  else if (sinSaludo.length) anotar('AVISO', 'Mensajes de WhatsApp', `sin saludo: ${sinSaludo.join(' | ')}`);
  else anotar('PASA', 'Mensajes de WhatsApp', `${textos.length} mensajes distintos, todos con saludo`);
}
// 10. Legibilidad
{
  // Cada bloque (párrafo, título, ítem, pregunta) cuenta como frase aparte, aunque no termine en punto
  const porBloques = decodificar(cuerpo.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>|<!--[\s\S]*?-->/gi, ' ')
    .replace(/<\/(p|h[1-6]|li|summary|div|a)>/gi, ' ‖ ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
  const frases = porBloques.split(/(?<=[.!?])\s+|\s*‖\s*/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 4);
  const palabras = frases.map((s) => s.split(/\s+/).length);
  const media = palabras.reduce((a, b) => a + b, 0) / palabras.length;
  const maxima = Math.max(...palabras);
  if (maxima > 35) anotar('AVISO', 'Legibilidad', `frase de ${maxima} palabras: "${frases[palabras.indexOf(maxima)].slice(0, 70)}…"`);
  else if (media > 20) anotar('AVISO', 'Legibilidad', `promedio de ${media.toFixed(1)} palabras por frase (ideal ≤ 20)`);
  else anotar('PASA', 'Legibilidad', `${media.toFixed(1)} palabras por frase en promedio, máxima de ${maxima}`);
}
// 11. Idioma y región
{
  const lang = /<html[^>]+lang="es-CR"/.test(html), loc = /og:locale"\s+content="es_CR"/.test(html);
  if (!lang || !loc) anotar('FALLA', 'Idioma y región', `lang="es-CR": ${lang ? 'sí' : 'NO'}; og:locale es_CR: ${loc ? 'sí' : 'NO (el sitio actual dice es_ES)'}`);
  else anotar('PASA', 'Idioma y región', 'lang="es-CR" y og:locale es_CR');
}

const icono = { PASA: '✓', AVISO: '⚠', FALLA: '✗' };
for (const r of resultados) console.log(`${icono[r.estado]} ${r.estado.padEnd(5)} ${r.regla.padEnd(36)} ${r.detalle}`);
const fallas = resultados.filter((r) => r.estado === 'FALLA').length, avisos = resultados.filter((r) => r.estado === 'AVISO').length;
console.log(`\n${resultados.length} reglas de lenguaje: ${resultados.length - fallas - avisos} pasan, ${avisos} aviso(s), ${fallas} falla(n).`);
if (fallas) process.exit(1);
