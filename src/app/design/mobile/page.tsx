import { notFound } from 'next/navigation';
import { HomeScreen } from '@/components/design/mobile/home-screen';

export default function DesignHomePage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <HomeScreen />;
}
