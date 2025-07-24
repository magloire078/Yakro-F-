
'use client'

import { MenuItemCard } from "@/components/menu-item-card";
import { Badge } from "@/components/ui/badge";
import { useImages } from "@/contexts/image-context";
import { Clock, Star } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";

export default function RestaurantPage() {
    const params = useParams();
    const { restaurants, menuItems } = useImages();
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
