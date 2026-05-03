import 'dotenv/config';
import { adminDb } from '../src/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

async function createOldLogs() {
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

    for (let i = 0; i < 5; i++) {
        await adminDb.collection('audit_logs').add({
            adminId: 'test-admin',
            adminEmail: 'test@example.com',
            action: 'TEST_PURGE',
            targetId: 'TEST',
            details: `Log de test ${i}`,
            timestamp: Timestamp.fromDate(thirtyOneDaysAgo)
        });
        console.log(`Log ${i} créé`);
    }
}

createOldLogs().catch(console.error);
