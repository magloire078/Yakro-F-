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
      refinedPrompt = `Authentic street-level photography of a real restaurant in Côte d'Ivoire: ${prompt}. 
        Natural daylight, real-world atmosphere, authentic storefront textures (wood, stone, glass). 
        Warm and welcoming local vibe, shot on a high-end smartphone for a natural documentary look. 
        Sharp focus on the signage and entrance, realistic urban environment. 
        AVOID 3D renders, AVOID unrealistic luxury lighting, purely natural professional photography.`;
    } else {
      refinedPrompt = `Realistic and authentic food photography of: ${prompt}. 
        Served in a simple ceramic plate on a wooden restaurant table. 
        Natural window lighting, real textures (glistening oils, steam, charred edges). 
        True West African colors, organic presentation, shallow depth of field. 
        Shot in a real kitchen or restaurant setting, not a studio. 
        AVOID plastic look, AVOID artificial saturation, AVOID perfection - make it look like a real delicious meal.`;
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
