# Entrega — Landing Electrotecnia C&C (10/10/2026)

## Comandos
```bash
cd ~/Desktop/electrotecnia-landing
python3 -m http.server 4173 --bind 127.0.0.1   # abrir http://127.0.0.1:4173
npm run verificar     # enlaces + contraste + lenguaje (avisa de lo pendiente)
npm run publicar      # igual, pero FALLA si queda algún [PENDIENTE]: correrlo justo antes de desplegar
npm run lenguaje      # solo la auditoría de lenguaje
npm run fotos         # re-optimiza fotos-originales/ -> assets/fotos/
npm run marca         # logo circular + imagen para compartir
npm run picture -- <clave> "<alt>" "<sizes>" [--eager]   # imprime el <picture> de una foto
```

## Qué dice la página sobre la inspección (confirmado por el dueño)
Cuesta ₡35.000 + IVA y se incluye en la factura electrónica. El alcance depende del equipo y de las condiciones de cada caso. Fuera de San José se cobra la visita, y su costo se acuerda antes de ir.

## Pendientes para el dueño
1. **Barco y sistema Schiller: retirado por ahora** (decisión del 10/10/2026). El texto, la tarjeta y la foto están en el commit "version inicial" (`git show 899b304`). La foto original quedó en `fotos-originales/guardadas/`. Si se retoma: qué es el sistema Schiller, qué incluye, tipos de embarcación, dónde atienden, a bordo o en taller, qué marcas.
2. **Años de experiencia:** el texto dice "40 años" y la cifra dice "+40". El anuncio viejo de aires dice "desde 1989" (unos 37). Confirmar cuál va y dejar el mismo en los dos lugares.
3. **Logo de Generac:** no se usa hasta confirmar si es distribuidor o servicio autorizado.
4. **Dirección exacta y coordenadas:** la página ya dice "Hatillo, San José" y enlaza a Google Maps con una búsqueda por nombre (probar desde un celular que abra el negocio). Falta calle/número y el punto exacto para el `geo` del JSON-LD: con el enlace de "Compartir" del punto se agrega.
5. **Atención 24/7 o de emergencia:** la página solo promete lunes a viernes 9:00–17:00.
6. **Fotos:** hay 7 (generadores 3, incendios 1, trabajos 3). Idealmente, 2 más de incendios y 4 más de trabajos, horizontales y de al menos 1600 px.
7. **Permiso para mostrar** esos equipos y cuartos de máquinas (se ven marcas Olympian, Kohler/SDMO, CAT, Clarke y Greegoo; no se afirma ninguna autorización).
8. **Logo:** pedir el archivo original o vectorial y los colores exactos (el recibido venía estirado, 920×1004; se corrigió al recortar).
9. **Cómputo forense:** el anuncio viejo lista servicios de espionaje que NO se copiaron. Confirmar qué se publica.

## Dominio: tiene que ser electrotecniacyc.com
La página ya está preparada para ese dominio (canonical, `og:url`, `og:image`, `robots.txt`, `sitemap.xml` y JSON-LD usan `https://electrotecniacyc.com/`; el `www` redirige al dominio sin `www`). `npm run verificar` falla si alguna URL propia usa otro origen.

### Lo que encontré en el sitio actual (verificado el 10/10/2026)
- WordPress con Yoast. Canonical: `https://electrotecniacyc.com/` (https, sin `www`); `www` responde 301 a ese.
- Título: "Electrotecnia C&C - Mantenimiento plantas electricas San José Costa Rica". Se conserva igual, solo con tilde en "eléctricas".
- Mapa del sitio: `/sitemap_index.xml`. Contacto: `/?page_id=1550`.
- El DNS está en **InMotion Hosting** (`ns1/ns2.inmotionhosting.com`). Sitio y correo viven en `70.39.248.148`.
- **El correo depende del dominio:** el MX es `electrotecniacyc.com` (el propio dominio) y `mail.electrotecniacyc.com` es un CNAME al dominio. Si el dominio se apunta a Vercel sin tocar eso, **`info@electrotecniacyc.com` deja de recibir correo**.
- `webmail`, `cpanel`, `ftp`, `autodiscover`, `autoconfig` y `whm` tienen su propia IP: no se afectan. El SPF ya autoriza `ip4:70.39.248.148` de forma explícita.

