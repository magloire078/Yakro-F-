import { notFound } from 'next/navigation';
import { TrackingScreen } from '@/components/design/mobile/tracking-screen';

export default function DesignTrackingPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <TrackingScreen />;
}
