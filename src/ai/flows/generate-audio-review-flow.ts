
// Refactored for stability and static export
/**
 * @fileOverview A client-safe wrapper for generating audio narration from restaurant reviews.
 */

export interface GenerateAudioReviewInput {
    reviews: Array<{
        nomUtilisateur: string;
        note: number;
        commentaire: string;
    }>;
}

export interface GenerateAudioReviewOutput {
    audioDataUri: string;
}

export async function generateAudioReview(input: GenerateAudioReviewInput): Promise<GenerateAudioReviewOutput> {
    const isServer = typeof window === 'undefined';

    if (isServer) {
        try {
            const flowModule = await import('./definitions/generate-audio-review-flow');
            const flow = flowModule.generateAudioReviewFlow;
            
            if (typeof flow !== 'function') {
                throw new Error('Flow is not a function');
            }
            
            return await flow(input);
        } catch (error) {
            console.error('Error in generateAudioReviewFlow server-side:', error);
            // Fallback to empty string on server error to prevent 500
            return {
                audioDataUri: "" 
            };
        }
    } else {
        console.warn('Genkit audio generation is not available in static mode.');
        return {
            audioDataUri: ""
        };
    }
}
