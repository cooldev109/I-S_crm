import { CATALOG } from './catalog';
import { STANDARD_CHAPTERS, chapterByCode } from './chapters';

describe('catalog integrity', () => {
  it('has 13 standard chapters', () => {
    expect(STANDARD_CHAPTERS).toHaveLength(13);
    const codes = STANDARD_CHAPTERS.map((c) => c.code);
    expect(codes).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']);
  });

  it('every catalog item references a real chapter', () => {
    for (const item of CATALOG) {
      expect(chapterByCode(item.chapterCode)).toBeDefined();
    }
  });

  it('every item has a positive default unit price', () => {
    for (const item of CATALOG) {
      expect(item.defaultUnitPrice).toBeGreaterThan(0);
    }
  });

  it('every item belongs to at least one project type', () => {
    for (const item of CATALOG) {
      expect(item.defaultFor.length).toBeGreaterThan(0);
    }
  });

  it('item codes follow chapter.N format and are unique', () => {
    const seen = new Set<string>();
    for (const item of CATALOG) {
      expect(item.code).toMatch(/^\d+\.\d+$/);
      expect(item.code.startsWith(item.chapterCode + '.')).toBe(true);
      expect(seen.has(item.code)).toBe(false);
      seen.add(item.code);
    }
  });
});
