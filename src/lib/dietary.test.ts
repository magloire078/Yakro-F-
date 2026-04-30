import { describe, expect, it } from 'vitest';
import { DIETARY_TAGS, getDietaryTag, matchesDietaryTags } from './dietary';

describe('DIETARY_TAGS', () => {
  it('expose 6 tags avec emoji et description', () => {
    expect(DIETARY_TAGS).toHaveLength(6);
    DIETARY_TAGS.forEach(t => {
      expect(t.emoji).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.label).toBeTruthy();
    });
  });
});

describe('getDietaryTag', () => {
  it('renvoie le tag correspondant', () => {
    expect(getDietaryTag('halal').label).toBe('Halal');
    expect(getDietaryTag('vegan').label).toBe('Vegan');
  });
});

describe('matchesDietaryTags', () => {
  it('aucune contrainte → toujours true', () => {
    expect(matchesDietaryTags(undefined, [])).toBe(true);
    expect(matchesDietaryTags(['halal'], [])).toBe(true);
  });

  it('exige tous les tags requis', () => {
    expect(matchesDietaryTags(['halal', 'sans-porc'], ['halal'])).toBe(true);
    expect(matchesDietaryTags(['halal'], ['halal', 'sans-porc'])).toBe(false);
    expect(matchesDietaryTags(['vegan', 'sans-gluten'], ['vegan', 'sans-gluten'])).toBe(true);
  });

  it('plat sans tag ne satisfait aucune contrainte non vide', () => {
    expect(matchesDietaryTags(undefined, ['halal'])).toBe(false);
    expect(matchesDietaryTags([], ['halal'])).toBe(false);
  });
});
