'use client'

import { MenuItemCard } from "@/components/menu-item-card";
import { Badge } from "@/components/ui/badge";
import type { MenuItem, Restaurant } from "@/lib/types";
import { Clock, Star } from "lucide-react";
import Image from "next/image";

const restaurants: Restaurant[] = [
  { id: '1', name: 'Le Pili Pili', cuisine: 'Ivorian', rating: 4.8, deliveryTime: 25, image: 'https://placehold.co/1200x400', imageHint: 'african food' },
  { id: '2', name: 'Pizza Bella', cuisine: 'Italian', rating: 4.6, deliveryTime: 30, image: 'https://placehold.co/1200x400', imageHint: 'pizza' },
  { id: '3', name: 'Sushi House', cuisine: 'Japanese', rating: 4.7, deliveryTime: 40, image: 'https://placehold.co/1200x400', imageHint: 'sushi' },
  { id: '4', name: 'Burger Queen', cuisine: 'American', rating: 4.5, deliveryTime: 20, image: 'https://placehold.co/1200x400', imageHint: 'burger' },
];

const menuItems: MenuItem[] = [
  { id: 'm1', name: 'Poulet Braisé', description: 'Poulet grillé mariné aux épices locales.', price: 12.50, image: 'https://placehold.co/600x400', imageHint: 'grilled chicken' },
  { id: 'm2', name: 'Pizza Margherita', description: 'Classique tomate, mozzarella, basilic.', price: 14.00, image: 'https://placehold.co/600x400', imageHint: 'pizza' },
  { id: 'm3', name: 'Combo Sushi', description: 'Assortiment de 16 sushis et makis.', price: 25.00, image: 'https://placehold.co/600x400', imageHint: 'sushi platter' },
  { id: 'm4', name: 'Classic Cheeseburger', description: 'Boeuf, cheddar, laitue, tomate, oignons.', price: 9.50, image: 'https://placehold.co/600x400', imageHint: 'cheeseburger' },
  { id: 'm5', name: 'Attiéké Poisson', description: 'Semoule de manioc avec poisson frit.', price: 15.00, image: 'https://placehold.co/600x400', imageHint: 'african dish' },
  { id: 'm6', name: 'Tiramisu', description: 'Dessert italien crémeux au café.', price: 7.00, image: 'https://placehold.co/600x400', imageHint: 'tiramisu' },
];


export default function RestaurantPage({ params }: { params: { id: string } }) {
    const restaurant = restaurants.find(r => r.id === params.id);

    if (!restaurant) {
        return <div>Restaurant non trouvé</div>
    }

    // For now, we'll show all menu items for any restaurant
    const restaurantMenu = menuItems;

    return (
        <div>
            <div className="relative h-64 w-full">
                <Image 
                    src={restaurant.image}
                    alt={restaurant.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={restaurant.imageHint}
                />
                <div className="absolute inset-0 bg-black/50 flex items-end p-8">
                    <div className="text-white">
                        <h1 className="text-5xl font-headline">{restaurant.name}</h1>
                        <p className="text-lg">{restaurant.cuisine}</p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto py-8 px-4">
                <div className="flex items-center gap-6 mb-8">
                     <Badge variant="outline" className="flex items-center gap-1 text-base p-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{restaurant.rating}</span>
                    </Badge>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-5 h-5" />
                        <span className="text-base">{restaurant.deliveryTime} min</span>
                    </div>
                </div>


                <h2 className="text-3xl font-headline text-foreground mb-6">Menu</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
                    {restaurantMenu.map(item => (
                        <MenuItemCard key={item.id} item={item} />
                    ))}
                </div>
            </div>
        </div>
    )
}