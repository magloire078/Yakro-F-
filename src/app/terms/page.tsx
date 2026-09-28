'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAEBD7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 selection:bg-orange-200">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-orange-200/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="container flex h-16 sm:h-20 items-center justify-between px-4 sm:px-8">
          <Logo size="md" />
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto py-12 px-4 sm:px-8">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-orange-200/50 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-12 shadow-xl shadow-orange-500/5">
          <div className="flex items-center gap-3 mb-4 text-orange-600 dark:text-orange-400">
            <Scale className="w-8 h-8" />
            <span className="text-xs font-black tracking-widest uppercase">Yakro Go • Juridique</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mb-8 pb-6 border-b border-orange-200/40 dark:border-white/10">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-black">1</span>
                Objet et Présentation du Service
              </h2>
              <p>
                Yakro Go est une plateforme numérique de mise en relation gastronomique et logistique opérant à Yamoussoukro, Côte d&apos;Ivoire. Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation des services fournis aux clients, restaurateurs partenaires et livreurs indépendants.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-black">2</span>
                Commandes et Paiement
              </h2>
              <p>
                Toute commande passée via l&apos;application engage l&apos;utilisateur. Les prix affichés sont en Francs CFA (XOF) et incluent la préparation et, le cas échéant, les frais de livraison calculés dynamiquement selon la distance à Yamoussoukro.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                <li>Le paiement s&apos;effectue par Mobile Money (Wave, Orange Money, MTN) ou en espèces à la livraison selon les options disponibles.</li>
                <li>Une commande confirmée et passée en préparation ne peut être annulée sans frais.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-black">3</span>
                Engagements et Responsabilités
              </h2>
              <p>
                Les restaurants partenaires garantissent la fraîcheur, la conformité sanitaire et la qualité gustative des plats préparés. Les livreurs Yakro Go s&apos;engagent à respecter les délais et les protocoles de transport isotherme.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-black">4</span>
                Comportement et Respect
              </h2>
              <p>
                Yakro Go applique une tolérance zéro pour tout comportement irrespectueux, frauduleux ou menaçant envers nos partenaires restaurateurs ou livreurs. Tout compte contrevenant fera l&apos;objet d&apos;une suspension immédiate.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-black">5</span>
                Contact & Réclamations
              </h2>
              <p>
                Pour toute réclamation, suggestion ou assistance, notre équipe support est joignable 7j/7 via notre conciergerie intégrée ou à l&apos;adresse <span className="text-orange-500 font-bold">contact@yakrofe.com</span>.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-orange-200/40 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/privacy" className="text-sm font-black text-orange-600 dark:text-orange-400 hover:underline">
              Consulter la Politique de Confidentialité →
            </Link>
            <Button
              onClick={() => router.push('/login')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-6"
            >
              Retour à la connexion
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
