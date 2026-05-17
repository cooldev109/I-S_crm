import { parseAdjustment } from './adjustment-parser';

describe('adjustment parser', () => {
  describe('approve', () => {
    it.each(['aprobar', 'aprobado', 'ok', 'OK', 'aprobar.'])('recognises "%s"', (s) => {
      expect(parseAdjustment(s)).toEqual({ kind: 'approve' });
    });
  });

  describe('regenerate', () => {
    it.each(['regenerar', 'regenerate', 'reset'])('recognises "%s"', (s) => {
      expect(parseAdjustment(s)).toEqual({ kind: 'regenerate' });
    });
  });

  describe('setPrice', () => {
    it('parses "subir 1.1 a 35"', () => {
      expect(parseAdjustment('subir 1.1 a 35')).toEqual({
        kind: 'setPrice',
        itemCode: '1.1',
        unitPrice: 35,
      });
    });
    it('parses "bajar 6.5 a 60.5"', () => {
      expect(parseAdjustment('bajar 6.5 a 60.5')).toEqual({
        kind: 'setPrice',
        itemCode: '6.5',
        unitPrice: 60.5,
      });
    });
    it('parses comma decimal "subir 9.1 a 1894,35"', () => {
      expect(parseAdjustment('subir 9.1 a 1894,35')).toEqual({
        kind: 'setPrice',
        itemCode: '9.1',
        unitPrice: 1894.35,
      });
    });
    it('parses alt form "precio 1.1 35"', () => {
      expect(parseAdjustment('precio 1.1 35')).toEqual({
        kind: 'setPrice',
        itemCode: '1.1',
        unitPrice: 35,
      });
    });
  });

  describe('setQuantity', () => {
    it('parses "cambiar 6.5 qty 12"', () => {
      expect(parseAdjustment('cambiar 6.5 qty 12')).toEqual({
        kind: 'setQuantity',
        itemCode: '6.5',
        quantity: 12,
      });
    });
    it('parses "cantidad 8.1 65.84"', () => {
      expect(parseAdjustment('cantidad 8.1 65.84')).toEqual({
        kind: 'setQuantity',
        itemCode: '8.1',
        quantity: 65.84,
      });
    });
  });

  describe('remove', () => {
    it.each(['quitar 11.1', 'eliminar 11.1', 'borrar 11.1'])('recognises "%s"', (s) => {
      expect(parseAdjustment(s)).toEqual({ kind: 'remove', itemCode: '11.1' });
    });
  });

  describe('rejection', () => {
    it.each(['hola', 'subir 1.1 a foo', 'no entiendo', ''])('returns null for "%s"', (s) => {
      expect(parseAdjustment(s)).toBeNull();
    });
  });
});
