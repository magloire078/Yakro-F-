
'use server';
/**
 * @fileOverview A flow for generating restaurant reviews.
 *
 * - generateReviews - A function that generates reviews for a restaurant.
 * - GenerateReviewsInput - The input type for the generateReviews function.
 * - GenerateReviewsOutput - The return type for the generateReviews function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateReviewsInputSchema = z.object({
  restaurantName: z.string().describe('The name of the restaurant to generate reviews for.'),
  cuisine: z.string().describe('The cuisine of the restaurant.'),
  count: z.number().describe('The number of reviews to generate.'),
});
export type GenerateReviewsInput = z.infer<typeof GenerateReviewsInputSchema>;

const GenerateReviewsOutputSchema = z.object({
  reviews: z.array(
    z.object({
      userName: z.string().describe("The name of the user leaving the review. Should be a realistic African-sounding name."),
      rating: z.number().min(1).max(5).describe('The star rating from 1 to 5.'),
      comment: z.string().describe('The review comment, between 20 and 50 words. Should be in French.'),
    })
  ),
});
export type GenerateReviewsOutput = z.infer<typeof GenerateReviewsOutputSchema>;

export async function generateReviews(input: GenerateReviewsInput): Promise<GenerateReviewsOutput> {
  return generateReviewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReviewsPrompt',
  input: { schema: GenerateReviewsInputSchema },
  output: { schema: GenerateReviewsOutputSchema },
  prompt: `You are an expert in Ivorian culture and cuisine. Generate a list of realistic reviews for a restaurant.

Restaurant Name: {{{restaurantName}}}
Cuisine: {{{cuisine}}}
Number of reviews to generate: {{{count}}}

Generate varied reviews, with different ratings and tones. The user names should sound Ivorian. The comments must be in French.
`,
});

const generateReviewsFlow = ai.defineFlow(
  {
    name: 'generateReviewsFlow',
    inputSchema: GenerateReviewsInputSchema,
    outputSchema: GenerateReviewsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
    
