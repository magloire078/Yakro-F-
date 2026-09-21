
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
    prompt: `Tu es un assistant de recherche intelligent pour "Yakro Fê", une Super App dédiée à la Côte d'Ivoire. Ton rôle est d'analyser la requête de l'utilisateur et d'extraire des informations structurées pour diriger l'utilisateur vers le bon service.

Requête utilisateur : "{{{query}}}"

Analyse la requête et classe-la dans l'une des catégories suivantes :
- FOOD : Restaurants, livraison de repas, plats spécifiques (ex: Garba, Foutou, Alloco, Kedjenou, Placali).
- REAL_ESTATE : Location de maisons, appartements à Cocody, Angré, Riviera, résidences meublées, bureaux.
- VEHICLE : Location de voitures (VTC, personnel), motos, services de transport interurbain.
- SERVICES : Recherche d'ouvriers (plombier, électricien "courant-fort", maçon), aide à domicile, services de beauté.
- GENERAL : Tout ce qui ne rentre pas dans les catégories ci-dessus.

Extrais les informations suivantes :
- category : La catégorie identifiée (FOOD, REAL_ESTATE, VEHICLE, SERVICES, GENERAL).
- searchTerms : Les termes clés spécifiques (ex: "Foutou graine", "Studio à Marcory", "Location 4x4", "Main d'œuvre").
- intent : Résume ce que l'utilisateur cherche à faire de manière naturelle (ex: "Manger un plat local ivoirien", "Se loger dans un quartier sécurisé").
- priceRange : Extrais les limites de prix (en FCFA ou devises mentionnées).
- Keywords : Adjectifs, conditions ou localisations précises (ex: "climatisé", "proche du goudron", "rapide", "Yopougon", "Plateau").

Exemples de nuances locales :
"Je cherche un studio meublé à Angré Terminus 81" -> category: REAL_ESTATE, searchTerms: ["studio", "Angré"], keywords: ["meublé", "Terminus 81"].
"Où manger un bon Garba à Cocody ?" -> category: FOOD, searchTerms: ["Garba"], keywords: ["Cocody", "bon"].
"Besoin d'un électricien à Attoban" -> category: SERVICES, searchTerms: ["électricien"], keywords: ["Attoban"].
"Location de Prado pour mariage" -> category: VEHICLE, searchTerms: ["Prado"], keywords: ["mariage"].

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
