
const fs = require('fs');
const dotenv = require('dotenv');

try {
    const envConfig = dotenv.parse(fs.readFileSync('.env'));
    console.log('NEXT_PUBLIC_FIREBASE_API_KEY from .env:', envConfig.NEXT_PUBLIC_FIREBASE_API_KEY);
    console.log('Type of value:', typeof envConfig.NEXT_PUBLIC_FIREBASE_API_KEY);
} catch (e) {
    console.error('Error reading .env:', e);
}
