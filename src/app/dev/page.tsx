'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { seedDatabaseAction } from '@/app/actions/seed-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader, Database, PlayCircle, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { E2EWorkbench } from '@/components/dev/e2e-workbench';

export default function DevPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [isDevBypass, setIsDevBypass] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    // En développement local ou via IP de test, accès direct pour simplifier les tests
    if (typeof window !== 'undefined') {
      const isLocal =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('10.') ||
        window.location.hostname.startsWith('192.168.') ||
        process.env.NODE_ENV === 'development';

      if (isLocal) {
        setIsDevBypass(true);
        return;
      }
    }

    if (!authLoading) {
      if (!user || userProfile?.roleSysteme !== 'SuperAdmin') {
        toast({
          variant: 'destructive',
          title: 'Accès non autorisé',
          description: 'Cette page est réservée aux administrateurs.',
        });
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router, toast]);

  const handleSeedDatabase = async () => {
    const uid = user?.uid || 'seed-dev-admin';
    setIsSeeding(true);
    toast({
      title: 'Peuplement de la base de données...',
      description: 'Cette opération peut prendre quelques instants.',
    });
    try {
      const result = await seedDatabaseAction(uid);
      if (result.success) {
        toast({
          title: 'Base de données peuplée !',
          description: result.message,
        });
      } else {
        toast({
          variant: 'default',
          title: 'Opération ignorée',
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur lors du peuplement',
        description: error instanceof Error ? error.message : 'Une erreur est survenue.',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const isAuthorized = isDevBypass || userProfile?.roleSysteme === 'SuperAdmin';

  if (authLoading && !isDevBypass) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-dvh w-full items-center justify-center p-4">
        <Card className="max-w-md w-full border border-white/10 bg-card/90 backdrop-blur-xl text-center p-6 rounded-3xl">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-3" />
          <h2 className="text-lg font-bold">Accès Administrateur Requis</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Connectez-vous avec un compte SuperAdmin pour accéder aux outils de test en production.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 py-6 max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-headline tracking-tight text-foreground">
            Outils de Test &amp; Développement
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Console de simulation et de diagnostic pour l&apos;application Yakro-Fê.
          </p>
        </div>
      </div>

      <Tabs defaultValue="e2e" className="w-full space-y-6">
        <TabsList className="bg-muted/40 border border-white/5 p-1 rounded-2xl h-11">
          <TabsTrigger value="e2e" className="rounded-xl font-bold text-xs sm:text-sm px-4">
            <PlayCircle className="mr-2 h-4 w-4" />
            Simulateur E2E
          </TabsTrigger>
          <TabsTrigger value="database" className="rounded-xl font-bold text-xs sm:text-sm px-4">
            <Database className="mr-2 h-4 w-4" />
            Base de Données
          </TabsTrigger>
        </TabsList>

        {/* Tab 1 : Simulateur E2E */}
        <TabsContent value="e2e" className="space-y-6 focus-visible:outline-none">
          <E2EWorkbench />
        </TabsContent>

        {/* Tab 2 : Base de données & Initialisation */}
        <TabsContent value="database" className="space-y-6 focus-visible:outline-none">
          <Card className="border border-white/10 bg-card/80 backdrop-blur-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base font-black">Peupler la Base de Données</CardTitle>
              <CardDescription className="text-xs">
                Insère les restaurants et plats initiaux de Yamoussoukro si la collection est vide.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-white/5 rounded-2xl bg-muted/20">
                <div className="flex-1">
                  <h3 className="font-bold text-sm">Initialiser les maquis et restaurants</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ajoute « Maquis du Val », « Le Grand Large », « Pizza Bella », et « Le Régal d&apos;Afrique » avec coordonnées GPS réelles.
                  </p>
                </div>
                <Button onClick={handleSeedDatabase} disabled={isSeeding} className="rounded-xl font-bold text-xs h-9">
                  {isSeeding ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <Database className="mr-2 h-4 w-4" />}
                  Lancer le peuplement
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
