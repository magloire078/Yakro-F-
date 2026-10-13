'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/firebase/admin';
import { aiQuotaExceededMessage, isWithinAiQuota, quotaDay, quotaDocId, type AiQuotaBucket, type AiQuotaUsage } from '@/lib/ai-quota';
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
// utilisateur connecté et respecte un quota quotidien (lib/ai-quota) ; la
// création de contenu (plats, images) est réservée aux restaurateurs et aux
// SuperAdmin.
type Audience = 'user' | 'creator';

const AI_LOGIN_REQUIRED = 'Connectez-vous pour utiliser les fonctions IA de Yakro Fê.';

interface AccessPolicy {
    audience: Audience;
    /** Quota quotidien décompté par cet appel. */
    bucket: AiQuotaBucket;
}

async function authorize(idToken: string | undefined, { audience, bucket }: AccessPolicy): Promise<string | null> {
    if (!idToken) return AI_LOGIN_REQUIRED;
    let uid: string;
    try {
        uid = (await getAdminAuth().verifyIdToken(idToken)).uid;
    } catch {
        return AI_LOGIN_REQUIRED;
    }

    const db = getAdminDb();
    const profile = (await db.collection('utilisateurs').doc(uid).get()).data();
    const isSuperAdmin = profile?.roleSysteme === 'SuperAdmin';
    if (audience === 'creator' && profile?.role !== 'restaurateur' && !isSuperAdmin) {
        return 'Fonction réservée aux restaurateurs.';
    }
    if (isSuperAdmin) return null;

    // Décompte avant l'appel IA (un appel qui échoue a quand même coûté), en
    // transaction pour que des requêtes simultanées ne dépassent pas la limite.
    const now = new Date();
    const quotaRef = db.collection('ai_quotas').doc(quotaDocId(uid, now));
    return db.runTransaction(async (tx) => {
        const usage = (await tx.get(quotaRef)).data() as AiQuotaUsage | undefined;
        if (!isWithinAiQuota(usage, bucket)) return aiQuotaExceededMessage(bucket);
        tx.set(quotaRef, {
            uid,
            day: quotaDay(now),
            [bucket]: FieldValue.increment(1),
            // Permet une politique TTL Firestore pour purger les vieux compteurs.
            expireAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        }, { merge: true });
        return null;
    });
}

async function run<T>(idToken: string | undefined, policy: AccessPolicy, task: () => Promise<T>, fallbackError: string): Promise<ActionResult<T>> {
    const denied = await authorize(idToken, policy);
    if (denied) return { success: false, error: denied };
    try {
        return { success: true, data: await task() };
    } catch (error: unknown) {
        console.error(fallbackError, error);
        return { success: false, error: error instanceof Error ? error.message : fallbackError };
    }
}

const USER_TEXT: AccessPolicy = { audience: 'user', bucket: 'text' };
const USER_MEDIA: AccessPolicy = { audience: 'user', bucket: 'media' };
const CREATOR_TEXT: AccessPolicy = { audience: 'creator', bucket: 'text' };
const CREATOR_MEDIA: AccessPolicy = { audience: 'creator', bucket: 'media' };

export async function generateReviewsAction(input: GenerateReviewsInput, idToken: string): Promise<ActionResult<GenerateReviewsOutput>> {
    return run(idToken, USER_TEXT, () => generateReviews(input), 'Erreur lors de la génération des avis.');
}

export async function generateAudioReviewAction(input: GenerateAudioReviewInput, idToken: string): Promise<ActionResult<GenerateAudioReviewOutput>> {
    return run(idToken, USER_MEDIA, () => generateAudioReview(input), "Erreur lors de la génération de l'audio.");
}

export async function getPersonalizedRecommendationsAction(input: PersonalizedRecommendationsInput, idToken: string): Promise<ActionResult<PersonalizedRecommendationsOutput>> {
    return run(idToken, USER_TEXT, () => getPersonalizedRecommendations(input), 'Erreur lors de la récupération des recommandations.');
}

export async function intelligentSearchAction(input: IntelligentSearchInput, idToken: string): Promise<ActionResult<IntelligentSearchOutput>> {
    return run(idToken, USER_TEXT, () => intelligentSearch(input), 'Erreur lors de la recherche intelligente.');
}

export async function assistantChatAction(input: AssistantChatInput, idToken: string): Promise<ActionResult<AssistantChatOutput>> {
    return run(idToken, USER_TEXT, () => chatWithAssistant(input), "Erreur lors de l'échange avec l'assistant.");
}

export async function generateMenuItemAction(input: GenerateMenuItemInput, idToken: string): Promise<ActionResult<GenerateMenuItemOutput>> {
    return run(idToken, CREATOR_TEXT, () => generateMenuItem(input), 'Erreur lors de la génération du plat.');
}

export async function generateImageAction(input: GenerateImageInput, idToken: string): Promise<ActionResult<GenerateImageOutput>> {
    return run(idToken, CREATOR_MEDIA, async () => {
        const data = await generateImage(input);
        if (!data.imageDataUri) throw new Error("L'IA n'a pas pu générer d'image.");
        return data;
    }, "Erreur lors de la génération de l'image.");
}
