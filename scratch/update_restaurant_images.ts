import { adminDb } from '../src/firebase/admin';
import { generateImage } from '../src/ai/flows/generate-image-flow';
import * as dotenv from 'dotenv';

dotenv.config();

async function updateRestaurantImages() {
  console.log('Starting restaurant image audit...');
  
  const restaurantsSnapshot = await adminDb.collection('restaurants').get();
  
  if (restaurantsSnapshot.empty) {
    console.log('No restaurants found.');
    return;
  }

  for (const doc of restaurantsSnapshot.docs) {
    const data = doc.data();
    const restaurantId = doc.id;
    
    // Check if image is missing or is a placeholder/empty
    const hasImage = data.image && data.image !== '' && !data.image.includes('placeholder');
    
    if (!hasImage) {
      console.log(`Updating image for restaurant: ${data.nom} (${restaurantId})`);
      
      const prompt = data.indiceImage || `${data.cuisine} restaurant ${data.nom}`;
      
      try {
        console.log(`Generating image with prompt: "${prompt}"...`);
        const result = await generateImage({ prompt });
        
        if (result.imageDataUri) {
          await adminDb.collection('restaurants').doc(restaurantId).update({
            image: result.imageDataUri
          });
          console.log(`Successfully updated image for ${data.nom}`);
        } else {
          console.error(`Failed to generate image for ${data.nom}: No URL returned`);
        }
      } catch (error) {
        console.error(`Error processing ${data.nom}:`, error);
      }
    } else {
      console.log(`Restaurant ${data.nom} already has a valid image: ${data.image.substring(0, 50)}...`);
    }
  }
  
  console.log('Audit complete.');
  process.exit(0);
}

updateRestaurantImages().catch((err) => {
    console.error('Fatal error in script:', err);
    process.exit(1);
});
