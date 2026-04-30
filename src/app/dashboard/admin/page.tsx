
'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import {
    Loader, ShieldCheck, Edit, UserPlus, Users, Utensils, ShoppingCart,
    Home, UtensilsCrossed, Bike, Search, X, Clock, CheckCircle2, Truck,
    ChefHat, XCircle, Store
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserProfile, AppRole, SystemRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { EditUserDialog } from '@/components/edit-user-dialog';
import Link from 'next/link';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { AddUserDialog } from '@/components/add-user-dialog';
import { useData } from '@/contexts/data-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';


export default function AdminPage() {
    const { user, userProfile, loading: authLoading, updateOtherUserProfile } = useAuth();
    const { db } = useFirebase();
    const { restaurants, orders, isLoading: isPublicDataLoading } = useData();
    const [allUsers, setAllUsers] = React.useState<UserProfile[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);
    const router = useRouter();
    const { toast } = useToast();
    const [updatingUserId, setUpdatingUserId] = React.useState<string | null>(null);
    const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = React.useState(false);

    // Filtres utilisateurs
    const [searchQuery, setSearchQuery] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState<AppRole | 'tous'>('tous');

    React.useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }

        if (userProfile && userProfile.roleSysteme !== 'SuperAdmin') {
            toast({ variant: 'destructive', title: 'Accès non autorisé', description: "Cette page est réservée aux Super Administrateurs." });
            router.push('/');
            return;
        }

        if (userProfile?.roleSysteme === 'SuperAdmin') {
            setDataLoading(true);
            const unsubscribe = onSnapshot(
                query(collection(db, 'utilisateurs')),
                (snapshot) => {
                    setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
                    setDataLoading(false);
                },
                () => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'utilisateurs', operation: 'list' }));
                    toast({ variant: 'destructive', title: 'Erreur de permission', description: "Impossible de charger la liste des utilisateurs." });
                    setDataLoading(false);
                }
            );
            return () => unsubscribe();
        } else {
            setDataLoading(!userProfile);
        }
    }, [user, userProfile, authLoading, router, toast, db]);

    const handleSystemRoleChange = async (userId: string, newRole: SystemRole) => {
        setUpdatingUserId(userId);
        await updateOtherUserProfile(userId, { roleSysteme: newRole });
        setUpdatingUserId(null);
    };

    const handleRoleChange = async (userId: string, newRole: AppRole) => {
        setUpdatingUserId(userId);
        await updateOtherUserProfile(userId, { role: newRole });
        setUpdatingUserId(null);
    };

    const getInitials = (name: string | undefined) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1 && parts[0] && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const filteredUsers = React.useMemo(() => {
        return allUsers.filter(u => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q || (u.nom?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
            const matchesRole = roleFilter === 'tous' || u.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [allUsers, searchQuery, roleFilter]);

    const latestUsers = React.useMemo(() => {
        return [...allUsers]
            .sort((a, b) => {
                const dateA = a.dateCreation?.toDate ? a.dateCreation.toDate() : new Date(0);
                const dateB = b.dateCreation?.toDate ? b.dateCreation.toDate() : new Date(0);
                return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 5);
    }, [allUsers]);

    const userStats = React.useMemo(() => ({
        total: allUsers.length,
        clients: allUsers.filter(u => u.role === 'client').length,
        restaurateurs: allUsers.filter(u => u.role === 'restaurateur').length,
        livreurs: allUsers.filter(u => u.role === 'livreur').length,
    }), [allUsers]);

    const orderStats = React.useMemo(() => ({
        total: orders.length,
        placees: orders.filter(o => o.statut === 'Placée').length,
        enPreparation: orders.filter(o => o.statut === 'En Préparation').length,
        enRoute: orders.filter(o => o.statut === 'En Route').length,
        livrees: orders.filter(o => o.statut === 'Livrée').length,
        annulees: orders.filter(o => o.statut === 'Annulée').length,
    }), [orders]);

    if (dataLoading || isPublicDataLoading || !userProfile || userProfile.roleSysteme !== 'SuperAdmin') {
        return <div className="flex h-full w-full items-center justify-center"><Loader className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    const roleColor: Record<AppRole, string> = {
        client: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        restaurateur: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        livreur: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };

    return (
        <>
            <div className="container mx-auto space-y-8">
                {/* En-tête */}
                <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <ShieldCheck className="h-8 w-8 md:h-10 md:w-10 text-primary shrink-0" />
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-3xl font-headline text-primary">Tableau de Bord Admin</h1>
                            <p className="text-sm md:text-base text-muted-foreground">Gérez les utilisateurs et supervisez l'activité de la plateforme.</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <Button asChild variant="outline" className="w-full sm:w-auto">
                            <Link href="/"><Home className="mr-2" />Accueil Client</Link>
                        </Button>
                        <Button onClick={() => setIsAddUserDialogOpen(true)} className="w-full sm:w-auto">
                            <UserPlus className="mr-2" />Ajouter un utilisateur
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="utilisateurs">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="utilisateurs"><Users className="mr-2 h-4 w-4" />Utilisateurs</TabsTrigger>
                        <TabsTrigger value="commandes"><ShoppingCart className="mr-2 h-4 w-4" />Commandes</TabsTrigger>
                        <TabsTrigger value="restaurants"><Store className="mr-2 h-4 w-4" />Restaurants</TabsTrigger>
                    </TabsList>

                    {/* ─── Onglet Utilisateurs ─── */}
                    <TabsContent value="utilisateurs" className="space-y-6 mt-6">
                        {/* Stats utilisateurs */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Total', value: userStats.total, icon: Users, desc: 'Comptes enregistrés' },
                                { label: 'Clients', value: userStats.clients, icon: Users, desc: 'Rôle client' },
                                { label: 'Restaurateurs', value: userStats.restaurateurs, icon: UtensilsCrossed, desc: 'Rôle restaurateur' },
                                { label: 'Livreurs', value: userStats.livreurs, icon: Bike, desc: 'Rôle livreur' },
                            ].map(({ label, value, icon: Icon, desc }) => (
                                <Card key={label} className="hover:bg-muted transition-colors">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">{label}</CardTitle>
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{value}</div>
                                        <p className="text-xs text-muted-foreground">{desc}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                {/* Barre de recherche + filtre */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Rechercher par nom ou email..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-9"
                                        />
                                        {searchQuery && (
                                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <Select value={roleFilter} onValueChange={v => setRoleFilter(v as AppRole | 'tous')}>
                                        <SelectTrigger className="w-full sm:w-[180px]">
                                            <SelectValue placeholder="Filtrer par rôle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tous">Tous les rôles</SelectItem>
                                            <SelectItem value="client">Client</SelectItem>
                                            <SelectItem value="restaurateur">Restaurateur</SelectItem>
                                            <SelectItem value="livreur">Livreur</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle>Gestion des Utilisateurs</CardTitle>
                                        <CardDescription>
                                            {filteredUsers.length} / {allUsers.length} utilisateur(s) affiché(s)
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Table desktop */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Utilisateur</TableHead>
                                                        <TableHead>Rôle Système</TableHead>
                                                        <TableHead>Rôle Fonctionnel</TableHead>
                                                        <TableHead>Inscription</TableHead>
                                                        <TableHead>Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredUsers.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucun utilisateur trouvé.</TableCell>
                                                        </TableRow>
                                                    ) : filteredUsers.map((u) => (
                                                        <TableRow key={u.uid} className={updatingUserId === u.uid ? 'opacity-50' : ''}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarFallback className="text-xs">{getInitials(u.nom || u.email)}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="font-medium">{u.nom || 'Non défini'}</div>
                                                                        <div className="text-xs text-muted-foreground">{u.email}</div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Select value={u.roleSysteme || 'User'} onValueChange={(v: SystemRole) => handleSystemRoleChange(u.uid, v)} disabled={updatingUserId === u.uid || u.uid === user?.uid}>
                                                                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                                                                        <SelectItem value="Admin">Admin</SelectItem>
                                                                        <SelectItem value="User">Utilisateur</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Select value={u.role} onValueChange={(v: AppRole) => handleRoleChange(u.uid, v)} disabled={updatingUserId === u.uid}>
                                                                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="client">Client</SelectItem>
                                                                        <SelectItem value="restaurateur">Restaurateur</SelectItem>
                                                                        <SelectItem value="livreur">Livreur</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </TableCell>
                                                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
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

                                        {/* Cartes mobile */}
                                        <div className="md:hidden space-y-3">
                                            {filteredUsers.length === 0 ? (
                                                <p className="text-center text-muted-foreground py-8">Aucun utilisateur trouvé.</p>
                                            ) : filteredUsers.map((u) => (
                                                <div key={u.uid} className={`rounded-lg border p-4 space-y-3 ${updatingUserId === u.uid ? 'opacity-50' : ''}`}>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <Avatar className="h-9 w-9 shrink-0">
                                                                <AvatarFallback className="text-xs">{getInitials(u.nom || u.email)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <div className="font-medium truncate">{u.nom || 'Non défini'}</div>
                                                                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                                    {u.dateCreation?.toDate ? formatDistanceToNow(u.dateCreation.toDate(), { addSuffix: true, locale: fr }) : ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button variant="outline" size="icon" onClick={() => setEditingUser(u)} disabled={updatingUserId === u.uid} className="shrink-0">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Rôle Système</p>
                                                            <Select value={u.roleSysteme || 'User'} onValueChange={(v: SystemRole) => handleSystemRoleChange(u.uid, v)} disabled={updatingUserId === u.uid || u.uid === user?.uid}>
                                                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                                                                    <SelectItem value="Admin">Admin</SelectItem>
                                                                    <SelectItem value="User">Utilisateur</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Rôle Fonctionnel</p>
                                                            <Select value={u.role} onValueChange={(v: AppRole) => handleRoleChange(u.uid, v)} disabled={updatingUserId === u.uid}>
                                                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="client">Client</SelectItem>
                                                                    <SelectItem value="restaurateur">Restaurateur</SelectItem>
                                                                    <SelectItem value="livreur">Livreur</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Derniers inscrits */}
                            <div className="lg:col-span-1">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Derniers Inscrits</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {latestUsers.map(u => (
                                            <div key={u.uid} className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 shrink-0">
                                                    <AvatarFallback className="text-xs">{getInitials(u.nom || u.email)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate text-sm">{u.nom || 'Non défini'}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                                </div>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${roleColor[u.role]}`}>
                                                    {u.role}
                                                </span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ─── Onglet Commandes ─── */}
                    <TabsContent value="commandes" className="space-y-6 mt-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {[
                                { label: 'Placées', value: orderStats.placees, icon: Clock, color: 'text-yellow-600' },
                                { label: 'En Préparation', value: orderStats.enPreparation, icon: ChefHat, color: 'text-orange-600' },
                                { label: 'En Route', value: orderStats.enRoute, icon: Truck, color: 'text-blue-600' },
                                { label: 'Livrées', value: orderStats.livrees, icon: CheckCircle2, color: 'text-green-600' },
                                { label: 'Annulées', value: orderStats.annulees, icon: XCircle, color: 'text-red-600' },
                            ].map(({ label, value, icon: Icon, color }) => (
                                <Card key={label} className="hover:bg-muted transition-colors">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-xs font-medium">{label}</CardTitle>
                                        <Icon className={`h-4 w-4 ${color}`} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{value}</div>
                                        <p className="text-xs text-muted-foreground">{orderStats.total > 0 ? Math.round((value / orderStats.total) * 100) : 0}% du total</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Dernières commandes</CardTitle>
                                <CardDescription>{orderStats.total} commande(s) au total sur la plateforme</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>N°</TableHead>
                                                <TableHead>Restaurant</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Statut</TableHead>
                                                <TableHead>Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[...orders]
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .slice(0, 20)
                                                .map(order => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-mono text-xs">{order.id.slice(0, 6)}…</TableCell>
                                                    <TableCell className="font-medium">{order.nomRestaurant}</TableCell>
                                                    <TableCell>{order.total.toLocaleString('fr-FR')} FCFA</TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            order.statut === 'Livrée' ? 'default' :
                                                            order.statut === 'Annulée' ? 'destructive' : 'secondary'
                                                        } className={order.statut === 'Livrée' ? 'bg-green-600' : ''}>
                                                            {order.statut}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                                        {new Date(order.date).toLocaleDateString('fr-FR')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ─── Onglet Restaurants ─── */}
                    <TabsContent value="restaurants" className="space-y-6 mt-6">
                        <div className="grid grid-cols-2 gap-4">
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
                                    <CardTitle className="text-sm font-medium">En Vedette</CardTitle>
                                    <Store className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{restaurants.filter(r => r.enVedette).length}</div>
                                    <p className="text-xs text-muted-foreground">Restaurants mis en avant</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Liste des Restaurants</CardTitle>
                                <CardDescription>{restaurants.length} établissement(s) enregistré(s)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Table desktop */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Restaurant</TableHead>
                                                <TableHead>Cuisine</TableHead>
                                                <TableHead>Note</TableHead>
                                                <TableHead>Propriétaire</TableHead>
                                                <TableHead>Vedette</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {restaurants.map(r => {
                                                const owner = allUsers.find(u => u.uid === r.proprietaireId);
                                                return (
                                                    <TableRow key={r.id}>
                                                        <TableCell className="font-medium">{r.nom}</TableCell>
                                                        <TableCell className="text-muted-foreground">{r.cuisine}</TableCell>
                                                        <TableCell>⭐ {r.note}</TableCell>
                                                        <TableCell>
                                                            <div className="text-sm">{owner?.nom || '—'}</div>
                                                            <div className="text-xs text-muted-foreground">{owner?.email || r.proprietaireId.slice(0, 8) + '…'}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {r.enVedette
                                                                ? <Badge className="bg-yellow-500 text-white">Vedette</Badge>
                                                                : <Badge variant="outline">Standard</Badge>
                                                            }
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Cartes mobile */}
                                <div className="md:hidden space-y-3">
                                    {restaurants.map(r => {
                                        const owner = allUsers.find(u => u.uid === r.proprietaireId);
                                        return (
                                            <div key={r.id} className="rounded-lg border p-4 space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-semibold truncate">{r.nom}</p>
                                                    {r.enVedette
                                                        ? <Badge className="bg-yellow-500 text-white shrink-0">Vedette</Badge>
                                                        : <Badge variant="outline" className="shrink-0">Standard</Badge>
                                                    }
                                                </div>
                                                <p className="text-xs text-muted-foreground">{r.cuisine} · ⭐ {r.note}</p>
                                                <p className="text-xs text-muted-foreground">Propriétaire : {owner?.nom || owner?.email || r.proprietaireId.slice(0, 8) + '…'}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {editingUser && (
                <EditUserDialog isOpen={!!editingUser} onClose={() => setEditingUser(null)} userProfile={editingUser} />
            )}
            <AddUserDialog isOpen={isAddUserDialogOpen} onClose={() => setIsAddUserDialogOpen(false)} />
        </>
    );
}
