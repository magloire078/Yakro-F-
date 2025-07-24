
'use server';
/**
 * @fileOverview A flow for generating a new menu item for a restaurant.
 *
 * - generateMenuItem - A function that generates a menu item.
 * - GenerateMenuItemInput - The input type for the generateMenuItem function.
 * - GenerateMenuItemOutput - The return type for the generateMenuItem function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMenuItemInputSchema = z.object({
  restaurantName: z.string().describe('The name of the restaurant.'),
  cuisine: z.string().describe('The cuisine of the restaurant.'),
  description: z.string().describe('A simple description of the dish provided by the user.'),
});
export type GenerateMenuItemInput = z.infer<typeof GenerateMenuItemInputSchema>;

const GenerateMenuItemOutputSchema = z.object({
  name: z.string().describe('A creative and appealing name for the dish in French.'),
  generatedDescription: z.string().describe('A delicious and enticing description of the dish in French, between 20 and 40 words.'),
  price: z.number().describe('A suggested price in West African CFA Franc (FCFA), should be a multiple of 50 or 100.'),
  imagePrompt: z.string().describe('A detailed prompt for an image generation model to create a photorealistic, appetizing picture of the dish. Should include details about lighting, composition, and style (e.g., food photography).'),
});
export type GenerateMenuItemOutput = z.infer<typeof GenerateMenuItemOutputSchema>;


export async function generateMenuItem(input: GenerateMenuItemInput): Promise<GenerateMenuItemOutput> {
  // This is a placeholder. We will implement the actual flow in the next step.
  console.log('Generating menu item with input:', input);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    name: 'Plat Démo',
    generatedDescription: 'Description générée pour le plat de démo.',
    price: 5000,
    imagePrompt: 'a high quality, professional photograph of a delicious meal, food photography',
  };
}
