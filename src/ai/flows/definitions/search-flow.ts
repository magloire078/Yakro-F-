
import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const IntelligentSearchInputSchema = z.object({
    query: z.string().describe('La requête de recherche de l\'utilisateur en langage naturel.'),
});

export const IntelligentSearchOutputSchema = z.object({
    category: z.enum(['FOOD', 'REAL_ESTATE', 'VEHICLE', 'SERVICES', 'GENERAL'])
        .describe('La catégorie de la recherche : FOOD (Alimentation/Restaurant), REAL_ESTATE (Immobilier/Logement), VEHICLE (Voiture/Transport), SERVICES (Ouvriers/Main d\'œuvre), GENERAL (Autre).'),
    keywords: z.array(z.string()).describe('Liste de mots-clés généraux (ex: "pas cher", "luxe", "urgent").'),
    cuisine: z.array(z.string()).optional().describe('Types de cuisine si catégorie FOOD.'),
    priceRange: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
    }).optional().describe('Fourchette de prix mentionnée.'),
    deliveryTime: z.number().optional().describe('Temps maximum de livraison ou d\'intervention en minutes.'),
    rating: z.number().optional().describe('Note minimale mentionnée.'),
    searchTerms: z.array(z.string()).describe('Termes spécifiques (plats, noms de quartiers, types de véhicules, types d\'ouvriers).'),
    intent: z.string().describe('Une description concise de l\'intention de l\'utilisateur en français.'),
});

const prompt = ai.definePrompt({
    name: 'intelligentSearchPrompt',
    input: { schema: IntelligentSearchInputSchema },
    output: { schema: IntelligentSearchOutputSchema },
    prompt: `Tu es un assistant de recherche intelligent pour une "Super App" urbaine. Ton rôle est d'analyser la requête de l'utilisateur et d'extraire des informations structurées pour diriger l'utilisateur vers le bon service.

Requête utilisateur : "{{{query}}}"

Analyse la requête et classe-la dans l'une des catégories suivantes :
- FOOD : Restaurants, livraison de repas, plats spécifiques.
- REAL_ESTATE : Location de maisons, appartements, résidences meublées, bureaux.
- VEHICLE : Location de voitures, motos, vélos, services de transport.
- SERVICES : Recherche d'ouvriers (plombier, électricien), aide à domicile, services professionnels.
- GENERAL : Tout ce qui ne rentre pas dans les catégories ci-dessus.

Extrais les informations suivantes :
- category : La catégorie identifiée (FOOD, REAL_ESTATE, VEHICLE, SERVICES, GENERAL).
- searchTerms : Les termes clés spécifiques (ex: "Foutou", "Studio à Angré", "Toyota RAV4", "Plombier qualifié").
- intent : Résume ce que l'utilisateur cherche à faire (ex: "Louer un véhicule pour le week-end").
- priceRange : Extrais les limites de prix si mentionnées.
- Keywords : Adjectifs ou conditions (ex: "meublé", "climatisé", "rapide").

Exemples :
"Je cherche un studio meublé à Yamoussoukro" -> category: REAL_ESTATE, searchTerms: ["studio", "Yamoussoukro"], keywords: ["meublé"].
"Besoin d'un électricien en urgence" -> category: SERVICES, searchTerms: ["électricien"], keywords: ["urgence"].
"Poulet braisé pas cher" -> category: FOOD, searchTerms: ["poulet braisé"], keywords: ["pas cher"].

Réponds au format JSON.
`,
});

export const intelligentSearchFlow = ai.defineFlow(
    {
        name: 'intelligentSearchFlow',
        inputSchema: IntelligentSearchInputSchema,
        outputSchema: IntelligentSearchOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
