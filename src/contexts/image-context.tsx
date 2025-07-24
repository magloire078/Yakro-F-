
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem } from '@/lib/types';
import { generateImage } from '@/ai/flows/generate-image-flow';

const initialRestaurants: Restaurant[] = [
    { id: '1', name: 'Le Pili Pili', cuisine: 'Ivoirienne', rating: 4.8, deliveryTime: 25, image: 'https://placehold.co/600x400', imageHint: 'african food' },
    { id: '2', name: 'Chez Mario', cuisine: 'Pizza', rating: 4.7, deliveryTime: 35, image: 'https://placehold.co/600x400', imageHint: 'pizza' },
    { id: '3', name: 'Le Bazin', cuisine: 'Africaine', rating: 4.6, deliveryTime: 30, image: 'https://placehold.co/600x400', imageHint: 'traditional african food' },
    { id: '4', name: 'La Brise du Lac', cuisine: 'Grillades', rating: 4.5, deliveryTime: 40, image: 'https://placehold.co/600x400', imageHint: 'lake view' },
];

const initialMenuItems: MenuItem[] = [
    { id: 'm1', name: 'Poulet Braisé', description: 'Poulet entier grillé, mariné aux épices locales.', price: 7500, image: 'https://placehold.co/600x400', imageHint: 'grilled chicken', restaurantId: '1' },
    { id: 'm2', name: 'Foutou Banane, Sauce Graine', description: 'Foutou de banane plantain accompagné d\'une sauce onctueuse aux noix de palme.', price: 5000, image: 'https://placehold.co/600x400', imageHint: 'fufu palm nut soup', restaurantId: '3' },
    { id: 'm3', name: 'Attiéké Poisson Thon', description: 'La spécialité ivoirienne par excellence : semoule de manioc et thon frit.', price: 3500, image: 'https://placehold.co/600x400', imageHint: 'attieke fried fish', restaurantId: '1' },
    { id: 'm4', name: 'Kedjenou de Poulet', description: 'Poulet mijoté aux légumes et épices, cuit à l\'étouffée.', price: 6000, image: 'https://placehold.co/600x400', imageHint: 'chicken stew', restaurantId: '4' },
    { id: 'm5', name: 'Alloco', description: 'Bananes plantains mûres frites, un délice sucré-salé.', price: 1500, image: 'https://placehold.co/600x400', imageHint: 'fried plantain', restaurantId: '3' },
    { id: 'm6', name: 'Pizza Reine', description: 'Pizza garnie de jambon, champignons et fromage.', price: 8000, image: 'https://placehold.co/600x400', imageHint: 'pizza', restaurantId: '2' },
    { id: 'm7', name: 'Pizza 4 Saisons', description: 'Pizza végétarienne avec artichauts, poivrons, olives et champignons.', price: 8500, image: 'https://placehold.co/600x400', imageHint: 'vegetarian pizza', restaurantId: '2' },
    { id: 'm8', name: 'Brochettes de Boeuf', description: 'Tendres morceaux de boeuf marinés et grillés.', price: 4000, image: 'https://placehold.co/600x400', imageHint: 'beef skewers', restaurantId: '4' },
];

interface ImageContextType {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  isGenerating: boolean;
  generateAllImages: () => Promise<void>;
  getMenuItemImage: (id: string) => string;
  getRestaurantImage: (id: string) => string;
}

const ImageContext = React.createContext<ImageContextType | undefined>(undefined);

export const ImageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>(initialRestaurants);
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>(initialMenuItems);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generateAllImages = async () => {
    setIsGenerating(true);
    try {
      const updatedMenuItems = await Promise.all(
        menuItems.map(async (item) => {
          const { imageUrl } = await generateImage({ prompt: item.name });
          return { ...item, image: imageUrl };
        })
      );
      setMenuItems(updatedMenuItems);
      
      const updatedRestaurants = await Promise.all(
        restaurants.map(async (resto) => {
          const { imageUrl } = await generateImage({ prompt: resto.cuisine });
          return { ...resto, image: imageUrl };
        })
      );
      setRestaurants(updatedRestaurants);
    } finally {
      setIsGenerating(false);
    }
  };

  const getMenuItemImage = (id: string) => {
    const item = menuItems.find(i => i.id === id);
    const initialItem = initialMenuItems.find(i => i.id === id);
    return item?.image || initialItem?.image || 'https://placehold.co/100x100';
  };

  const getRestaurantImage = (id: string) => {
    const restaurant = restaurants.find(r => r.id === id);
    const initialRestaurant = initialRestaurants.find(r => r.id === id);
    return restaurant?.image || initialRestaurant?.image || 'https://placehold.co/600x400';
  };


  return (
    <ImageContext.Provider value={{ restaurants, menuItems, isGenerating, generateAllImages, getMenuItemImage, getRestaurantImage }}>
      {children}
    </ImageContext.Provider>
  );
};

export const useImages = () => {
  const context = React.useContext(ImageContext);
  if (context === undefined) {
    throw new Error('useImages must be used within a ImageProvider');
  }
  return context;
};
