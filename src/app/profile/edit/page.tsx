
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
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const profileFormSchema = z.object({
  nom: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  telephone: z.string().optional(),
  adresseParDefaut: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function EditProfilePage() {
    const { user, userProfile, updateUserProfile } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            nom: '',
            telephone: '',
            adresseParDefaut: '',
        },
    });

    React.useEffect(() => {
        if (userProfile) {
            form.reset({
                nom: userProfile.nom || '',
                telephone: userProfile.telephone || '',
                adresseParDefaut: userProfile.adresseParDefaut || '',
            });
        }
    }, [userProfile, form]);


    const onSubmit = async (data: ProfileFormValues) => {
        if(!user) return;
        setIsSubmitting(true);
        try {
            await updateUserProfile(user.uid, data);
            toast({
                title: 'Profil mis à jour !',
                description: 'Vos informations ont été enregistrées avec succès.',
            });
            router.push('/profile');
        } catch {
            // The auth context now handles the server action which emits the error
            // so we just show a generic message here.
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de mettre à jour votre profil. Vérifiez les permissions.'
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (!userProfile) {
        return null;
    }

  return (
    <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Button variant="ghost" asChild className="mb-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-orange-500">
            <Link href="/profile">
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Retour au profil
            </Link>
        </Button>

        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/10">
                    <User className="h-6 w-6 text-orange-500"/>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500/70">Identité</p>
                    <h1 className="text-3xl font-headline font-black italic uppercase tracking-tighter text-foreground leading-none">
                        Modifier votre <span className="text-orange-500">Profil</span>
                    </h1>
                </div>
            </div>

            <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-[2rem] shadow-2xl p-8 md:p-10">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="nom"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom complet</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Aïcha Koné" className="h-12 rounded-2xl border-border/50 bg-background/50 focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50" {...field} />
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
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Numéro de téléphone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: 07 01 02 03 04" className="h-12 rounded-2xl border-border/50 bg-background/50 focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="adresseParDefaut"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adresse par défaut</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Yamoussoukro, Quartier des Lacs, Villa 24" className="h-12 rounded-2xl border-border/50 bg-background/50 focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-2xl shadow-orange-500/20 transition-all"
                        >
                            {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer les modifications
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    </div>
  );
}
