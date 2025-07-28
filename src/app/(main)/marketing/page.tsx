'use client';

import * as React from 'react';
import { useData } from '@/contexts/data-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateVideo } from '@/ai/flows/generate-video-flow';
import type { Restaurant, SUPER_USER_EMAIL } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader, Video } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

// Helper to convert image URL to data URI.
// In a real app, you might want a more robust solution, but this works for demo purposes.
async function toDataURL(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


export default function MarketingPage() {
  const { restaurants, getRestaurant } = useData();
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && (!user || user.email !== SUPER_USER_EMAIL)) {
        router.push('/');
    }
  }, [user, authLoading, router]);

  React.useEffect(() => {
    if(restaurants.length > 0 && !selectedRestaurant) {
      setSelectedRestaurant(restaurants[0]);
    }
  }, [restaurants, selectedRestaurant]);

  const restaurantImage = selectedRestaurant ? getRestaurant(selectedRestaurant.id)?.image : null;

  const handleGenerateVideo = async () => {
    if (!selectedRestaurant) return;

    setLoading(true);
    setVideoUrl(null);
    toast({
      title: 'Préparation de la génération...',
      description: 'Cette opération peut prendre jusqu\'à une minute.',
    });

    let imageDataUri: string | null = null;
    try {
      if (restaurantImage) {
        // Handle images that are already data URIs (from AI generation) and standard URLs (from initial data)
        if (restaurantImage.startsWith('data:')) {
            imageDataUri = restaurantImage;
        } else if (restaurantImage.startsWith('http')) {
             // Note: This conversion can fail due to CORS if the image host doesn't allow it.
             // For placehold.co, it works, but a production app would need a server-side proxy or direct image uploads.
             imageDataUri = await toDataURL(restaurantImage);
        }
      }
    } catch (error) {
        console.error("Failed to convert image to data URI:", error);
        toast({
            variant: "destructive",
            title: "Erreur de préparation",
            description: "Impossible de charger l'image de référence. L'hôte de l'image bloque peut-être la conversion."
        });
        setLoading(false);
        return;
    }


    toast({
      title: 'Génération de la vidéo en cours...',
      description: 'L\'IA réalise votre spot publicitaire. Veuillez patienter.',
    });

    try {
      const result = await generateVideo({
        restaurantName: selectedRestaurant.name,
        cuisine: selectedRestaurant.cuisine,
        imageDataUri: imageDataUri
      });
      setVideoUrl(result.videoUrl);
      toast({
        title: 'Vidéo générée avec succès !',
        description: `Votre spot publicitaire pour ${selectedRestaurant.name} est prêt.`,
      });
    } catch (error) {
      console.error('Failed to generate video:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur de génération vidéo',
        description: "Impossible de générer la vidéo. Le modèle est peut-être surchargé. Veuillez réessayer plus tard.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading || !user || user.email !== SUPER_USER_EMAIL) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-headline text-primary">Marketing Vidéo IA</h1>
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
                  setSelectedRestaurant(restaurants.find(r => r.id === value) || null);
                  setVideoUrl(null);
                }}
                value={selectedRestaurant?.id || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisissez un restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
                <label className="font-medium">2. Image de référence</label>
                <div className="border rounded-lg p-2 bg-muted h-48 flex items-center justify-center">
                   {restaurantImage ? (
                     <Image src={restaurantImage} alt={selectedRestaurant?.name || ""} width={300} height={150} className="object-contain rounded-md" />
                   ) : (
                    <p className="text-sm text-muted-foreground">L'image du restaurant apparaîtra ici.</p>
                   )}
                </div>
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
                      <p className="font-semibold">L'IA réalise votre chef-d'œuvre...</p>
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
