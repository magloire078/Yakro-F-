import type { DietaryTag } from './types';

export interface DietaryTagInfo {
  id: DietaryTag;
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
}

export const DIETARY_TAGS: DietaryTagInfo[] = [
  {
    id: 'halal',
    label: 'Halal',
    shortLabel: 'Halal',
    emoji: '🕌',
    description: 'Conforme aux préceptes alimentaires islamiques.',
  },
  {
    id: 'vegetarien',
    label: 'Végétarien',
    shortLabel: 'Végé',
    emoji: '🥗',
    description: 'Sans viande ni poisson.',
  },
  {
    id: 'vegan',
    label: 'Vegan',
    shortLabel: 'Vegan',
    emoji: '🌱',
    description: 'Sans aucun produit d’origine animale.',
  },
  {
    id: 'sans-gluten',
    label: 'Sans gluten',
    shortLabel: 'S/Gluten',
    emoji: '🌾',
    description: 'Convient aux personnes intolérantes au gluten.',
  },
  {
    id: 'sans-porc',
    label: 'Sans porc',
    shortLabel: 'S/Porc',
    emoji: '🐷',
    description: 'Ne contient aucune viande de porc.',
  },
  {
    id: 'epice',
    label: 'Épicé',
    shortLabel: 'Épicé',
    emoji: '🌶️',
    description: 'Plat avec une note pimentée prononcée.',
  },
];

export const getDietaryTag = (id: DietaryTag): DietaryTagInfo =>
  DIETARY_TAGS.find(t => t.id === id) ?? DIETARY_TAGS[0];

/** Renvoie true si le plat satisfait toutes les contraintes diététiques actives. */
export const matchesDietaryTags = (
  itemTags: DietaryTag[] | undefined,
  required: DietaryTag[]
): boolean => {
  if (required.length === 0) return true;
  const tags = itemTags ?? [];
  return required.every(t => tags.includes(t));
};
