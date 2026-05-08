import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateReviewsInputSchema = z.object({
  restaurantName: z.string().describe('The name of the restaurant to generate reviews for.'),
  cuisine: z.string().describe('The cuisine of the restaurant.'),
  count: z.number().describe('The number of reviews to generate.'),
});

export const GenerateReviewsOutputSchema = z.object({
  reviews: z.array(
    z.object({
      nomUtilisateur: z.string().describe("The name of the user leaving the review. Should be a realistic African-sounding name."),
      note: z.number().min(1).max(5).describe('The star rating from 1 to 5.'),
      commentaire: z.string().describe('The review comment, between 20 and 50 words. Should be in French.'),
    })
  ),
});

const prompt = ai.definePrompt({
  name: 'generateReviewsPrompt',
  input: { schema: GenerateReviewsInputSchema },
  output: { schema: GenerateReviewsOutputSchema },
  prompt: `Tu es un expert de la culture et de la gastronomie ivoirienne. Génère une liste d'avis clients réalistes pour un restaurant.

Restaurant : {{{restaurantName}}}
Cuisine : {{{cuisine}}}
Nombre d'avis à générer : {{{count}}}

Règles impératives :
1. **Prénoms/Noms** : Utilise des noms authentiquement ivoiriens issus des principales ethnies — Akan (Kouamé, Aya, Affoué, Koffi, Adjoa), Dioula (Seydou, Mariam, Mamadou, Fatoumata), Bété (Gondo, Kpan), Senoufo (Soro, Coulibaly). Mélange prénom africain + nom de famille.
2. **Notes** : Varie entre 3 et 5 étoiles avec une majorité de 4-5 étoiles, mais inclure 1 ou 2 avis moins enthousiastes (3 étoiles) pour plus de crédibilité.
3. **Style des commentaires** : Court et direct, comme on écrit vraiment sur une app. Mentionne un plat spécifique, la rapidité de service, ou une comparaison avec d'autres maquis ou restaurants connus d'Abidjan. Inclure parfois des expressions locales (ex: "C'est bon comme maquis !", "Le service est un peu lent hein", "Le Garba valait le détour").
4. **Longueur** : Entre 15 et 45 mots par commentaire, pas plus.
5. **Langue** : Français ivoirien naturel, pas de français soutenu ou académique.
`,
});

export const generateReviewsFlow = ai.defineFlow(
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
