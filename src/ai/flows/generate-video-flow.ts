
'use server';
/**
 * @fileOverview A flow for generating a promotional video for a restaurant.
 *
 * - generateVideo - A function that generates a video.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import type { MediaPart } from 'genkit';

const GenerateVideoInputSchema = z.object({
  restaurantName: z.string().describe('The name of the restaurant.'),
  cuisine: z.string().describe('The cuisine of the restaurant.'),
  imageDataUri: z.string().nullable().describe("An optional image of the restaurant or a dish, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI of the generated video.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

// This defines an operation that will be checked for doneness.
const GenerateVideoOperationSchema = z.object({
  name: z.string(),
  done: z.boolean(),
});
export type GenerateVideoOperation = z.infer<
  typeof GenerateVideoOperationSchema
>;

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const { operation } = await generateVideoFlow(input);
  if (!operation) {
    throw new Error('Expected the model to return an operation');
  }

  // Poll for completion
  let completedOperation = operation;
  while (!completedOperation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
    completedOperation = await ai.checkOperation(completedOperation);
  }

  if (completedOperation.error) {
    throw new Error(
      'Failed to generate video: ' + completedOperation.error.message
    );
  }

  const videoPart = completedOperation.output?.message?.content.find(
    p => !!p.media
  );
  if (!videoPart || !videoPart.media) {
    throw new Error('Failed to find the generated video in the operation result');
  }

  // For client-side display, we convert the video buffer to a data URI
  const fetch = (await import('node-fetch')).default;
  const videoDownloadResponse = await fetch(
    `${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`
  );
  if (
    !videoDownloadResponse ||
    videoDownloadResponse.status !== 200 ||
    !videoDownloadResponse.body
  ) {
    throw new Error('Failed to download video from the signed URL');
  }
  const videoBuffer = await videoDownloadResponse.arrayBuffer();
  const base64Video = Buffer.from(videoBuffer).toString('base64');
  const contentType = videoPart.media.contentType || 'video/mp4';

  return {
    videoUrl: `data:${contentType};base64,${base64Video}`,
  };
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
  },
  async ({ restaurantName, cuisine, imageDataUri }) => {
    
    const textPrompt = `A cinematic, professional 5-second video advertisement for a restaurant named "${restaurantName}". The restaurant specializes in ${cuisine} cuisine. Show delicious, steaming food, a glimpse of a warm and inviting atmosphere. Food photography style.`;
    
    let prompt: (string | MediaPart)[] | string;
    
    if(imageDataUri) {
        prompt = [
            { text: `Animate this image in a subtle, elegant way. Make the food steam, add a gentle zoom or pan effect. The final video should feel like a premium food commercial for "${restaurantName}".` },
            { media: { url: imageDataUri } }
        ]
    } else {
        prompt = textPrompt;
    }

    const { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt,
      config: {
        durationSeconds: 5