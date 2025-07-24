
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

export default function MarketingPage() {
  const { restaurants } = useImages();
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(restaurants[0] || null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGenerateVideo = async () => {
    if (!selectedRestaurant) return;

    setLoading(true);
    setVideoUrl(null);
    toast({
      title: 'Génération de la vidéo en cours...',
      description: 'Cela peut prendre jusqu\'à une minute. Veuillez patienter.',
    });

    try {
      const result = await generateVideo({
        restaurantName: selectedRestaurant.name,
        cuisine: selectedRestaurant.cuisine,
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

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Générateur de Publicité Vidéo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="font-medium">Sélectionnez un restaurant</label>
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

          <Button onClick={handleGenerateVideo} disabled={loading || !selectedRestaurant} className="w-full" size="lg">
            {loading ? <Loader className="animate-spin" /> : <Video className="mr-2" />}
            {loading ? 'Génération en cours...' : 'Générer la vidéo promotionnelle'}
          </Button>

          {loading && (
            <div className="text-center text-muted-foreground animate-pulse">
              <p>L'IA réalise votre chef-d'œuvre...</p>
              <p>Cette opération peut prendre une minute.</p>
            </div>
          )}

          {videoUrl && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Résultat :</h3>
              <video controls autoPlay loop className="w-full rounded-lg border">
                <source src={videoUrl} type="video/mp4" />
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
