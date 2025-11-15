
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader, ShieldCheck, Edit, UserPlus, Users, Utensils, ShoppingCart, Home, UtensilsCrossed, Bike } from 'lucide-react';
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
import { AddUserDialog } from '@/components/add-user-dialog';
import { useData } from '@/contexts/data-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {formatDistanceToNow} from 'date-fns';
import { fr } from 'date-fns/locale';


export default function AdminPage() {
    const { user, userProfile, loading: authLoading, updateOtherUserProfile } = useAuth();
    const { restaurants, orders, isLoading: isPublicDataLoading } = useData();
    const [allUsers, setAllUsers] = React.useState<UserProfile[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);
    const router = useRouter();
    const { toast } = useToast();
    const [updatingUserId, setUpdatingUserId] = React.useState<string | null>(null);
    const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = React.useState(false);

    React.useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user || userProfile?.roleSysteme !== 'SuperAdmin') {
            toast({ 
                variant: 'destructive', 
                title: 'Accès non autorisé',
                description: "Cette page est réservée aux Super Administrateurs."
            });
            router.push('/');
            return;
        }

        // Only proceed to fetch data if the user is a SuperAdmin
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

        return () => {
            unsubscribe();
        };
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

    const getInitials = (name: string | undefined) => {
        if (!name) return '?';
        const nameParts = name.split(' ');
        if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
            return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    const latestUsers = React.useMemo(() => {
        if (!allUsers) return [];
        return [...allUsers]
            .sort((a, b) => {
                const dateA = a.dateCreation?.toDate ? a.dateCreation.toDate() : new Date(0);
                const dateB = b.dateCreation?.toDate ? b.dateCreation.toDate() : new Date(0);
                return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 5);
    }, [allUsers]);

    const userStats = React.useMemo(() => {
        if (!allUsers) return { clients: 0, restaurateurs: 0, livreurs: 0 };
        return {
            clients: allUsers.filter(u => u.rolesAutorises?.includes('client')).length,
            restaurateurs: allUsers.filter(u => u.rolesAutorises?.includes('restaurateur')).length,
            livreurs: allUsers.filter(u => u.rolesAutorises?.includes('livreur')).length,
        };
    }, [allUsers]);

    if (authLoading || dataLoading || !userProfile || userProfile.roleSysteme !== 'SuperAdmin') {
        return <div className="flex h-full w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <>
            <div className="container mx-auto space-y-8">
                 <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                        <div>
                            <h1 className="text-3xl md:text-4xl font-headline text-primary">Tableau de Bord Admin</h1>
                            <p className="text-muted-foreground">Gérez les utilisateurs et supervisez l'activité de la plateforme.</p>
                        </div>
                    </div>
                     <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/">
                                <Home className="mr-2" />
                                Accueil Client
                            </Link>
                        </Button>
                        <Button onClick={() => setIsAddUserDialogOpen(true)}>
                            <UserPlus className="mr-2" />
                            Ajouter un utilisateur
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="hover:bg-muted transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Utilisateurs Totaux</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{allUsers.length}</div>
                            <p className="text-xs text-muted-foreground">Comptes enregistrés sur la plateforme</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:bg-muted transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clients</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{userStats.clients}</div>
                            <p className="text-xs text-muted-foreground">Utilisateurs ayant le rôle client</p>
                        </CardContent>
                    </Card>
                     <Card className="hover:bg-muted transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Restaurateurs</CardTitle>
                            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{userStats.restaurateurs}</div>
                            <p className="text-xs text-muted-foreground">Utilisateurs ayant le rôle restaurateur</p>
                        </CardContent>
                    </Card>
                     <Card className="hover:bg-muted transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Livreurs</CardTitle>
                            <Bike className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{userStats.livreurs}</div>
                            <p className="text-xs text-muted-foreground">Utilisateurs ayant le rôle livreur</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:bg-muted transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
                            <Utensils className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{restaurants.length}</div>
                            <p className="text-xs text-muted-foreground">Établissements partenaires</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:bg-muted transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Commandes Traitées</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{orders.length}</div>
                            <p className="text-xs text-muted-foreground">Total des commandes passées via l'app</p>
                        </CardContent>
                    </Card>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gestion des Utilisateurs</CardTitle>
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
                                                <TableHead>Rôles Fonctionnels</TableHead>
                                                <TableHead>Date d'inscription</TableHead>
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
                                                        {u.dateCreation?.toDate ? formatDistanceToNow(u.dateCreation.toDate(), { addSuffix: true, locale: fr }) : 'Date inconnue'}
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
                     <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Derniers Inscrits</CardTitle>
                            </CardHeader>
                             <CardContent className="space-y-4">
                                {latestUsers.map(u => (
                                    <div key={u.uid} className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarFallback>{getInitials(u.nom || u.email)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-semibold truncate">{u.nom || 'Non défini'}</p>
                                            <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                                        </div>
                                        <Badge variant="outline">{u.dateCreation?.toDate ? formatDistanceToNow(u.dateCreation.toDate(), { addSuffix: true, locale: fr }) : ''}</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                     </div>
                </div>
            </div>
            {editingUser && (
                <EditUserDialog
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    userProfile={editingUser}
                />
            )}
            <AddUserDialog
                isOpen={isAddUserDialogOpen}
                onClose={() => setIsAddUserDialogOpen(false)}
            />
        </>
    );
}

    