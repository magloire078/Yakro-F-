
'use client'

import { MenuItemCard } from "@/components/menu-item-card";
import { Badge } from "@/components/ui/badge";
import type { MenuItem, Restaurant } from "@/lib/types";
import { Clock, Star } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";

const restaurants: Restaurant[] = [
    { id: '1', name: 'Le Pili Pili', cuisine: 'Ivoirienne', rating: 4.8, deliveryTime: 25, image: 'https://placehold.co/1200x400', imageHint: 'african food' },
    { id: '2', name: 'Chez Mario', cuisine: 'Pizza', rating: 4.7, deliveryTime: 35, image: 'https://placehold.co/1200x400', imageHint: 'pizza' },
    { id: '3', name: 'Le Bazin', cuisine: 'Africaine', rating: 4.6, deliveryTime: 30, image: 'https://placehold.co/1200x400', imageHint: 'traditional african food' },
    { id: '4', name: 'La Brise du Lac', cuisine: 'Grillades', rating: 4.5, deliveryTime: 40, image: 'https://placehold.co/1200x400', imageHint: 'lake view' },
];

const menuItems: MenuItem[] = [
    { id: 'm1', name: 'Poulet Braisé', description: 'Poulet entier grillé, mariné aux épices locales.', price: 7500, image: 'https://placehold.co/600x400', imageHint: 'grilled chicken', restaurantId: '1' },
    { id: 'm2', name: 'Foutou Banane, Sauce Graine', description: 'Foutou de banane plantain accompagné d\'une sauce onctueuse aux noix de palme.', price: 5000, image: 'https://placehold.co/600x400', imageHint: 'fufu palm nut soup', restaurantId: '3' },
    { id: 'm3', name: 'Attiéké Poisson Thon', description: 'La spécialité ivoirienne par excellence : semoule de manioc et thon frit.', price: 3500, image: 'https://placehold.co/600x400', imageHint: 'attieke fried fish', restaurantId: '1' },
    { id: 'm4', name: 'Kedjenou de Poulet', description: 'Poulet mijoté aux légumes et épices, cuit à l\'étouffée.', price: 6000, image: 'https://placehold.co/600x400', imageHint: 'chicken stew', restaurantId: '4' },
    { id: 'm5', name: 'Alloco', description: 'Bananes plantains mûres frites, un délice sucré-salé.', price: 1500, image: 'https://placehold.co/600x400', imageHint: 'fried plantain', restaurantId: '3' },
    { id: 'm6', name: 'Pizza Reine', description: 'Pizza garnie de jambon, champignons et fromage.', price: 8000, image: 'https://placehold.co/600x400', imageHint: 'pizza', restaurantId: '2' },
    { id: 'm7', name: 'Pizza 4 Saisons', description: 'Pizza végétarienne avec artichauts, poivrons, olives et champignons.', price: 8500, image: 'https://placehold.co/600x400', imageHint: 'vegetarian pizza', restaurantId: '2' },
    { id: 'm8', name: 'Brochettes de Boeuf', description: 'Tendres morceaux de boeuf marinés et grillés.', price: 4000, image: 'https://placehold.co/600x400', imageHint: 'beef skewers', restaurantId: '4' },

];


export default function RestaurantPage() {
    const params = useParams();
    const restaurant = restaurants.find(r => r.id === params.id);

    if (!restaurant) {
        return <div>Restaurant non trouvé</div>
    }

    const restaurantMenu = menuItems.filter(item => item.restaurantId === params.id);

    return (
        <div>
            <div className="relative h-64 w-full -m-8">
                <Image 
                    src={restaurant.image}
                    alt={restaurant.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={restaurant.imageHint}
                    className="rounded-xl"
                />
                <div className="absolute inset-0 bg-black/50 flex items-end p-8 rounded-xl">
                    <div className="text-white">
                        <h1 className="text-5xl font-headline">{restaurant.name}</h1>
                        <p className="text-lg">{restaurant.cuisine}</p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto py-8">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {restaurantMenu.length > 0 ? restaurantMenu.map(item => (
                        <MenuItemCard key={item.id} item={item} />
                    )) : (
                        <p>Aucun plat disponible pour ce restaurant.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
