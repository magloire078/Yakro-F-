
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
  description: z.string().describe("A simple description of the dish provided by the user. This is the primary input."),
  name: z.string().optional().describe("An optional name for the dish. If provided, the AI should refine it or use it as inspiration."),
  price: z.number().optional().describe("An optional price for the dish. If provided, the AI should use it or adjust it slightly if it seems unrealistic."),
});
export type GenerateMenuItemInput = z.infer<typeof GenerateMenuItemInputSchema>;

const GenerateMenuItemOutputSchema = z.object({
  name: z.string().describe('A creative and appealing name for the dish in French. If a name was provided in the input, refine or use it.'),
  generatedDescription: z.string().describe('A delicious and enticing description of the dish in French, between 20 and 40 words, based on the user\'s simple description.'),
  price: z.number().describe('A suggested price in West African CFA Franc (FCFA), should be a multiple of 50 or 100. If a price was provided, use or adjust it.'),
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
    prompt: `You are an expert in West African and particularly Ivorian cuisine and marketing. Your task is to generate a new menu item for a restaurant based on a user's input.

    Restaurant Name: {{{restaurantName}}}
    Cuisine: {{{cuisine}}}
    
    User Input:
    - Description (required): "{{{description}}}"
    {{#if name}}- Name (optional): "{{{name}}}"{{/if}}
    {{#if price}}- Price (optional): "{{{price}}} FCFA"{{/if}}

    Based on the information provided, please generate the following, adhering to these rules:
    1.  **Name:** 
        - If a name was provided, use it as the primary name or slightly refine it to be more appealing. Do not invent a completely new name.
        - If no name was provided, create an appealing, authentic-sounding French name for the dish based on the description.
    2.  **Description:** 
        - Create an enticing and delicious-sounding description in French, between 20 and 40 words. This should be based *only* on the user's input description.
    3.  **Price:** 
        - If a price was provided, use that price. If it seems completely unrealistic for the dish, you can adjust it slightly, but try to respect the user's input. The final price must be a multiple of 50 or 100.
        - If no price was provided, suggest a realistic price in West African CFA Francs (XOF). The price should be reasonable and a multiple of 50 or 100.
    4.  **Image Prompt:** 
        - Create a detailed prompt for an image generation model. This prompt should produce a photorealistic, appetizing picture of the dish. Include details about the plating, lighting (e.g., natural light), composition (e.g., close-up shot), background, and style (e.g., professional food photography, rustic).
    
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