### Orden de salida (no saltarse pasos)
0. **Respaldos:** copia completa de WordPress y del correo desde cPanel. **No cancelar el hosting de InMotion:** el correo vive ahí.
1. **Línea base en Search Console:** exportar las páginas indexadas y las consultas principales de los últimos 16 meses. Anotar la posición de las 10 consultas más importantes.
2. **Desplegar en Vercel Pro** con la URL provisional `*.vercel.app` y probar ahí: celular, enlaces, `npm run publicar`.
3. **DNS en InMotion. NO cambiar los nameservers**, solo registros:
   - a) `mail`: cambiar de CNAME a registro **A** con `70.39.248.148`.
   - b) MX: cambiar a `mail.electrotecniacyc.com` con prioridad 0 (quitar el que apunta al dominio).
   - c) Esperar el TTL y probar **enviar y recibir** correo a `info@`, y que el webmail siga abriendo.
   - d) Recién ahí, el dominio (`@`): registro **A** con el valor exacto que Vercel muestre, y `www` como CNAME al valor que Vercel muestre.
4. **En Vercel:** agregar `electrotecniacyc.com` como dominio principal y `www.electrotecniacyc.com` redirigiendo al principal. El HTTPS lo emite Vercel.
5. **Verificar:** `https://electrotecniacyc.com/`, `www` con 301 al dominio, `/robots.txt`, `/sitemap.xml`, `/sitemap_index.xml` con 301 a `/sitemap.xml`, imagen para compartir (Debugger de Facebook), Rich Results Test.
6. **Search Console:** inspeccionar la URL y solicitar indexación; enviar `sitemap.xml`.
7. **Monitorear 2 a 4 semanas** (posiciones, impresiones, errores de cobertura). No cambiar título ni H1 en ese lapso.

### Riesgos para Google (honestos)
- Lo que más protege: mismo dominio, misma URL principal (`/`), mismo canonical, mismo título, y la misma frase del H1 y de la descripción del sitio actual.
- Inevitable: WordPress sale, el texto cambia y la imagen para compartir es nueva. Las URLs con parámetros (`/?page_id=1550`, `?feed=…`) y las imágenes de `wp-content/uploads/…` dejan de existir; las imágenes ya indexadas en Google Imágenes se pierden.
- **Otros servicios:** cómputo forense, laptops, compresores y aire acondicionado pasaron de secciones del sitio a una lista corta. Si hoy traen visitas, esas consultas pueden bajar. Revisar en Search Console antes de decidir si hacen falta páginas aparte.
- **Redirección del contacto:** no la puse todavía porque Vercel puede conservar el parámetro de la URL y causar un bucle. Probarla primero en la URL provisional y, si funciona, agregar a `redirects` en `vercel.json`:
  `{ "source": "/", "has": [{ "type": "query", "key": "page_id", "value": "1550" }], "destination": "/#contacto", "permanent": true }`
  Probar `https://<provisional>.vercel.app/?page_id=1550`; si da bucle, no usarla.
- **Google Business Profile:** mismo nombre y mismo teléfono (+506 8707 1228). El sitio web ya es `electrotecniacyc.com`, no cambia.
- **Plan de Vercel:** el Hobby no es para uso comercial; un sitio de cliente va en **Pro**.

## Auditoría de lenguaje
- **Criterio:** compra B2B, urgente y de riesgo. Trato de **usted**, frases cortas (8,7 palabras en promedio, la más larga de 22), botones con verbos en infinitivo (Llamar, Escribir, Solicitar), y nada que no esté confirmado.
- **Conservado de lo que ya posiciona:** el título, la primera frase de la descripción, la frase del H1 (ahora como línea superior dentro del H1), "plantas eléctricas" y los nombres de los otros servicios.
- **Corregido:** "Llamá al" (vos) en la descripción para compartir; la descripción pasó de 175 a 144 caracteres para que no se corte; H1 y "plantas eléctricas" que faltaban; el texto de otros servicios ahora es una lista.
- **No se escribió:** garantías, 24/7, "inmediato", certificaciones, marcas autorizadas ni superlativos. El sitio actual dice "soluciones técnicas inmediatas" y "garantizan su total satisfacción"; no se copió.
- **Repetible:** `npm run lenguaje` revisa 12 reglas (título, descripción, H1, registro, afirmaciones, precio, palabras clave, terminología, WhatsApp, legibilidad, idioma).

## Reseñas de Google (11/10/2026)
Las 3 reseñas de 5 estrellas más recientes están escritas a mano en `index.html` (sección `#opiniones`), copiadas del perfil el 11/10/2026 con nombre, texto y fecha tal como las mostraba Google. Las fechas ("hace un mes") no se actualizan solas: revisar y refrescar cada cierto tiempo. El dueño pidió mostrarlas (11/10/2026). Se descartó Places API (requiere Google Cloud con facturación); si se retoma, está en el commit `9698607`.

## Foto de Línea amarilla (11/10/2026)
Foto real enviada por el dueño (`fotos-originales/linea-amarilla/equipos-patio.jpg`): camión Mack, tractor CAT D4C y excavadora. Reemplaza la foto de stock anterior. Se ven las marcas Mack y CAT; no se afirma ninguna autorización (ver pendiente 7).
