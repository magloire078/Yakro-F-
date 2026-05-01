
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
    try {
      const flowModule = await import('./definitions/personalized-recommendations');
      const flow = flowModule.personalizedRecommendationsFlow;
      
      if (typeof flow !== 'function') {
        console.error('personalizedRecommendationsFlow is not a function!', typeof flow);
        throw new Error('Flow is not a function');
      }
      
      return await flow(input);
    } catch (error) {
      console.error('Error in personalizedRecommendationsFlow server-side:', error);
      // Fallback to mock on server error to prevent 500
      return {
        recommendations: input.availableMenuItems.slice(0, 3).map(item => ({
          item: item.nom,
          description: item.description,
          restaurant: item.nomRestaurant,
          cuisine: item.cuisine
        }))
      };
    }
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
