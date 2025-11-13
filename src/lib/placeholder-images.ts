
// A simple map of keywords to image IDs for picsum.photos
// This ensures that the same keyword always returns the same image.
const imageKeywordMap: Record<string, number> = {
    'maquis': 1, 'restaurant': 2, 'african': 3, 'french': 4, 'bistro': 5, 
    'fine': 6, 'dining': 7, 'pizza': 8, 'oven': 9, 'italy': 10, 'grilled': 11,
    'chicken': 12, 'barbecue': 13, 'pastries': 14, 'cakes': 15, 'braised': 16,
    'ivorian': 17, 'fish': 18, 'food': 19, 'beef': 20, 'fillet': 21, 'pepper': 22,
    'sauce': 23, 'nicoise': 24, 'salad': 25, 'gourmet': 26, 'regina': 27, 
    'classic': 28, 'four': 29, 'seasons': 30, 'skewers': 31, 'lamb': 32,
    'diby': 33, 'lemon': 34, 'tart': 35, 'meringue': 36, 'mille-feuille': 37, 'pastry': 38,
};

// Function to generate a unique seed from keywords
function getSeedFromKeywords(keywords: string = ''): number {
    if (!keywords) return 1000;
    const words = keywords.split(' ');
    let seed = 0;
    words.forEach(word => {
        seed += imageKeywordMap[word] || 0;
    });
    return seed > 0 ? seed : 1000;
}

// Generates a placeholder image URL
export function getPlaceholderImage(keywords: string | undefined, width: number = 400, height: number = 300): string {
    const seed = getSeedFromKeywords(keywords || '');
    return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}
