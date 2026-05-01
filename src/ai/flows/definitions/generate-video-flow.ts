import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const GenerateVideoInputSchema = z.object({
  restaurantName: z.string().describe('The name of the restaurant.'),
  cuisine: z.string().describe('The cuisine of the restaurant.'),
  imageUrl: z.string().url().nullable().describe("An optional public URL to an image of the restaurant or a dish."),
});

export const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI of the generated video.'),
});

async function imageUrlToDataUri(url: string): Promise<string> {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
  }
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${contentType};base64,${base64}`;
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
  },
  async ({ restaurantName, cuisine, imageUrl }) => {
    const textPrompt = `A cinematic, professional 5-second video advertisement for a restaurant named "${restaurantName}". The restaurant specializes in ${cuisine} cuisine. Show delicious, steaming food, a glimpse of a warm and inviting atmosphere. Food photography style.`;

    let prompt: string | Array<{ text?: string } | { media: { url: string } }>;
    let imageDataUri: string | null = null;
    if (imageUrl) {
      try {
        imageDataUri = await imageUrlToDataUri(imageUrl);
      } catch (error) {
        console.error("Failed to convert image URL to data URI:", error);
      }
    }

    if (imageDataUri) {
      prompt = [
        { text: `Animate this image in a subtle, elegant way. Make the food steam, add a gentle zoom or pan effect. The final video should feel like a premium food commercial for "${restaurantName}".` },
        { media: { url: imageDataUri } }
      ];
    } else {
      prompt = textPrompt;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { operation } = await (ai.generate as any)({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt,
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
      },
    });

    return { operation };
  }
);

export async function generateVideoExecutor(input: z.infer<typeof GenerateVideoInputSchema>): Promise<z.infer<typeof GenerateVideoOutputSchema>> {
  const result = await generateVideoFlow(input);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const operation = result.operation as any;
  if (!operation) {
    throw new Error('Expected the model to return an operation');
  }

  // Poll for completion
  let completedOperation = operation;
  while (!completedOperation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    completedOperation = await ai.checkOperation(completedOperation);
  }

  if (completedOperation.error) {
    throw new Error('Failed to generate video: ' + completedOperation.error.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videoPart = (completedOperation.output?.message?.content as any[] | undefined)?.find((p: any) => !!p.media);
  if (!videoPart || !videoPart.media) {
    throw new Error('Failed to find the generated video in the operation result');
  }

  const fetch = (await import('node-fetch')).default;
  const videoDownloadResponse = await fetch(`${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`);
  if (!videoDownloadResponse || videoDownloadResponse.status !== 200 || !videoDownloadResponse.body) {
    throw new Error('Failed to download video from the signed URL');
  }
  const videoBuffer = await videoDownloadResponse.arrayBuffer();
  const base64Video = Buffer.from(videoBuffer).toString('base64');
  const contentType = (videoPart.media.contentType as string) || 'video/mp4';

  return {
    videoUrl: `data:${contentType};base64,${base64Video}`,
  };
}
