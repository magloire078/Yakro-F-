
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

const PersonalizedRecommendationsInputSchema = z.object({
  userHistory: z.string().describe('The user history of orders and preferences.'),
  currentLocation: z.string().describe('The current location of the user.'),
  timeOfDay: z.string().describe('The time of day.'),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      item: z.string().describe('The name of the recommended item.'),
      description: z.string().describe('A short description of the item.'),
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

  Based on the user's order history, current location, and the time of day, you will provide personalized recommendations for restaurants, meals, or items.

  User History: {{{userHistory}}}
  Current Location: {{{currentLocation}}}
  Time of Day: {{{timeOfDay}}}

  Recommendations should be tailored to the user's taste and preferences, and should be relevant to their current location and the time of day.

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
