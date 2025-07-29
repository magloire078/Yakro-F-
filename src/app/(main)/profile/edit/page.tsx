
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
import { Loader, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  phone: z.string().optional(),
  defaultAddress: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function EditProfilePage() {
    const { user, userProfile, updateUserProfile, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: '',
            phone: '',
            defaultAddress: '',
        },
    });

    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
        if (userProfile) {
            form.reset({
                name: userProfile.name || '',
                phone: userProfile.phone || '',
                defaultAddress: userProfile.defaultAddress || '',
            });
        }
    }, [user, userProfile, authLoading, router, form]);


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
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de mettre à jour votre profil pour le moment.'
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (authLoading || !userProfile) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <Loader className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

  return (
    <div className="container mx-auto">
        <Button variant="ghost" asChild className="mb-8">
            <Link href="/profile">
                <ArrowLeft/>
                Retour au profil
            </Link>
        </Button>
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <User className="h-8 w-8 text-primary"/>
                        <div>
                            <CardTitle className="text-2xl">Modifier votre profil</CardTitle>
                            <CardDescription>Mettez à jour vos informations personnelles.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="name"
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
                                name="phone"
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
                            <FormField
                                control={form.control}
                                name="defaultAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adresse par défaut</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Yamoussoukro, Quartier des Lacs, Villa 24" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                Enregistrer les modifications
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
