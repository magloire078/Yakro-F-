
'use client'

import * as React from 'react';
import { MenuItemCard } from "@/components/menu-item-card";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/data-context";
import { Clock, Star, Loader } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Skeleton } from '@/components/ui/skeleton';

export default function RestaurantPage() {
    const params = useParams();
    const { getRestaurant, getMenuItem, menuItems, isLoading, fetchData } = useData();
    const [restaurant, setRestaurant] = React.useState(getRestaurant(params.id as string));

    React.useEffect(() => {
        // Fetch data if it's not already loaded, for deep links
        if (!restaurant) {
            fetchData();
        }
    }, [restaurant, fetchData]);

    React.useEffect(() => {
        setRestaurant(getRestaurant(params.id as string));
    }, [params.id, getRestaurant]);

    if (isLoading && !restaurant) {
        return (
             <div className="space-y-8">
                <Skeleton className="h-48 md:h-64 w-full -mx-4 md:-mx-8 -mt-4 md:-mt-8 md:rounded-xl" />
                <div className="py-8">
                     <Skeleton className="h-10 w-48 mb-8" />
                     <Skeleton className="h-8 w-32 mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-24 w-24 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-24 w-24 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!restaurant) {
        return <div>Restaurant non trouvé</div>
    }

    const restaurantMenu = menuItems.filter(item => item.restaurantId === params.id);

    return (
        <div>
            <div className="relative h-48 md:h-64 w-full -mx-4 md:-mx-8 -mt-4 md:-mt-8">
                <Image 
                    src={restaurant.image}
                    alt={restaurant.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{objectFit: 'cover'}}
                    data-ai-hint={restaurant.imageHint}
                    className="md:rounded-xl"
                />
                <div className="absolute inset-0 bg-black/50 flex items-end p-4 md:p-8 md:rounded-xl">
                    <div className="text-white">
                        <h1 className="text-3xl md:text-5xl font-headline">{restaurant.name}</h1>
                        <p className="text-md md:text-lg">{restaurant.cuisine}</p>
                    </div>
                </div>
            </div>

            <div className="py-8">
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


                <h2 className="text-2xl md:text-3xl font-headline text-foreground mb-6">Menu</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
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
