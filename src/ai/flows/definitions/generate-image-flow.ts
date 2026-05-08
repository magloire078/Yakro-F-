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
      refinedPrompt = `Street-level documentary photograph of a real local restaurant in Abidjan, Côte d'Ivoire: ${prompt}.
        Shot with a Sony A7 III, 35mm f/1.8 lens, midday diffused sunlight.
        Authentic West African urban architecture: hand-painted signage, corrugated metal roof edges visible, worn concrete walls, colourful plastic chairs on the terrace.
        Customers and motorbikes naturally in background, slight motion blur on passersby.
        Imperfect real-world details: uneven paint, a handwritten menu board, water stains on lower walls.
        NOT a staged photo shoot. NOT a luxury restaurant. NOT neon lights. NOT CGI or render.
        Colour grading: warm, slightly desaturated, photojournalistic — NOT Instagram-filtered.`;
    } else {
      refinedPrompt = `Authentic documentary food photograph of: ${prompt}.
        Served on a rustic hand-painted clay bowl or chipped enamel plate, resting on a wood-grain formica table.
        Shot with a Canon EOS R6, 50mm f/2.0 lens, natural window light from the left, slight lens flare.
        True West African presentation: irregular portions, a shared communal serving, palm oil sheen or peanut sauce pooling, visible steam rising.
        Background shows a real restaurant interior: plastic chairs, tiled wall, a plastic water jug on the next table.
        Visible imperfections: a few oil drips on the side of the bowl, a lime wedge slightly off-center.
        NOT styled food photography. NOT studio lighting. NOT perfect symmetry. NOT crisp white backgrounds.
        Colour palette: rich ochres, deep browns, vibrant reds — earthy and appetising, NOT neon or oversaturated.`;
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
