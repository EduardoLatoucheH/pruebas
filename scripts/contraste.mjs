// Auditoría de contraste WCAG 2.x (10/10/2026). Calcula el ratio de cada combinación texto/fondo usada en css/estilos.css.
// Umbrales: texto normal >= 4.5, texto grande (>=24 px, o >=18.66 px en negrita) y elementos de interfaz >= 3.
// Si cambiás un color en estilos.css, actualizá también esta tabla.
const C = {
  bg: '#0b2545', panel: '#13315c',
  amarillo: '#ffc400', rojo: '#ff6b60', rojoFill: '#c62828', verde: '#25d366',
  texto: '#eef1f6', tenue: '#b4bfd1', li: '#d6dce8', claro: '#f4f6f9', tinta: '#1b2430', tinta2: '#4a5568',
  navy: '#0b2545', blanco: '#ffffff', negro: '#111111', verdeTxt: '#06240f',
};

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => {
  const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [descripción, texto, fondo, tipo]  tipo: n = texto normal, g = texto grande, ui = elemento de interfaz
const pares = [
  ['Texto general sobre fondo azul', C.texto, C.bg, 'n'],
  ['Texto general sobre panel', C.texto, C.panel, 'n'],
  ['Texto tenue (subtítulos, notas, menú) sobre fondo', C.tenue, C.bg, 'n'],
  ['Texto tenue sobre panel (stats, tarjetas)', C.tenue, C.panel, 'n'],
  ['Lista de servicios sobre panel', C.li, C.panel, 'n'],
  ['Teléfono gigante / titular amarillo sobre fondo', C.amarillo, C.bg, 'g'],
  ['Cifras amarillas sobre panel (34 px)', C.amarillo, C.panel, 'g'],
  ['Botón/enlace amarillo pequeño sobre panel', C.amarillo, C.panel, 'n'],
  ['Teléfono del encabezado (amarillo) sobre fondo', C.amarillo, C.bg, 'n'],
  ['Rojo (titular) sobre fondo', C.rojo, C.bg, 'g'],
  ['Rojo (etiqueta y "solicitar") sobre panel', C.rojo, C.panel, 'n'],
  ['Texto oscuro sobre amarillo (botón Llamar, barra, banda)', C.negro, C.amarillo, 'n'],
  ['Texto verde oscuro sobre verde WhatsApp', C.verdeTxt, C.verde, 'n'],
  ['Amarillo sobre negro (botón de la banda)', C.amarillo, C.negro, 'n'],
  ['Blanco sobre rojo de relleno (número de paso)', C.blanco, C.rojoFill, 'n'],
  ['Texto de lectura sobre sección clara', C.tinta, C.claro, 'n'],
  ['Texto secundario sobre sección clara', C.tinta2, C.claro, 'n'],
  ['Texto secundario sobre tarjeta blanca', C.tinta2, C.blanco, 'n'],
  ['Titular azul sobre sección clara', C.navy, C.claro, 'g'],
  ['Titular azul sobre el resaltado amarillo', C.navy, C.amarillo, 'g'],
  ['Pregunta (summary) azul sobre tarjeta blanca', C.navy, C.blanco, 'n'],
  ['Anillo de foco amarillo sobre fondo oscuro', C.amarillo, C.bg, 'ui'],
  ['Anillo de foco azul sobre sección clara', C.navy, C.claro, 'ui'],
  ['Borde rojo de la tarjeta de incendios sobre fondo azul', C.rojo, C.bg, 'ui'],
  ['Borde rojo de la tarjeta de incendios sobre el panel', C.rojo, C.panel, 'ui'],
  ['Botón verde sobre fondo azul (borde del botón)', C.verde, C.bg, 'ui'],
  ['Botón amarillo sobre fondo azul (borde del botón)', C.amarillo, C.bg, 'ui'],
];

const minimo = { n: 4.5, g: 3, ui: 3 };
const etiqueta = { n: 'normal', g: 'grande', ui: 'interfaz' };
let fallas = 0;
console.log('Combinación'.padEnd(60), 'Texto'.padEnd(8), 'Fondo'.padEnd(8), 'Ratio'.padStart(7), ' Mínimo  Tipo      Resultado');
for (const [d, fg, bg, t] of pares) {
  const r = ratio(fg, bg);
  const ok = r >= minimo[t];
  if (!ok) fallas++;
  console.log(d.padEnd(60), fg.padEnd(8), bg.padEnd(8), (r.toFixed(2) + ':1').padStart(7), ` ${String(minimo[t]).padEnd(6)}  ${etiqueta[t].padEnd(8)}  ${ok ? 'PASA' : 'FALLA'}`);
}
console.log(`\n${pares.length} combinaciones revisadas, ${fallas} fallan.`);
if (fallas) process.exit(1);
