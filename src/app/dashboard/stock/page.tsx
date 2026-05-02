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
import Image from 'next/image';
import { MobileBackButton } from '@/components/mobile-back-button';

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

    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center bg-[#0A0A0B]">
                <div className="relative">
                    <div className="h-20 w-20 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                    <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-orange-500" />
                </div>
            </div>
        );
    }

    if (myRestaurants.length === 0) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-orange-500/10 blur-[120px]" />
                </div>

                <div className="relative mb-12 z-10">
                    <div className="h-32 w-32 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center backdrop-blur-xl shadow-2xl relative">
                        <Warehouse className="h-14 w-14 text-white/20" />
                        <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Plus className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="relative z-10 space-y-6 max-w-lg">
                    <h1 className="text-5xl font-black italic tracking-tighter text-white leading-[0.9]">
                        Stockage <span className="text-orange-500">Non Configuré</span>
                    </h1>
                    <p className="text-sm font-bold text-white/40 uppercase tracking-[0.2em] leading-relaxed">
                        Vous devez posséder un établissement actif pour commencer à gérer votre <span className="text-white font-black italic">Inventaire d&apos;Excellence</span>.
                    </p>
                    <div className="pt-8">
                        <Button 
                            onClick={() => router.push('/dashboard/new-restaurant')}
                            className="h-16 px-12 bg-white text-[#0A0A0B] hover:bg-white/90 rounded-2xl font-black italic tracking-tight text-lg shadow-2xl transition-all hover:scale-105 active:scale-95"
                        >
                            Inaugurer un Restaurant
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-24 relative overflow-hidden text-white">
            {/* Elite Background Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[120px]" />
            </div>

            {/* Elite Stock Header */}
            <div className="relative h-[45vh] w-full overflow-hidden flex items-center justify-center pt-16">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"
                        alt="Inventory Background"
                        fill
                        className="object-cover opacity-20 scale-110 animate-slow-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B]/0 via-[#0A0A0B]/80 to-[#0A0A0B] z-10" />
                </div>
                
                <MobileBackButton />

                <div className="relative z-30 text-center space-y-6 px-6 max-w-4xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 shadow-sm backdrop-blur-md mb-2"
                    >
                        <Warehouse className="h-4 w-4 text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Gestion de l&apos;Approvisionnement</span>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black italic tracking-tighter text-white leading-[0.8] mb-4"
                    >
                        Contrôle <span className="text-orange-500">Inventaire</span>
                    </motion.h1>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex justify-center gap-12 md:gap-24 mt-8"
                    >
                        <div className="text-center group">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2 group-hover:text-white transition-colors">Total</p>
                            <p className="text-3xl md:text-5xl font-black italic text-white tracking-tighter group-hover:scale-110 transition-transform">{stats.total}</p>
                        </div>
                        <div className="w-px h-12 bg-white/10 self-center" />
                        <div className="text-center group">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-2">Faible</p>
                            <p className="text-3xl md:text-5xl font-black italic text-amber-500 tracking-tighter group-hover:scale-110 transition-transform">{stats.low}</p>
                        </div>
                        <div className="w-px h-12 bg-white/10 self-center" />
                        <div className="text-center group">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-2">Ruptures</p>
                            <p className="text-3xl md:text-5xl font-black italic text-red-500 tracking-tighter group-hover:scale-110 transition-transform">{stats.critical}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl -mt-16 relative z-40 space-y-12">
                <Tabs defaultValue="inventaire" className="w-full">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-[#121214]/60 backdrop-blur-xl border border-white/5 p-3 rounded-[2rem] shadow-2xl">
                        <TabsList className="bg-white/5 h-14 md:h-16 p-1 w-full md:w-auto rounded-2xl">
                            <TabsTrigger 
                                value="inventaire" 
                                className="flex-1 md:flex-none h-full px-8 rounded-xl font-black italic text-xs md:text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
                            >
                                Vision Globale
                            </TabsTrigger>
                            <TabsTrigger 
                                value="courses" 
                                className="flex-1 md:flex-none h-full px-8 rounded-xl font-black italic text-xs md:text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all flex items-center justify-center gap-3"
                            >
                                Liste
                                {stats.low + stats.critical > 0 && (
                                    <span className="h-5 w-5 bg-white text-orange-500 text-[10px] flex items-center justify-center font-black rounded-full shadow-lg animate-pulse">
                                        {stats.low + stats.critical}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                        
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full md:w-auto h-14 md:h-16 px-10 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black italic tracking-tight transition-all hover:scale-105 active:scale-95 shadow-xl shadow-orange-500/20">
                                    <Plus className="mr-3 h-5 w-5" />
                                    Nouvelle Acquisition
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[550px] bg-[#0A0A0B] border border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
                                <div className="relative p-10 border-b border-white/5 bg-white/5 backdrop-blur-xl">
                                    <DialogHeader>
                                        <div className="inline-flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-orange-500/20 rounded-xl">
                                                <Warehouse className="h-5 w-5 text-orange-500" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Logistique Culinaire</span>
                                        </div>
                                        <DialogTitle className="text-4xl font-black italic tracking-tighter text-white leading-none">Ajouter au Stock</DialogTitle>
                                        <DialogDescription className="text-white/40 font-medium text-lg">Référencez un nouvel intrant dans votre chaîne logistique.</DialogDescription>
                                    </DialogHeader>
                                </div>
                                <div className="p-10 space-y-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Établissement Cible</Label>
                                        <Select value={newItem.restaurantId} onValueChange={(v) => setNewItem({...newItem, restaurantId: v})}>
                                            <SelectTrigger className="h-16 bg-white/5 border-white/10 rounded-2xl text-white focus:ring-orange-500 font-bold italic">
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
                                            className="h-16 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 font-bold italic text-lg focus:border-orange-500/50"
                                            value={newItem.nom}
                                            onChange={(e) => setNewItem({...newItem, nom: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Quantité Initiale</Label>
                                            <Input 
                                                type="number" 
                                                className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black italic text-xl"
                                                value={newItem.quantite}
                                                onChange={(e) => setNewItem({...newItem, quantite: Number(e.target.value)})}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Unité</Label>
                                            <Select value={newItem.unite} onValueChange={(v) => setNewItem({...newItem, unite: v})}>
                                                <SelectTrigger className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-bold italic">
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
                                            className="h-16 bg-white/5 border-white/10 rounded-2xl text-white font-black italic text-xl"
                                            value={newItem.seuilAlerte}
                                            onChange={(e) => setNewItem({...newItem, seuilAlerte: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="p-10 pt-0 gap-4">
                                    <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="h-16 px-10 rounded-2xl font-black italic text-white/40 hover:bg-white/5 hover:text-white transition-all">Annuler</Button>
                                    <Button onClick={handleAddStock} disabled={isSubmitting} className="h-16 px-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black italic tracking-tight text-lg shadow-xl shadow-orange-500/20">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmer l&apos;Ajout'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <TabsContent value="inventaire" className="space-y-12 outline-none">
                        {/* Filters & Search */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-8 relative group">
                                <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-white/20 group-hover:text-orange-500 transition-colors" />
                                <Input 
                                    placeholder="Rechercher une référence..." 
                                    className="pl-16 h-20 bg-white/5 backdrop-blur-xl border-white/10 rounded-3xl text-white font-bold italic text-lg placeholder:text-white/20 focus:ring-orange-500/20 shadow-2xl" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-4 relative group">
                                <Filter className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-white/20 group-hover:text-orange-500 transition-colors" />
                                <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                                    <SelectTrigger className="pl-16 h-20 bg-white/5 backdrop-blur-xl border-white/10 rounded-3xl text-white font-bold italic shadow-2xl">
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
                        <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden p-4 md:p-8">
                            {/* Desktop View */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-white/5">
                                            <TableHead className="py-8 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Référence</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Statut Logistique</TableHead>
                                            <TableHead className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Volume Actuel</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Flux Temporel</TableHead>
                                            <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Actions</TableHead>
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
                                                            className="group border-white/5 hover:bg-white/5 transition-all rounded-2xl"
                                                        >
                                                            <TableCell className="py-10 px-8">
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-2xl italic tracking-tighter text-white group-hover:text-orange-500 transition-colors">{item.nom}</span>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-2 flex items-center gap-2">
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/20" /> {restaurantName}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={cn(
                                                                    "rounded-full px-5 py-1.5 font-black italic text-[10px] tracking-tight uppercase border backdrop-blur-md",
                                                                    isCritical ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                                                                    isLow ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                                                                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                                )}>
                                                                    {isCritical ? 'Rupture Totale' : isLow ? 'Seuil Critique' : 'Niveau Optimal'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex items-center justify-center gap-8">
                                                                    <button 
                                                                        className="h-12 w-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all font-black text-2xl"
                                                                        onClick={() => handleUpdateQuantity(item.id, item.quantite - 1)}
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <div className="min-w-[100px] group-hover:scale-110 transition-transform">
                                                                        <span className="text-4xl font-black italic tracking-tighter text-white">{item.quantite}</span>
                                                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">{item.unite}</p>
                                                                    </div>
                                                                    <button 
                                                                        className="h-12 w-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all font-black text-2xl"
                                                                        onClick={() => handleUpdateQuantity(item.id, item.quantite + 1)}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3 text-white/40 font-bold italic">
                                                                    <div className="p-2 bg-white/5 rounded-lg">
                                                                        <History className="h-4 w-4 opacity-50" />
                                                                    </div>
                                                                    <span className="text-sm">{format(new Date(item.derniereMiseAJour), "dd MMM, HH:mm")}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right px-8">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-12 w-12 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all" 
                                                                    onClick={() => handleDelete(item.id)}
                                                                >
                                                                    <Trash2 className="h-5 w-5" />
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
                                                                <h3 className="text-2xl font-black italic tracking-tight text-white uppercase">Aucune référence</h3>
                                                                <p className="text-white/40 font-medium max-w-xs mx-auto">Ajustez vos filtres ou effectuez une nouvelle acquisition.</p>
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
                                                className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-6 backdrop-blur-xl"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-black text-xl italic tracking-tighter text-white leading-tight">{item.nom}</h3>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <MapPin className="h-3 w-3 text-orange-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{restaurantName}</span>
                                                        </div>
                                                    </div>
                                                    <Badge className={cn(
                                                        "rounded-full px-3 py-1 font-black italic text-[8px] tracking-tight uppercase border shadow-sm",
                                                        isCritical ? "bg-red-500/20 text-red-500 border-red-500/30" : 
                                                        isLow ? "bg-amber-500/20 text-amber-500 border-amber-500/30 animate-pulse" : 
                                                        "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                                                    )}>
                                                        {isCritical ? 'Rupture' : isLow ? 'Critique' : 'Optimal'}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/10">
                                                    <div className="flex items-center gap-4">
                                                        <button 
                                                            className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 active:text-red-500 active:bg-red-500/10 transition-colors font-black text-xl border border-white/10"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantite - 1)}
                                                        >
                                                            -
                                                        </button>
                                                        <div className="text-center min-w-[70px]">
                                                            <span className="text-2xl font-black italic tracking-tighter text-white">{item.quantite}</span>
                                                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{item.unite}</p>
                                                        </div>
                                                        <button 
                                                            className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 active:text-emerald-500 active:bg-emerald-500/10 transition-colors font-black text-xl border border-white/10"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantite + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="flex items-center gap-1.5 text-white/30 text-[9px] font-black italic uppercase">
                                                            <History className="h-3 w-3" />
                                                            {format(new Date(item.derniereMiseAJour), "dd MMM")}
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-10 w-10 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all" 
                                                            onClick={() => handleDelete(item.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <div className="py-20 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Aucune référence</p>
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
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            className="p-10 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] relative overflow-hidden group shadow-2xl"
                        >
                            <div className="absolute top-0 left-0 w-2 h-full bg-orange-500" />
                            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                                <div className="h-20 w-20 bg-orange-500/10 border border-orange-500/20 rounded-3xl flex items-center justify-center shadow-inner">
                                    <AlertTriangle className="h-10 w-10 text-orange-500 animate-pulse" />
                                </div>
                                <div className="flex-1 text-center md:text-left space-y-3">
                                    <h4 className="text-3xl font-black italic tracking-tighter text-white leading-none">Vigilance Approvisionnement</h4>
                                    <p className="text-sm font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                                        Plusieurs références ont franchi le seuil critique de sécurité. <span className="text-orange-500 font-black italic">Urgence Logistique</span> détectée.
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => (document.querySelector('[value="courses"]') as HTMLElement)?.click()}
                                    className="h-16 px-12 bg-white text-[#0A0A0B] hover:bg-white/90 rounded-2xl font-black italic tracking-tight text-lg shadow-xl transition-all hover:scale-105 active:scale-95"
                                >
                                    Générer Liste de Frais
                                </Button>
                            </div>
                            
                            {/* Decorative background scanline */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
