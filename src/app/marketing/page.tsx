
'use client';

import * as React from 'react';
import { useImages } from '@/contexts/image-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateVideo } from '@/ai/flows/generate-video-flow';
import type { Restaurant } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader, Video } from 'lucide-react';
import Image from 'next/image';

// Helper to convert image URL to data URI
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
  const { restaurants, menuItems, getRestaurantImage } = useImages();
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(restaurants[0] || null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const restaurantImage = selectedRestaurant ? getRestaurantImage(selectedRestaurant.id) : null;

  const handleGenerateVideo = async () => {
    if (!selectedRestaurant) return;

    setLoading(true);
    setVideoUrl(null);
    toast({
      title: 'Préparation de la génération...',
      description: 'Conversion de l\'image en cours.',
    });

    let imageDataUri: string | null = null;
    try {
      if (restaurantImage) {
        // If the image is already a data URI, use it directly. Otherwise, fetch and convert.
        if (restaurantImage.startsWith('data:')) {
            imageDataUri = restaurantImage;
        } else {
            // This proxy is needed to avoid CORS issues when running in a browser environment
            const proxyUrl = `https://cors-anywhere.herokuapp.com/${restaurantImage}`;
            imageDataUri = await toDataURL(proxyUrl);
        }
      }
    } catch (error) {
        console.error("Failed to convert image to data URI:", error);
        toast({
            variant: "destructive",
            title: "Erreur de préparation",
            description: "Impossible de charger l'image de référence."
        });
        setLoading(false);
        return;
    }


    toast({
      title: 'Génération de la vidéo en cours...',
      description: 'Cela peut prendre jusqu\'à une minute. Veuillez patienter.',
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
  
  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-4xl font-headline text-primary">Marketing Vidéo IA</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                defaultValue={selectedRestaurant?.id}
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
                <label className="font-medium">2. Image de référence (Optionnel)</label>
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
