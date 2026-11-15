import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yakro Elite · Design mobile',
  robots: { index: false, follow: false },
};

/**
 * Aperçu de design (prototype haute-fidélité).
 *
 * Ces écrans servent de référence visuelle « Yakro Elite · Nuit & Braise »
 * et ne sont accessibles qu'en développement : le prototype ne dépend ni de
 * Firebase ni d'un compte (données de démonstration statiques).
 */
export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#0A0A0B]">{children}</div>;
}
