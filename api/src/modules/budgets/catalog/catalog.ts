/**
 * Item catalog — every item the budget generator can include in a draft.
 * Defaults (codes, units, descriptions, unit prices) seeded from the
 * Lekunberri reference budget (docs/client-data-analysis.md).
 *
 * Each item declares:
 *   - which project types include it by default
 *   - how its quantity is computed (fixed, or scaled with the project area)
 *
 * As more historical budgets arrive, extend this file — keep it the single
 * source of truth so the generator stays predictable.
 */

import { BudgetUnit } from '@studio/shared';
import { ProjectType } from '@studio/shared';

/** How to compute the quantity for a generated item. */
export type QuantityRule =
  | { kind: 'fixed'; value: number }
  /** factor * project.areaM2 (rounded to 2 decimals). */
  | { kind: 'perAreaM2'; factor: number }
  /** Number of bathrooms/kitchens — for now we pin both at 1 in the generator. */
  | { kind: 'perRoom'; rooms: 'bath' | 'kitchen'; factor: number };

export interface CatalogItem {
  /** Dotted code, e.g. "1.1". */
  code: string;
  /** Which chapter this item belongs to (matches ChapterDef.code). */
  chapterCode: string;
  unit: BudgetUnit;
  description: string;
  defaultUnitPrice: number;
  quantity: QuantityRule;
  /** Project types where this item is part of the default draft. */
  defaultFor: readonly ProjectType[];
}

const ALL = [
  ProjectType.REFORMA_INTEGRAL,
  ProjectType.REFORMA_PARCIAL,
  ProjectType.INTERIORISMO,
] as const;
const RENOVATIONS = [ProjectType.REFORMA_INTEGRAL, ProjectType.REFORMA_PARCIAL] as const;

