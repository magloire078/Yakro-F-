
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
  keywords: z.array(z.string()).describe('A list of general keywords from the query (e.g., "pas cher", "rapide").'),
  cuisine: z.array(z.string()).describe('Any cuisine types mentioned (e.g., Ivoirienne, Pizza, Africaine, Grillades).'),
  priceRange: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional()
    .describe('The price range mentioned.'),
  deliveryTime: z.number().optional().describe('The maximum delivery time in minutes.'),
  rating: z.number().optional().describe('The minimum rating mentioned.'),
  searchTerms: z.array(z.string()).describe('A list of specific dishes or restaurant names mentioned in the query. This is the most important field for direct searching.'),
});
export type IntelligentSearchOutput = z.infer<typeof IntelligentSearchOutputSchema>;

export async function intelligentSearch(input: IntelligentSearchInput): Promise<IntelligentSearchOutput> {
  return intelligentSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentSearchPrompt',
  input: { schema: IntelligentSearchInputSchema },
  output: { schema: IntelligentSearchOutputSchema },
  prompt: `You are an intelligent search assistant for a food delivery app. Your task is to analyze the user's search query and extract structured information from it. The primary goal is to identify specific dishes or restaurants the user is looking for.

User Query: "{{{query}}}"

Analyze the query and extract the following information:
- searchTerms: This is the most important. Extract any specific dish names (e.g., "Poulet Yassa", "Pizza", "Foutou Banane") or restaurant names mentioned. Be specific.
- cuisine: Identify any general cuisine types mentioned (e.g., Ivoirienne, Africaine, Grillades).
- keywords: Extract general keywords describing qualities (e.g., "rapide", "pas cher", "bien noté").
- priceRange: Identify any price constraints. For "pas cher" or "bon marché", consider a max of 4000. For "moins de X", set max to X.
- deliveryTime: Note any constraints on delivery time. "Rapide" or "livraison rapide" should be interpreted as under 30 minutes.
- rating: Note any preference for ratings. "Bien noté", "le meilleur", or "4 étoiles" should be interpreted as a minimum rating of 4.

Example: "Je veux du poulet yassa pas cher" -> searchTerms: ["poulet yassa"], priceRange: { max: 4000 }.
Example: "pizza rapide" -> searchTerms: ["pizza"], deliveryTime: 30.

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
