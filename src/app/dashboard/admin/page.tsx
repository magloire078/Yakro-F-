'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader, ShieldCheck, Edit, UserPlus, Users, Home, Store, TrendingUp, Bell, FileText, Activity, ShieldAlert, Cpu, Navigation2, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserProfile, SystemRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EditUserDialog } from '@/components/edit-user-dialog';
import Link from 'next/link';
import { collection, onSnapshot, query, Timestamp, doc, deleteDoc, orderBy, limit, where, getDocs, writeBatch } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import { AddUserDialog } from '@/components/add-user-dialog';
import { useData } from '@/contexts/data-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

import { SupervisionModule } from '@/components/supervision-module';
import { RestaurantManager } from '@/components/restaurant-manager';
import { FinancialAnalytics } from '@/components/financial-analytics';
import { AdminAlerts } from '@/components/admin-alerts';
import { ReportCenter } from '@/components/report-center';

import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logAdminAction, type AuditLogEntry } from '@/lib/audit-logs';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function AdminPage() {
    const { user, userProfile, loading: authLoading, updateOtherUserProfile } = useAuth();
    const { db } = useFirebase();
    const { restaurants, orders, isLoading: isPublicDataLoading } = useData();
    const [allUsers, setAllUsers] = React.useState<UserProfile[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);
    const router = useRouter();
    const { toast } = useToast();

    const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = React.useState(false);
    const [userToDelete, setUserToDelete] = React.useState<UserProfile | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isPurgeDialogOpen, setIsPurgeDialogOpen] = React.useState(false);
    const [isPurging, setIsPurging] = React.useState(false);
    

    const [auditLogs, setAuditLogs] = React.useState<AuditLogEntry[]>([]);
    const [logSearchQuery, setLogSearchQuery] = React.useState('');
    const [logDisplayLimit, setLogDisplayLimit] = React.useState(50);
    const [activeTab, setActiveTab] = React.useState('live');
    const [isPending, startTransition] = React.useTransition();
    const [userDisplayLimit, setUserDisplayLimit] = React.useState(20);
    const [userSearchQuery, setUserSearchQuery] = React.useState('');

    // Persist tab state
    React.useEffect(() => {
        const savedTab = localStorage.getItem('yakro-admin-active-tab');
        if (savedTab) {
            setActiveTab(savedTab);
        }
    }, []);

    const handleTabChange = (value: string) => {
        startTransition(() => {
            setActiveTab(value);
        });
        localStorage.setItem('yakro-admin-active-tab', value);
    };

    React.useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        if (userProfile && userProfile.roleSysteme !== 'SuperAdmin') {
            toast({ variant: 'destructive', title: 'Accès non autorisé', description: "Cette page est réservée aux Super Administrateurs." });
            router.push('/');
            return;
        }
        if (userProfile?.roleSysteme === 'SuperAdmin') {
            setDataLoading(true);
            const usersCollectionRef = query(collection(db, 'utilisateurs'));
            const unsubscribeUsers = onSnapshot(usersCollectionRef,
                (snapshot) => {
                    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
                    setAllUsers(users);
                    setDataLoading(false);
                },
                () => {
                    setDataLoading(false);
                }
            );

            const auditLogsRef = query(
                collection(db, 'audit_logs'), 
                orderBy('timestamp', 'desc'),
                limit(logDisplayLimit)
            );
            const unsubscribeLogs = onSnapshot(auditLogsRef, 
                (snapshot) => {
                    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry));
                    setAuditLogs(logs);
                },
                () => {
                    const permissionError = new FirestorePermissionError({
                        path: 'audit_logs',
                        operation: 'list',
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                }
            );

            return () => {
                unsubscribeUsers();
                unsubscribeLogs();
            };
        } else {
            setDataLoading(!userProfile);
        }
    }, [user, userProfile, authLoading, router, toast, db, logDisplayLimit]);

    const handleSystemRoleChange = async (userId: string, newRole: SystemRole) => {
        if (!user || !userProfile) return;
        
        try {
            await updateOtherUserProfile(userId, { roleSysteme: newRole });
            
            await logAdminAction(db, {
                adminId: user.uid,
                adminEmail: user.email || 'unknown',
                action: 'CHANGE_USER_ROLE',
                targetId: userId,
                details: `Changement du rôle système vers ${newRole}`
            });
            
            toast({ title: "Rôle mis à jour", description: `L'utilisateur est désormais ${newRole}.` });
        } catch {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour le rôle." });
        }
    };
    
    const handleDeleteUser = async (userId: string) => {
        if (!user || !userProfile) return;
        
        setIsDeleting(true);
        try {
            const userRef = doc(db, 'utilisateurs', userId);
            const userEmail = userToDelete?.email || 'inconnu';
            await deleteDoc(userRef);
            
            await logAdminAction(db, {
                adminId: user.uid,
                adminEmail: user.email || 'unknown',
                action: 'DELETE_USER',
                targetId: userId,
                details: `Suppression définitive du compte ${userEmail}`
            });
            
            toast({ title: "Utilisateur supprimé", description: "Le compte a été retiré du système." });
            setUserToDelete(null);
        } catch {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'utilisateur." });
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePurgeLogs = async () => {
        if (!user || !userProfile) return;
        
        setIsPurging(true);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        try {
            const q = query(collection(db, 'audit_logs'), where('timestamp', '<', Timestamp.fromDate(thirtyDaysAgo)));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                toast({ title: "Nettoyage terminé", description: "Aucun log ancien à supprimer." });
                return;
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
            
            await logAdminAction(db, {
                adminId: user.uid,
                adminEmail: user.email || 'unknown',
                action: 'PURGE_LOGS',
                targetId: 'SYSTEM',
                details: `Purge de ${deletedCount} anciens journaux d'audit`
            });
            
            toast({ title: "Journal purgé", description: `${deletedCount} entrées ont été supprimées.` });
            setIsPurgeDialogOpen(false);
        } catch (error) {
            console.error("Erreur lors de la purge:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de purger les journaux." });
        } finally {
            setIsPurging(false);
        }
    };



    const getInitials = (name: string | undefined) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1 && parts[0] && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    }

    const filteredLogs = React.useMemo(() => {
        return auditLogs.filter(log => {
            const searchStr = `${log.adminEmail} ${log.action} ${log.details}`.toLowerCase();
            return searchStr.includes(logSearchQuery.toLowerCase());
        });
    }, [auditLogs, logSearchQuery]);

    const displayedLogs = React.useMemo(() => {
        return filteredLogs.slice(0, logDisplayLimit);
    }, [filteredLogs, logDisplayLimit]);

    const latestUsers = React.useMemo(() => {
        if (!allUsers || allUsers.length === 0) return [];
        // Only sort a copy of the array
        return [...allUsers]
            .sort((a, b) => {
                const dateA = (a.dateCreation && 'toDate' in a.dateCreation) ? a.dateCreation.toDate() : new Date(0);
                const dateB = (b.dateCreation && 'toDate' in b.dateCreation) ? b.dateCreation.toDate() : new Date(0);
                return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 5);
    }, [allUsers]);

    const filteredUsers = React.useMemo(() => {
        if (!userSearchQuery) return allUsers;
        const query = userSearchQuery.toLowerCase();
        return allUsers.filter(u => 
            (u.nom?.toLowerCase().includes(query)) || 
            (u.email?.toLowerCase().includes(query)) ||
            (u.roleSysteme?.toLowerCase().includes(query))
        );
    }, [allUsers, userSearchQuery]);

    const displayedUsers = React.useMemo(() => {
        return filteredUsers.slice(0, userDisplayLimit);
    }, [filteredUsers, userDisplayLimit]);

    if (dataLoading || isPublicDataLoading || !userProfile || userProfile.roleSysteme !== 'SuperAdmin') {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="relative">
                    <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader className="h-16 w-16 animate-spin text-orange-500 relative" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-body">
            {/* Cinematic Hero Header */}
            <div className="relative h-[30vh] md:h-[35vh] min-h-[350px] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1451187534959-42266104411e?q=80&w=2070&auto=format&fit=crop"
                        alt="Network Grid"
                        fill
                        className="object-cover opacity-10 dark:opacity-20 scale-110 animate-slow-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60 z-10" />
                </div>

                <div className="relative z-30 text-center space-y-8 px-6 max-w-5xl pt-10 md:pt-0">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-2xl mb-2 shadow-2xl"
                    >
                        <ShieldCheck className="h-4 w-4 text-orange-500" />
                        <span className="text-[10px] font-body font-bold tracking-widest text-orange-500">Autorité Suprême Yakro</span>
                    </motion.div>
                    
                    <div className="space-y-4">
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl md:text-5xl font-headline font-bold tracking-tight text-foreground leading-tight mb-4"
                        >
                            Centre de <span className="text-orange-500 italic">Contrôle</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-500 font-body text-[10px] md:text-xs tracking-wider opacity-80"
                        >
                            Supervision intégrale et commandement de l&apos;écosystème
                        </motion.p>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap items-center justify-center gap-3 mt-8"
                    >
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="h-10 px-5 bg-card/50 border-border rounded-xl font-body font-bold tracking-tight hover:bg-orange-500/10 transition-all group text-xs">
                                    <Bell className="mr-2 h-4 w-4 text-orange-500 group-hover:scale-110 transition-transform" />
                                    Alertes <span className="ml-2 px-2 py-0.5 bg-red-500 text-[9px] font-body text-white rounded-full animate-pulse">Live</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-md bg-background/95 backdrop-blur-3xl border-border text-foreground shadow-2xl">
                                <SheetHeader className="pb-8 border-b border-white/5">
                                    <SheetTitle className="text-2xl font-headline font-bold tracking-tight flex items-center gap-3">
                                        <Bell className="h-7 w-7 text-orange-500" />
                                        Alertes <span className="text-orange-500 italic">Système</span>
                                    </SheetTitle>
                                    <SheetDescription className="text-slate-500 font-body text-[9px] tracking-widest opacity-70">ANOMALIES ET ÉVÉNEMENTS CRITIQUES</SheetDescription>
                                </SheetHeader>
                                <ScrollArea className="h-[calc(100vh-150px)] mt-6 pr-4">
                                    <AdminAlerts />
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                        
                        <Button asChild className="h-10 px-5 bg-card/50 border border-border text-foreground rounded-xl font-body font-bold tracking-tight hover:bg-card transition-all text-xs">
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4 text-slate-500" />
                                Quitter
                            </Link>
                        </Button>
                        
                        <Button onClick={() => setIsAddUserDialogOpen(true)} className="h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-body font-bold tracking-tight shadow-[0_15px_30px_rgba(249,115,22,0.2)] transition-all hover:scale-105 text-xs">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Enrôler Citoyen
                        </Button>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-6 -mt-12 relative z-40 pb-32">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {[
                        { title: 'Citoyens', value: allUsers.length, icon: Users, color: 'orange' },
                        { title: 'Bastions', value: restaurants.length, icon: Store, color: 'white' },
                        { title: 'Flux', value: orders.length, icon: Activity, color: 'white' },
                        { title: 'Opérations', value: 'Active', icon: Cpu, color: 'white' }
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + (idx * 0.1), duration: 0.5, ease: "easeOut" }}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            className={`bg-card/50 dark:bg-white/5 backdrop-blur-3xl border border-border dark:border-white/5 p-6 relative group overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 hover:border-orange-500/50 hover:shadow-orange-500/10 animate-float`}
                            style={{ animationDelay: `${idx * 1.5}s` } as React.CSSProperties}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_20px_rgba(249,115,22,0.6)]" />
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <span className="text-[11px] font-body font-semibold tracking-wider text-slate-500/80 group-hover:text-orange-500 transition-colors">{stat.title}</span>
                                <div className={`p-2 rounded-xl ${stat.color === 'orange' ? 'bg-orange-500/10' : 'bg-white/5'}`}>
                                    <stat.icon className={`h-4 w-4 ${stat.color === 'orange' ? 'text-orange-500' : 'text-slate-400'}`} />
                                </div>
                            </div>
                            <div className="text-3xl md:text-5xl font-headline font-bold tracking-tight text-foreground group-hover:scale-105 transition-transform duration-500 relative z-10">
                                {stat.value}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
                    <div className="lg:col-span-3 space-y-10">
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
                            <TabsList className="h-auto bg-card/50 dark:bg-white/5 border border-border dark:border-white/5 p-1 rounded-2xl flex-wrap justify-start gap-1 backdrop-blur-3xl">
                                {[
                                    { id: 'live', icon: Navigation2, label: 'Supervision' },
                                    { id: 'restaurants', icon: Store, label: 'Établissements' },
                                    { id: 'users', icon: Users, label: 'Utilisateurs' },
                                    { id: 'finances', icon: TrendingUp, label: 'Flux Financiers' },
                                    { id: 'security', icon: ShieldAlert, label: 'Sécurité' },
                                    { id: 'reports', icon: FileText, label: 'Archives' }
                                ].map(tab => (
                                    <TabsTrigger 
                                        key={tab.id}
                                        value={tab.id} 
                                        className="h-10 px-5 rounded-xl data-[state=active]:bg-orange-500 data-[state=active]:text-white font-body font-bold text-[11px] transition-all data-[state=active]:shadow-[0_10px_20px_rgba(249,115,22,0.3)] hover:bg-card/50 dark:hover:bg-white/5"
                                    >
                                        <tab.icon className="h-4 w-4 mr-3" />
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isPending ? 0.6 : 1 }}
                                transition={{ duration: 0.3 }}
                                className={isPending ? "pointer-events-none" : ""}
                            >
                                <TabsContent value="live" className="m-0 outline-none animate-in fade-in duration-700"><SupervisionModule /></TabsContent>
                                <TabsContent value="restaurants" className="m-0 outline-none animate-in fade-in duration-700"><RestaurantManager /></TabsContent>
                                <TabsContent value="finances" className="m-0 outline-none animate-in fade-in duration-700"><FinancialAnalytics /></TabsContent>
                                <TabsContent value="security" className="m-0 outline-none animate-in fade-in duration-700">
                                    <div className="bg-card/50 dark:bg-white/5 backdrop-blur-3xl border border-border dark:border-white/5 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 relative z-10">
                                            <div className="space-y-2">
                                                <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight text-foreground leading-none">Journal d&apos;Audit <span className="text-orange-500 italic">Sécurisé</span></h2>
                                                <p className="text-[11px] font-body font-medium text-slate-500/70 uppercase tracking-widest">TRAÇABILITÉ TOTALE DES OPÉRATIONS DE COMMANDEMENT</p>
                                            </div>
                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                <Input 
                                                    value={logSearchQuery}
                                                    onChange={(e) => setLogSearchQuery(e.target.value)}
                                                    placeholder="Filtrer les actions..."
                                                    className="h-12 bg-card/50 dark:bg-white/5 border-border dark:border-white/5 rounded-2xl text-[10px] font-body font-medium tracking-wide min-w-[250px] focus:ring-orange-500/50"
                                                />
                                                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
                                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                                    <span className="text-[9px] font-body font-bold tracking-widest text-orange-500">PROTOCOLE ACTIF</span>
                                                </div>
                                                <Button 
                                                    onClick={() => setIsPurgeDialogOpen(true)}
                                                    variant="outline" 
                                                    className="h-12 px-6 border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-2xl font-body font-bold text-[10px] tracking-widest transition-all"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    NETTOYER
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="border-white/5">
                                                    <TableRow className="hover:bg-transparent border-border dark:border-white/5">
                                                        <TableHead className="text-[11px] font-body font-medium tracking-widest opacity-60 py-6">Horodatage</TableHead>
                                                        <TableHead className="text-[11px] font-body font-medium tracking-widest opacity-60 py-6">Administrateur</TableHead>
                                                        <TableHead className="text-[11px] font-body font-medium tracking-widest opacity-60 py-6">Action</TableHead>
                                                        <TableHead className="text-[11px] font-body font-medium tracking-widest opacity-60 py-6">Cible</TableHead>
                                                        <TableHead className="text-[11px] font-body font-medium tracking-widest opacity-60 py-6">Détails</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {displayedLogs.map((log) => (
                                                        <TableRow key={log.id} className="border-border dark:border-white/5 hover:bg-card/80 dark:hover:bg-white/5 transition-colors group">
                                                            <TableCell className="py-6 text-[11px] font-mono text-gray-500">
                                                                {(log.timestamp as Timestamp)?.toDate ? (log.timestamp as Timestamp).toDate().toLocaleString() : 'RECORDER...'}
                                                            </TableCell>
                                                            <TableCell className="py-6">
                                                                <div className="flex flex-col">
                                                                    <span className="font-body font-bold text-xs text-foreground">{log.adminEmail}</span>
                                                                    <span className="text-[8px] font-body font-medium text-gray-600 tracking-wider">ID: {log.adminId.substring(0, 8)}...</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-6">
                                                                <Badge variant="outline" className="rounded-xl border-orange-500/30 text-orange-500 bg-orange-500/10 text-[9px] font-body font-bold tracking-widest py-1.5 px-3">
                                                                    {log.action}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="py-6 text-[11px] font-bold text-gray-400">
                                                                {log.targetId}
                                                            </TableCell>
                                                            <TableCell className="py-6 text-[11px] text-gray-500">
                                                                {log.details}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        
                                        {filteredLogs.length > logDisplayLimit && (
                                            <div className="mt-8 flex justify-center">
                                                <Button 
                                                    onClick={() => setLogDisplayLimit(prev => prev + 50)}
                                                    variant="outline"
                                                    className="rounded-2xl border-white/10 hover:bg-orange-500 hover:text-white font-body font-bold text-[10px] h-12 px-8 transition-all hover:scale-105"
                                                >
                                                    Charger plus de journaux
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                                <TabsContent value="reports" className="m-0 outline-none animate-in fade-in duration-700"><ReportCenter /></TabsContent>
                                
                                <TabsContent value="users" className="m-0 outline-none animate-in fade-in duration-700">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                        <div className="lg:col-span-2 bg-card/50 dark:bg-white/5 backdrop-blur-3xl border border-border dark:border-white/5 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 relative z-10 gap-6">
                                                <div className="space-y-2">
                                                    <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight text-foreground leading-none">Registre des <span className="text-orange-500 italic">Comptes</span></h2>
                                                    <p className="text-[11px] font-body font-medium text-slate-500/70 tracking-widest">GESTION DES ACCÈS ET PRIVILÈGES SYSTÈME</p>
                                                </div>
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    <Input 
                                                        value={userSearchQuery}
                                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                                        placeholder="Rechercher un citoyen..."
                                                        className="h-12 bg-card/50 dark:bg-white/5 border-border dark:border-white/5 rounded-2xl text-[10px] font-body font-medium tracking-wide min-w-[200px] focus:ring-orange-500/50"
                                                    />
                                                    <Button onClick={() => setIsAddUserDialogOpen(true)} className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-body font-bold tracking-tight transition-all hover:scale-105 shadow-xl whitespace-nowrap">
                                                        <UserPlus className="mr-2 h-4 w-4" />
                                                        NOUVEAU
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader className="border-white/5">
                                                        <TableRow className="hover:bg-transparent border-border dark:border-white/5">
                                                            <TableHead className="text-[10px] font-body font-bold tracking-widest opacity-40 py-6">Identité</TableHead>
                                                            <TableHead className="text-[10px] font-body font-bold tracking-widest opacity-40 py-6">Privilèges</TableHead>
                                                            <TableHead className="text-right text-[10px] font-body font-bold tracking-widest opacity-40 py-6">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {displayedUsers.map((u) => (
                                                            <TableRow key={u.uid} className="border-border dark:border-white/5 hover:bg-card/80 dark:hover:bg-white/5 transition-colors group">
                                                                <TableCell className="py-6">
                                                                    <div className="flex items-center gap-4">
                                                                        <Avatar className="h-12 w-12 rounded-2xl border border-white/10 group-hover:border-orange-500/30 transition-all group-hover:scale-110 shadow-lg">
                                                                            <AvatarFallback className="bg-card dark:bg-white/10 text-xs font-body font-bold text-orange-500">{getInitials(u.nom || u.email)}</AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-body font-bold text-sm text-foreground">{u.nom || 'UTILISATEUR ANONYME'}</span>
                                                                            <span className="text-[9px] font-body font-medium text-gray-600 tracking-wider">{u.email}</span>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-6">
                                                                    <Select value={u.roleSysteme || 'User'} onValueChange={(val: SystemRole) => handleSystemRoleChange(u.uid, val)}>
                                                                        <SelectTrigger className="w-[140px] h-12 bg-card/50 dark:bg-white/5 border-border dark:border-white/10 rounded-2xl text-[10px] font-body font-bold tracking-widest focus:ring-orange-500/50 transition-all hover:bg-card dark:hover:bg-white/10">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-popover/95 backdrop-blur-3xl border-border text-foreground rounded-2xl overflow-hidden shadow-2xl">
                                                                            <SelectItem value="SuperAdmin" className="focus:bg-orange-500 focus:text-white text-[10px] font-body font-bold tracking-widest py-3 cursor-pointer">SUPERADMIN</SelectItem>
                                                                            <SelectItem value="Admin" className="focus:bg-orange-500 focus:text-white text-[10px] font-body font-bold tracking-widest py-3 cursor-pointer">ADMIN</SelectItem>
                                                                            <SelectItem value="User" className="focus:bg-orange-500 focus:text-white text-[10px] font-body font-bold tracking-widest py-3 cursor-pointer">USER</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </TableCell>
                                                                <TableCell className="text-right py-6">
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button variant="ghost" size="icon" onClick={() => setEditingUser(u)} className="h-12 w-12 hover:bg-orange-500/10 hover:text-orange-500 rounded-2xl border border-transparent hover:border-orange-500/20 transition-all hover:scale-110">
                                                                            <Edit className="h-5 w-5" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" onClick={() => setUserToDelete(u)} className="h-12 w-12 hover:bg-red-500/10 hover:text-red-500 rounded-2xl border border-transparent hover:border-red-500/20 transition-all hover:scale-110">
                                                                            <Trash2 className="h-5 w-5" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>

                                            {filteredUsers.length > userDisplayLimit && (
                                                <div className="mt-8 flex justify-center">
                                                    <Button 
                                                        onClick={() => setUserDisplayLimit(prev => prev + 20)}
                                                        variant="outline"
                                                        className="rounded-2xl border-white/10 hover:bg-orange-500 hover:text-white font-body font-bold text-[10px] h-12 px-8 transition-all hover:scale-105"
                                                    >
                                                        Charger plus d&apos;utilisateurs
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="lg:col-span-1 space-y-8">
                                            <div className="bg-card/50 dark:bg-white/5 backdrop-blur-3xl border border-border dark:border-white/5 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <UserPlus className="h-12 w-12 text-orange-500" />
                                                </div>
                                                <h3 className="text-[11px] font-body font-semibold tracking-wider text-slate-500/80 mb-10">FLUX D&apos;ENRÔLEMENT RÉCENT</h3>
                                                <div className="space-y-8 relative z-10">
                                                    {latestUsers.map((u, i) => (
                                                        <motion.div 
                                                            key={u.uid} 
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.1 * i }}
                                                            className="flex items-center gap-5 group/item"
                                                        >
                                                            <div className="h-12 w-12 bg-card/50 dark:bg-white/5 flex items-center justify-center rounded-2xl border border-border dark:border-white/10 group-hover/item:border-orange-500/30 transition-all group-hover/item:bg-orange-500/5">
                                                                <span className="text-xs font-body font-bold text-orange-500">{getInitials(u.nom || u.email)}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-body font-bold text-foreground tracking-tight group-hover/item:text-orange-500 transition-colors">{u.nom || 'Citoyen Anonyme'}</span>
                                                                <span className="text-[9px] font-body font-medium text-slate-600 tracking-widest">IDENTIFIÉ RÉCEMMENT</span>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>


                            </motion.div>
                        </Tabs>
                    </div>

                    <div className="lg:col-span-1 space-y-10">
                        <AdminAlerts />
                        
                        <div className="bg-orange-500 p-8 rounded-[2rem] relative overflow-hidden group shadow-[0_30px_60px_rgba(249,115,22,0.3)] animate-float [animation-delay:1000ms]">
                            <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 transition-transform group-hover:rotate-0 group-hover:scale-110">
                                <ShieldAlert className="h-32 w-32 text-white" />
                            </div>
                            <h3 className="text-2xl font-headline font-bold tracking-tight text-white mb-4 relative z-10">Support <span className="text-orange-200 italic">Elite</span></h3>
                            <p className="text-[12px] font-medium text-orange-100 mb-10 leading-relaxed relative z-10 max-w-[80%]">
                                Ligne directe avec l&apos;unité d&apos;intervention technique Yakro pour les opérations critiques.
                            </p>
                            <Button variant="secondary" className="h-14 w-full bg-white text-orange-500 hover:bg-orange-50 rounded-[1.5rem] font-body font-bold tracking-tight transition-all hover:scale-105 shadow-2xl relative z-10">
                                SOLLICITER AIDE
                            </Button>
                        </div>
                        
                        <div className="text-center opacity-10 py-10">
                            <p className="text-[8px] font-body tracking-[0.3em] text-gray-500">
                                Protocol Zero v9.2 &bull; Yakro Supreme Authority
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {editingUser && <EditUserDialog isOpen={!!editingUser} onClose={() => setEditingUser(null)} userProfile={editingUser} />}
            <AddUserDialog isOpen={isAddUserDialogOpen} onClose={() => setIsAddUserDialogOpen(false)} />

            {/* Non-blocking Deletion Confirmation */}
            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent className="bg-card/95 backdrop-blur-3xl border-border rounded-3xl shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-headline font-bold tracking-tight">Suppression <span className="text-red-500 italic">Définitive</span></AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-body text-xs tracking-wide py-4 leading-relaxed">
                            Êtes-vous absolument certain de vouloir révoquer tous les accès de <span className="font-bold text-foreground"> {userToDelete?.email}</span> ? 
                            <br /><br />
                            Cette action détruira définitivement le profil citoyen et est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 mt-4">
                        <AlertDialogCancel className="rounded-2xl h-12 border-border font-body font-bold text-[10px] tracking-widest px-8">ANNULER</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => userToDelete && handleDeleteUser(userToDelete.uid)}
                            disabled={isDeleting}
                            className="rounded-2xl h-12 bg-red-500 hover:bg-red-600 text-white font-body font-bold text-[10px] tracking-widest px-8 shadow-xl shadow-red-500/20"
                        >
                            {isDeleting ? <Loader className="h-4 w-4 animate-spin" /> : "CONFIRMER LA SUPPRESSION"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Purge Logs Confirmation */}
            <AlertDialog open={isPurgeDialogOpen} onOpenChange={setIsPurgeDialogOpen}>
                <AlertDialogContent className="bg-card/95 backdrop-blur-3xl border-border rounded-3xl shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-headline font-bold tracking-tight">Nettoyage des <span className="text-orange-500 italic">Registres</span></AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-body text-xs tracking-wide py-4 leading-relaxed">
                            Cette opération va purger tous les journaux d&apos;audit de plus de <span className="font-bold text-foreground">30 jours</span>.
                            <br /><br />
                            Cette action est irréversible et libérera de l&apos;espace dans le bastion de données.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 mt-4">
                        <AlertDialogCancel className="rounded-2xl h-12 border-border font-body font-bold text-[10px] tracking-widest px-8">ANNULER</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handlePurgeLogs}
                            disabled={isPurging}
                            className="rounded-2xl h-12 bg-orange-500 hover:bg-orange-600 text-white font-body font-bold text-[10px] tracking-widest px-8 shadow-xl shadow-orange-500/20"
                        >
                            {isPurging ? <Loader className="h-4 w-4 animate-spin" /> : "CONFIRMER LA PURGE"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
