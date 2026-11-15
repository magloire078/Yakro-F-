import { notFound } from 'next/navigation';
import { CartScreen } from '@/components/design/mobile/cart-screen';

export default function DesignCartPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <CartScreen />;
}
