
// src/ai/flows/personalized-recommendations.ts
'use server';

/**
 * @fileOverview A personalized recommendation AI agent.
 *
 * - getPersonalizedRecommendations - A function that generates personalized recommendations.
 * - PersonalizedRecommendationsInput - The input type for the getPersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the getPersonalizedRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MenuItemSchema = z.object({
  id: z.string(),
  nom: z.string(),
  description: z.string(),
  prix: z.number(),
  nomRestaurant: z.string(),
  cuisine: z.string(),
});

const PersonalizedRecommendationsInputSchema = z.object({
  userHistory: z.string().describe('A summary of the user\'s order history and preferences.'),
  availableMenuItems: z.array(MenuItemSchema).describe('A list of all available menu items to choose from for recommendations.'),
  currentLocation: z.string().describe('The current location of the user.'),
  timeOfDay: z.string().describe('The time of day.'),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      item: z.string().describe('The name of the recommended item.'),
      description: z.string().describe('A short description of the item, taken from the available menu items.'),
      restaurant: z.string().describe('The name of the restaurant offering the item.'),
      cuisine: z.string().describe('The type of cuisine.'),
    })
  ).describe('A list of personalized recommendations.'),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

export async function getPersonalizedRecommendations(input: PersonalizedRecommendationsInput): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: {schema: PersonalizedRecommendationsInputSchema},
  output: {schema: PersonalizedRecommendationsOutputSchema},
  prompt: `You are a personal recommendation system for a food delivery app.

Your task is to provide personalized recommendations for meals. You MUST select items exclusively from the provided list of available menu items. Do NOT invent new items.

Base your recommendations on the user's order history, their current location, and the time of day.

User History: {{{userHistory}}}
Current Location: {{{currentLocation}}}
Time of Day: {{{timeOfDay}}}

Here is the list of available menu items you can recommend from:
{{#each availableMenuItems}}
- Name: {{nom}}
  Description: {{description}}
  Price: {{prix}} FCFA
  Restaurant: {{nomRestaurant}}
  Cuisine: {{cuisine}}
{{/each}}

Select a few diverse items from the list above that would best suit the user. For each recommendation, provide the item's name, its original description, the restaurant name, and the cuisine type.

Return the recommendations in JSON format.
  `
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
