
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const MenuItemSchema = z.object({
    id: z.string(),
    nom: z.string(),
    description: z.string(),
    prix: z.number(),
    nomRestaurant: z.string(),
    cuisine: z.string(),
});

export const PersonalizedRecommendationsInputSchema = z.object({
    userHistory: z.string().describe('A summary of the user\'s order history and preferences.'),
    availableMenuItems: z.array(MenuItemSchema).describe('A list of all available menu items to choose from for recommendations.'),
    currentLocation: z.string().describe('The current location of the user.'),
    timeOfDay: z.string().describe('The time of day.'),
});

export const PersonalizedRecommendationsOutputSchema = z.object({
    recommendations: z.array(
        z.object({
            item: z.string().describe('The name of the recommended item.'),
            description: z.string().describe('A short description of the item, taken from the available menu items.'),
            restaurant: z.string().describe('The name of the restaurant offering the item.'),
            cuisine: z.string().describe('The type of cuisine.'),
        })
    ).describe('A list of personalized recommendations.'),
});

const prompt = ai.definePrompt({
    name: 'personalizedRecommendationsPrompt',
    input: { schema: PersonalizedRecommendationsInputSchema },
    output: { schema: PersonalizedRecommendationsOutputSchema },
    prompt: `Tu es un assistant de recommandations culinaires pour Yakro Fê, une super-app de livraison de repas en Côte d'Ivoire.

Ta mission : recommander des plats pertinents EXCLUSIVEMENT à partir de la liste fournie. Ne jamais inventer de plats ou de restaurants.

Contexte utilisateur :
- Historique de commandes : {{{userHistory}}}
- Localisation actuelle : {{{currentLocation}}}
- Moment de la journée : {{{timeOfDay}}}

Règles de recommandation :
1. **Cohérence horaire** : Le matin → privilégier café, pain, attiéké léger. Midi → plats chauds complets (Foutou, Riz gras, Placali). Soir → plats de partage ou grillades. Nuit → plats rapides.
2. **Diversité** : Ne pas recommander deux fois le même restaurant.
3. **Pertinence locale** : Si l'utilisateur est dans un quartier populaire (Yopougon, Abobo), favoriser les plats locaux abordables. Si Cocody ou Plateau, inclure des options plus variées.
4. **Historique** : Si l'historique mentionne des plats, recommander des variantes ou des compléments, pas exactement les mêmes.
5. **Sélection** : Choisis 3 à 5 plats diversifiés de la liste ci-dessous.

Liste des plats disponibles :
{{#each availableMenuItems}}
- Plat : {{nom}} | Restaurant : {{nomRestaurant}} | Cuisine : {{cuisine}} | Prix : {{prix}} FCFA
  Description : {{description}}
{{/each}}

Retourne les recommandations en JSON avec le nom du plat, sa description originale, le restaurant et la cuisine.
  `
});

export const personalizedRecommendationsFlow = ai.defineFlow(
    {
        name: 'personalizedRecommendationsFlow',
        inputSchema: PersonalizedRecommendationsInputSchema,
        outputSchema: PersonalizedRecommendationsOutputSchema,
    },
    async input => {
        const { output } = await prompt(input);
        return output!;
    }
);
