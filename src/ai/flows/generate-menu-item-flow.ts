
// Client-safe interface for static export
/**
 * @fileOverview A client-safe wrapper for generating a new menu item.
 * In a static export (e.g. Capacitor), Genkit flows cannot run directly.
 * This file provides the same interface but prevents server-only modules from being bundled.
 */

export interface GenerateMenuItemInput {
    restaurantName: string;
    cuisine: string;
    description: string;
    nom?: string;
    prix?: number;
}

export interface GenerateMenuItemOutput {
    nom: string;
    description: string;
    prix: number;
    categorie: string;
    indiceImage: string;
}

export async function generateMenuItem(input: GenerateMenuItemInput): Promise<GenerateMenuItemOutput> {
    const isServer = typeof window === 'undefined';

    if (isServer) {
        try {
            // Dynamic import to avoid bundling on client
            const flowModule = await import('./definitions/generate-menu-item-flow');
            return await flowModule.generateMenuItemFlow(input);
        } catch (error) {
            console.error('Error in generateMenuItemFlow server-side:', error);
            // Fallback to mock on server error
            return {
                nom: `Plat suggéré (${input.cuisine})`,
                description: `Une délicieuse création inspirée par: ${input.description}`,
                prix: input.prix || 3500,
                categorie: "Plats",
                indiceImage: "gastronomie"
            };
        }
    } else {
        // On client (Capacitor/Static Export), we should call an external API.
        // For now, we return a mock or throw an error with instructions.
        console.warn('Genkit flows are not yet implemented as external API calls for static export.');

        // Mocking for unblocking build/dev
        return {
            nom: `Plat: ${input.description.substring(0, 20)}...`,
            description: `Une version raffinée de: ${input.description}. (Généré en mode statique)`,
            prix: input.prix || 2500,
            categorie: "Plats",
            indiceImage: "cuisine locale"
        };
    }
}
