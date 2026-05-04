
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBl9KMx5EuvhN71R81bNRqXuQhVdNKPGdc",
  authDomain: "yakro-go.firebaseapp.com",
  projectId: "yakro-go",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findRestaurant() {
  // Note: listing collections is only possible in Node.js Admin SDK, 
  // but we are using the Client SDK in the scratch script.
  // Actually, let's try to query some common names.
  const collections = ['restaurants', 'plats', 'commandes', 'users', 'stocks', 'profiles'];
  for (const name of collections) {
    const snap = await getDocs(collection(db, name));
    console.log(`Collection "${name}": ${snap.size} documents`);

    if (name === 'restaurants') {
      snap.forEach(doc => {
        console.log('Restaurant Found:', {
          id: doc.id,
          nom: doc.data().nom,
          image: doc.data().image,
          indiceImage: doc.data().indiceImage,
          description: doc.data().description
        });
      });
    }
  }
}

findRestaurant().catch(console.error);
