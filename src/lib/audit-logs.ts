import { Firestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type AdminAction = 
    | 'SUSPEND_RESTAURANT' 
    | 'ACTIVATE_RESTAURANT' 
    | 'FEATURE_RESTAURANT' 
    | 'UNFEATURE_RESTAURANT'
    | 'CHANGE_USER_ROLE'
    | 'DELETE_USER';

interface AuditLogData {
    adminId: string;
    adminEmail: string;
    action: AdminAction;
    targetId: string;
    details: string;
}

/**
 * Enregistre une action administrative dans Firestore pour la traçabilité.
 */
export async function logAdminAction(db: Firestore, data: AuditLogData) {
    try {
        const logsRef = collection(db, 'audit_logs');
        await addDoc(logsRef, {
            ...data,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du log d\'audit:', error);
        // On ne bloque pas l'action principale si le log échoue, mais on l'affiche en console
    }
}
