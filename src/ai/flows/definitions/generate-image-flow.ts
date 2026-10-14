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
      refinedPrompt = `High-end editorial architectural photography of an authentic, welcoming restaurant in Côte d'Ivoire (Yamoussoukro / Abidjan): ${prompt}. 
        Setting: An elegant contemporary dining establishment or upscale tropical maquis with natural wood pergolas, textured clay, lush tropical foliage, warm ambient lighting, and clean outdoor or indoor tables set with glassware. 
        Atmosphere: Warm daylight, diffused afternoon sun, genuine West African urban warmth. 
        Photography style: Shot on 35mm lens, f/4 aperture, crisp natural depth of field, realistic textures (weathered teak, polished stone, woven artisan lanterns). 
        Negative constraints: No futuristic CGI, no cartoon illustration, no 3D digital architectural render, no fake neon glow, no sterile European cafe clichés. Purely organic, inviting, realistic documentary photography.`;
    } else {
      refinedPrompt = `Editorial culinary food photography of authentic West African & Ivorian cuisine: ${prompt}. 
        Plating & presentation: Generously served in an authentic artisanal matte ceramic bowl, dark stoneware plate, or natural banana leaf on a rustic wooden dining table. 
        Sensory details: Tactile realistic textures — glistening golden palm oil or braising jus, delicate steam rising, authentic grill-charred edges on braised fish or meats, granular fermented cassava attiéké, freshly diced red onions and tomatoes, vibrant scotch bonnet peppers, caramelized plantain alloco. 
        Lighting & aesthetics: Soft natural side-window daylight with soft organic shadows, 50mm macro food lens, shallow depth of field with sharp focus on the main dish. 
        Negative constraints: No plastic sheen, no artificial oversaturation, no 3D digital render, no fake glowing sauce, no miniature fine-dining tweezers plating, no irrelevant Western herbs (broccoli, mint on savory food), no cartoon look. Real, mouth-watering, genuine home-cooked and restaurant-quality Ivorian gastronomy.`;
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
