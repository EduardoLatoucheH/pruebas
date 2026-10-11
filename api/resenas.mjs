// Reseñas de Google (11/10/2026). GET /api/resenas
// Lee el perfil con Places API (New) y devuelve las 3 reseñas más recientes de 5 estrellas, de las que Google entrega (máximo 5).
// La llave vive solo en variables de entorno de Vercel (GOOGLE_PLACES_API_KEY); nunca llega al navegador.
// Si falta la llave o algo falla, responde una lista vacía y la página mantiene la sección oculta.
const BASE = 'https://places.googleapis.com/v1';
const NOMBRE_NEGOCIO = 'Electrotecnia C&C mantenimiento y reparación de generadores electricos';
const SESGO = { latitude: 9.9175268, longitude: -84.0966909 }; // Hatillo, del perfil de Google Maps
const MAX_RESENAS = 3;
const MAX_TEXTO = 420;
const TTL_MS = 6 * 60 * 60 * 1000; // caché en memoria de la función: 6 horas

let cache = null;
let placeIdCache = null;

const cabeceras = (llave, campos) => ({ 'Content-Type': 'application/json', 'X-Goog-Api-Key': llave, 'X-Goog-FieldMask': campos });

async function obtenerPlaceId(llave) {
  if (process.env.GOOGLE_PLACE_ID) return process.env.GOOGLE_PLACE_ID;
  if (placeIdCache) return placeIdCache;
  const r = await fetch(`${BASE}/places:searchText`, {
    method: 'POST',
    headers: cabeceras(llave, 'places.id,places.displayName'),
    body: JSON.stringify({
      textQuery: NOMBRE_NEGOCIO,
      languageCode: 'es',
      regionCode: 'CR',
      locationBias: { circle: { center: SESGO, radius: 1500 } },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`searchText ${r.status}`);
  const id = (await r.json()).places?.[0]?.id;
  if (!id) throw new Error('perfil no encontrado');
  placeIdCache = id;
  return id;
}

const limpiar = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

async function leerResenas(llave) {
  const id = await obtenerPlaceId(llave);
  const r = await fetch(`${BASE}/places/${encodeURIComponent(id)}?languageCode=es`, {
    headers: cabeceras(llave, 'reviews,googleMapsUri'),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`details ${r.status}`);
  const d = await r.json();
  const resenas = (d.reviews ?? [])
    .filter((x) => x.rating === 5 && (x.text?.text || x.originalText?.text))
    .sort((a, b) => Date.parse(b.publishTime ?? 0) - Date.parse(a.publishTime ?? 0))
    .slice(0, MAX_RESENAS)
    .map((x) => {
      const uri = x.authorAttribution?.uri ?? '';
      return {
        autor: limpiar(x.authorAttribution?.displayName, 80) || 'Cliente de Google',
        autorUrl: /^https:\/\/www\.google\.com\/maps\/contrib\//.test(uri) ? uri : '',
        estrellas: 5,
        texto: limpiar(x.text?.text ?? x.originalText?.text, MAX_TEXTO),
        fecha: limpiar(x.relativePublishTimeDescription, 40),
      };
    });
  return { resenas, enlace: /^https:\/\/(www\.google\.com|maps\.google\.com|maps\.app\.goo\.gl)\//.test(d.googleMapsUri ?? '') ? d.googleMapsUri : '' };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); return res.end('{"resenas":[]}'); }

  const llave = process.env.GOOGLE_PLACES_API_KEY;
  if (!llave) { res.statusCode = 200; return res.end('{"resenas":[]}'); }

  if (cache && Date.now() - cache.t < TTL_MS) return res.end(JSON.stringify(cache.datos));
  try {
    const datos = await leerResenas(llave);
    cache = { t: Date.now(), datos };
    res.statusCode = 200;
    return res.end(JSON.stringify(datos));
  } catch (e) {
    console.error('resenas:', e.message); // sin detalles hacia el cliente
    res.statusCode = 200;
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.end(JSON.stringify(cache?.datos ?? { resenas: [] }));
  }
}
