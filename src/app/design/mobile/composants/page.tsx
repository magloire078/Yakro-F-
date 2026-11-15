import { notFound } from 'next/navigation';
import { ComponentsPreview } from '@/components/design/mobile/components-preview';

export default function DesignComponentsPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ComponentsPreview />;
}
