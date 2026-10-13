'use server';

import { getAdminAuth, getAdminDb } from '@/firebase/admin';
import { generateReviews, type GenerateReviewsInput, type GenerateReviewsOutput } from '@/ai/flows/generate-reviews-flow';
import { generateAudioReview, type GenerateAudioReviewInput, type GenerateAudioReviewOutput } from '@/ai/flows/generate-audio-review-flow';
import { getPersonalizedRecommendations, type PersonalizedRecommendationsInput, type PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { intelligentSearch, type IntelligentSearchInput, type IntelligentSearchOutput } from '@/ai/flows/search-flow';
import { generateMenuItem, type GenerateMenuItemInput, type GenerateMenuItemOutput } from '@/ai/flows/generate-menu-item-flow';
import { generateImage, type GenerateImageInput, type GenerateImageOutput } from '@/ai/flows/generate-image-flow';
import { chatWithAssistant, type AssistantChatInput, type AssistantChatOutput } from '@/ai/flows/assistant-flow';

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

// Les actions serveur sont des points d'accès publics : sans contrôle,
// n'importe qui pouvait déclencher des générations IA (texte, image, audio)
// facturées sur le compte Google du projet. Chaque action exige donc un
// utilisateur connecté, et la création de contenu (plats, images) est
// réservée aux restaurateurs et aux SuperAdmin.
type Audience = 'user' | 'creator';

const AI_LOGIN_REQUIRED = 'Connectez-vous pour utiliser les fonctions IA de Yakro Fê.';

async function authorize(idToken: string | undefined, audience: Audience): Promise<string | null> {
    if (!idToken) return AI_LOGIN_REQUIRED;
    let uid: string;
    try {
        uid = (await getAdminAuth().verifyIdToken(idToken)).uid;
    } catch {
        return AI_LOGIN_REQUIRED;
    }
    if (audience === 'creator') {
        const profile = (await getAdminDb().collection('utilisateurs').doc(uid).get()).data();
        if (profile?.role !== 'restaurateur' && profile?.roleSysteme !== 'SuperAdmin') {
            return 'Fonction réservée aux restaurateurs.';
        }
    }
    return null;
}

async function run<T>(idToken: string | undefined, audience: Audience, task: () => Promise<T>, fallbackError: string): Promise<ActionResult<T>> {
    const denied = await authorize(idToken, audience);
    if (denied) return { success: false, error: denied };
    try {
        return { success: true, data: await task() };
    } catch (error: unknown) {
        console.error(fallbackError, error);
        return { success: false, error: error instanceof Error ? error.message : fallbackError };
    }
}

export async function generateReviewsAction(input: GenerateReviewsInput, idToken: string): Promise<ActionResult<GenerateReviewsOutput>> {
    return run(idToken, 'user', () => generateReviews(input), 'Erreur lors de la génération des avis.');
}

export async function generateAudioReviewAction(input: GenerateAudioReviewInput, idToken: string): Promise<ActionResult<GenerateAudioReviewOutput>> {
    return run(idToken, 'user', () => generateAudioReview(input), "Erreur lors de la génération de l'audio.");
}

export async function getPersonalizedRecommendationsAction(input: PersonalizedRecommendationsInput, idToken: string): Promise<ActionResult<PersonalizedRecommendationsOutput>> {
    return run(idToken, 'user', () => getPersonalizedRecommendations(input), 'Erreur lors de la récupération des recommandations.');
}

export async function intelligentSearchAction(input: IntelligentSearchInput, idToken: string): Promise<ActionResult<IntelligentSearchOutput>> {
    return run(idToken, 'user', () => intelligentSearch(input), 'Erreur lors de la recherche intelligente.');
}

export async function assistantChatAction(input: AssistantChatInput, idToken: string): Promise<ActionResult<AssistantChatOutput>> {
    return run(idToken, 'user', () => chatWithAssistant(input), "Erreur lors de l'échange avec l'assistant.");
}

export async function generateMenuItemAction(input: GenerateMenuItemInput, idToken: string): Promise<ActionResult<GenerateMenuItemOutput>> {
    return run(idToken, 'creator', () => generateMenuItem(input), 'Erreur lors de la génération du plat.');
}

export async function generateImageAction(input: GenerateImageInput, idToken: string): Promise<ActionResult<GenerateImageOutput>> {
    return run(idToken, 'creator', async () => {
        const data = await generateImage(input);
        if (!data.imageDataUri) throw new Error("L'IA n'a pas pu générer d'image.");
        return data;
    }, "Erreur lors de la génération de l'image.");
}
