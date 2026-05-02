import { Firestore, collection, addDoc, serverTimestamp, Timestamp, FieldValue } from 'firebase/firestore';

export type AdminAction = 
    | 'SUSPEND_RESTAURANT' 
    | 'ACTIVATE_RESTAURANT' 
    | 'FEATURE_RESTAURANT' 
    | 'UNFEATURE_RESTAURANT'
    | 'UPDATE_RESTAURANT'
    | 'UPDATE_MENU_ITEM'
    | 'CHANGE_USER_ROLE'
    | 'UPDATE_USER'
    | 'DELETE_USER'
    | 'LOGIN_FAILURE'
    | 'SYSTEM_CONFIG_CHANGE';

export interface AuditLogData {
    adminId: string;
    adminEmail: string;
    action: AdminAction;
    targetId: string;
    details: string;
    metadata?: Record<string, unknown>;
}

export interface AuditLogEntry extends AuditLogData {
    id: string;
    timestamp: Timestamp | FieldValue;
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
