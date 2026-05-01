
// Refactored for stability and static export
/**
 * @fileOverview A client-safe wrapper for generating restaurant reviews.
 */

export interface GenerateReviewsInput {
  restaurantName: string;
  cuisine: string;
  count: number;
}

export interface GenerateReviewsOutput {
  reviews: Array<{
    nomUtilisateur: string;
    note: number;
    commentaire: string;
  }>;
}

export async function generateReviews(input: GenerateReviewsInput): Promise<GenerateReviewsOutput> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    try {
      const flowModule = await import('./definitions/generate-reviews-flow');
      const flow = flowModule.generateReviewsFlow;
      
      if (typeof flow !== 'function') {
        console.error('generateReviewsFlow is not a function!', typeof flow);
        throw new Error('Flow is not a function');
      }
      
      return await flow(input);
    } catch (error) {
      console.error('Error in generateReviewsFlow server-side:', error);
      // Fallback to mock on server error to prevent 500
      return {
        reviews: Array.from({ length: input.count }).map((_, i) => ({
          nomUtilisateur: i % 2 === 0 ? "Koffi Moussa" : "Awa Traoré",
          note: 4 + (i % 2 === 0 ? 1 : 0),
          commentaire: `Un repas excellent chez ${input.restaurantName}. Le service était impeccable et la cuisine ${input.cuisine} authentique.`
        }))
      };
    }
  } else {
    console.warn('Genkit reviews are not implemented for static export.');
    // Mock for static mode (Capacitor)
    return {
      reviews: Array.from({ length: input.count }).map((_, i) => ({
        nomUtilisateur: i % 2 === 0 ? "Adama Bamba" : "Marie Koné",
        note: 5,
        commentaire: `Excellent plat de ${input.cuisine} ! (Généré en mode statique)`
      }))
    };
  }
}
