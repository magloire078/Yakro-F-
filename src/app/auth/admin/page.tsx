
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { useRouter } from 'next/navigation';
import { Loader, Users, Utensils, ShoppingCart, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {formatDistanceToNow} from 'date-fns';
import { fr } from 'date-fns/locale';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export default function AdminHomePage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const { allUsers, setAllUsers, restaurants, orders, isLoading: isPublicDataLoading } = useData();
    const [dataLoading, setDataLoading] = React.useState(true);
    const router = useRouter();

    React.useEffect(() => {
        if (!authLoading && (!user || userProfile?.roleSysteme !== 'SuperAdmin')) {
            router.push('/');
            return;
        }
        
        if (user && userProfile?.roleSysteme === 'SuperAdmin') {
            setDataLoading(true);
            const usersCollectionRef = collection(db, 'utilisateurs');
            const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
                const users = snapshot.docs.map(doc => doc.data() as UserProfile);
                setAllUsers(users);
                setDataLoading(false);
            }, (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: usersCollectionRef.path,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                setDataLoading(false);
            });
            return () => unsubscribe();
        }

    }, [user, userProfile, authLoading, router, setAllUsers]);

    const getInitials = (name: string | undefined) => {
        if (!name) return '?';
        const nameParts = name.split(' ');
        if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
            return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    const latestUsers = React.useMemo(() => {
        return [...allUsers]
            .sort((a, b) => {
                const dateA = a.dateCreation?.toDate ? a.dateCreation.toDate() : new Date(0);
                const dateB = b.dateCreation?.toDate ? b.dateCreation.toDate() : new Date(0);
                return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 5);
    }, [allUsers]);

    if (authLoading || dataLoading || isPublicDataLoading || !userProfile || userProfile.roleSysteme !== 'SuperAdmin') {
        return <div className="flex h-full w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>;
    }
    
    return (
        <div className="container mx-auto space-y-8">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-headline text-primary">Tableau de Bord Super Admin</h1>
                    <p className="text-muted-foreground">Vue d'ensemble de l'activité sur la plateforme.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/admin">
                        <ShieldCheck/>
                        Gérer les utilisateurs
                    </Link>
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Utilisateurs Totaux</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{allUsers.length}</div>
                        <p className="text-xs text-muted-foreground">Comptes enregistrés sur la plateforme</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
                        <Utensils className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{restaurants.length}</div>
                        <p className="text-xs text-muted-foreground">Établissements partenaires</p>
                    </CardContent>
                </Card>
                <Card>
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

            <Card>
                <CardHeader>
                    <CardTitle>Dernières inscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Date d'inscription</TableHead>
                                <TableHead>Rôle</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {latestUsers.map((u, index) => (
                                <TableRow key={u.uid || index}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{getInitials(u.nom)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{u.nom}</div>
                                                <div className="text-sm text-muted-foreground">{u.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {u.dateCreation?.toDate ? formatDistanceToNow(u.dateCreation.toDate(), { addSuffix: true, locale: fr }) : 'Date inconnue'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={u.roleSysteme === 'SuperAdmin' ? 'destructive' : 'secondary'}>{u.roleSysteme}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
