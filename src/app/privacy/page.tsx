'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Lock, Eye, Server, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function PrivacyPage() {
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
            <ShieldCheck className="w-8 h-8" />
            <span className="text-xs font-black tracking-widest uppercase">Yakro Go • Confidentialité</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Politique de Confidentialité
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mb-8 pb-6 border-b border-orange-200/40 dark:border-white/10">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-black">1</span>
                Collecte des Données
              </h2>
              <p>
                Pour vous fournir une expérience de livraison optimale à Yamoussoukro, nous collectons les données strictement nécessaires :
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                <li><strong className="text-slate-900 dark:text-white">Identité :</strong> Nom, prénom, numéro de téléphone et adresse e-mail.</li>
                <li><strong className="text-slate-900 dark:text-white">Localisation :</strong> Coordonnées GPS précises pendant la commande et la livraison pour assurer l&apos;acheminement rapide par le livreur.</li>
                <li><strong className="text-slate-900 dark:text-white">Historique :</strong> Commandes passées, restaurants favoris et avis déposés.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-black">2</span>
                Utilisation des Données & IA
              </h2>
              <p>
                Vos informations permettent d&apos;orchestrer la logistique, d&apos;alimenter nos algorithmes de recommandation gastronomique personnalisée (Genkit IA) et de garantir la sécurité des transactions.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Nous ne vendons ni ne louons vos données personnelles à des tiers à des fins publicitaires.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-black">3</span>
                Sécurité et Stockage Cloud
              </h2>
              <p>
                Toutes les données sont chiffrées en transit (TLS/HTTPS) et au repos via les infrastructures sécurisées de Google Cloud et Firebase. L&apos;accès à votre profil est protégé par Firebase Authentication.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-black">4</span>
                Vos Droits
              </h2>
              <p>
                Conformément aux réglementations sur la protection des données personnelles, vous disposez d&apos;un droit d&apos;accès, de modification, d&apos;exportation et de suppression de vos données personnelles à tout moment depuis votre espace profil ou sur simple demande à notre support.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-orange-200/40 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/terms" className="text-sm font-black text-orange-600 dark:text-orange-400 hover:underline">
              ← Consulter les Conditions Générales
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
