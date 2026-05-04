import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { uploadImage } from '@/lib/cloudinary';

export const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});

export const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI, including MIME type and Base64 encoding."),
});

export const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({ prompt }) => {
    // Detect if the prompt is for a restaurant or a dish
    const isRestaurant = /restaurant|établissement|façade|hôtel|boutique|enseigne/i.test(prompt);

    let refinedPrompt = "";

    if (isRestaurant) {
      refinedPrompt = `Hyper-premium cinematic architectural photography of the luxury establishment: ${prompt}. 
        'Yakro Elite' signature style, Yamoussoukro ultra-luxury architecture. 
        Warm golden hour lighting, dramatic deep shadows, sophisticated glass and stone textures. 
        Natural evening atmosphere, 8k resolution, authentic textures, architectural masterpiece. 
        No CGI look, purely realistic professional photography.`;
    } else {
      refinedPrompt = `Authentic and hyper-realistic professional food photography of: ${prompt}. 
        Close-up shot, natural organic textures, realistic steam, moisture on glass, imperfect natural edges. 
        West African haute cuisine, Yamoussoukro luxury presentation. 
        Warm cinematic lighting, deep contrast, dark charcoal background. 
        Shot on Phase One XF, f/2.8, depth of field, natural food styling. 
        AVOID plastic look, AVOID artificial shine, purely organic and appetizing masterpiece.`;
    }

    try {
      const { media } = await ai.generate({
        model: googleAI.model('imagen-3.0-fast-generate-001'),
        prompt: refinedPrompt,
      });

      const imageUrl = media?.url;

      if (!imageUrl) {
        throw new Error('Image generation failed to return a URL.');
      }

      // Step 2: Permanent storage on Cloudinary
      const timestamp = Date.now();
      const publicId = `yakro/ia-generated/${timestamp}`;
      const permanentUrl = await uploadImage(imageUrl, publicId);

      return {
        imageDataUri: permanentUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Gemini image generation failed, falling back to Pollinations AI:', errorMessage);
      
      // Fallback to Pollinations AI with the same refined prompt
      const seed = Math.floor(Math.random() * 1000000);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(refinedPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
      
      try {
        const timestamp = Date.now();
        const publicId = `yakro/ia-fallback/${timestamp}`;
        const permanentUrl = await uploadImage(fallbackUrl, publicId);
        
        return {
          imageDataUri: permanentUrl,
        };
      } catch (uploadError) {
        console.error('Failed to upload fallback image to Cloudinary, returning direct URL:', uploadError);
        return {
          imageDataUri: fallbackUrl,
        };
      }
    }
  }
);
