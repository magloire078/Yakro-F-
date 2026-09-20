/**
 * @fileOverview L'Assistant YakroFe : un conseiller gourmand conversationnel
 * qui comprend une demande en langage naturel ("J'ai 2500 FCFA et je suis à
 * Dioulakro") et suggère des plats réellement disponibles au catalogue,
 * avec leur id réel plutôt qu'un simple nom (pour éviter tout rattachement
 * fragile côté client).
 *
 * - assistantChatFlow - Le flow Genkit.
 * - AssistantChatInput / AssistantChatOutput - Types exportés.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const AssistantMenuItemSchema = z.object({
  id: z.string(),
  nom: z.string(),
  description: z.string(),
  prix: z.number(),
  restaurantId: z.string(),
  nomRestaurant: z.string(),
  cuisine: z.string(),
  tempsDeLivraison: z.number(),
  fraisDeLivraison: z.number(),
  adresseRestaurant: z.string().optional(),
});

export const ConversationTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const AssistantChatInputSchema = z.object({
  message: z.string().describe("Le dernier message du client, en français."),
  conversationHistory: z.array(ConversationTurnSchema).default([])
    .describe('Les échanges précédents de la conversation, du plus ancien au plus récent.'),
  availableMenuItems: z.array(AssistantMenuItemSchema)
    .describe('Le catalogue de plats réellement disponibles, avec leur id, prix, restaurant et délai.'),
  userLocation: z.string().optional()
    .describe("Adresse par défaut du client, si connue — un indice, pas une contrainte stricte."),
});
export type AssistantChatInput = z.infer<typeof AssistantChatInputSchema>;

export const AssistantSuggestionSchema = z.object({
  menuItemId: z.string().describe('id exact tiré de availableMenuItems — jamais inventé.'),
  restaurantId: z.string().describe('restaurantId correspondant, tiré de availableMenuItems.'),
  raison: z.string().describe('Une phrase courte expliquant pourquoi ce plat correspond (budget, délai, quartier...).'),
});

export const AssistantChatOutputSchema = z.object({
  reply: z.string().describe("La réponse chaleureuse et concise de l'assistant, en français."),
  suggestions: z.array(AssistantSuggestionSchema).max(3).default([])
    .describe('0 à 3 suggestions, vide si rien ne correspond vraiment à la demande.'),
});
export type AssistantChatOutput = z.infer<typeof AssistantChatOutputSchema>;

const prompt = ai.definePrompt({
  name: 'assistantChatPrompt',
  input: { schema: AssistantChatInputSchema },
  output: { schema: AssistantChatOutputSchema },
  prompt: `Tu es l'Assistant YakroFe, un conseiller gourmand local à Yamoussoukro (Côte d'Ivoire). Tu parles un français chaleureux et direct, jamais robotique.

Ta mission : comprendre la demande du client (budget, quartier, envie, délai) et proposer UNIQUEMENT des plats tirés de la liste "Catalogue disponible" ci-dessous — jamais un plat inventé. Utilise l'id exact du plat et le restaurantId exact.

Règles :
- Si un budget est mentionné, ne propose que des plats dont le prix (éventuellement + frais de livraison) rentre dans ce budget.
- Si un quartier est mentionné, privilégie les restaurants dont l'adresse le mentionne ; sinon base-toi sur le délai de livraison (tempsDeLivraison) le plus court.
- Si rien ne correspond exactement (budget trop bas, quartier non couvert), dis-le honnêtement dans "reply" et propose plutôt l'option la moins chère ou la plus proche disponible, en expliquant le compromis.
- Ne propose jamais plus de 3 plats.
- "reply" doit rester court (2-4 phrases), jamais une liste à puces — les suggestions structurées vont dans "suggestions", pas dans le texte.

{{#if userLocation}}Adresse par défaut du client (indice, pas une contrainte) : {{userLocation}}{{/if}}

Historique de la conversation :
{{#each conversationHistory}}
{{this.role}}: {{this.content}}
{{/each}}

Catalogue disponible :
{{#each availableMenuItems}}
- id: {{this.id}} | {{this.nom}} ({{this.description}}) — {{this.prix}} FCFA — {{this.nomRestaurant}} ({{this.cuisine}}), livraison {{this.tempsDeLivraison}} min, frais {{this.fraisDeLivraison}} FCFA{{#if this.adresseRestaurant}}, adresse: {{this.adresseRestaurant}}{{/if}} — restaurantId: {{this.restaurantId}}
{{/each}}

Message du client : {{message}}

Réponds uniquement avec le JSON demandé.`,
});

export const assistantChatFlow = ai.defineFlow(
  {
    name: 'assistantChatFlow',
    inputSchema: AssistantChatInputSchema,
    outputSchema: AssistantChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
