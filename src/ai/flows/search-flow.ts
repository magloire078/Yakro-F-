
// Interface client-safe pour l'export statique
/**
 * @fileOverview Un wrapper client-safe pour la recherche intelligente.
 * Dans un export statique (ex: Capacitor), les flux Genkit ne peuvent pas s'exécuter directement.
 */

export interface IntelligentSearchInput {
  query: string;
}

export interface IntelligentSearchOutput {
  category: 'FOOD' | 'REAL_ESTATE' | 'VEHICLE' | 'SERVICES' | 'GENERAL';
  keywords: string[];
  cuisine?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  deliveryTime?: number;
  rating?: number;
  searchTerms: string[];
  intent: string; // Description de ce que l'utilisateur veut faire
}

export async function intelligentSearch(input: IntelligentSearchInput): Promise<IntelligentSearchOutput> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    const { intelligentSearchFlow } = await import('./definitions/search-flow');
    return intelligentSearchFlow(input);
  } else {
    console.warn('La recherche Genkit n\'est pas encore implémentée via API externe pour l\'export statique.');

    // Mock pour débloquer le build/dev avec le nouveau périmètre
    return {
      category: 'GENERAL',
      keywords: [input.query.substring(0, 10)],
      cuisine: [],
      searchTerms: [input.query],
      intent: `Recherche générale pour: ${input.query}`,
    };
  }
}
