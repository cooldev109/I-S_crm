import { ProjectType } from '@studio/shared';
import {
  isCancellation,
  isConfirmation,
  isIntakeMessage,
  parseIntake,
  summarise,
} from './intake-parser';

describe('intake parser', () => {
  describe('confirmation / cancellation detection', () => {
    it.each(['sí', 'si', 'SÍ', 'yes', 'ok', 'OK', 'vale', 'confirmo', 'crear', 'sí.'])(
      'recognises confirmation "%s"',
      (s) => expect(isConfirmation(s)).toBe(true),
    );

    it.each(['no', 'NO', 'cancelar', 'descartar', 'cancel'])(
      'recognises cancellation "%s"',
      (s) => expect(isCancellation(s)).toBe(true),
    );

    it('rejects ambiguous input', () => {
      expect(isConfirmation('quizás')).toBe(false);
      expect(isCancellation('luego')).toBe(false);
    });
  });

  describe('isIntakeMessage', () => {
    it('matches when first line starts with an intake keyword', () => {
      expect(isIntakeMessage('nuevo proyecto\ncliente: X')).toBe(true);
      expect(isIntakeMessage('Alta cliente\ncliente: X')).toBe(true);
      expect(isIntakeMessage('lead | A | B | C')).toBe(true);
    });

    it('rejects unrelated messages', () => {
      expect(isIntakeMessage('hola, ¿cómo va?')).toBe(false);
      expect(isIntakeMessage('sí')).toBe(false);
    });
  });

  describe('parseIntake — keyed format', () => {
    it('parses a complete message', () => {
      const result = parseIntake(
        'nuevo proyecto\n' +
          'cliente: Juan Pérez\n' +
          'contacto: +34 600 12 34 56\n' +
          'tipo: reforma parcial\n' +
          'm2: 75\n' +
          'alcance: cocina y baño',
      );
      expect(result).toEqual({
        clientName: 'Juan Pérez',
        contact: '+34600123456',
        projectType: ProjectType.REFORMA_PARCIAL,
        areaM2: 75,
        scope: 'cocina y baño',
      });
    });

    it('accepts alias keys', () => {
      const result = parseIntake(
        'nuevo\n' +
          'nombre: Ana López\n' +
          'teléfono: +34 666 11 22 33\n' +
          'tipo: integral\n' +
          'superficie: 120 m2\n' +
          'descripción: piso entero',
      );
      expect(result?.clientName).toBe('Ana López');
      expect(result?.contact).toBe('+34666112233');
      expect(result?.projectType).toBe(ProjectType.REFORMA_INTEGRAL);
      expect(result?.areaM2).toBe(120);
      expect(result?.scope).toBe('piso entero');
    });

    it('returns null when a mandatory field is missing', () => {
      expect(
        parseIntake('nuevo proyecto\ncontacto: +34600\ntipo: parcial'),
      ).toBeNull();
    });

    it('keeps emails as-is in the contact field', () => {
      const r = parseIntake(
        'nuevo\ncliente: X\ncontacto: cliente@example.com\ntipo: parcial',
      );
      expect(r?.contact).toBe('cliente@example.com');
    });

    it('accepts decimal area with comma or dot', () => {
      const a = parseIntake('nuevo\ncliente: X\ncontacto: +1\ntipo: parcial\nm2: 75,5');
      const b = parseIntake('nuevo\ncliente: X\ncontacto: +1\ntipo: parcial\nm2: 75.5');
      expect(a?.areaM2).toBe(75.5);
      expect(b?.areaM2).toBe(75.5);
    });

    it('omits area when unparseable', () => {
      const r = parseIntake('nuevo\ncliente: X\ncontacto: +1\ntipo: parcial\nm2: ?');
      expect(r?.areaM2).toBeNull();
    });

    it('falls back to OTRO for unknown project types', () => {
      const r = parseIntake('nuevo\ncliente: X\ncontacto: +1\ntipo: paisajismo');
      expect(r?.projectType).toBe(ProjectType.OTRO);
    });
  });

  describe('parseIntake — pipe format', () => {
    it('parses a complete pipe message', () => {
      const r = parseIntake('nuevo | Juan Pérez | +34 600 12 34 56 | parcial | 75 | cocina');
      expect(r).toEqual({
        clientName: 'Juan Pérez',
        contact: '+34600123456',
        projectType: ProjectType.REFORMA_PARCIAL,
        areaM2: 75,
        scope: 'cocina',
      });
    });

    it('preserves scope segments that themselves contain pipes', () => {
      const r = parseIntake('nuevo | X | +1 | parcial | 60 | cocina | baño');
      expect(r?.scope).toBe('cocina | baño');
    });
  });

  describe('summarise', () => {
    it('renders a multi-line summary including optional fields', () => {
      const s = summarise({
        clientName: 'Juan',
        contact: '+34600',
        projectType: ProjectType.REFORMA_INTEGRAL,
        areaM2: 80,
        scope: 'piso entero',
      });
      expect(s).toBe(
        'cliente: Juan\ncontacto: +34600\ntipo: Reforma integral\nm²: 80\nalcance: piso entero',
      );
    });

    it('omits area and scope when null', () => {
      const s = summarise({
        clientName: 'Ana',
        contact: '+34666',
        projectType: ProjectType.OTRO,
        areaM2: null,
        scope: null,
      });
      expect(s).toBe('cliente: Ana\ncontacto: +34666\ntipo: Otro');
    });
  });
});
