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
            <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-10">
                    <div className="absolute inset-0 bg-orange-500/10 blur-3xl scale-150" />
                    <Warehouse className="h-24 w-24 text-gray-800 relative" />
                </div>
                <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-4">Stockage <span className="text-orange-500">Inactif</span></h1>
                <p className="text-gray-500 max-w-md mb-10 font-medium uppercase tracking-widest text-[10px]">
                    Vous devez posséder un établissement actif pour commencer à gérer votre inventaire d&apos;excellence.
                </p>
                <Button 
                    onClick={() => router.push('/dashboard/new-restaurant')}
                    className="h-16 px-12 bg-orange-500 hover:bg-orange-600 text-white rounded-none font-black italic uppercase tracking-tighter transition-all duration-500 hover:scale-105"
                >
                    Inaugurer un Restaurant
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-24 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-500/5 to-transparent" />

            {/* Elite Stock Header */}
            <div className="relative h-[30vh] md:h-[40vh] w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"
                        alt="Inventory Background"
                        fill
                        className="object-cover opacity-20 scale-110 animate-slow-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/40 to-black/60 z-10" />
                </div>
                
                <MobileBackButton />

                <div className="relative z-30 text-center space-y-4 md:space-y-6 px-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-md mb-2 animate-fade-in-up">
                        <Warehouse className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Gestion de l&apos;Approvisionnement</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white italic leading-none animate-fade-in-up delay-100">
                        Contrôle <span className="text-orange-500">Inventaire</span>
                    </h1>
                    
                    <div className="flex justify-center gap-6 md:gap-16 mt-8 animate-fade-in-up delay-200">
                        <div className="text-center">
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Total</p>
                            <p className="text-2xl md:text-4xl font-black text-white tracking-tighter">{stats.total}</p>
                        </div>
                        <div className="w-px h-8 md:h-12 bg-white/10 self-center" />
                        <div className="text-center">
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-1">Faible</p>
                            <p className="text-2xl md:text-4xl font-black text-amber-500 tracking-tighter">{stats.low}</p>
                        </div>
                        <div className="w-px h-8 md:h-12 bg-white/10 self-center" />
                        <div className="text-center">
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-1">Ruptures</p>
                            <p className="text-2xl md:text-4xl font-black text-red-500 tracking-tighter">{stats.critical}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl -mt-10 relative z-40 space-y-10">
                <Tabs defaultValue="inventaire" className="w-full">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-[#121214]/60 backdrop-blur-md border border-white/5 p-2">
                        <TabsList className="bg-transparent h-12 md:h-14 p-0 w-full md:w-auto overflow-x-auto">
                            <TabsTrigger 
                                value="inventaire" 
                                className="flex-1 md:flex-none h-full px-4 md:px-8 rounded-none font-black italic uppercase tracking-tighter text-xs md:text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
                            >
                                Vision Globale
                            </TabsTrigger>
                            <TabsTrigger 
                                value="courses" 
                                className="flex-1 md:flex-none h-full px-4 md:px-8 rounded-none font-black italic uppercase tracking-tighter text-xs md:text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all flex items-center justify-center gap-2 md:gap-3"
                            >
                                Liste
                                {stats.low + stats.critical > 0 && (
                                    <span className="h-4 w-4 md:h-5 md:w-5 bg-orange-500/20 text-orange-500 text-[8px] md:text-[10px] flex items-center justify-center font-black">
                                        {stats.low + stats.critical}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                        
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full md:w-auto h-12 md:h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white rounded-none font-black italic uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                                    <Plus className="mr-2 md:mr-3 h-4 md:h-5 w-4 md:w-5" />
                                    Nouvelle Acquisition
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] bg-[#0A0A0B] border border-white/10 rounded-none p-0 overflow-hidden shadow-2xl">
                                <div className="relative p-8 border-b border-white/5 bg-[#121214]">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                                    <DialogHeader>
                                        <div className="inline-flex items-center gap-2 mb-4">
                                            <Warehouse className="h-4 w-4 text-orange-500" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Logistique Culinaire</span>
                                        </div>
                                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">Ajouter au Stock</DialogTitle>
                                        <DialogDescription className="text-gray-500 font-medium">Référencez un nouvel intrant dans votre chaîne logistique.</DialogDescription>
                                    </DialogHeader>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Établissement Cible</Label>
                                        <Select value={newItem.restaurantId} onValueChange={(v) => setNewItem({...newItem, restaurantId: v})}>
                                            <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-none text-white focus:ring-orange-500">
                                                <SelectValue placeholder="Séléctionnez un lieu" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#121214] border-white/10 text-white rounded-none">
                                                {myRestaurants.map(r => (
                                                    <SelectItem key={r.id} value={r.id} className="focus:bg-orange-500 focus:text-white rounded-none">{r.nom}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Désignation</Label>
                                        <Input 
                                            placeholder="Ex: Riz Parfumé, Huile d'Olive..." 
                                            className="h-14 bg-white/5 border-white/10 rounded-none text-white placeholder:text-gray-700"
                                            value={newItem.nom}
                                            onChange={(e) => setNewItem({...newItem, nom: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Quantité Initiale</Label>
                                            <Input 
                                                type="number" 
                                                className="h-14 bg-white/5 border-white/10 rounded-none text-white"
                                                value={newItem.quantite}
                                                onChange={(e) => setNewItem({...newItem, quantite: Number(e.target.value)})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Unité de Mesure</Label>
                                            <Select value={newItem.unite} onValueChange={(v) => setNewItem({...newItem, unite: v})}>
                                                <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-none text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#121214] border-white/10 text-white rounded-none">
                                                    {['unités', 'kg', 'g', 'l', 'ml', 'caisses', 'sacs'].map(u => (
                                                        <SelectItem key={u} value={u} className="focus:bg-orange-500 focus:text-white rounded-none uppercase text-[10px] font-black">{u}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Seuil de Vigilance</Label>
                                        <Input 
                                            type="number" 
                                            className="h-14 bg-white/5 border-white/10 rounded-none text-white"
                                            value={newItem.seuilAlerte}
                                            onChange={(e) => setNewItem({...newItem, seuilAlerte: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="p-8 pt-0 border-t border-white/5 bg-[#121214]/50 gap-3">
                                    <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="h-14 px-8 rounded-none font-bold uppercase text-[10px] tracking-widest text-white hover:bg-white/5">Annuler</Button>
                                    <Button onClick={handleAddStock} disabled={isSubmitting} className="h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white rounded-none font-black italic uppercase tracking-tighter">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmer l&apos;Ajout'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <TabsContent value="inventaire" className="space-y-10 outline-none">
                        {/* Filters & Search */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-8 relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700" />
                                <Input 
                                    placeholder="Rechercher une référence..." 
                                    className="pl-16 h-16 bg-[#121214]/60 backdrop-blur-md border-white/5 rounded-none text-white placeholder:text-gray-700 focus:border-orange-500/50" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-4 relative group">
                                <Filter className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700 group-hover:text-orange-500 transition-colors" />
                                <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                                    <SelectTrigger className="pl-16 h-16 bg-[#121214]/60 backdrop-blur-md border-white/5 rounded-none text-white">
                                        <SelectValue placeholder="Filtrer par lieu" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#121214] border-white/10 text-white rounded-none">
                                        <SelectItem value="all" className="focus:bg-orange-500 focus:text-white rounded-none">Tous les établissements</SelectItem>
                                        {myRestaurants.map(r => (
                                            <SelectItem key={r.id} value={r.id} className="focus:bg-orange-500 focus:text-white rounded-none">{r.nom}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Inventory Table */}
                        <div className="bg-[#121214]/40 backdrop-blur-md border border-white/5 relative overflow-hidden">
                            {/* Desktop View */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader className="bg-[#121214] border-b border-white/5">
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableHead className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Référence</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Statut Logistique</TableHead>
                                            <TableHead className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Volume Actuel</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Flux Temporel</TableHead>
                                            <TableHead className="text-right px-10 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Actions</TableHead>
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
                                                            className="group border-b border-white/5 hover:bg-white/[0.02] transition-all"
                                                        >
                                                            <TableCell className="py-8 px-10">
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-xl italic uppercase tracking-tighter text-white group-hover:text-orange-500 transition-colors">{item.nom}</span>
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 mt-1 flex items-center gap-2">
                                                                        <MapPin className="h-2 w-2 text-orange-500" /> {restaurantName}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={cn(
                                                                    "rounded-none px-3 py-1 font-black uppercase text-[8px] tracking-widest border",
                                                                    isCritical ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                                                                    isLow ? "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse" : 
                                                                    "bg-green-500/10 text-green-500 border-green-500/20"
                                                                )}>
                                                                    {isCritical ? 'Rupture Totale' : isLow ? 'Seuil Critique' : 'Niveau Optimal'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex items-center justify-center gap-6">
                                                                    <button 
                                                                        className="h-10 w-10 bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all font-black text-lg"
                                                                        onClick={() => handleUpdateQuantity(item.id, item.quantite - 1)}
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <div className="min-w-[80px]">
                                                                        <span className="text-3xl font-black italic tracking-tighter text-white">{item.quantite}</span>
                                                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">{item.unite}</p>
                                                                    </div>
                                                                    <button 
                                                                        className="h-10 w-10 bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-green-500/20 hover:border-green-500/30 transition-all font-black text-lg"
                                                                        onClick={() => handleUpdateQuantity(item.id, item.quantite + 1)}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2 text-gray-500 font-bold text-xs italic">
                                                                    <History className="h-3 w-3 opacity-50" />
                                                                    {format(new Date(item.derniereMiseAJour), "dd MMM, HH:mm")}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right px-10">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-12 w-12 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-none transition-colors" 
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
                                                    <TableCell colSpan={5} className="h-96 text-center border-none">
                                                        <div className="flex flex-col items-center justify-center space-y-6">
                                                            <div className="p-8 bg-white/5 border border-white/5 relative">
                                                                <Package className="h-16 w-16 text-gray-800" />
                                                                <div className="absolute inset-0 bg-orange-500/5 blur-2xl" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">Aucune référence détectée</p>
                                                                <p className="text-xs text-gray-500 font-medium">Ajustez vos filtres ou effectuez une nouvelle acquisition.</p>
                                                            </div>
                                                            <Button 
                                                                variant="ghost" 
                                                                className="text-orange-500 font-black uppercase text-[10px] tracking-widest border border-orange-500/20 rounded-none h-12 px-8 hover:bg-orange-500/5" 
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
                            <div className="md:hidden space-y-px bg-white/5">
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
                                                className="bg-[#121214] p-4 flex flex-col gap-4"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-black text-lg italic uppercase tracking-tighter text-white">{item.nom}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <MapPin className="h-3 w-3 text-orange-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{restaurantName}</span>
                                                        </div>
                                                    </div>
                                                    <Badge className={cn(
                                                        "rounded-none px-2 py-0.5 font-black uppercase text-[7px] tracking-widest border",
                                                        isCritical ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                                                        isLow ? "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse" : 
                                                        "bg-green-500/10 text-green-500 border-green-500/20"
                                                    )}>
                                                        {isCritical ? 'Rupture' : isLow ? 'Critique' : 'Optimal'}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center justify-between bg-white/5 p-3">
                                                    <div className="flex items-center gap-4">
                                                        <button 
                                                            className="h-10 w-10 bg-white/10 flex items-center justify-center text-white active:bg-red-500/40 transition-colors font-black text-xl"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantite - 1)}
                                                        >
                                                            -
                                                        </button>
                                                        <div className="text-center min-w-[60px]">
                                                            <span className="text-2xl font-black italic tracking-tighter text-white">{item.quantite}</span>
                                                            <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{item.unite}</p>
                                                        </div>
                                                        <button 
                                                            className="h-10 w-10 bg-white/10 flex items-center justify-center text-white active:bg-green-500/40 transition-colors font-black text-xl"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantite + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-1.5 text-gray-600 text-[10px] font-bold italic">
                                                            <History className="h-2.5 w-2.5" />
                                                            {format(new Date(item.derniereMiseAJour), "dd MMM")}
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-none transition-colors" 
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
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">Aucune référence</p>
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
                            className="p-8 bg-[#121214] border border-orange-500/30 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                <div className="h-16 w-16 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                    <AlertTriangle className="h-8 w-8 text-orange-500 animate-pulse" />
                                </div>
                                <div className="flex-1 text-center md:text-left space-y-2">
                                    <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">Vigilance Approvisionnement</h4>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                                        Plusieurs références ont franchi le seuil critique de sécurité. <span className="text-orange-500">Urgence Logistique</span> détectée.
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => (document.querySelector('[value="courses"]') as HTMLElement)?.click()}
                                    className="h-14 px-10 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-none font-black italic uppercase tracking-tighter"
                                >
                                    Générer Liste de Frais
                                </Button>
                            </div>
                            
                            {/* Decorative background scanline */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
