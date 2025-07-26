
// src/ai/flows/search-flow.ts
'use server';
/**
 * @fileOverview An intelligent search AI agent.
 *
 * - intelligentSearch - A function that interprets a natural language search query.
 * - IntelligentSearchInput - The input type for the intelligentSearch function.
 * - IntelligentSearchOutput - The return type for the intelligentSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const IntelligentSearchInputSchema = z.object({
  query: z.string().describe('The user\'s search query in natural language.'),
});
export type IntelligentSearchInput = z.infer<typeof IntelligentSearchInputSchema>;

const IntelligentSearchOutputSchema = z.object({
  keywords: z.array(z.string()).describe('A list of keywords extracted from the query.'),
  cuisine: z.array(z.string()).describe('The type of cuisine mentioned.'),
  priceRange: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional()
    .describe('The price range mentioned.'),
  deliveryTime: z.number().optional().describe('The maximum delivery time in minutes.'),
  rating: z.number().optional().describe('The minimum rating mentioned.'),
  searchTerms: z.array(z.string()).describe('The list of dishes mentioned in the query.'),
});
export type IntelligentSearchOutput = z.infer<typeof IntelligentSearchOutputSchema>;

export async function intelligentSearch(input: IntelligentSearchInput): Promise<IntelligentSearchOutput> {
  return intelligentSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentSearchPrompt',
  input: { schema: IntelligentSearchInputSchema },
  output: { schema: IntelligentSearchOutputSchema },
  prompt: `You are an intelligent search assistant for a food delivery app. Your task is to analyze the user's search query and extract structured information from it.

User Query: "{{{query}}}"

Analyze the query and extract the following information:
- Keywords: General terms from the query.
- Cuisine: Identify any mentioned cuisines (e.g., Ivoirienne, Pizza, Africaine, Grillades).
- Price Range: Identify any price constraints. For "pas cher" or "bon marché" consider a max of 4000. For "moins de X", set max to X.
- Delivery Time: Note any constraints on delivery time (e.g., "rapide", "en moins de 30 minutes"). "Rapide" should be interpreted as under 30 minutes.
- Rating: Note any preference for ratings (e.g., "bien noté", "le meilleur"). "Bien noté" or "le meilleur" should be interpreted as a minimum rating of 4.
- Search Terms: List any specific dishes mentioned in the query.

Return the result in JSON format.
`,
});

const intelligentSearchFlow = ai.defineFlow(
  {
    name: 'intelligentSearchFlow',
    inputSchema: IntelligentSearchInputSchema,
    outputSchema: IntelligentSearchOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
