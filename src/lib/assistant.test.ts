import { describe, it, expect } from 'vitest';
import { buildAssistantCatalog } from './assistant';
import type { MenuItem, Restaurant } from './types';

const restaurant = (overrides: Partial<Restaurant> = {}): Restaurant => ({
  id: 'rest-1',
  proprietaireId: 'owner-1',
  nom: 'Chez Mariam',
  cuisine: 'Attiéké',
  note: 4.8,
  tempsDeLivraison: 25,
  fraisDeLivraison: 500,
  image: 'img.jpg',
  indiceImage: 'rest-1',
  adresse: 'Dioulakro',
  ...overrides,
});

const menuItem = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  id: 'item-1',
  nom: 'Attiéké poisson',
  description: 'Poisson braisé, attiéké maison',
  prix: 2000,
  categorie: 'Plat',
  indiceImage: 'item-1',
  restaurantId: 'rest-1',
  ...overrides,
});

describe('buildAssistantCatalog', () => {
  it('joins a menu item with its restaurant fields', () => {
    const catalog = buildAssistantCatalog([menuItem()], [restaurant()]);
    expect(catalog).toEqual([{
      id: 'item-1',
      nom: 'Attiéké poisson',
      description: 'Poisson braisé, attiéké maison',
      prix: 2000,
      restaurantId: 'rest-1',
      nomRestaurant: 'Chez Mariam',
      cuisine: 'Attiéké',
      tempsDeLivraison: 25,
      fraisDeLivraison: 500,
      adresseRestaurant: 'Dioulakro',
    }]);
  });

  it('omits items whose restaurant is suspended', () => {
    const catalog = buildAssistantCatalog([menuItem()], [restaurant({ suspendu: true })]);
    expect(catalog).toEqual([]);
  });

  it('omits items whose restaurant no longer exists', () => {
    const catalog = buildAssistantCatalog([menuItem({ restaurantId: 'ghost' })], [restaurant()]);
    expect(catalog).toEqual([]);
  });

  it('omits adresseRestaurant when the restaurant has none', () => {
    const catalog = buildAssistantCatalog([menuItem()], [restaurant({ adresse: undefined })]);
    expect(catalog[0]).not.toHaveProperty('adresseRestaurant');
  });
});
