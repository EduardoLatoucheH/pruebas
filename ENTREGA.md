# Entrega — Landing Electrotecnia C&C (10/10/2026)

## Cómo verla
```bash
cd ~/Desktop/electrotecnia-landing
python3 -m http.server 4173 --bind 127.0.0.1   # y abrir http://127.0.0.1:4173
npm run verificar          # enlaces + contraste (avisa de los [PENDIENTE] y del dominio por confirmar)
npm run publicar           # igual, pero FALLA si queda algún pendiente: correrlo justo antes de desplegar
npm run fotos              # re-optimiza fotos-originales/ -> assets/fotos/
npm run marca              # logo circular + imagen para compartir
npm run picture -- <clave> "<alt>" "<sizes>" [--eager]   # imprime el <picture> de una foto
```

## Pendientes para el dueño
1. **Sistema Schiller y servicio de barco** (el texto de la sección es solo lo confirmado, con un `[PENDIENTE]` visible):
   - ¿Qué es exactamente el sistema Schiller (marca, modelo, para qué sirve)?
   - ¿Qué incluye el mantenimiento? ¿Tipos de embarcación? ¿Dónde atienden (puertos, marinas)?
   - ¿A bordo o en taller? ¿Qué marcas de generador marino? ¿Hay atención de emergencia?
2. **Años de experiencia:** el sitio dice 40, pero el anuncio viejo de aires dice "desde 1989" (unos 37). Confirmar cuál va.
3. **Logo de Generac:** no se usa hasta confirmar si es distribuidor o servicio autorizado.
4. **Dirección, correo y coordenadas** (el pie y el JSON-LD los dejan en blanco).
5. **Atención 24/7 o de emergencia:** la página solo promete lunes a viernes 9:00–17:00.
6. **Qué incluye la inspección y diagnóstico** (₡35.000 + IVA): hoy dice "por confirmar".
7. **Fotos:** hay 8 (generadores 3, incendios 1, barco 1, trabajos 3). Idealmente, 2 más de incendios, 2 más de barco (incluido el Schiller) y 4 más de trabajos, todas horizontales y de al menos 1600 px.
   Las de generador azul, generador amarillo y bomba traían EXIF (posible GPS): ya se quitó de las copias publicadas.
8. **Permiso para mostrar** esos equipos y cuartos de máquinas (se ven marcas Olympian, Kohler/SDMO, CAT, Clarke y Greegoo; no se afirma ninguna autorización).
9. **Logo:** pedir el archivo original o vectorial y los colores exactos. El archivo recibido mide 920×1004 y el círculo venía estirado; se corrigió al recortar.
   También confirmar si se quiere usar su leyenda "Ingeniería eléctrica y soluciones tecnológicas".
10. **Anuncios viejos:** el de aires menciona "barcos yate" (indicio, no confirmado) y el de forense lista servicios de espionaje que NO se copiaron. Confirmar qué se publica de cómputo forense.
11. **Subdominio final:** hoy figura `generadores.electrotecniacyc.com` en `og:image`, `robots.txt` y `sitemap.xml`. Cambiarlo ahí si es otro, y agregar `canonical` y `og:url`.

## Publicar sin tocar su WordPress
1. `git add -A && git commit` en este proyecto (no hay push hecho). `fotos-originales/`, `sitio-viejo/` y `node_modules/` están en `.gitignore`.
2. Vercel: proyecto nuevo, Framework "Other", sin comando de build, directorio de salida la raíz. Si el repo contiene varias carpetas, poner **Root Directory** en esta.
3. Dominio: agregar `generadores.electrotecniacyc.com` en Vercel y crear en el DNS de su dominio **un solo CNAME** con el valor exacto que Vercel muestre. No se toca el WordPress.
4. **Plan de Vercel:** el Hobby no es para uso comercial; un sitio de cliente corresponde al plan **Pro**.
5. Google Business: mismo nombre y mismo teléfono (+506 8707 1228) que en la página. Poner el subdominio como sitio web.

## Conservar el posicionamiento
- El sitio actual tiene una sola URL real (`/`) y el contacto en `/?page_id=1550`. El título y el H1 nuevos conservan sus frases clave ("generadores eléctricos y sistemas contra incendios en Costa Rica", "plantas eléctricas").
- Un subdominio se considera un sitio distinto: no hereda automáticamente el posicionamiento del dominio principal. Conviene que el sitio actual enlace al subdominio.
- Si algún día reemplazan el WordPress por esta página: mantener las mismas URLs y poner redirecciones **301** de cualquier URL vieja a la nueva.
- Agregar el subdominio en Search Console y enviar el `sitemap.xml`.
