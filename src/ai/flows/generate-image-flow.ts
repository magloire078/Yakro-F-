
// Refactored for stability and static export
/**
 * @fileOverview A client-safe wrapper for generating an image from a text prompt.
 */

export interface GenerateImageInput {
  prompt: string;
}

export interface GenerateImageOutput {
  imageDataUri: string;
}

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    try {
      const flowModule = await import('./definitions/generate-image-flow');
      const flow = flowModule.generateImageFlow;
      
      if (typeof flow !== 'function') {
        throw new Error('Flow is not a function');
      }
      
      return await flow(input);
    } catch (error) {
      console.error('Error in generateImageFlow server-side:', error);
      // Fallback: return empty image data to prevent crash
      return {
        imageDataUri: ""
      };
    }
  } else {
    console.warn('Genkit image generation is not implemented for static export.');
    return {
      imageDataUri: ""
    };
  }
}
