// Logo e imagen para compartir (10/10/2026). npm run marca
// 1) marca/logo-original.jpg -> assets/marca/logo-96.webp y logo-192.webp (recortado al borde del círculo, cuadrado, esquinas transparentes).
// 2) generadores/planta-grande -> assets/og.jpg (1200x630) con degradado azul, logo y titular, para Open Graph.
// Sharp descarta los metadatos de ambas salidas.
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOGO = join(RAIZ, 'marca', 'logo-original.jpg');
const FOTO = join(RAIZ, 'fotos-originales', 'generadores', 'planta-grande.jpg');
const SALIDA = join(RAIZ, 'assets', 'marca');
mkdirSync(SALIDA, { recursive: true });

if (!existsSync(LOGO)) { console.error('Falta marca/logo-original.jpg'); process.exit(1); }

// El logo original es 920x1004: el círculo quedó estirado. Se recorta al borde del aro y se pasa a cuadrado.
async function logoCuadrado(lado) {
  const recortado = await sharp(LOGO).trim({ background: '#ffffff', threshold: 30 }).toBuffer();
  const cuadrado = await sharp(recortado).resize(lado, lado, { fit: 'fill' }).toBuffer();
  const mascara = Buffer.from(`<svg width="${lado}" height="${lado}"><circle cx="${lado / 2}" cy="${lado / 2}" r="${lado / 2}" fill="#fff"/></svg>`);
  return sharp(cuadrado).ensureAlpha().composite([{ input: mascara, blend: 'dest-in' }]).png().toBuffer();
}

for (const lado of [96, 192]) {
  await sharp(await logoCuadrado(lado)).webp({ quality: 90, alphaQuality: 100 }).toFile(join(SALIDA, `logo-${lado}.webp`));
  console.log(`✓ assets/marca/logo-${lado}.webp`);
}

if (existsSync(FOTO)) {
  const W = 1200, H = 630;
  const degradado = Buffer.from(`<svg width="${W}" height="${H}">
    <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#0b2545" stop-opacity="0.97"/><stop offset="0.55" stop-color="#0b2545" stop-opacity="0.82"/><stop offset="1" stop-color="#0b2545" stop-opacity="0.25"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect y="${H - 14}" width="${W}" height="14" fill="#ffc400"/>
    <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="900">
      <text x="64" y="300" font-size="64" fill="#eef1f6">GENERADORES</text>
      <text x="64" y="372" font-size="64" fill="#ffc400">QUE ARRANCAN.</text>
      <text x="64" y="444" font-size="64" fill="#ff6b60">PREVENCIÓN DE INCENDIOS.</text>
      <text x="64" y="540" font-size="46" fill="#ffc400">8707-1228</text>
    </g></svg>`);
  const logo = await logoCuadrado(160);
  await sharp(FOTO).rotate().resize(W, H, { fit: 'cover', position: 'centre' })
    .composite([{ input: degradado }, { input: logo, left: 64, top: 64 }])
    .jpeg({ quality: 82, mozjpeg: true }).toFile(join(RAIZ, 'assets', 'og.jpg'));
  console.log('✓ assets/og.jpg (1200x630)');
} else {
  console.log('Sin fotos-originales/generadores/planta-grande.jpg: no se generó og.jpg');
}
