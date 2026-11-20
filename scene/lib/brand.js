// Brand theming: one palette drives the overlay (CSS/SVG) and the key 3D materials.
// Defaults reproduce the original navy/gold identity exactly. Override via scene/brand.json.
export const BASE = { primary: '#0b1626', accent: '#e2c78f', accentDeep: '#c9a96a', text: '#f3eee4' };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const darken = (h, k) => '#' + hex(h).map((v) => Math.round(v * k).toString(16).padStart(2, '0')).join('');
export function makeBrand(b = {}) {
  const B = { ...BASE, ...b }; if (!b.accentDeep && b.accent) B.accentDeep = darken(B.accent, 0.89);
  const [pr, pg, pb] = hex(B.primary), [ar, ag, ab] = hex(B.accent), [tr, tg, tb] = hex(B.text);
  const deep = darken(B.primary, 0.62), [dr, dg, db] = hex(deep);
  // literal colour tokens used across the overlay → brand values
  const MAP = [
    [/#e2c78f|#f0d59c|#e8cd96|#d9b46a/gi, B.accent], [/#c9a96a|#a8874c|#9c7c43/gi, B.accentDeep],
    [/#0b1626|#08121f|#0d1828/gi, B.primary], [/#f3eee4/gi, B.text],
    [/rgba\(226,\s*199,\s*143,/g, `rgba(${ar},${ag},${ab},`], [/rgba\(243,\s*238,\s*228,/g, `rgba(${tr},${tg},${tb},`],
    [/rgba\(7,\s*14,\s*25,/g, `rgba(${dr},${dg},${db},`], [/rgba\(5,\s*10,\s*18,/g, `rgba(${dr},${dg},${db},`],
  ];
  const theme = (s) => MAP.reduce((acc, [re, v]) => acc.replace(re, v), s);
  const ratio = (h, ref) => { const a = hex(h), r = hex(ref); return a.map((v, i) => Math.min(3, (v + 8) / (r[i] + 8))); };
  const lum = (h) => { const c = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const darkText = lum(B.text) < 0.2;  // dark text ⇒ text sits on accent panels; accent is used for text on backgrounds
  const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
  return { ...B, deep, theme, darkText, rgba, lum, isDefault: JSON.stringify(B) === JSON.stringify(BASE), rgb01: (h) => hex(h).map((v) => v / 255),
    accentTint: ratio(B.accent, BASE.accent), primaryTint: ratio(B.primary, BASE.primary) };
}
