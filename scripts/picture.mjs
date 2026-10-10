// Imprime el <picture> de una foto ya optimizada (10/10/2026).
// Uso: npm run picture -- <clave> "<alt en español>" "<sizes>" [--eager]
// Ejemplo: npm run picture -- generadores-planta-grande "Planta de generación diésel en su cuarto de máquinas" "(min-width: 960px) 45vw, 100vw" --eager
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(RAIZ, 'assets', 'fotos', 'manifest.json'), 'utf8'));
const args = process.argv.slice(2);
const eager = args.includes('--eager');
const [clave, alt, sizes = '100vw'] = args.filter((a) => a !== '--eager');

if (!clave || !manifest[clave]) {
  console.error(`Clave desconocida: ${clave ?? '(vacía)'}\nDisponibles:\n  ${Object.keys(manifest).join('\n  ')}`);
  process.exit(1);
}
if (!alt) { console.error('Falta el texto alt (descriptivo, en español).'); process.exit(1); }

const { anchos } = manifest[clave];
const lista = Object.keys(anchos).map(Number).sort((a, b) => a - b);
const srcset = (ext) => lista.map((w) => `assets/fotos/${clave}-${w}.${ext} ${w}w`).join(', ');
// La imagen de respaldo es la variante de 960 px (o la más grande si no hay 960)
const base = lista.includes(960) ? 960 : lista[lista.length - 1];
const atributos = eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
const alt2 = alt.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

console.log(`<picture>
  <source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}">
  <source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}">
  <img src="assets/fotos/${clave}-${base}.webp" width="${base}" height="${anchos[base]}" alt="${alt2}" ${atributos}>
</picture>`);
