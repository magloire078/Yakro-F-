import { NextResponse } from 'next/server';
import { db } from '@/firebase/client';
import { collection, query, where, getDocs, Timestamp, writeBatch } from 'firebase/firestore';

/**
 * Route API pour la purge automatique des logs d'audit.
 * Utilisé par un service de CRON (ex: Vercel Cron).
 * Sécurisée par une clé secrète.
 * Utilise le SDK client avec une règle Firestore permissive pour les logs > 30 jours.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    const expectedSecret = process.env.CRON_SECRET || 'yakro_dev_secret';

    if (secret !== expectedSecret) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
        if (!db) {
            throw new Error("Firestore non initialisé");
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const q = query(
            collection(db, 'audit_logs'), 
            where('timestamp', '<', Timestamp.fromDate(thirtyDaysAgo))
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            return NextResponse.json({ 
                success: true, 
                message: "Aucun log à purger." 
            });
        }

        const docs = snapshot.docs;
        const batchSize = 500;
        let deletedCount = 0;

        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = docs.slice(i, i + batchSize);
            chunk.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            deletedCount += chunk.length;
        }

        return NextResponse.json({ 
            success: true, 
            deletedCount,
            message: `Purge effectuée avec succès : ${deletedCount} entrées supprimées.`
        });

    } catch (error) {
        console.error("Erreur Cron Purge:", error);
        return NextResponse.json({ 
            error: 'Erreur interne', 
            details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue' 
        }, { status: 500 });
    }
}
