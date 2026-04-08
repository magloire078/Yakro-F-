'use server';

import { generateReviews, type GenerateReviewsInput, type GenerateReviewsOutput } from '@/ai/flows/generate-reviews-flow';
import { generateAudioReview, type GenerateAudioReviewInput, type GenerateAudioReviewOutput } from '@/ai/flows/generate-audio-review-flow';
import { getPersonalizedRecommendations, type PersonalizedRecommendationsInput, type PersonalizedRecommendationsOutput } from '@/ai/flows/personalized-recommendations';
import { intelligentSearch, type IntelligentSearchInput, type IntelligentSearchOutput } from '@/ai/flows/search-flow';
import { generateMenuItem, type GenerateMenuItemInput, type GenerateMenuItemOutput } from '@/ai/flows/generate-menu-item-flow';
import { generateVideo, type GenerateVideoInput, type GenerateVideoOutput } from '@/ai/flows/generate-video-flow';

export async function generateReviewsAction(input: GenerateReviewsInput): Promise<{ success: true; data: GenerateReviewsOutput } | { success: false; error: string }> {
    try {
        const data = await generateReviews(input);
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message || "Erreur lors de la génération des avis." };
    }
}

export async function generateAudioReviewAction(input: GenerateAudioReviewInput): Promise<{ success: true; data: GenerateAudioReviewOutput } | { success: false; error: string }> {
    try {
        const data = await generateAudioReview(input);
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message || "Erreur lors de la génération de l'audio." };
    }
}

export async function getPersonalizedRecommendationsAction(input: PersonalizedRecommendationsInput): Promise<{ success: true; data: PersonalizedRecommendationsOutput } | { success: false; error: string }> {
    try {
        const data = await getPersonalizedRecommendations(input);
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message || "Erreur lors de la récupération des recommandations." };
    }
}

export async function intelligentSearchAction(input: IntelligentSearchInput): Promise<{ success: true; data: IntelligentSearchOutput } | { success: false; error: string }> {
    try {
        const data = await intelligentSearch(input);
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message || "Erreur lors de la recherche intelligente." };
    }
}

export async function generateMenuItemAction(input: GenerateMenuItemInput): Promise<{ success: true; data: GenerateMenuItemOutput } | { success: false; error: string }> {
    try {
        const data = await generateMenuItem(input);
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: e.message || "Erreur lors de la génération du plat." };
    }
}

export async function generateVideoAction(input: GenerateVideoInput): Promise<{ success: true; data: GenerateVideoOutput } | { success: false; error: string }> {
    try {
        const result = await generateVideo(input);
        return { success: true, data: result };
    } catch (error: any) {
        console.error('generateVideoAction error:', error);
        return { success: false, error: error?.message || 'Erreur inconnue lors de la génération vidéo.' };
    }
}
