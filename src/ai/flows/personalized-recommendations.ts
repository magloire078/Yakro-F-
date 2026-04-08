
// Client-safe interface for static export
/**
 * @fileOverview A client-safe wrapper for personalized recommendations.
 */

export interface MenuItem {
  id: string;
  nom: string;
  description: string;
  prix: number;
  nomRestaurant: string;
  cuisine: string;
}

export interface PersonalizedRecommendationsInput {
  userHistory: string;
  availableMenuItems: MenuItem[];
  currentLocation: string;
  timeOfDay: string;
}

export interface PersonalizedRecommendationsOutput {
  recommendations: Array<{
    item: string;
    description: string;
    restaurant: string;
    cuisine: string;
  }>;
}

export async function getPersonalizedRecommendations(input: PersonalizedRecommendationsInput): Promise<PersonalizedRecommendationsOutput> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    const { personalizedRecommendationsFlow } = await import('./definitions/personalized-recommendations');
    return personalizedRecommendationsFlow(input);
  } else {
    console.warn('Genkit recommendations are not implemented as external API calls for static export.');

    // Mock recommendations for static mode
    return {
      recommendations: input.availableMenuItems.slice(0, 3).map(item => ({
        item: item.nom,
        description: item.description,
        restaurant: item.nomRestaurant,
        cuisine: item.cuisine
      }))
    };
  }
}
