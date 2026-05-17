import { ParsedIntakeMessage, ProjectType } from '@studio/shared';

/**
 * Parses studio-to-bot intake messages. Two supported formats:
 *
 * 1. Keyed lines (recommended — clearest):
 *      nuevo proyecto
 *      cliente: Juan Pérez
 *      contacto: +34 600 12 34 56
 *      tipo: reforma parcial
 *      m2: 75
 *      alcance: cocina y baño
 *
 * 2. Pipe-separated single line (compact):
 *      nuevo | Juan Pérez | +34 600 12 34 56 | parcial | 75 | cocina y baño
 *
 * Project-type matching is fuzzy: "integral" -> REFORMA_INTEGRAL,
 * "parcial" -> REFORMA_PARCIAL, "interior" -> INTERIORISMO,
 * "estudio" -> ESTUDIO_PREVIO. Anything else -> OTRO.
 *
 * Returns null when the message is not a recognisable intake (so the orchestrator
 * can route it elsewhere — confirmation reply, help text, etc.).
 */

const INTAKE_KEYWORDS = ['nuevo', 'alta', 'lead', 'proyecto nuevo'];
const KEY_ALIASES: Record<string, keyof RawFields> = {
  cliente: 'name',
  nombre: 'name',
  contacto: 'contact',
  telefono: 'contact',
  teléfono: 'contact',
  tipo: 'type',
  m2: 'areaM2',
  'm²': 'areaM2',
  metros: 'areaM2',
  superficie: 'areaM2',
  alcance: 'scope',
  scope: 'scope',
  descripcion: 'scope',
  descripción: 'scope',
};

interface RawFields {
  name?: string;
  contact?: string;
  type?: string;
  areaM2?: string;
  scope?: string;
}

export function isConfirmation(body: string): boolean {
  const t = body.trim().toLowerCase();
  return /^(sí|si|yes|ok|okay|vale|confirmo|confirmar|crear)\.?$/.test(t);
}

export function isCancellation(body: string): boolean {
  const t = body.trim().toLowerCase();
  return /^(no|cancelar|descartar|cancel)\.?$/.test(t);
}

export function isIntakeMessage(body: string): boolean {
  const first = body.trim().split(/[\n|]/)[0]?.toLowerCase() ?? '';
  return INTAKE_KEYWORDS.some((kw) => first.includes(kw));
}

export function parseIntake(body: string): ParsedIntakeMessage | null {
  if (!isIntakeMessage(body)) return null;
  const fields = body.includes('|') ? parsePipeFormat(body) : parseKeyedFormat(body);

  // Mandatory: name, contact, type.
  if (!fields.name || !fields.contact || !fields.type) return null;

  return {
    clientName: fields.name.trim(),
    contact: normaliseContact(fields.contact),
    projectType: matchProjectType(fields.type),
    areaM2: fields.areaM2 ? parseArea(fields.areaM2) : null,
    scope: fields.scope?.trim() || null,
  };
}

function parseKeyedFormat(body: string): RawFields {
  const out: RawFields = {};
  for (const line of body.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const rawKey = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (!value) continue;
    const target = KEY_ALIASES[rawKey];
    if (target) out[target] = value;
  }
  return out;
}

function parsePipeFormat(body: string): RawFields {
  // First segment is the "nuevo" keyword; subsequent are positional:
  // 1=name, 2=contact, 3=type, 4=areaM2, 5=scope.
  const parts = body
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    name: parts[1],
    contact: parts[2],
    type: parts[3],
    areaM2: parts[4],
    scope: parts.slice(5).join(' | ') || undefined,
  };
}

function matchProjectType(raw: string): ProjectType {
  const v = raw.toLowerCase();
  if (v.includes('integral')) return ProjectType.REFORMA_INTEGRAL;
  if (v.includes('parcial')) return ProjectType.REFORMA_PARCIAL;
  if (v.includes('interior')) return ProjectType.INTERIORISMO;
  if (v.includes('estudio')) return ProjectType.ESTUDIO_PREVIO;
  return ProjectType.OTRO;
}

function parseArea(raw: string): number | null {
  // Accept "75", "75 m2", "75,5", "75.5".
  const m = raw.replace(',', '.').match(/[\d.]+/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normaliseContact(raw: string): string {
  // Strip spaces, hyphens, parentheses from phone-looking inputs; keep emails as-is.
  if (raw.includes('@')) return raw.trim();
  return raw.replace(/[\s\-()]/g, '');
}

/** Short human-readable summary for the WhatsApp confirmation reply. */
export function summarise(parsed: ParsedIntakeMessage): string {
  const parts = [
    `cliente: ${parsed.clientName}`,
    `contacto: ${parsed.contact}`,
    `tipo: ${projectTypeLabel(parsed.projectType)}`,
  ];
  if (parsed.areaM2 != null) parts.push(`m²: ${parsed.areaM2}`);
  if (parsed.scope) parts.push(`alcance: ${parsed.scope}`);
  return parts.join('\n');
}

function projectTypeLabel(t: ProjectType): string {
  switch (t) {
    case ProjectType.REFORMA_INTEGRAL:
      return 'Reforma integral';
    case ProjectType.REFORMA_PARCIAL:
      return 'Reforma parcial';
    case ProjectType.INTERIORISMO:
      return 'Interiorismo';
    case ProjectType.ESTUDIO_PREVIO:
      return 'Estudio previo';
    default:
      return 'Otro';
  }
}
