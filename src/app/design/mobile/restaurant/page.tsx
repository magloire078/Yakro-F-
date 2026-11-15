import { notFound } from 'next/navigation';
import { RestaurantScreen } from '@/components/design/mobile/restaurant-screen';

export default function DesignRestaurantPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <RestaurantScreen />;
}
