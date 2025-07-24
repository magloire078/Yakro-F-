
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
  actions: {
    generateAllImages: () => Promise<void>;
    getMenuItemImage: (id: string) => string;
    getRestaurantImage: (id: string) => string;
  }
}

const useImagesStore = create<ImageState>((set, get) => ({
  restaurants: initialRestaurants,
  menuItems: initialMenuItems,
  isGenerating: false,
  actions: {
    generateAllImages: async () => {
      set({ isGenerating: true });
      try {
        const updatedMenuItems = await Promise.all(
          get().menuItems.map(async (item) => {
            const { imageUrl } = await generateImage({ prompt: item.name });
            return { ...item, image: imageUrl };
          })
        );
        set({ menuItems: updatedMenuItems });
        
        const updatedRestaurants = await Promise.all(
          get().restaurants.map(async (resto) => {
            const { imageUrl } = await generateImage({ prompt: resto.cuisine });
            return { ...resto, image: imageUrl };
          })
        );
        set({ restaurants: updatedRestaurants });
      } finally {
        set({ isGenerating: false });
      }
    },
    getMenuItemImage: (id: string) => {
      const item = get().menuItems.find(i => i.id === id);
      const initialItem = initialMenuItems.find(i => i.id === id);
      return item?.image || initialItem?.image || 'https://placehold.co/100x100';
    },
    getRestaurantImage: (id: string) => {
      const restaurant = get().restaurants.find(r => r.id === id);
      const initialRestaurant = initialRestaurants.find(r => r.id === id);
      return restaurant?.image || initialRestaurant?.image || 'https://placehold.co/600x400';
    },
  }
}));

export const useImages = () => {
    const state = useImagesStore();
    return {
        ...state,
        ...state.actions
    }
}
// This is needed for the user history generation helper
useImages.getState = useImagesStore.getState;


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
  const { restaurants, menuItems, isGenerating, generateAllImages, getMenuItemImage, getRestaurantImage } = useImages();

  return (
    <ImageContext.Provider value={{ restaurants, menuItems, isGenerating, generateAllImages, getMenuItemImage, getRestaurantImage }}>
      {children}
    </ImageContext.Provider>
  );
};
