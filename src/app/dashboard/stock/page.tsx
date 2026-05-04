'use client';

import * as React from 'react';
import { useData, addStockItem, updateStockItem, deleteStockItem } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { useFirebase } from '@/contexts/firebase-provider';
// import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, Plus, AlertTriangle, Trash2, Loader2, Warehouse, History, Filter, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { StockItem } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PurchaseList } from '@/components/stock/purchase-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';

export default function StockPage() {
    const { restaurants, stocks, isLoading } = useData();
    const { user } = useAuth();
    const { db } = useFirebase();
    const router = useRouter();
    
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedRestaurant, setSelectedRestaurant] = React.useState<string>('all');
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const myRestaurants = React.useMemo(() => {
        if (!user) return [];
        return restaurants.filter(r => r.proprietaireId === user.uid);
    }, [restaurants, user]);

    const initialNewItem = {
        nom: '',
        quantite: 0,
        unite: 'unités',
        seuilAlerte: 5,
        restaurantId: myRestaurants.length > 0 ? myRestaurants[0].id : '',
        restaurateurId: user?.uid || '',
    };
    const [newItem, setNewItem] = React.useState(initialNewItem);

    const filteredStocks = React.useMemo(() => {
        return stocks.filter(item => {
            const matchesSearch = item.nom.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRestaurant = selectedRestaurant === 'all' || item.restaurantId === selectedRestaurant;
            return matchesSearch && matchesRestaurant;
        }).sort((a, b) => {
            const getStatusScore = (item: StockItem) => {
                if (item.quantite === 0) return 0;
                if (item.quantite <= item.seuilAlerte) return 1;
                return 2;
            };
            return getStatusScore(a) - getStatusScore(b);
        });
    }, [stocks, searchQuery, selectedRestaurant]);

    const stats = React.useMemo(() => {
        const myStocks = stocks.filter(s => selectedRestaurant === 'all' || s.restaurantId === selectedRestaurant);
        const total = myStocks.length;
        const low = myStocks.filter(item => item.quantite > 0 && item.quantite <= item.seuilAlerte).length;
        const critical = myStocks.filter(item => item.quantite === 0).length;
        return { total, low, critical };
    }, [stocks, selectedRestaurant]);

    const handleAddStock = async () => {
        if (!newItem.nom || !newItem.restaurantId) {
            toast({ title: "Données manquantes", description: "Veuillez remplir les champs obligatoires.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await addStockItem(db, {
                ...newItem,
                derniereMiseAJour: new Date().toISOString()
            });
            setIsAddDialogOpen(false);
            setNewItem(initialNewItem);
            toast({ title: "Inventaire Mis à Jour", description: "Le nouvel article a été intégré avec succès." });
        } catch (error) {
            console.error(error);
            toast({ title: "Erreur Système", description: "Impossible d'ajouter l'article au stock.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateQuantity = async (id: string, newQty: number) => {
        try {
            await updateStockItem(db, id, { 
                quantite: Math.max(0, newQty),
                derniereMiseAJour: new Date().toISOString()
            });
        } catch (error) {
            console.error(error);
            toast({ title: "Ajustement Échoué", description: "Une erreur est survenue lors de la mise à jour.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteStockItem(db, id);
            toast({ title: "Article Retiré", description: "L'ingrédient a été supprimé de votre inventaire." });
        } catch (error) {
            console.error(error);
            toast({ title: "Action Interrompue", description: "Impossible de supprimer l'article.", variant: "destructive" });
        }
    };

    const statsItems = React.useMemo(() => [
        {
            label: 'Total Références',
            value: stats.total,
            icon: Warehouse,
            color: 'orange' as const
        },
        {
            label: 'Niveau Faible',
            value: stats.low,
            icon: AlertTriangle,
            color: stats.low > 0 ? ('orange' as const) : undefined
        },
        {
            label: 'Ruptures',
            value: stats.critical,
            icon: Package,
            color: stats.critical > 0 ? ('orange' as const) : undefined
        }
    ], [stats]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="relative">
                    <div className="h-20 w-20 border-2 border-orange-500/10 border-t-orange-500 rounded-full animate-spin" />
                    <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-orange-500 animate-pulse" />
                </div>
            </div>
        );
    }

    if (myRestaurants.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-orange-500/10 blur-[120px]" />
                </div>

                <div className="relative mb-8 z-10">
                    <div className="h-24 w-24 glass-dark border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl relative">
                        <Warehouse className="h-10 w-10 text-orange-500/50" />
                        <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Plus className="h-5 w-5 text-white" />
                        </div>
                    </div>
                </div>

                <div className="relative z-10 space-y-6 max-w-lg">
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white leading-[0.9] uppercase">
                        Stockage <span className="text-orange-500 italic">Non Configuré</span>
                    </h1>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] leading-relaxed italic">
                        Vous devez posséder un établissement actif pour commencer à gérer votre <span className="text-white font-black">Inventaire d&apos;Excellence</span>.
                    </p>
                    <div className="pt-6">
                        <Button 
                            onClick={() => router.push('/dashboard/new-restaurant')}
                            className="h-14 px-10 bg-white text-black hover:bg-white/90 rounded-2xl font-black italic tracking-tight text-base shadow-2xl transition-all hover:scale-105"
                        >
                            Inaugurer un Restaurant
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <DashboardPage
            heroProps={{
                backgroundImage: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop",
                badgeIcon: <Warehouse className="h-3 w-3" />,
                badgeText: "Logistique Élite",
                title: <>Contrôle <span className="text-orange-500 italic text-shadow-orange">Inventaire</span></>,
                subtitle: "Vision stratégique de vos ressources et flux",
                children: <DashboardStats items={statsItems} />
            }}
        >
            <div className="space-y-8 md:space-y-12">
                <Tabs defaultValue="inventaire" className="w-full">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-card/40 backdrop-blur-xl border border-white/5 p-2 rounded-3xl shadow-2xl">
                        <TabsList className="bg-white/5 h-12 md:h-14 p-1 w-full md:w-auto rounded-2xl border border-white/5">
                            <TabsTrigger 
                                value="inventaire" 
                                className="flex-1 md:flex-none h-full px-6 rounded-xl font-black italic text-[10px] md:text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
                            >
                                Vision Globale
                            </TabsTrigger>
                            <TabsTrigger 
                                value="courses" 
                                className="flex-1 md:flex-none h-full px-6 rounded-xl font-black italic text-[10px] md:text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all flex items-center justify-center gap-2"
                            >
                                Liste
                                {stats.low + stats.critical > 0 && (
                                    <span className="h-4 w-4 bg-white text-orange-500 text-[9px] flex items-center justify-center font-black rounded-full shadow-lg animate-pulse">
                                        {stats.low + stats.critical}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                        
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full md:w-auto h-12 md:h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black italic tracking-tight transition-all hover:scale-105 active:scale-95 shadow-xl shadow-orange-500/20">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nouvelle Acquisition
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] bg-[#0A0A0B] border border-white/10 rounded-[2rem] p-0 overflow-hidden shadow-2xl">
                                <div className="relative p-6 border-b border-white/5 bg-white/5 backdrop-blur-xl">
                                    <DialogHeader>
                                        <div className="inline-flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-orange-500/20 rounded-xl">
                                                <Warehouse className="h-5 w-5 text-orange-500" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Logistique Culinaire</span>
                                        </div>
                                        <DialogTitle className="text-2xl font-black italic tracking-tighter text-white leading-none">Ajouter au Stock</DialogTitle>
                                        <DialogDescription className="text-white/40 font-medium text-sm">Référencez un nouvel article dans votre inventaire.</DialogDescription>
                                    </DialogHeader>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Établissement Cible</Label>
                                        <Select value={newItem.restaurantId} onValueChange={(v) => setNewItem({...newItem, restaurantId: v})}>
                                        <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl text-white focus:ring-orange-500 font-bold italic">
                                                <SelectValue placeholder="Séléctionnez un lieu" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0A0A0B] border-white/10 text-white rounded-2xl">
                                                {myRestaurants.map(r => (
                                                    <SelectItem key={r.id} value={r.id} className="focus:bg-orange-500/20 rounded-xl font-bold italic">{r.nom}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Désignation</Label>
                                        <Input 
                                            placeholder="Ex: Riz Parfumé, Huile d'Olive..." 
                                            className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/20 font-bold italic text-base focus:border-orange-500/50"
                                            value={newItem.nom}
                                            onChange={(e) => setNewItem({...newItem, nom: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Quantité Initiale</Label>
                                            <Input 
                                                type="number" 
                                                className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-black italic text-lg"
                                                value={newItem.quantite}
                                                onChange={(e) => setNewItem({...newItem, quantite: Number(e.target.value)})}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Unité</Label>
                                            <Select value={newItem.unite} onValueChange={(v) => setNewItem({...newItem, unite: v})}>
                                                <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold italic">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#0A0A0B] border-white/10 text-white rounded-2xl">
                                                    {['unités', 'kg', 'g', 'l', 'ml', 'caisses', 'sacs'].map(u => (
                                                        <SelectItem key={u} value={u} className="focus:bg-orange-500/20 rounded-xl uppercase text-[10px] font-black">{u}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Seuil de Vigilance</Label>
                                        <Input 
                                            type="number" 
                                            className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-black italic text-lg"
                                            value={newItem.seuilAlerte}
                                            onChange={(e) => setNewItem({...newItem, seuilAlerte: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="p-6 pt-0 gap-3">
                                    <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="h-12 px-6 rounded-xl font-black italic text-white/40 hover:bg-white/5 hover:text-white transition-all">Annuler</Button>
                                    <Button onClick={handleAddStock} disabled={isSubmitting} className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black italic tracking-tight text-base shadow-xl shadow-orange-500/20">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmer l\'Ajout'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <TabsContent value="inventaire" className="space-y-8 outline-none">
                        {/* Filters & Search */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-8 relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-hover:text-orange-500 transition-colors" />
                                <Input 
                                    placeholder="Rechercher une référence..." 
                                    className="pl-14 h-14 bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl text-white font-bold italic text-base placeholder:text-white/20 focus:ring-orange-500/20 shadow-2xl" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-4 relative group">
                                <Filter className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-hover:text-orange-500 transition-colors" />
                                <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                                    <SelectTrigger className="pl-14 h-14 bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl text-white font-bold italic shadow-2xl">
                                        <SelectValue placeholder="Filtrer par lieu" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0A0A0B] border-white/10 text-white rounded-2xl">
                                        <SelectItem value="all" className="focus:bg-orange-500/20 rounded-xl font-bold italic">Tous les établissements</SelectItem>
                                        {myRestaurants.map(r => (
                                            <SelectItem key={r.id} value={r.id} className="focus:bg-orange-500/20 rounded-xl font-bold italic">{r.nom}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Inventory Container */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-2xl relative overflow-hidden p-2 md:p-4">
                            {/* Desktop View */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-white/5">
                                            <TableHead className="py-4 px-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Référence</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Statut</TableHead>
                                            <TableHead className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Volume</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Mise à jour</TableHead>
                                            <TableHead className="text-right px-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence mode="popLayout">
                                            {filteredStocks.length > 0 ? (
                                                filteredStocks.map((item, index) => {
                                                    const isCritical = item.quantite === 0;
                                                    const isLow = !isCritical && item.quantite <= item.seuilAlerte;
                                                    const restaurantName = myRestaurants.find(r => r.id === item.restaurantId)?.nom || 'Etablissement';

                                                    return (
                                                        <motion.tr 
                                                            key={item.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, scale: 0.98 }}
                                                            transition={{ delay: index * 0.03 }}
                                                            className="group border-white/5 hover:bg-white/[0.02] transition-all py-4"
                                                        >
                                                            <TableCell className="py-4 px-6">
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-xl italic tracking-tighter text-white group-hover:text-orange-500 transition-colors">{item.nom}</span>
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1 flex items-center gap-2">
                                                                        <div className="h-1 w-1 rounded-full bg-orange-500 shadow-sm shadow-orange-500/20" /> {restaurantName}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={cn(
                                                                    "rounded-full px-4 py-1 font-black italic text-[8px] tracking-tight uppercase border backdrop-blur-md",
                                                                    isCritical ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                                                                    isLow ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                                                                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                                )}>
                                                                    {isCritical ? 'Rupture' : isLow ? 'Critique' : 'Optimal'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex items-center justify-center gap-4">
                                                                    <button 
                                                                        className="h-8 w-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all font-black text-xl"
                                                                        onClick={() => handleUpdateQuantity(item.id, item.quantite - 1)}
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <div className="min-w-[60px] group-hover:scale-110 transition-transform">
                                                                        <span className="text-2xl font-black italic tracking-tighter text-white">{item.quantite}</span>
                                                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">{item.unite}</p>
                                                                    </div>
                                                                    <button 
                                                                        className="h-8 w-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all font-black text-xl"
                                                                        onClick={() => handleUpdateQuantity(item.id, item.quantite + 1)}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2 text-white/30 font-bold italic">
                                                                    <History className="h-3 w-3 opacity-30" />
                                                                    <span className="text-xs">{format(new Date(item.derniereMiseAJour), "dd MMM, HH:mm")}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right px-6">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-white/5 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" 
                                                                    onClick={() => handleDelete(item.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </motion.tr>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-[50vh] text-center border-none">
                                                        <div className="flex flex-col items-center justify-center space-y-8">
                                                            <div className="relative">
                                                                <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                                                <div className="bg-white/5 p-10 rounded-full border border-white/10 backdrop-blur-xl relative">
                                                                    <Package className="h-20 w-20 text-white/10" />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <h3 className="text-2xl font-black italic tracking-tight text-slate-900 uppercase">Aucune référence</h3>
                                                                <p className="text-slate-400 font-medium max-w-xs mx-auto">Ajustez vos filtres ou effectuez une nouvelle acquisition.</p>
                                                            </div>
                                                            <Button 
                                                                variant="outline" 
                                                                className="rounded-2xl h-14 px-12 border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 font-black italic transition-all" 
                                                                onClick={() => { setSearchQuery(''); setSelectedRestaurant('all'); }}
                                                            >
                                                                Réinitialiser Flux
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </AnimatePresence>
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-6">
                                {filteredStocks.length > 0 ? (
                                    filteredStocks.map((item, index) => {
                                        const isCritical = item.quantite === 0;
                                        const isLow = !isCritical && item.quantite <= item.seuilAlerte;
                                        const restaurantName = myRestaurants.find(r => r.id === item.restaurantId)?.nom || 'Etablissement';

                                        return (
                                            <motion.div 
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col gap-4 shadow-2xl backdrop-blur-md"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-black text-lg italic tracking-tighter text-white leading-tight">{item.nom}</h3>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <MapPin className="h-2.5 w-2.5 text-orange-500" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{restaurantName}</span>
                                                        </div>
                                                    </div>
                                                    <Badge className={cn(
                                                        "rounded-full px-2 py-0.5 font-black italic text-[7px] tracking-tight uppercase border shadow-sm",
                                                        isCritical ? "bg-red-500/20 text-red-500 border-red-500/30" : 
                                                        isLow ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : 
                                                        "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                                                    )}>
                                                        {isCritical ? 'Rupture' : isLow ? 'Critique' : 'Optimal'}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center justify-between bg-white/[0.03] rounded-xl p-3 border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center text-white/20 active:text-red-500 active:bg-red-500/10 transition-colors font-black text-lg border border-white/5"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantite - 1)}
                                                        >
                                                            -
                                                        </button>
                                                        <div className="text-center min-w-[50px]">
                                                            <span className="text-xl font-black italic tracking-tighter text-white">{item.quantite}</span>
                                                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">{item.unite}</p>
                                                        </div>
                                                        <button 
                                                            className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center text-white/20 active:text-emerald-500 active:bg-emerald-500/10 transition-colors font-black text-lg border border-white/5"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantite + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-1 text-white/20 text-[8px] font-black italic uppercase">
                                                            <History className="h-2.5 w-2.5" />
                                                            {format(new Date(item.derniereMiseAJour), "dd MMM")}
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-white/5 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" 
                                                            onClick={() => handleDelete(item.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <div className="py-20 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Aucune référence</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="courses" className="outline-none">
                        <PurchaseList stocks={stocks} restaurants={restaurants} />
                    </TabsContent>
                </Tabs>

                {/* Critical Alert Overlay */}
                <AnimatePresence>
                    {stocks.some(item => item.quantite <= item.seuilAlerte) && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="p-6 md:p-8 bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[2rem] relative overflow-hidden group shadow-2xl"
                        >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10">
                                <div className="h-14 w-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center shadow-inner">
                                    <AlertTriangle className="h-7 w-7 text-orange-500 animate-pulse" />
                                </div>
                                <div className="flex-1 text-center md:text-left space-y-2">
                                    <h4 className="text-2xl font-black italic tracking-tighter text-white leading-none">Vigilance Approvisionnement</h4>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                                        Plusieurs références ont franchi le seuil critique de sécurité. <span className="text-orange-500 font-black italic">Urgence Logistique</span> détectée.
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => (document.querySelector('[value="courses"]') as HTMLElement)?.click()}
                                    className="w-full md:w-auto h-12 md:h-14 px-8 bg-white text-[#0A0A0B] hover:bg-white/90 rounded-xl font-black italic tracking-tight text-base shadow-xl transition-all hover:scale-105 active:scale-95"
                                >
                                    Générer Liste de Frais
                                </Button>
                            </div>
                            
                            {/* Decorative background scanline */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


        </DashboardPage>
    );
}
