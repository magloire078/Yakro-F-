
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Order } from '@/lib/types';
import { useCart } from '@/contexts/cart-context';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/data-context';
import { Separator } from './ui/separator';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { isRestaurantOpen } from '@/lib/restaurant-hours';

interface OrderHistoryItemProps {
  order: Order;
}

export function OrderHistoryItem({ order }: OrderHistoryItemProps) {
  const { reorderItems } = useCart();
  const { toast } = useToast();
  const { getMenuItem, getRestaurant } = useData();
  const router = useRouter();

  const handleReorder = () => {
    const restaurant = getRestaurant(order.restaurantId);
    if (restaurant && !isRestaurantOpen(restaurant)) {
      toast({
        variant: 'destructive',
        title: 'Restaurant fermé',
        description: `${order.nomRestaurant} n'accepte pas de commande pour le moment.`,
      });
      return;
    }

    const availableItems = order.plats
      .filter(item => getMenuItem(item.id))
      .map(item => ({ ...item }));

    if (availableItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Plats indisponibles',
        description: 'Aucun des plats de cette commande n\'est plus disponible.',
      });
      return;
    }

    const skipped = order.plats.length - availableItems.length;
    reorderItems(availableItems);
    toast({
      title: 'Panier prêt à être validé',
      description: skipped > 0
        ? `${availableItems.length} plat(s) ajouté(s). ${skipped} indisponible(s) ignoré(s).`
        : `${availableItems.length} plat(s) ajouté(s) depuis ${order.nomRestaurant}.`,
    });
    router.push(`/restaurants/${order.restaurantId}`);
  };
  
  const getItemPrice = (item: typeof order.plats[0]) => {
      const itemPrice = item.prix;
      const sidePrice = item.accompagnementSelectionne?.prix || 0;
      const drinkPrice = item.boissonSelectionnee?.prix || 0;
      return (itemPrice + sidePrice + drinkPrice) * item.quantite;
  }

  return (
    <Card className="shadow-md">
      <Accordion type="single" collapsible>
        <AccordionItem value={order.id} className="border-b-0">
          <AccordionTrigger className="p-6 hover:no-underline">
            <div className="flex justify-between items-center w-full">
              <div className="text-left">
                <p className="font-bold text-lg font-headline">{order.nomRestaurant}</p>
                <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-lg text-primary">{order.total.toLocaleString('fr-FR')} FCFA</span>
                <Badge variant={order.statut === 'Livrée' ? 'default' : 'destructive'} className={order.statut === 'Livrée' ? 'bg-green-600' : ''}>
                    {order.statut}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-6 pt-0">
            <div className="space-y-4">
                {order.plats.map((item, index) => {
                    const menuItem = getMenuItem(item.id);
                    if (!menuItem) return null;
                    const placeholder = getPlaceholderImage(item.indiceImage);
                    const imageSrc = (item.image && !item.image.includes('picsum.photos'))
                        ? item.image
                        : placeholder.url;
                    return (
                        <div key={`${item.id}-${index}`} className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <Image src={imageSrc} alt={item.nom} width={40} height={40} className="rounded-md" data-ai-hint={item.indiceImage}/>
                                <div>
                                    <span className="font-medium">{item.quantite}x {item.nom}</span>
                                     <div className="text-xs text-muted-foreground">
                                        {item.accompagnementSelectionne && <p>+ {item.accompagnementSelectionne.nom} ({item.accompagnementSelectionne.prix} F)</p>}
                                        {item.boissonSelectionnee && <p>+ {item.boissonSelectionnee.nom} ({item.boissonSelectionnee.prix} F)</p>}
                                    </div>
                                </div>
                            </div>
                            <span>{getItemPrice(item).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                    )
                })}
            </div>
            <Separator className="my-4"/>
             <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>{order.sousTotal.toLocaleString('fr-FR')} FCFA</span>
                </div>
                    <div className="flex justify-between">
                    <span>Frais de livraison</span>
                    <span>{order.fraisDeLivraison.toLocaleString('fr-FR')} FCFA</span>
                </div>
                {order.codePromo && (order.reductionPromo ?? 0) > 0 && (
                    <div className="flex justify-between text-green-700 dark:text-green-400">
                        <span>Code {order.codePromo}</span>
                        <span>−{(order.reductionPromo ?? 0).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                )}
                <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>{order.total.toLocaleString('fr-FR')} FCFA</span>
                </div>
            </div>
             {order.statut === 'Livrée' && (
              <div className="mt-6 flex justify-end">
                  <Button onClick={handleReorder}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Recommander
                  </Button>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
