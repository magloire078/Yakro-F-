'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { useFirebase } from '@/contexts/firebase-provider';
import {
  collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, Timestamp,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Loader, Tag, Plus, Trash2, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Coupon, CouponType } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileBackButton } from '@/components/mobile-back-button';

const CODE_PATTERN = /^[A-Z0-9]{4,12}$/;

export default function CouponsPage() {
  const { user, activeRole } = useAuth();
  const { restaurants } = useData();
  const { db } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const [code, setCode] = React.useState('');
  const [restaurantId, setRestaurantId] = React.useState('');
  const [type, setType] = React.useState<CouponType>('montant_fixe');
  const [valeur, setValeur] = React.useState('');
  const [montantMinimum, setMontantMinimum] = React.useState('');
  const [dateExpiration, setDateExpiration] = React.useState('');

  const myRestaurants = React.useMemo(() => {
    if (!user || activeRole !== 'restaurateur') return [];
    return restaurants.filter(r => r.proprietaireId === user.uid);
  }, [restaurants, user, activeRole]);

  React.useEffect(() => {
    if (user && activeRole !== 'restaurateur') {
      router.push('/');
    }
  }, [user, activeRole, router]);

  React.useEffect(() => {
    if (!user || activeRole !== 'restaurateur') return;
    const q = query(collection(db, 'coupons'), where('restaurateurId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon)));
    }, (error) => {
      console.error('Échec du chargement des codes promo:', error);
    });
    return () => unsubscribe();
  }, [db, user, activeRole]);

  React.useEffect(() => {
    if (myRestaurants.length > 0 && !restaurantId) {
      setRestaurantId(myRestaurants[0].id);
    }
  }, [myRestaurants, restaurantId]);

  const resetForm = () => {
    setCode('');
    setType('montant_fixe');
    setValeur('');
    setMontantMinimum('');
    setDateExpiration('');
  };

  const handleCreate = async () => {
    const normalizedCode = code.trim().toUpperCase();
    const restaurant = myRestaurants.find(r => r.id === restaurantId);
    const valeurNum = Number(valeur);

    if (!CODE_PATTERN.test(normalizedCode)) {
      toast({ variant: 'destructive', title: 'Code invalide', description: '4 à 12 lettres/chiffres, ex: YAKRO10.' });
      return;
    }
    if (!restaurant) {
      toast({ variant: 'destructive', title: 'Restaurant manquant', description: 'Sélectionnez un restaurant.' });
      return;
    }
    if (!valeurNum || valeurNum <= 0 || (type === 'pourcentage' && valeurNum > 100)) {
      toast({ variant: 'destructive', title: 'Valeur invalide', description: type === 'pourcentage' ? 'Entrez un pourcentage entre 1 et 100.' : 'Entrez un montant en FCFA supérieur à 0.' });
      return;
    }
    if (!dateExpiration) {
      toast({ variant: 'destructive', title: 'Date manquante', description: "Choisissez une date d'expiration." });
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'coupons', normalizedCode), {
        code: normalizedCode,
        restaurantId: restaurant.id,
        restaurateurId: restaurant.proprietaireId,
        type,
        valeur: valeurNum,
        ...(montantMinimum && { montantMinimum: Number(montantMinimum) }),
        dateExpiration: Timestamp.fromDate(new Date(dateExpiration)),
        actif: true,
      });
      toast({ title: 'Code promo créé !', description: `${normalizedCode} est actif dès maintenant.` });
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Échec de la création du code promo:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Ce code existe peut-être déjà, ou une information est invalide.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    setTogglingId(coupon.id);
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), { actif: !coupon.actif });
    } catch (error) {
      console.error('Échec de la mise à jour du code promo:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de modifier ce code pour le moment.' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (couponId: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', couponId));
    } catch (error) {
      console.error('Échec de la suppression du code promo:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer ce code pour le moment.' });
    }
  };

  const restaurantName = (id: string) => myRestaurants.find(r => r.id === id)?.nom || restaurants.find(r => r.id === id)?.nom || 'Restaurant';

  if (!user || activeRole !== 'restaurateur') return null;

  return (
    <div className="min-h-screen bg-transparent pb-24">
      <div className="md:hidden pt-6 px-4">
        <MobileBackButton label="Dashboard" href="/restaurateur" />
      </div>

      <div className="container mx-auto px-4 max-w-5xl pt-6 md:pt-12 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
              Promotions <span className="text-primary">Ciblées</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
              Codes de réduction pour vos clients — distincts de la mise en avant Boost
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="rounded-2xl h-14 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest"
                disabled={myRestaurants.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" /> Nouveau Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2rem]">
              <DialogHeader>
                <DialogTitle>Créer un code promo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {myRestaurants.length > 1 && (
                  <div className="space-y-2">
                    <Label>Restaurant</Label>
                    <Select value={restaurantId} onValueChange={setRestaurantId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {myRestaurants.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" placeholder="YAKRO10" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={type} onValueChange={(v: CouponType) => setType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="montant_fixe">Montant fixe (FCFA)</SelectItem>
                        <SelectItem value="pourcentage">Pourcentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valeur">Valeur</Label>
                    <Input id="valeur" type="number" min={1} placeholder={type === 'pourcentage' ? '10' : '1000'} value={valeur} onChange={(e) => setValeur(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="montantMinimum">Commande minimum (optionnel)</Label>
                  <Input id="montantMinimum" type="number" min={0} placeholder="3000" value={montantMinimum} onChange={(e) => setMontantMinimum(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateExpiration">Date d&apos;expiration</Label>
                  <Input id="dateExpiration" type="date" value={dateExpiration} onChange={(e) => setDateExpiration(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={isSaving} className="rounded-2xl w-full">
                  {isSaving ? <Loader className="h-4 w-4 animate-spin" /> : 'Créer le code'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {coupons.length > 0 ? (
          <div className="grid gap-4">
            <AnimatePresence>
              {coupons.map((coupon) => {
                const isExpired = coupon.dateExpiration.toDate().getTime() < Date.now();
                return (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="glass-dark p-6 rounded-[2rem] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
                        <Tag className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-black uppercase tracking-tight text-white">{coupon.code}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {coupon.type === 'montant_fixe' ? `${coupon.valeur.toLocaleString('fr-FR')} FCFA` : `${coupon.valeur}%`}
                          {' • '}{restaurantName(coupon.restaurantId)}
                          {' • '}Expire le {coupon.dateExpiration.toDate().toLocaleDateString('fr-FR')}
                          {isExpired && <span className="text-rose-500"> • Expiré</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-2">
                        {togglingId === coupon.id && <Loader className="h-4 w-4 animate-spin text-primary" />}
                        <Switch
                          checked={coupon.actif}
                          onCheckedChange={() => handleToggleActive(coupon)}
                          disabled={togglingId === coupon.id}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="text-slate-500 hover:text-red-500 transition-colors p-2"
                        aria-label={`Supprimer ${coupon.code}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="glass-dark p-16 text-center rounded-[3rem] border border-white/5">
            <Ticket className="h-16 w-16 text-primary/20 mx-auto mb-6" />
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Aucun code promo</h2>
            <p className="text-slate-400 text-sm">
              {myRestaurants.length === 0
                ? 'Créez un restaurant avant de lancer une promotion.'
                : 'Créez votre premier code pour attirer de nouveaux clients.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
