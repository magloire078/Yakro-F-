
'use client';

import * as React from 'react';
import type { Restaurant, MenuItem } from '@/lib/types';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { initialMenuItems, initialRestaurants } from '@/lib/data';
import { create } from 'zustand';

interface ImageState {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  isGenerating: boolean;
  setRestaurants: (restaurants: Restaurant[]) => void;
  setMenuItems: (menuItems: MenuItem[]) => void;
  generateAllImages: () => Promise<void>;
  getMenuItemImage: (id: string) => string;
  getRestaurantImage: (id: string) => string;
}

const useImagesStore = create<ImageState>((set, get) => ({
  restaurants: initialRestaurants,
  menuItems: initialMenuItems,
  isGenerating: false,
  setRestaurants: (restaurants) => set({ restaurants }),
  setMenuItems: (menuItems) => set({ menuItems }),
  generateAllImages: async () => {
    set({ isGenerating: true });
    try {
      const updatedMenuItems = await Promise.all(
        get().menuItems.map(async (item) => {
          if (item.image.startsWith('https://placehold.co')) {
              const { imageUrl } = await generateImage({ prompt: item.imageHint || item.name });
              return { ...item, image: imageUrl };
          }
          return item;
        })
      );
      set({ menuItems: updatedMenuItems });
      
      const updatedRestaurants = await Promise.all(
        get().restaurants.map(async (resto) => {
           if (resto.image.startsWith('https://placehold.co')) {
            const { imageUrl } = await generateImage({ prompt: resto.imageHint || resto.cuisine });
            return { ...resto, image: imageUrl };
           }
           return resto;
        })
      );
      set({ restaurants: updatedRestaurants });
    } finally {
      set({ isGenerating: false });
    }
  },
  getMenuItemImage: (id: string) => {
    const item = get().menuItems.find(i => i.id === id);
    return item?.image || 'https://placehold.co/100x100';
  },
  getRestaurantImage: (id: string) => {
    const restaurant = get().restaurants.find(r => r.id === id);
    return restaurant?.image || 'https://placehold.co/600x400';
  },
}));

// The hook to be used in components
export const useImages = useImagesStore;

// This is needed for the user history generation helper which runs outside of React components
export const getRestaurantsForHistory = () => useImagesStore.getState().restaurants;
