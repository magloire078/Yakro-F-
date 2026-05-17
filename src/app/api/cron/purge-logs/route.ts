import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/firebase/admin';

/**
 * Cron route for automatic purge of audit logs older than 30 days.
 *
 * Now uses the Admin SDK (bypasses Firestore rules) since the new rules
 * restrict /audit_logs read/delete to SuperAdmin and there is no auth
 * context on a cron invocation. Endpoint protection is the
 * `CRON_SECRET` query-string token, which must be configured in App
 * Hosting / Vercel Cron headers.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    const expectedSecret = process.env.CRON_SECRET;
    if (!expectedSecret) {
        return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
    }
    if (secret !== expectedSecret) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoff = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

        const snapshot = await adminDb
            .collection('audit_logs')
            .where('timestamp', '<', cutoff)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({
                success: true,
                message: 'Aucun log à purger.',
            });
        }

        const docs = snapshot.docs;
        const batchSize = 500;
        let deletedCount = 0;

        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = adminDb.batch();
            const chunk = docs.slice(i, i + batchSize);
            chunk.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            deletedCount += chunk.length;
        }

        return NextResponse.json({
            success: true,
            deletedCount,
            message: `Purge effectuée avec succès : ${deletedCount} entrées supprimées.`,
        });
    } catch (error) {
        console.error('Erreur Cron Purge:', error);
        return NextResponse.json({
            error: 'Erreur interne',
            details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue',
        }, { status: 500 });
    }
}
