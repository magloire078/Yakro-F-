
import { getPersonalizedRecommendations } from './src/ai/flows/personalized-recommendations.js';

async function test() {
    try {
        console.log("Testing flows...");
        const result = await getPersonalizedRecommendations({
            userHistory: "test",
            availableMenuItems: [],
            currentLocation: "test",
            timeOfDay: "test"
        });
        console.log("Result:", result);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
