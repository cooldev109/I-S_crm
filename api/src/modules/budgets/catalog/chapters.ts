/**
 * The 13 standard chapters used by I&S Homes Studio.
 * Order matches the studio's reference budget (Lekunberri).
 * See docs/client-data-analysis.md.
 */
export interface ChapterDef {
  code: string;
  title: string;
}

export const STANDARD_CHAPTERS: readonly ChapterDef[] = [
  { code: '1', title: 'TRABAJOS PREVIOS/DEMOLICIONES' },
  { code: '2', title: 'PLADUR, ESCAYOLA' },
  { code: '3', title: 'ALBAÑILERÍA' },
  { code: '4', title: 'CARPINTERIA INTERIOR MADERA' },
  { code: '5', title: 'FONTANERIA' },
  { code: '6', title: 'ELECTRICIDAD' },
  { code: '7', title: 'CALEFACCION' },
  { code: '8', title: 'PINTURA' },
  { code: '9', title: 'MUEBLES DE COCINA SIN ELECTRODOMESTICOS' },
  { code: '10', title: 'ELECTRODOMESTICOS COCINA' },
  { code: '11', title: 'MUEBLES ARMARIO' },
  { code: '12', title: 'GESTION DE RESIDUOS' },
  { code: '13', title: 'LIMPIEZA FINAL' },
] as const;

export function chapterByCode(code: string): ChapterDef | undefined {
  return STANDARD_CHAPTERS.find((c) => c.code === code);
}
