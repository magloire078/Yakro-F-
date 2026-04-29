'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, Star, Loader, Megaphone } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import type { DayOfWeek, HappyHour, Restaurant } from '@/lib/types';
import { ORDERED_DAYS, DAY_LABELS } from '@/lib/restaurant-hours';
import { isHappyHourActive, formatHappyHourLabel } from '@/lib/promotions';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const DEFAULT_HAPPY_HOUR: HappyHour = {
    pourcentage: 15,
    debut: '17:00',
    fin: '19:00',
    actif: false,
};

interface RestaurantPromoCardProps {
    restaurant: Restaurant;
}

function RestaurantPromoCard({ restaurant }: RestaurantPromoCardProps) {
    const { db } = useFirebase();
    const { menuItems } = useData();
    const { toast } = useToast();
    const [hh, setHh] = React.useState<HappyHour>(restaurant.happyHour ?? DEFAULT_HAPPY_HOUR);
    const [platDuJourId, setPlatDuJourId] = React.useState<string>(restaurant.platDuJourId ?? '');
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        setHh(restaurant.happyHour ?? DEFAULT_HAPPY_HOUR);
        setPlatDuJourId(restaurant.platDuJourId ?? '');
    }, [restaurant.id, restaurant.happyHour, restaurant.platDuJourId]);

    const platsRestaurant = menuItems.filter(i => i.restaurantId === restaurant.id && !i.indisponible);

    const toggleDay = (day: DayOfWeek) => {
        const current = hh.jours ?? [];
        const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
        setHh({ ...hh, jours: next.length === 0 ? undefined : next });
    };

    const persist = async () => {
        if (hh.pourcentage < 1 || hh.pourcentage > 50) {
            toast({ variant: 'destructive', title: 'Pourcentage invalide', description: 'La réduction doit être entre 1 et 50%.' });
            return;
        }
        setSaving(true);
        try {
            const data: Partial<Restaurant> = {
                happyHour: hh,
                platDuJourId: platDuJourId || undefined,
            };
            // updateDoc ignore les valeurs undefined côté Firestore? Non, il les écrit comme deleteField.
            // Pour une simple suppression, on enverrait deleteField(); ici on laisse la chaîne vide remplacée par null.
            await updateDoc(doc(db, 'restaurants', restaurant.id), {
                happyHour: hh,
                platDuJourId: platDuJourId || null,
            });
            toast({ title: 'Promotions enregistrées' });
        } catch {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'enregistrer les promotions." });
        } finally {
            setSaving(false);
        }
    };

    const isActive = isHappyHourActive(hh);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="font-headline text-xl">{restaurant.nom}</CardTitle>
                    {isActive && <Badge className="bg-pink-500 hover:bg-pink-500"><Sparkles className="h-3 w-3 mr-1" /> Active</Badge>}
                </div>
                <CardDescription>{restaurant.cuisine}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-pink-500" />
                            <span className="font-medium">Happy Hour</span>
                        </div>
                        <Switch checked={hh.actif} onCheckedChange={v => setHh({ ...hh, actif: v })} />
                    </div>
                    <p className="text-xs text-muted-foreground">Réduction automatique sur toute la carte pendant la plage horaire.</p>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label className="text-xs">% Réduction</Label>
                            <Input
                                type="number"
                                min={1}
                                max={50}
                                value={hh.pourcentage}
                                onChange={e => setHh({ ...hh, pourcentage: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Début</Label>
                            <Input type="time" value={hh.debut} onChange={e => setHh({ ...hh, debut: e.target.value })} />
                        </div>
                        <div>
                            <Label className="text-xs">Fin</Label>
                            <Input type="time" value={hh.fin} onChange={e => setHh({ ...hh, fin: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs">Jours actifs (vide = tous les jours)</Label>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {ORDERED_DAYS.map(d => {
                                const selected = (hh.jours ?? []).includes(d);
                                return (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => toggleDay(d)}
                                        className={cn(
                                            'rounded-md border px-2 py-0.5 text-xs',
                                            selected ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                                        )}
                                    >
                                        {DAY_LABELS[d].slice(0, 3)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {hh.actif && (
                        <p className="text-xs text-pink-700 dark:text-pink-300">
                            {formatHappyHourLabel(hh)}
                        </p>
                    )}
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium">Plat du jour</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Mis en avant côté client avec un badge sur la fiche restaurant.</p>
                    {platsRestaurant.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun plat disponible. Ajoutez d'abord des plats au menu.</p>
                    ) : (
                        <select
                            value={platDuJourId}
                            onChange={e => setPlatDuJourId(e.target.value)}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        >
                            <option value="">— Aucun —</option>
                            {platsRestaurant.map(p => (
                                <option key={p.id} value={p.id}>{p.nom} — {p.prix.toLocaleString('fr-FR')} FCFA</option>
                            ))}
                        </select>
                    )}
                </div>

                <Button onClick={persist} disabled={saving} className="w-full">
                    {saving && <Loader className="animate-spin" />}
                    Enregistrer les promotions
                </Button>
            </CardContent>
        </Card>
    );
}

export default function PromotionsPage() {
    const { user, activeRole } = useAuth();
    const { restaurants } = useData();
    const router = useRouter();

    React.useEffect(() => {
        if (user && activeRole !== 'restaurateur') {
            router.push('/');
        }
    }, [user, activeRole, router]);

    const myRestaurants = React.useMemo(() => {
        if (!user) return [];
        return restaurants.filter(r => r.proprietaireId === user.uid);
    }, [restaurants, user]);

    return (
        <div className="container mx-auto pb-12">
            <div className="flex items-center gap-4 mb-8">
                <Megaphone className="h-10 w-10 text-primary" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-headline text-primary">Promotions</h1>
                    <p className="text-muted-foreground">Lancez des happy hours et mettez un plat du jour en avant.</p>
                </div>
            </div>

            {myRestaurants.length === 0 ? (
                <Card className="max-w-lg mx-auto text-center p-8">
                    <CardHeader>
                        <CardTitle>Aucun restaurant</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>Créez d'abord un restaurant pour configurer des promotions.</CardDescription>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myRestaurants.map(r => (
                        <RestaurantPromoCard key={r.id} restaurant={r} />
                    ))}
                </div>
            )}
        </div>
    );
}
