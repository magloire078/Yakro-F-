

'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader, ShieldCheck, Edit, UserPlus, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserProfile, AppRole, SystemRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EditUserDialog } from '@/components/edit-user-dialog';
import Link from 'next/link';
import { collection, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export default function AdminPage() {
    const { user, userProfile, loading: authLoading, updateOtherUserProfile } = useAuth();
    const [allUsers, setAllUsers] = React.useState<UserProfile[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);
    const router = useRouter();
    const { toast } = useToast();
    const [updatingUserId, setUpdatingUserId] = React.useState<string | null>(null);
    const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);

    React.useEffect(() => {
        if (authLoading) return;

        if (!user || !userProfile || userProfile.roleSysteme !== 'SuperAdmin') {
            toast({ variant: 'destructive', title: 'Accès non autorisé' });
            router.push('/');
            setDataLoading(false);
            return;
        }

        // Only subscribe if the user is a confirmed SuperAdmin
        setDataLoading(true);
        const usersCollectionRef = collection(db, 'utilisateurs');
        const unsubscribe = onSnapshot(usersCollectionRef, 
            (snapshot) => {
                const users = snapshot.docs.map(doc => ({
                    uid: doc.id,
                    ...doc.data()
                } as UserProfile));
                setAllUsers(users);
                setDataLoading(false);
            }, 
            (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: usersCollectionRef.path,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Erreur de permission', description: "Impossible de charger la liste des utilisateurs." });
                setDataLoading(false);
            }
        );

        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }, [user, userProfile, authLoading, router, toast]);

    const handleSystemRoleChange = async (userId: string, newRole: SystemRole) => {
        setUpdatingUserId(userId);
        await updateOtherUserProfile(userId, { roleSysteme: newRole });
        setUpdatingUserId(null);
    };

    const handleAllowedRoleChange = async (userId: string, role: AppRole, isChecked: boolean) => {
        setUpdatingUserId(userId);
        const targetUser = allUsers.find(u => u.uid === userId);
        if (!targetUser) return;

        const currentRoles = targetUser.rolesAutorises || [];
        const newRoles = isChecked
            ? [...currentRoles, role]
            : currentRoles.filter(r => r !== role);
        
        await updateOtherUserProfile(userId, { rolesAutorises: newRoles });
        setUpdatingUserId(null);
    };

    if (authLoading || dataLoading || !userProfile || userProfile.roleSysteme !== 'SuperAdmin') {
        return <div className="flex h-full w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <>
            <div className="container mx-auto">
                 <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                        <div>
                            <h1 className="text-3xl md:text-4xl font-headline text-primary">Gestion des Utilisateurs</h1>
                            <p className="text-muted-foreground">Gérez les permissions et les profils des utilisateurs de la plateforme.</p>
                        </div>
                    </div>
                     <Button asChild variant="outline">
                        <Link href="/auth/admin">
                           <Home />
                           Tableau de bord
                        </Link>
                     </Button>
                </div>


                <Card>
                    <CardHeader>
                        <CardTitle>Utilisateurs</CardTitle>
                        <CardDescription>
                            {allUsers.length} utilisateur(s) trouvé(s) sur la plateforme.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Utilisateur</TableHead>
                                        <TableHead>Rôle Système</TableHead>
                                        <TableHead>Permissions</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allUsers.map((u) => (
                                        <TableRow key={u.uid} className={updatingUserId === u.uid ? 'opacity-50' : ''}>
                                            <TableCell>
                                                <div className="font-medium">{u.nom || 'Non défini'}</div>
                                                <div className="text-sm text-muted-foreground">{u.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={u.roleSysteme || 'User'}
                                                    onValueChange={(value: SystemRole) => handleSystemRoleChange(u.uid, value)}
                                                    disabled={updatingUserId === u.uid || u.uid === user?.uid}
                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                                                        <SelectItem value="Admin">Admin</SelectItem>
                                                        <SelectItem value="User">Utilisateur</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-4">
                                                    {(['client', 'restaurateur', 'livreur'] as AppRole[]).map(role => (
                                                        <div key={role} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`${u.uid}-${role}`}
                                                                checked={(u.rolesAutorises || []).includes(role)}
                                                                onCheckedChange={(checked) => handleAllowedRoleChange(u.uid, role, !!checked)}
                                                                disabled={updatingUserId === u.uid || (u.roleSysteme === 'SuperAdmin' && u.uid === user?.uid)}
                                                            />
                                                            <label
                                                                htmlFor={`${u.uid}-${role}`}
                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                                                            >
                                                                {role}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="icon" onClick={() => setEditingUser(u)} disabled={updatingUserId === u.uid}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {editingUser && (
                <EditUserDialog
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    userProfile={editingUser}
                />
            )}
        </>
    );
}
