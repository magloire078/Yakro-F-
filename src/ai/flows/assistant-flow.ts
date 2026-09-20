
// Client-safe interface for static export
/**
 * @fileOverview A client-safe wrapper for the conversational YakroFe
 * assistant.
 */

export interface AssistantMenuItem {
  id: string;
  nom: string;
  description: string;
  prix: number;
  restaurantId: string;
  nomRestaurant: string;
  cuisine: string;
  tempsDeLivraison: number;
  fraisDeLivraison: number;
  adresseRestaurant?: string;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatInput {
  message: string;
  conversationHistory: ConversationTurn[];
  availableMenuItems: AssistantMenuItem[];
  userLocation?: string;
}

export interface AssistantSuggestion {
  menuItemId: string;
  restaurantId: string;
  raison: string;
}

export interface AssistantChatOutput {
  reply: string;
  suggestions: AssistantSuggestion[];
}

const FALLBACK_REPLY = "Je ne suis pas encore disponible dans cette version de l'application. Utilisez la recherche pour trouver votre plat.";

function fallbackOutput(input: AssistantChatInput): AssistantChatOutput {
  return {
    reply: FALLBACK_REPLY,
    suggestions: input.availableMenuItems.slice(0, 2).map(item => ({
      menuItemId: item.id,
      restaurantId: item.restaurantId,
      raison: 'Suggestion par défaut',
    })),
  };
}

export async function chatWithAssistant(input: AssistantChatInput): Promise<AssistantChatOutput> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    try {
      const flowModule = await import('./definitions/assistant-flow');
      const flow = flowModule.assistantChatFlow;

      if (typeof flow !== 'function') {
        console.error('assistantChatFlow is not a function!', typeof flow);
        throw new Error('Flow is not a function');
      }

      return await flow(input);
    } catch (error) {
      console.error('Error in assistantChatFlow server-side:', error);
      return fallbackOutput(input);
    }
  } else {
    console.warn('YakroFe assistant is not implemented as an external API call for static export.');
    return fallbackOutput(input);
  }
}
