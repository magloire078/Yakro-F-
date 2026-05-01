
'use client';

import * as React from 'react';
import { useData } from '@/contexts/data-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateVideoAction } from '@/app/actions/ai-actions';
import { type Restaurant } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader, Video } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function MarketingPage() {
  const { restaurants } = useData();
  const [myRestaurants, setMyRestaurants] = React.useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { user, activeRole } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (user && activeRole !== 'restaurateur') {
        toast({
            variant: 'destructive',
            title: 'Accès non autorisé',
            description: 'Veuillez sélectionner le profil "Restaurateur" pour accéder à cette page.',
        })
        router.push('/');
    }
  }, [user, router, activeRole, toast]);

   React.useEffect(() => {
    if (user && activeRole === 'restaurateur') {
      const filtered = restaurants.filter(r => r.proprietaireId === user.uid);
      setMyRestaurants(filtered);
      if(filtered.length > 0 && !selectedRestaurant) {
        setSelectedRestaurant(filtered[0]);
      }
    }
  }, [restaurants, user, activeRole, selectedRestaurant]);

  const restaurantImage = selectedRestaurant?.image || null;

  const handleGenerateVideo = async () => {
    if (!selectedRestaurant) return;

    setLoading(true);
    setVideoUrl(null);
    toast({
      title: 'Génération de la vidéo en cours...',
      description: 'L\'IA réalise votre spot publicitaire. Cette opération peut prendre jusqu\'à une minute, veuillez patienter.',
    });

    try {
      const result = await generateVideoAction({
        restaurantName: selectedRestaurant.nom,
        cuisine: selectedRestaurant.cuisine,
        imageUrl: restaurantImage,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setVideoUrl(result.data.videoUrl);
      toast({
        title: 'Vidéo générée avec succès !',
        description: `Votre spot publicitaire pour ${selectedRestaurant.nom} est prêt.`,
      });
    } catch (error) {
      console.error('Failed to generate video:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur de génération vidéo',
        description: "Impossible de générer la vidéo. Le modèle est peut-être surchargé ou l'URL de l'image est inaccessible. Veuillez réessayer plus tard.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-headline text-primary">Marketing Vidéo IA</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Générateur de Publicité Vidéo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="font-medium">1. Sélectionnez un restaurant</label>
              <Select
                onValueChange={value => {
                  setSelectedRestaurant(myRestaurants.find(r => r.id === value) || null);
                  setVideoUrl(null);
                }}
                value={selectedRestaurant?.id || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisissez un de vos restaurants" />
                </SelectTrigger>
                <SelectContent>
                  {myRestaurants.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
                <label className="font-medium">2. Image de référence</label>
                <div className="border rounded-lg p-2 bg-muted h-48 flex items-center justify-center">
                   {restaurantImage ? (
                     <Image src={restaurantImage} alt={selectedRestaurant?.nom || "Image de référence"} width={300} height={150} className="object-contain rounded-md" />
                   ) : (
                    <p className="text-sm text-muted-foreground">L&apos;image du restaurant apparaîtra ici.</p>
                   )}
                </div>
                <p className="text-xs text-muted-foreground">L&apos;IA animera cette image ou s&apos;en inspirera. Si aucune image n&apos;est disponible, l&apos;IA créera une vidéo de A à Z.</p>
            </div>

            <Button onClick={handleGenerateVideo} disabled={loading || !selectedRestaurant} className="w-full" size="lg">
              {loading ? <Loader className="animate-spin" /> : <Video className="mr-2" />}
              {loading ? 'Génération en cours...' : 'Générer la vidéo promotionnelle'}
            </Button>
          </CardContent>
        </Card>
        
        <div className="flex flex-col">
            <h2 className="text-2xl font-headline mb-4">Résultat</h2>
            <Card className="flex-1 flex items-center justify-center bg-muted/30">
                 {loading && (
                    <div className="text-center text-muted-foreground p-8">
                      <Loader className="animate-spin h-12 w-12 mx-auto mb-4 text-primary" />
                      <p className="font-semibold">L&apos;IA réalise votre chef-d&apos;œuvre...</p>
                      <p className="text-sm">Cette opération peut prendre une minute.</p>
                    </div>
                  )}

                  {!loading && videoUrl && (
                    <div className="w-full">
                      <video controls autoPlay loop className="w-full rounded-lg border">
                        <source src={videoUrl} type="video/mp4" />
                        Votre navigateur ne supporte pas la lecture de vidéos.
                      </video>
                    </div>
                  )}
                  
                  {!loading && !videoUrl && (
                     <p className="text-muted-foreground p-8 text-center">La vidéo générée apparaîtra ici.</p>
                  )}
            </Card>
        </div>
      </div>
    </div>
  );
}
