'use client';

import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Order } from '@/lib/types';
import { useCart } from '@/contexts/cart-context';
import { Card } from './ui/card';

interface OrderHistoryItemProps {
  order: Order;
}

export function OrderHistoryItem({ order }: OrderHistoryItemProps) {
  const { addToCart } = useCart();

  const handleReorder = () => {
    order.items.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
            addToCart(item);
        }
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
                <span className="font-semibold text-lg text-primary">{order.total.toFixed(2)} FCFA</span>
                <Badge variant={order.status === 'Livrée' ? 'default' : 'destructive'}>
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
                            <Image src={item.image} alt={item.name} width={40} height={40} className="rounded-md" data-ai-hint={item.imageHint}/>
                            <div>
                                <span>{item.quantity} x </span>
                                <span className="font-medium">{item.name}</span>
                            </div>
                        </div>
                        <span>{(item.price * item.quantity).toFixed(2)} FCFA</span>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                <Button onClick={handleReorder}>Recommander</Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
