
'use client';

import Image from 'next/image';
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

interface OrderHistoryItemProps {
  order: Order;
}

export function OrderHistoryItem({ order }: OrderHistoryItemProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { getMenuItem } = useData();

  const handleReorder = () => {
    order.plats.forEach(item => {
        const menuItem = getMenuItem(item.id);
        if (menuItem) {
            addToCart({...item });
        }
    });
    toast({
        title: "Commande ajoutée au panier",
        description: `Les articles de votre commande chez ${order.nomRestaurant} ont été ajoutés.`,
    });
  }
  
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
          <AccordionTrigger className="px-4 py-4 md:p-6 hover:no-underline">
            <div className="flex justify-between items-start sm:items-center w-full gap-2 pr-2">
              <div className="text-left min-w-0">
                <p className="font-bold text-base md:text-lg font-headline truncate">{order.nomRestaurant}</p>
                <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3 shrink-0">
                <span className="font-semibold text-base text-primary whitespace-nowrap">{order.total.toLocaleString('fr-FR')} F</span>
                <Badge variant={order.statut === 'Livrée' ? 'default' : 'destructive'} className={order.statut === 'Livrée' ? 'bg-green-600 dark:bg-green-700' : ''}>
                    {order.statut}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-0 md:p-6 md:pt-0">
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
                <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>{order.total.toLocaleString('fr-FR')} FCFA</span>
                </div>
            </div>
             {order.statut === 'Livrée' && (
              <div className="mt-6 flex justify-end">
                  <Button onClick={handleReorder}>Recommander</Button>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