export const CATALOG: readonly CatalogItem[] = [
  // ---- 1. Demoliciones ---------------------------------------------------
  {
    code: '1.1',
    chapterCode: '1',
    unit: 'M2',
    description: 'M2 DEMOLICIÓN TABIQUERIA ZONA ARMARIO',
    defaultUnitPrice: 30,
    quantity: { kind: 'fixed', value: 4 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '1.2',
    chapterCode: '1',
    unit: 'M2',
    description: 'M2 DEMOLICIÓN PAVIMENTOS CERÁMICOS EXISTENTES COCINA',
    defaultUnitPrice: 31,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 3 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '1.3',
    chapterCode: '1',
    unit: 'M2',
    description: 'M2 DEMOLICIÓN PAVIMENTOS CERÁMICOS EXISTENTES BAÑO',
    defaultUnitPrice: 31,
    quantity: { kind: 'perRoom', rooms: 'bath', factor: 5.4 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '1.4',
    chapterCode: '1',
    unit: 'M2',
    description: 'M2 PICADO REVESTIMIENTOS VERTICALES INTERIORES',
    defaultUnitPrice: 23,
    quantity: { kind: 'fixed', value: 9.77 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '1.5',
    chapterCode: '1',
    unit: 'UD',
    description: 'UD DESMONTADO HOJA PUERTA INT.SIN RECUP.',
    defaultUnitPrice: 12,
    quantity: { kind: 'fixed', value: 2 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '1.6',
    chapterCode: '1',
    unit: 'UD',
    description: 'UD DESMONTADO MOBILIARIO /ELECTRODOMÉSTICOS VIVIENDA',
    defaultUnitPrice: 450,
    quantity: { kind: 'fixed', value: 1 },
    defaultFor: ALL,
  },
  {
    code: '1.7',
    chapterCode: '1',
    unit: 'UD',
    description: 'UD LEVANTADO RADIADORES',
    defaultUnitPrice: 60,
    quantity: { kind: 'fixed', value: 2 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '1.8',
    chapterCode: '1',
    unit: 'UD',
    description: 'UD DEMOL. INSTAL. ELÉCTRICA BAÑO-ARMARIO',
    defaultUnitPrice: 210,
    quantity: { kind: 'perRoom', rooms: 'bath', factor: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '1.9',
    chapterCode: '1',
    unit: 'UD',
    description: 'UD DEMOL. INSTAL. FONTANERÍA BAÑO',
    defaultUnitPrice: 178,
    quantity: { kind: 'perRoom', rooms: 'bath', factor: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '1.10',
    chapterCode: '1',
    unit: 'UD',
    description: 'UD LEVANTADO DE APARATOS SANIT. DE BAÑO I/INSTAL.',
    defaultUnitPrice: 42,
    quantity: { kind: 'perRoom', rooms: 'bath', factor: 4 },
    defaultFor: RENOVATIONS,
  },

  // ---- 2. Pladur ---------------------------------------------------------
  {
    code: '2.1',
    chapterCode: '2',
    unit: 'ML',
    description: 'Ml FORMACIÓN TABICAS CIERRE VERTICAL PLADUR N-13',
    defaultUnitPrice: 33,
    quantity: { kind: 'fixed', value: 5.54 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '2.2',
    chapterCode: '2',
    unit: 'M2',
    description: 'm2 TABIQUERIA INTERIOR 2*13+48+2*13 CON MW PARA CERRAR ARMARIO',
    defaultUnitPrice: 98,
    quantity: { kind: 'fixed', value: 3.6 },
    defaultFor: RENOVATIONS,
  },

  // ---- 3. Albañilería ----------------------------------------------------
  {
    code: '3.1',
    chapterCode: '3',
    unit: 'UD',
    description: 'UD RECIBIDO CARPINTERÍA MADERA PUERTAS',
    defaultUnitPrice: 180,
    quantity: { kind: 'fixed', value: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '3.2',
    chapterCode: '3',
    unit: 'M2',
    description: 'M2 ENFOSCADO MAESTREADO PARA ALICATAR',
    defaultUnitPrice: 32.5,
    quantity: { kind: 'fixed', value: 3 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '3.3',
    chapterCode: '3',
    unit: 'M2',
    description: 'ALICATADO SUELO: ADHESIVO, COLOCACION Y MATERIAL',
    defaultUnitPrice: 130.2,
    quantity: { kind: 'fixed', value: 3 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '3.4',
    chapterCode: '3',
    unit: 'UD',
    description: 'Ud AYUDA A GREMIOS',
    defaultUnitPrice: 800,
    quantity: { kind: 'fixed', value: 1 },
    defaultFor: RENOVATIONS,
  },

  // ---- 4. Carpintería interior madera -----------------------------------
  {
    code: '4.1',
    chapterCode: '4',
    unit: 'M2',
    description: 'SUELO MADERA PARA ARMARIO',
    defaultUnitPrice: 98,
    quantity: { kind: 'fixed', value: 5.4 },
    defaultFor: ALL,
  },
  {
    code: '4.2',
    chapterCode: '4',
    unit: 'ML',
    description: 'M.L. Suministro y colocación de zócalo DMH/prelacado blanco 120 x 12',
    defaultUnitPrice: 18,
    quantity: { kind: 'fixed', value: 10.32 },
    defaultFor: ALL,
  },
  {
    code: '4.3',
    chapterCode: '4',
    unit: 'UD',
    description: 'UD PUERTA LACADA BLANCO LISA 2300X825',
    defaultUnitPrice: 730,
    quantity: { kind: 'fixed', value: 2 },
    defaultFor: RENOVATIONS,
  },

  // ---- 5. Fontanería -----------------------------------------------------
  {
    code: '5.1',
    chapterCode: '5',
    unit: 'UD',
    description: 'UD DESMONTAR INSTALACIÓN ANTIGUA Y PONER GRIFO DE OBRA',
    defaultUnitPrice: 360,
    quantity: { kind: 'fixed', value: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '5.2',
    chapterCode: '5',
    unit: 'UD',
    description: 'UD INSTALACIÓN FONTANERÍA Y SANEMIENTO COCINA',
    defaultUnitPrice: 1100,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 1 },
    defaultFor: RENOVATIONS,
  },

  // ---- 6. Electricidad ---------------------------------------------------
  {
    code: '6.1',
    chapterCode: '6',
    unit: 'UD',
    description: 'UD LINEA HORNO-PLACA 6 MM2',
    defaultUnitPrice: 60,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '6.2',
    chapterCode: '6',
    unit: 'UD',
    description: 'UD LINEA LAVAVAJILLAS- LAVADORA-CALDERA AIRE-SECADORA 2.5 MM2',
    defaultUnitPrice: 50,
    quantity: { kind: 'fixed', value: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '6.3',
    chapterCode: '6',
    unit: 'UD',
    description: 'UD PUNTO ENCENDIDO SENCILLO',
    defaultUnitPrice: 55,
    quantity: { kind: 'fixed', value: 3 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '6.4',
    chapterCode: '6',
    unit: 'UD',
    description: 'UD PUNTO ENCENDIDO CONMUTADO DOS SITIOS',
    defaultUnitPrice: 90,
    quantity: { kind: 'fixed', value: 2 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '6.5',
    chapterCode: '6',
    unit: 'UD',
    description: 'UD PUNTO ENCHUFE',
    defaultUnitPrice: 65,
    quantity: { kind: 'fixed', value: 9 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '6.6',
    chapterCode: '6',
    unit: 'UD',
    description: 'UD PUNTO ENCHUFE VITRO/HORNO',
    defaultUnitPrice: 60,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '6.7',
    chapterCode: '6',
    unit: 'UD',
    description: 'UD PUNTO ENCHUFE LAVAVAJILLAS',
    defaultUnitPrice: 50,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '6.8',
    chapterCode: '6',
    unit: 'UD',
    description: 'UD PUNTO ENCHUFE FRIGO, CAMPANA, MICRO, CALDERA',
    defaultUnitPrice: 50,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '6.9',
    chapterCode: '6',
    unit: 'UD',
    description: 'UD PUNTO DE LUZ',
    defaultUnitPrice: 65,
    quantity: { kind: 'fixed', value: 6 },
    defaultFor: RENOVATIONS,
  },

  // ---- 7. Calefacción ----------------------------------------------------
  {
    code: '7.1',
    chapterCode: '7',
    unit: 'UD',
    description: 'REINSTALACIÓN RADIADORES',
    defaultUnitPrice: 50,
    quantity: { kind: 'fixed', value: 2 },
    defaultFor: RENOVATIONS,
  },

  // ---- 8. Pintura --------------------------------------------------------
  {
    code: '8.1',
    chapterCode: '8',
    unit: 'M2',
    description: 'M2 PINTURA PLÁSTICA LISA SOBRE PARAMENTO VERTICALES ALISANDO',
    defaultUnitPrice: 21,
    // ~0.88 m2 of wall per m2 of floor — derived from Lekunberri (65.84 / 75 ~= 0.88).
    quantity: { kind: 'perAreaM2', factor: 0.88 },
    defaultFor: ALL,
  },

  // ---- 9. Muebles de cocina ---------------------------------------------
  {
    code: '9.1',
    chapterCode: '9',
    unit: 'ML',
    description: 'Total muebles de cocina (acabado a concretar)',
    defaultUnitPrice: 1894.35,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 7.34 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '9.2',
    chapterCode: '9',
    unit: 'ML',
    description: 'Encimera DEKTON SABBIA + NEBBIA',
    defaultUnitPrice: 442.71,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 7.34 },
    defaultFor: RENOVATIONS,
  },

  // ---- 10. Electrodomésticos cocina --------------------------------------
  {
    code: '10.1',
    chapterCode: '10',
    unit: 'un',
    description: 'Placa inducción BOSCH 3 fuegos (PID631HC1E)',
    defaultUnitPrice: 593,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '10.2',
    chapterCode: '10',
    unit: 'un',
    description: 'Campana integrada BOSCH 90 cristal extraíble (DBB97AM60)',
    defaultUnitPrice: 558,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '10.3',
    chapterCode: '10',
    unit: 'un',
    description: 'Horno alto 60 pirolítico BOSCH (HBA 574BB3) cristal negro',
    defaultUnitPrice: 515,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '10.4',
    chapterCode: '10',
    unit: 'un',
    description: 'Microondas BOSCH BEL 524 MBO',
    defaultUnitPrice: 294,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '10.5',
    chapterCode: '10',
    unit: 'un',
    description: 'Frigo Combi integrable No frost XXL clase D (KIN96VFDO)',
    defaultUnitPrice: 1315,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '10.6',
    chapterCode: '10',
    unit: 'un',
    description: 'Lavavajillas integrable',
    defaultUnitPrice: 592,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 1 },
    defaultFor: RENOVATIONS,
  },
  {
    code: '10.7',
    chapterCode: '10',
    unit: 'un',
    description: 'PACK Fregadero INOX 50X40 RIPLY FB + grifo Inediro INOX',
    defaultUnitPrice: 622,
    quantity: { kind: 'perRoom', rooms: 'kitchen', factor: 1 },
    defaultFor: RENOVATIONS,
  },

  // ---- 11. Muebles armario ----------------------------------------------
  {
    code: '11.1',
    chapterCode: '11',
    unit: 'ML',
    description: 'Muebles a medida interior de vestidor',
    defaultUnitPrice: 1740,
    quantity: { kind: 'fixed', value: 4.28 },
    defaultFor: ALL,
  },

  // ---- 12. Gestión de residuos ------------------------------------------
  {
    code: '12.1',
    chapterCode: '12',
    unit: 'UD',
    description: 'Gestión de residuos de obra',
    defaultUnitPrice: 625,
    quantity: { kind: 'fixed', value: 1 },
    defaultFor: RENOVATIONS,
  },

  // ---- 13. Limpieza final -----------------------------------------------
  {
    code: '13.1',
    chapterCode: '13',
    unit: 'UD',
    description: 'Limpieza final de obra',
    defaultUnitPrice: 550,
    quantity: { kind: 'fixed', value: 1 },
    defaultFor: ALL,
  },
] as const;
