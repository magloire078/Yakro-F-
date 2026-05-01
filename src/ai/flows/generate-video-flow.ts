
// Refactored for stability and static export
/**
 * @fileOverview A client-safe wrapper for generating a promotional video for a restaurant.
 */

export interface GenerateVideoInput {
  restaurantName: string;
  cuisine: string;
  imageUrl: string | null;
}

export interface GenerateVideoOutput {
  videoUrl: string;
}

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    try {
      const flowModule = await import('./definitions/generate-video-flow');
      const executor = flowModule.generateVideoExecutor;
      
      if (typeof executor !== 'function') {
        throw new Error('Executor is not a function');
      }
      
      return await executor(input);
    } catch (error) {
      console.error('Error in generateVideoFlow server-side:', error);
      // Fallback: return an empty string or a placeholder if video generation fails
      // Given video is heavy, we just return empty string to indicate failure
      return {
        videoUrl: ""
      };
    }
  } else {
    console.warn('Genkit video generation is not implemented for static export.');
    return {
      videoUrl: ""
    };
  }
}
