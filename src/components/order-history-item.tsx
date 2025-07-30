
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

interface OrderHistoryItemProps {
  order: Order;
}

export function OrderHistoryItem({ order }: OrderHistoryItemProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { getMenuItem } = useData();

  const handleReorder = () => {
    order.items.forEach(item => {
        const menuItem = getMenuItem(item.id);
        const imageSrc = `https://placehold.co/100x100.png`;
        if (menuItem) {
            addToCart({...item, image: imageSrc });
        }
    });
    toast({
        title: "Commande ajoutée au panier",
        description: `Les articles de votre commande chez ${order.restaurantName} ont été ajoutés.`,
    });
  }
  
  const getItemPrice = (item: typeof order.items[0]) => {
      const itemPrice = item.price;
      const sidePrice = item.selectedSide?.price || 0;
      const drinkPrice = item.selectedDrink?.price || 0;
      return (itemPrice + sidePrice + drinkPrice) * item.quantity;
  }

  return (
    <Card className="shadow-md">
      <Accordion type="single" collapsible>
        <AccordionItem value={order.id} className="border-b-0">
          <AccordionTrigger className="p-6 hover:no-underline">
            <div className="flex justify-between items-center w-full">
              <div className="text-left">
                <p className="font-bold text-lg font-headline">{order.restaurantName}</p>
                <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-lg text-primary">{order.total.toLocaleString('fr-FR')} FCFA</span>
                <Badge variant={order.status === 'Livrée' ? 'default' : 'destructive'} className={order.status === 'Livrée' ? 'bg-green-600' : ''}>
                    {order.status}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-6 pt-0">
            <div className="space-y-4">
                {order.items.map((item, index) => {
                    const menuItem = getMenuItem(item.id);
                    if (!menuItem) return null;
                    return (
                        <div key={`${item.id}-${index}`} className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <Image src={item.image} alt={menuItem.name} width={40} height={40} className="rounded-md" data-ai-hint={menuItem.imageHint}/>
                                <div>
                                    <span className="font-medium">{item.quantity}x {item.name}</span>
                                     <div className="text-xs text-muted-foreground">
                                        {item.selectedSide && <p>+ {item.selectedSide.name} ({item.selectedSide.price} F)</p>}
                                        {item.selectedDrink && <p>+ {item.selectedDrink.name} ({item.selectedDrink.price} F)</p>}
                                    </div>
                                </div>
                            </div>
                            <span>{getItemPrice(item).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                    )
                })}
            </div>
             {order.status === 'Livrée' && (
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
