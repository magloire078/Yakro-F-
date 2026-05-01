
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateMenuItemInputSchema = z.object({
    restaurantName: z.string().describe('The name of the restaurant.'),
    cuisine: z.string().describe('The cuisine of the restaurant.'),
    description: z.string().describe("A simple description of the dish provided by the user. This is the primary input."),
    nom: z.string().optional().describe("An optional name for the dish. If provided, the AI should refine it or use it as inspiration."),
    prix: z.number().optional().describe("An optional price for the dish. If provided, the AI should use it or adjust it slightly if it seems unrealistic."),
});

export const GenerateMenuItemOutputSchema = z.object({
    nom: z.string().describe('A creative and appealing name for the dish in French. If a name was provided in the input, refine or use it.'),
    description: z.string().describe('A delicious and enticing description of the dish in French, between 20 and 40 words, based on the user\'s simple description.'),
    prix: z.number().describe('A suggested price in West African CFA Franc (FCFA), should be a multiple of 50 or 100. If a price was provided, use or adjust it.'),
    categorie: z.enum(["Entrées", "Plats", "Desserts", "Boissons", "Autres"]).describe('The logical category of the dish.'),
    indiceImage: z.string().describe("A 2-word hint for an image for alt text and future AI tasks."),
});

const textGenerationPrompt = ai.definePrompt({
    name: 'generateMenuItemTextPrompt',
    input: { schema: GenerateMenuItemInputSchema },
    output: { schema: GenerateMenuItemOutputSchema },
    prompt: `You are an expert in West African and particularly Ivorian cuisine and marketing. Your task is to generate the details for a new menu item for a restaurant based on a user's input.

    Restaurant Name: {{{restaurantName}}}
    Cuisine: {{{cuisine}}}
    
    User Input:
    - Description (required): "{{{description}}}"
    {{#if nom}}- Name (optional): "{{{nom}}}"{{/if}}
    {{#if prix}}- Price (optional): "{{{prix}}} FCFA"{{/if}}

    Based on the information provided, please generate the following, adhering to these rules:
    1.  **Name:** 
        - If a name was provided, use it as the primary name or slightly refine it to be more appealing. Do not invent a completely new name.
        - If no name was provided, create an appealing, authentic-sounding French name for the dish based on the description.
    2.  **Description:** 
        - Create an enticing and delicious-sounding description in French, between 20 and 40 words. This should be based *only* on the user's input description.
    3.  **Price:** 
        - If a price was provided, use that price. If it seems completely unrealistic for the dish, you can adjust it slightly, but try to respect the user's input. The final price must be a multiple of 50 or 100.
        - If no price was provided, suggest a realistic price in West African CFA Francs (XOF). The price should be reasonable and a multiple of 50 or 100.
    4.  **Category:**
        - Identify the most appropriate category for the dish. Must be exactly one of: "Entrées", "Plats", "Desserts", "Boissons", or "Autres".
    5.  **Image Hint:** 
        - Create a 2-word hint for an image based on the generated dish name and description. This will be used for alt text and future AI tasks. For example, "Poulet Yassa" -> "grilled chicken".
    
    Return the result in JSON format.
    `,
});

export const generateMenuItemFlow = ai.defineFlow(
    {
        name: 'generateMenuItemFlow',
        inputSchema: GenerateMenuItemInputSchema,
        outputSchema: GenerateMenuItemOutputSchema,
    },
    async (input) => {
        const { output } = await textGenerationPrompt(input);
        if (!output) {
            throw new Error('Failed to generate menu item details.');
        }
        return output;
    }
);
