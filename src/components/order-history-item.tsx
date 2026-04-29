
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
import { formatScheduledDate } from '@/lib/scheduled-orders';
import { CalendarClock, CreditCard, Sparkles, MessageSquare, XCircle } from 'lucide-react';
import { getPaymentMethod } from '@/lib/payment';
import { IncidentList } from '@/components/incident-list';

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
            {order.programmePour && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-700 dark:text-blue-300">
                <CalendarClock className="h-4 w-4" />
                <span>Commande programmée pour <strong>{formatScheduledDate(order.programmePour)}</strong></span>
              </div>
            )}
            {order.statut === 'Annulée' && order.motifAnnulation && (
              <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm flex items-start gap-2 text-destructive">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Commande annulée</p>
                  <p className="text-xs">{order.motifAnnulation}</p>
                </div>
              </div>
            )}
            {order.incidents && order.incidents.length > 0 && (
              <div className="mb-4">
                <IncidentList incidents={order.incidents} />
              </div>
            )}
            {(order.libelleAdresse || order.instructionsLivraison) && (
              <div className="mb-4 rounded-md border p-3 text-sm space-y-1">
                {order.libelleAdresse && (
                  <p className="text-xs text-muted-foreground">
                    Livré à : <span className="font-medium text-foreground">{order.libelleAdresse}</span>
                  </p>
                )}
                {order.instructionsLivraison && (
                  <div className="flex items-start gap-2 pt-1">
                    <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground italic whitespace-pre-line">«&nbsp;{order.instructionsLivraison}&nbsp;»</p>
                  </div>
                )}
              </div>
            )}
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
            {order.methodePaiement && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {getPaymentMethod(order.methodePaiement).shortLabel}
                    </Badge>
                    {order.statutPaiement && (
                        <Badge
                            variant={
                                order.statutPaiement === 'Confirmé'
                                    ? 'default'
                                    : order.statutPaiement === 'Échoué'
                                    ? 'destructive'
                                    : 'secondary'
                            }
                            className={order.statutPaiement === 'Confirmé' ? 'bg-green-600' : ''}
                        >
                            Paiement : {order.statutPaiement}
                        </Badge>
                    )}
                    {order.statut === 'Livrée' && (order.pointsGagnes ?? 0) > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1 border-yellow-400 text-yellow-700 dark:text-yellow-300">
                            <Sparkles className="h-3 w-3" />
                            +{order.pointsGagnes} pts
                        </Badge>
                    )}
                </div>
            )}
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
