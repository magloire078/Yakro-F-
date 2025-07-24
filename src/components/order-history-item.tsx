
'use client';

import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Order } from '@/lib/types';
import { useCart } from '@/contexts/cart-context';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useImages } from '@/contexts/image-context';

interface OrderHistoryItemProps {
  order: Order;
}

export function OrderHistoryItem({ order }: OrderHistoryItemProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { getMenuItemImage } = useImages();


  const handleReorder = () => {
    order.items.forEach(item => {
        // The item in order.items might not have all the fields of a full MenuItem (like description),
        // but addToCart only needs the fields present in CartItem which extends MenuItem.
        addToCart(item);
    });
    toast({
        title: "Commande ajoutée au panier",
        description: `Les articles de votre commande chez ${order.restaurantName} ont été ajoutés.`,
    });
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
                {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Image src={getMenuItemImage(item.id)} alt={item.name} width={40} height={40} className="rounded-md" data-ai-hint={item.imageHint}/>
                            <div>
                                <span>{item.quantity} x </span>
                                <span className="font-medium">{item.name}</span>
                            </div>
                        </div>
                        <span>{(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                ))}
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
