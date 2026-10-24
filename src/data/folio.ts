// Número de folio de ejemplo, estable por inmueble. No es una matrícula real:
// en pantalla siempre va con "(ejemplo)".
export function sampleFolio(id: string, title: string, zone: string): string {
  let h = 0;
  for (const ch of id + title) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const office = zone === 'Cedritos' ? '50N' : '50C';
  return `${office}-${String(1_000_000 + (h % 8_999_999))}`;
}
