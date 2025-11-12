
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { useRouter } from 'next/navigation';
import { Loader, ShieldCheck, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserProfile, AppRole, SystemRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EditUserDialog } from '@/components/edit-user-dialog';

export default function AdminPage() {
    const { user, userProfile, loading: authLoading, updateOtherUserProfile } from useAuth();
    const { allUsers, isLoading: dataLoading } = useData();
    const router = useRouter();
    const { toast } = useToast();
    const [updatingUserId, setUpdatingUserId] = React.useState<string | null>(null);
    const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);

    React.useEffect(() => {
        if (!authLoading && (!user || userProfile?.roleSysteme !== 'SuperAdmin')) {
            toast({ variant: 'destructive', title: 'Accès non autorisé' });
            router.push('/');
        }
    }, [user, userProfile, authLoading, router, toast]);

    const handleSystemRoleChange = async (userId: string, newRole: SystemRole) => {
        setUpdatingUserId(userId);
        await updateOtherUserProfile(userId, { roleSysteme: newRole });
        toast({ title: 'Mise à jour du rôle système...' });
        // The UI will update automatically from the data context listener.
        // A success toast can be added in the context if desired.
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
        toast({ title: 'Mise à jour des permissions...' });
        setUpdatingUserId(null);
    };

    if (authLoading || dataLoading || userProfile?.roleSysteme !== 'SuperAdmin') {
        return <div className="flex h-full w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <>
            <div className="container mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-3xl md:text-4xl font-headline text-primary">Panneau d'Administration</h1>
                        <p className="text-muted-foreground">Gestion des utilisateurs et de leurs permissions.</p>
                    </div>
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
                                    {allUsers.map((u, index) => (
                                        <TableRow key={u.uid || index} className={updatingUserId === u.uid ? 'opacity-50' : ''}>
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
