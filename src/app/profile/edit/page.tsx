'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader, User, ArrowLeft, MapPin, Plus, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { SavedAddress } from '@/lib/types';
import {
  generateAddressId,
  getUserAddresses,
  normalizeAddresses,
} from '@/lib/addresses';
import { Badge } from '@/components/ui/badge';

const profileFormSchema = z.object({
  nom: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  telephone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const addressFormSchema = z.object({
  libelle: z.string().min(2, "Donnez un libellé (Maison, Travail, etc.)."),
  adresse: z.string().min(10, "L'adresse doit contenir au moins 10 caractères."),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

export default function EditProfilePage() {
    const { user, userProfile, updateUserProfile } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = React.useState(false);
    const [pendingCoords, setPendingCoords] = React.useState<{ latitude: number; longitude: number } | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: { nom: '', telephone: '' },
    });

    const addressForm = useForm<AddressFormValues>({
        resolver: zodResolver(addressFormSchema),
        defaultValues: { libelle: '', adresse: '' },
    });

    React.useEffect(() => {
        if (userProfile) {
            form.reset({
                nom: userProfile.nom || '',
                telephone: userProfile.telephone || '',
            });
        }
    }, [userProfile, form]);

    const addresses = React.useMemo(() => getUserAddresses(userProfile), [userProfile]);

    const persistAddresses = async (next: SavedAddress[]) => {
        if (!user) return;
        const normalized = normalizeAddresses(next);
        const defaultOne = normalized.find(a => a.parDefaut);
        await updateUserProfile(user.uid, {
            adresses: normalized,
            // Maintient la compat : adresseParDefaut reflète celle marquée par défaut.
            adresseParDefaut: defaultOne?.adresse ?? '',
        });
    };

    const onSubmit = async (data: ProfileFormValues) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await updateUserProfile(user.uid, data);
            toast({ title: 'Profil mis à jour !', description: 'Vos informations ont été enregistrées.' });
            router.push('/profile');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour votre profil.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast({ variant: 'destructive', title: 'Géolocalisation non supportée' });
            return;
        }
        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
            position => {
                setPendingCoords({
                    latitude: parseFloat(position.coords.latitude.toFixed(6)),
                    longitude: parseFloat(position.coords.longitude.toFixed(6)),
                });
                toast({ title: 'Position GPS récupérée', description: 'Elle sera associée à la prochaine adresse ajoutée.' });
                setIsFetchingLocation(false);
            },
            () => {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de récupérer la position.' });
                setIsFetchingLocation(false);
            }
        );
    };

    const handleAddAddress = async (data: AddressFormValues) => {
        const newAddress: SavedAddress = {
            id: generateAddressId(),
            libelle: data.libelle,
            adresse: data.adresse,
            ...(pendingCoords ?? {}),
            parDefaut: addresses.length === 0,
        };
        try {
            await persistAddresses([...addresses, newAddress]);
            toast({ title: 'Adresse ajoutée', description: `« ${data.libelle} » a été enregistrée.` });
            addressForm.reset();
            setPendingCoords(null);
        } catch {
            toast({ variant: 'destructive', title: 'Erreur', description: "L'adresse n'a pas pu être enregistrée." });
        }
    };

    const handleSetDefault = async (id: string) => {
        const next = addresses.map(a => ({ ...a, parDefaut: a.id === id }));
        await persistAddresses(next);
        toast({ title: 'Adresse par défaut mise à jour' });
    };

    const handleDelete = async (id: string) => {
        const next = addresses.filter(a => a.id !== id);
        await persistAddresses(next);
        toast({ title: 'Adresse supprimée' });
    };

    if (!userProfile) return null;

    return (
        <div className="container mx-auto">
            <Button variant="ghost" asChild className="mb-8">
                <Link href="/profile">
                    <ArrowLeft />
                    Retour au profil
                </Link>
            </Button>
            <div className="max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <User className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle className="text-2xl">Informations personnelles</CardTitle>
                                <CardDescription>Mettez à jour votre nom et téléphone.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="nom"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom complet</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Aïcha Koné" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="telephone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Numéro de téléphone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: 07 01 02 03 04" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                    Enregistrer
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <MapPin className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle className="text-2xl">Mes adresses</CardTitle>
                                <CardDescription>Enregistrez plusieurs adresses (Maison, Travail, etc.) et choisissez la livraison rapidement.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {addresses.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucune adresse enregistrée.</p>
                        ) : (
                            <div className="space-y-3">
                                {addresses.map(a => (
                                    <div key={a.id} className="flex items-start justify-between rounded-md border p-3 gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-medium">{a.libelle}</p>
                                                {a.parDefaut && (
                                                    <Badge variant="default" className="bg-primary/15 text-primary border-primary/30">
                                                        <Star className="h-3 w-3 mr-1 fill-current" /> Par défaut
                                                    </Badge>
                                                )}
                                                {a.latitude && a.longitude && (
                                                    <Badge variant="outline" className="text-xs">GPS</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{a.adresse}</p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            {!a.parDefaut && (
                                                <Button variant="outline" size="sm" onClick={() => handleSetDefault(a.id)}>
                                                    <Star className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} aria-label="Supprimer">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Form {...addressForm}>
                            <form onSubmit={addressForm.handleSubmit(handleAddAddress)} className="space-y-4 rounded-md border-2 border-dashed p-4">
                                <p className="text-sm font-medium">Ajouter une adresse</p>
                                <FormField
                                    control={addressForm.control}
                                    name="libelle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Libellé</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Maison / Travail / Chez Maman…" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={addressForm.control}
                                    name="adresse"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Adresse complète</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Quartier, rue, repère, étage…" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex items-center justify-between gap-3">
                                    <Button type="button" variant="outline" size="sm" onClick={handleGetLocation} disabled={isFetchingLocation}>
                                        {isFetchingLocation ? <Loader className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                                        {pendingCoords ? 'GPS prêt' : 'Capturer ma position'}
                                    </Button>
                                    <Button type="submit" disabled={addressForm.formState.isSubmitting}>
                                        <Plus className="h-4 w-4" />
                                        Ajouter
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
