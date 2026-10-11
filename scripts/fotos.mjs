// Optimizador de fotos (10/10/2026). npm run fotos
// De cada original en fotos-originales/<grupo>/ genera AVIF y WebP en 3 anchos dentro de assets/fotos/,
// sin metadatos (sharp los descarta por defecto: EXIF, GPS, miniaturas) y con la orientación ya aplicada.
// Escribe assets/fotos/manifest.json con ancho y alto para poner width/height en el HTML y evitar saltos de diseño.
import sharp from 'sharp';
import { readdirSync, mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = join(RAIZ, 'fotos-originales');
const DESTINO = join(RAIZ, 'assets', 'fotos');
const GRUPOS = ['generadores', 'incendios', 'trabajos', 'barco', 'linea-amarilla'];
const ANCHOS = [480, 960, 1600];
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tiff']);
const MINIMO_GRANDE = 1600; // las fotos principales deberían tener al menos este ancho

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

mkdirSync(DESTINO, { recursive: true });
const manifest = {};
const avisos = [];
const resumen = {};

for (const grupo of GRUPOS) {
  const carpeta = join(ORIGEN, grupo);
  if (!existsSync(carpeta)) { resumen[grupo] = 0; continue; }
  const todos = readdirSync(carpeta).filter((f) => !f.startsWith('.') && statSync(join(carpeta, f)).isFile());
  const archivos = todos.filter((f) => EXT.has(extname(f).toLowerCase()));
  for (const o of todos.filter((f) => !EXT.has(extname(f).toLowerCase())))
    avisos.push(`${grupo}/${o}: formato no soportado (usá JPG o PNG; si es HEIC, exportalo a JPG)`);
  resumen[grupo] = archivos.length;

  for (const archivo of archivos) {
    const base = `${grupo}-${slug(basename(archivo, extname(archivo)))}`;
    const ruta = join(carpeta, archivo);
    const meta = await sharp(ruta, { failOn: 'none' }).metadata();
    const girada = meta.orientation && meta.orientation >= 5; // 5-8: ancho y alto vienen intercambiados
    const anchoReal = girada ? meta.height : meta.width;
    const altoReal = girada ? meta.width : meta.height;
    if (meta.exif) avisos.push(`${grupo}/${archivo}: traía EXIF (posible GPS); se eliminó en las copias publicadas`);
    if (anchoReal < MINIMO_GRANDE) avisos.push(`${grupo}/${archivo}: ${anchoReal} px de ancho, menos de ${MINIMO_GRANDE} px; sirve en tarjetas, no como foto principal`);

    const anchos = [...new Set(ANCHOS.map((a) => Math.min(a, anchoReal)))];
    manifest[base] = { grupo, original: archivo, w: anchoReal, h: altoReal, anchos: {} };
    for (const ancho of anchos) {
      const tuberia = () => sharp(ruta, { failOn: 'none' }).rotate().resize({ width: ancho, withoutEnlargement: true });
      await tuberia().avif({ quality: 50, effort: 4 }).toFile(join(DESTINO, `${base}-${ancho}.avif`));
      await tuberia().webp({ quality: 78 }).toFile(join(DESTINO, `${base}-${ancho}.webp`));
      manifest[base].anchos[ancho] = Math.round((altoReal * ancho) / anchoReal);

      // Verificación: ninguna copia publicada conserva EXIF
      for (const e of ['avif', 'webp']) {
        const m = await sharp(join(DESTINO, `${base}-${ancho}.${e}`)).metadata();
        if (m.exif) throw new Error(`${base}-${ancho}.${e} conserva EXIF`);
      }
    }
    console.log(`✓ ${base}: ${anchoReal}×${altoReal} → ${anchos.join(', ')} px (AVIF + WebP)`);
  }
}

writeFileSync(join(DESTINO, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('\nFotos por grupo:', Object.entries(resumen).map(([g, n]) => `${g}: ${n}`).join(' · '));
if (avisos.length) { console.log('\nAvisos:'); for (const a of avisos) console.log('  - ' + a); }
if (!Object.values(resumen).some(Boolean)) console.log('\nNo hay originales todavía. Poné las fotos en fotos-originales/<grupo>/ y corré npm run fotos.');
