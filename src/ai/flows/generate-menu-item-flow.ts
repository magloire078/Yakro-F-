
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
  return generateMenuItemFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateMenuItemPrompt',
    input: { schema: GenerateMenuItemInputSchema },
    output: { schema: GenerateMenuItemOutputSchema },
    prompt: `You are an expert in West African and particularly Ivorian cuisine and marketing. Your task is to generate a new menu item for a restaurant based on a user's simple description.

    Restaurant Name: {{{restaurantName}}}
    Cuisine: {{{cuisine}}}
    User's Description: "{{{description}}}"

    Based on this information, please generate the following:
    1.  **Name:** A creative, appealing, and authentic-sounding name for the dish in French.
    2.  **Description:** An enticing and delicious-sounding description in French, between 20 and 40 words.
    3.  **Price:** A realistic price in West African CFA Francs (XOF). The price should be reasonable for the described dish and be a multiple of 50 or 100.
    4.  **Image Prompt:** A detailed prompt for an image generation model to create a photorealistic, appetizing picture of the dish. Include details about the plating, lighting (e.g., natural light), composition (e.g., close-up shot), background, and style (e.g., professional food photography, rustic).
    
    Return the result in JSON format.
    `,
});

const generateMenuItemFlow = ai.defineFlow(
    {
        name: 'generateMenuItemFlow',
        inputSchema: GenerateMenuItemInputSchema,
        outputSchema: GenerateMenuItemOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
