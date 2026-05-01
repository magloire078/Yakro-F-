'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader, ShieldCheck, Edit, UserPlus, Users, Home, Store, TrendingUp, Bell, Zap, FileText, Activity, ShieldAlert, Cpu, Navigation2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserProfile, SystemRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EditUserDialog } from '@/components/edit-user-dialog';
import Link from 'next/link';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useFirebase } from '@/contexts/firebase-provider';
import { AddUserDialog } from '@/components/add-user-dialog';
import { useData } from '@/contexts/data-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SupervisionModule } from '@/components/supervision-module';
import { RestaurantManager } from '@/components/restaurant-manager';
import { FinancialAnalytics } from '@/components/financial-analytics';
import { AdminAlerts } from '@/components/admin-alerts';
import { ReportCenter } from '@/components/report-center';
import { intelligentSearchAction } from '@/app/actions/ai-actions';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logAdminAction } from '@/lib/audit-logs';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
    
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResult, setSearchResult] = React.useState<{ category: string; keywords: string[] } | null>(null);
    const [isSearching, setIsSearching] = React.useState(false);

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
            const unsubscribe = onSnapshot(usersCollectionRef,
                (snapshot) => {
                    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
                    setAllUsers(users);
                    setDataLoading(false);
                },
                () => {
                    setDataLoading(false);
                }
            );
            return () => unsubscribe();
        } else {
            setDataLoading(!userProfile);
        }
    }, [user, userProfile, authLoading, router, toast, db]);

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

    const runAiSearchTest = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const result = await intelligentSearchAction({ query: searchQuery });
            if (result.success) setSearchResult(result.data);
            else toast({ variant: 'destructive', title: 'Erreur IA', description: result.error });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const getInitials = (name: string | undefined) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1 && parts[0] && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    }

    const latestUsers = React.useMemo(() => {
        if (!allUsers) return [];
        return [...allUsers].sort((a, b) => {
            const dateA = (a.dateCreation && 'toDate' in a.dateCreation) ? a.dateCreation.toDate() : new Date(0);
            const dateB = (b.dateCreation && 'toDate' in b.dateCreation) ? b.dateCreation.toDate() : new Date(0);
            return dateB.getTime() - dateA.getTime();
        }).slice(0, 5);
    }, [allUsers]);

    if (dataLoading || isPublicDataLoading || !userProfile || userProfile.roleSysteme !== 'SuperAdmin') {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0A0A0B]">
                <div className="relative">
                    <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader className="h-16 w-16 animate-spin text-orange-500 relative" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white">
            {/* Cinematic Hero Header */}
            <div className="relative h-[35vh] min-h-[350px] w-full overflow-hidden flex items-end pb-12 px-6">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1451187534959-42266104411e?q=80&w=2070&auto=format&fit=crop"
                        alt="Network Grid"
                        fill
                        className="object-cover opacity-20 scale-105 animate-slow-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/40 to-transparent z-10" />
                </div>

                <div className="relative z-20 container mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/30 backdrop-blur-md mb-2"
                            >
                                <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Autorité Suprême</span>
                            </motion.div>
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none"
                            >
                                Centre de <span className="text-orange-500">Contrôle</span>
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-gray-500 italic"
                            >
                                Supervision intégrale de l&apos;écosystème Yakro Go.
                            </motion.p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-14 w-14 bg-white/5 border-white/10 rounded-none relative hover:bg-orange-500/10 transition-colors">
                                        <Bell className="h-6 w-6 text-orange-500" />
                                        <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 border-2 border-[#0A0A0B] animate-pulse" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="w-full sm:max-w-md bg-[#121214]/95 backdrop-blur-xl border-white/5 text-white shadow-2xl">
                                    <SheetHeader className="pb-10 border-b border-white/5">
                                        <SheetTitle className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                                            <Bell className="h-8 w-8 text-orange-500" />
                                            Alertes <span className="text-orange-500">Live</span>
                                        </SheetTitle>
                                        <SheetDescription className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Anomalies et événements système</SheetDescription>
                                    </SheetHeader>
                                    <ScrollArea className="h-[calc(100vh-150px)] mt-6 pr-4">
                                        <AdminAlerts />
                                    </ScrollArea>
                                </SheetContent>
                            </Sheet>
                            
                            <Button asChild className="h-14 px-8 bg-white/5 border border-white/10 text-white rounded-none font-black italic uppercase tracking-tighter hover:bg-white/10 transition-all">
                                <Link href="/">
                                    <Home className="mr-3 h-5 w-5 text-gray-500" />
                                    Quitter
                                </Link>
                            </Button>
                            
                            <Button onClick={() => setIsAddUserDialogOpen(true)} className="h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white rounded-none font-black italic uppercase tracking-tighter shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all">
                                <UserPlus className="mr-3 h-5 w-5" />
                                Enrôler
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 -mt-10 relative z-40 pb-32">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { title: 'Citoyens', value: allUsers.length, icon: Users, color: 'orange' },
                        { title: 'Bastions', value: restaurants.length, icon: Store, color: 'white' },
                        { title: 'Flux', value: orders.length, icon: Activity, color: 'white' },
                        { title: 'Processus IA', value: '1.2K', icon: Cpu, color: 'white' }
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + (idx * 0.05) }}
                            className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 p-8 relative group overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 group-hover:text-orange-500 transition-colors">{stat.title}</span>
                                <stat.icon className={`h-4 w-4 ${stat.color === 'orange' ? 'text-orange-500' : 'text-gray-400'}`} />
                            </div>
                            <div className="text-4xl font-black tracking-tighter italic">
                                {stat.value}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    <div className="lg:col-span-3 space-y-10">
                        <Tabs defaultValue="live" className="space-y-10">
                            <TabsList className="h-auto bg-white/5 border border-white/5 p-1 rounded-none flex-wrap justify-start gap-1">
                                {[
                                    { id: 'live', icon: Navigation2, label: 'Supervision' },
                                    { id: 'restaurants', icon: Store, label: 'Établissements' },
                                    { id: 'users', icon: Users, label: 'Utilisateurs' },
                                    { id: 'finances', icon: TrendingUp, label: 'Flux Financiers' },
                                    { id: 'reports', icon: FileText, label: 'Archives' },
                                    { id: 'ai', icon: Zap, label: 'Yakro AI' }
                                ].map(tab => (
                                    <TabsTrigger 
                                        key={tab.id}
                                        value={tab.id} 
                                        className="h-12 px-6 rounded-none data-[state=active]:bg-orange-500 data-[state=active]:text-white font-black italic uppercase tracking-tighter text-[11px] transition-all"
                                    >
                                        <tab.icon className="h-4 w-4 mr-3" />
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <TabsContent value="live" className="m-0 outline-none"><SupervisionModule /></TabsContent>
                                <TabsContent value="restaurants" className="m-0 outline-none"><RestaurantManager /></TabsContent>
                                <TabsContent value="finances" className="m-0 outline-none"><FinancialAnalytics /></TabsContent>
                                <TabsContent value="reports" className="m-0 outline-none"><ReportCenter /></TabsContent>
                                
                                <TabsContent value="users" className="m-0 outline-none">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                        <div className="lg:col-span-2 bg-[#121214]/60 backdrop-blur-md border border-white/5 p-8">
                                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-8">Registre des <span className="text-orange-500">Comptes</span></h2>
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader className="border-white/5">
                                                        <TableRow className="hover:bg-transparent border-white/5">
                                                            <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-40 py-6">Identité</TableHead>
                                                            <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-40 py-6">Privilèges</TableHead>
                                                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest opacity-40 py-6">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {allUsers.map((u) => (
                                                            <TableRow key={u.uid} className="border-white/5 hover:bg-white/5 transition-colors group">
                                                                <TableCell className="py-6">
                                                                    <div className="flex items-center gap-4">
                                                                        <Avatar className="h-10 w-10 rounded-none border border-white/10 group-hover:border-orange-500/30 transition-colors">
                                                                            <AvatarFallback className="bg-white/5 text-xs font-black">{getInitials(u.nom || u.email)}</AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-black text-sm text-white uppercase italic tracking-tight">{u.nom || 'UTILISATEUR ANONYME'}</span>
                                                                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{u.email}</span>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-6">
                                                                    <Select value={u.roleSysteme || 'User'} onValueChange={(val: SystemRole) => handleSystemRoleChange(u.uid, val)}>
                                                                        <SelectTrigger className="w-[140px] h-10 bg-white/5 border-white/10 rounded-none text-[10px] font-black uppercase italic tracking-widest focus:ring-orange-500/50">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-[#121214] border-white/10 text-white rounded-none">
                                                                            <SelectItem value="SuperAdmin" className="focus:bg-orange-500 text-[10px] font-black uppercase italic tracking-widest py-3">SUPERADMIN</SelectItem>
                                                                            <SelectItem value="Admin" className="focus:bg-orange-500 text-[10px] font-black uppercase italic tracking-widest py-3">ADMIN</SelectItem>
                                                                            <SelectItem value="User" className="focus:bg-orange-500 text-[10px] font-black uppercase italic tracking-widest py-3">USER</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </TableCell>
                                                                <TableCell className="text-right py-6">
                                                                    <Button variant="ghost" size="icon" onClick={() => setEditingUser(u)} className="h-10 w-10 hover:bg-orange-500/10 hover:text-orange-500 rounded-none border border-transparent hover:border-orange-500/20">
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-1 space-y-8">
                                            <div className="bg-[#121214]/60 border border-white/5 p-8 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4">
                                                    <UserPlus className="h-4 w-4 text-orange-500/20" />
                                                </div>
                                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-8 italic">Flux d&apos;Enrôlement</h3>
                                                <div className="space-y-6">
                                                    {latestUsers.map(u => (
                                                        <div key={u.uid} className="flex items-center gap-4 group">
                                                            <div className="h-10 w-10 bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-orange-500/30 transition-colors">
                                                                <span className="text-[10px] font-black">{getInitials(u.nom || u.email)}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-gray-300 uppercase italic truncate max-w-[120px]">{u.nom || 'Anonyme'}</span>
                                                                <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">NOUVEL ADHÉRENT</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="ai" className="m-0 outline-none">
                                    <div className="bg-slate-900 border border-purple-500/20 p-12 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Zap className="h-40 w-40 text-purple-500" />
                                        </div>
                                        <div className="relative z-10 max-w-2xl">
                                            <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-6">Yakro AI <span className="text-purple-500">Sandbox</span></h3>
                                            <p className="text-gray-400 font-medium mb-10 text-sm leading-relaxed">
                                                Interrogez le moteur neural Yakro pour des analyses prédictives ou des recherches intelligentes dans la base de données administrative.
                                            </p>
                                            <div className="flex gap-4">
                                                <Input 
                                                    value={searchQuery} 
                                                    onChange={e => setSearchQuery(e.target.value)} 
                                                    placeholder="EX: ANALYSER LES TENDANCES DE CONSOMMATION..." 
                                                    className="h-16 bg-black/40 border-white/10 rounded-none text-sm font-black uppercase tracking-widest placeholder:opacity-20 focus:ring-purple-500/50 px-6" 
                                                />
                                                <Button 
                                                    onClick={runAiSearchTest} 
                                                    disabled={isSearching} 
                                                    className="h-16 px-10 bg-purple-600 hover:bg-purple-700 text-white rounded-none font-black italic uppercase tracking-tighter"
                                                >
                                                    {isSearching ? <Loader className="animate-spin h-6 w-6" /> : "PROCESS"}
                                                </Button>
                                            </div>
                                            {searchResult && (
                                                <motion.pre 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-10 p-8 bg-black/60 border border-purple-500/30 rounded-none text-[10px] font-mono text-purple-400 overflow-x-auto"
                                                >
                                                    {JSON.stringify(searchResult, null, 2)}
                                                </motion.pre>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </motion.div>
                        </Tabs>
                    </div>

                    <div className="lg:col-span-1 space-y-10">
                        <AdminAlerts />
                        
                        <div className="bg-orange-500 p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-20 rotate-12 transition-transform group-hover:rotate-0">
                                <ShieldAlert className="h-24 w-24 text-white" />
                            </div>
                            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-4">Support Elite</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-100 mb-8 leading-relaxed">
                                Ligne directe avec l&apos;unité d&apos;intervention technique Yakro.
                            </p>
                            <Button variant="secondary" className="h-12 w-full bg-white text-orange-500 hover:bg-gray-100 rounded-none font-black italic uppercase tracking-tighter transition-all">
                                SOLICITER AIDE
                            </Button>
                        </div>
                        
                        <div className="text-center opacity-10 py-10">
                            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-500">
                                Protocol Zero v9.2 &bull; Yakro Supreme Authority
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {editingUser && <EditUserDialog isOpen={!!editingUser} onClose={() => setEditingUser(null)} userProfile={editingUser} />}
            <AddUserDialog isOpen={isAddUserDialogOpen} onClose={() => setIsAddUserDialogOpen(false)} />
        </div>
    );
}
