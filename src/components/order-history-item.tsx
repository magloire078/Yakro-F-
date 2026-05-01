
'use client';

import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Order } from '@/lib/types';
import { useCart } from '@/contexts/cart-context';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/data-context';
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
        addToCart({ ...item });
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
    <Card className="glass overflow-hidden border-white/5 transition-all duration-500 hover:border-orange-500/20 hover:shadow-2xl hover:shadow-orange-500/10 rounded-[2rem]">
      <Accordion type="single" collapsible>
        <AccordionItem value={order.id} className="border-b-0">
          <AccordionTrigger className="p-6 md:p-8 hover:no-underline group">
            <div className="flex justify-between items-center w-full">
              <div className="text-left space-y-1">
                <p className="font-black text-xl uppercase tracking-tighter group-hover:text-orange-500 transition-colors duration-300">{order.nomRestaurant}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                  {new Date(order.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-black text-xl text-orange-500 tracking-tighter">{order.total.toLocaleString('fr-FR')} <span className="text-[10px] opacity-60">FCFA</span></p>
                </div>
                <Badge variant="outline" className={`rounded-full px-4 py-1 font-black uppercase text-[10px] tracking-widest border-2 ${
                  order.statut === 'Livrée' 
                    ? 'border-green-500/20 text-green-500 bg-green-500/5' 
                    : 'border-orange-500/20 text-orange-500 bg-orange-500/5'
                }`}>
                  {order.statut}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-6 md:p-8 pt-0">
            <div className="space-y-6">
              {order.plats.map((item, index) => {
                const menuItem = getMenuItem(item.id);
                if (!menuItem) return null;
                const placeholder = getPlaceholderImage(item.indiceImage);
                const imageSrc = (item.image && !item.image.includes('picsum.photos'))
                  ? item.image
                  : placeholder.url;
                const isCloudinary = imageSrc.includes('res.cloudinary.com');
                return (
                  <div key={`${item.id}-${index}`} className="flex justify-between items-center group/item">
                    <div className="flex items-center gap-5">
                      <div className="relative w-14 h-14 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 border border-white/10">
                        {isCloudinary ? (
                          <CldImage
                            src={imageSrc}
                            alt={item.nom}
                            width={56}
                            height={56}
                            crop="fill"
                            gravity="auto"
                            className="object-cover transition-transform duration-500 group-hover/item:scale-110"
                          />
                        ) : (
                          <Image
                            src={imageSrc}
                            alt={item.nom}
                            width={56}
                            height={56}
                            className="object-cover transition-transform duration-500 group-hover/item:scale-110"
                            data-ai-hint={item.indiceImage}
                          />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-black uppercase text-sm tracking-tight">{item.quantite}x {item.nom}</span>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
                          {item.accompagnementSelectionne && <span>{item.accompagnementSelectionne.nom}</span>}
                          {item.accompagnementSelectionne && item.boissonSelectionnee && <span> • </span>}
                          {item.boissonSelectionnee && <span>{item.boissonSelectionnee.nom}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="font-black text-sm tracking-tighter opacity-80">{getItemPrice(item).toLocaleString('fr-FR')} <span className="text-[8px] opacity-40">FCFA</span></span>
                  </div>
                )
              })}
            </div>
            
            <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="space-y-2 text-xs font-bold uppercase tracking-widest opacity-60">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{order.sousTotal.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span>Livraison</span>
                <span>{order.fraisDeLivraison.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between font-black text-lg text-foreground tracking-tighter pt-2">
                <span className="text-sm opacity-100 uppercase">Total de la commande</span>
                <span className="text-orange-500">{order.total.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
            
            {order.statut === 'Livrée' && (
              <div className="mt-8 flex justify-end">
                <Button 
                  onClick={handleReorder} 
                  className="rounded-2xl glass-orange text-white font-black uppercase tracking-widest px-8 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-500/20"
                >
                  Commander à nouveau
                </Button>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
