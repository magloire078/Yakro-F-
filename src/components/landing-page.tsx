'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, PlayCircle, Shield, Zap, MapPin, Clock, Heart, Sparkles, Utensils, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Logo } from './logo';
import { motion, AnimatePresence } from 'framer-motion';

const featureCategories = [
  {
    title: "Gastronomie Locale",
    icon: Utensils,
    color: "bg-orange-500/10 text-orange-600",
    features: ["Le meilleur de Yakro", "Produits frais & locaux", "Recettes traditionnelles", "Restaurants vérifiés"]
  },
  {
    title: "Livraison Éclair",
    icon: Bike,
    color: "bg-amber-500/10 text-amber-600",
    features: ["Suivi en temps réel", "Livreurs professionnels", "Emballage premium", "Respect des délais"]
  },
  {
    title: "IA Intelligente",
    icon: Sparkles,
    color: "bg-orange-500/10 text-orange-600",
    features: ["Recherche naturelle", "Recommandations personnalisées", "Assistant vocal (bientôt)", "Analyse des goûts"]
  },
  {
    title: "Service Premium",
    icon: Heart,
    color: "bg-red-500/10 text-red-600",
    features: ["Support 24/7", "Paiement sécurisé", "Programme fidélité", "Qualité garantie"]
  }
];

const heroSlides = [
  {
    image: "/assets/marketing/hero-basilica.png",
    title: "Yamoussoukro à votre table",
    description: "Découvrez les saveurs uniques de la capitale, livrées avec excellence jusque chez vous."
  },
  {
    image: "/assets/marketing/hero-food.png",
    title: "L'excellence gastronomique",
    description: "Des plats d'exception préparés par les meilleurs restaurateurs de la ville."
  },
  {
    image: "/assets/marketing/hero-delivery.png",
    title: "La ville, livrée intelligemment",
    description: "Une logistique de pointe pour une livraison rapide, sûre et toujours souriante."
  },
];

export function LandingPage() {
  const router = useRouter();
  const [currentHero, setCurrentHero] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroSlides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-background dark:bg-slate-950 min-h-screen transition-colors duration-500 overflow-x-hidden selection:bg-orange-200">
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[-5%] w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[-5%] w-96 h-96 bg-orange-400/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-orange-200/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-slate-900/40">
        <div className="container flex h-16 sm:h-20 items-center justify-between px-4 sm:px-8">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 mr-6">
              <Link href="#features" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-orange-500 transition-colors">Fonctionnalités</Link>
              <Link href="#about" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-orange-500 transition-colors">À propos</Link>
            </nav>
            <Button
              onClick={() => router.push('/login')}
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 px-6 sm:px-8 rounded-xl sm:rounded-2xl h-10 sm:h-11 font-bold text-sm sm:text-base"
            >
              Connexion
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-8 sm:pt-12 pb-12 sm:pb-16 text-center px-4">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-orange-600 border-orange-500/30 bg-orange-500/5 backdrop-blur-sm rounded-full font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">
                <Sparkles className="w-3 h-3 mr-2" />
                L&apos;expérience food-tech ultime à Yakro
              </Badge>
              <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-8xl font-black tracking-tight text-slate-900 dark:text-white leading-[0.9] mb-6 sm:mb-8">
                Savourez <br className="hidden xs:block" />
                <span className="text-orange-500 italic relative inline-block">
                  l&apos;instant.
                  <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="#F97316" strokeWidth="4" fill="transparent" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-600 dark:text-slate-400 px-2 sm:px-4 leading-relaxed font-medium mb-8 sm:mb-10">
                Yakro Go réinvente la livraison de repas avec une touche de luxe et d&apos;intelligence artificielle. Le meilleur de Yamoussoukro, à portée de clic.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-md mx-auto sm:max-w-none">
                <Button size="lg" onClick={() => router.push('/login')} className="bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-900/20 px-8 sm:px-10 h-14 sm:h-16 rounded-xl sm:rounded-2xl text-base sm:text-lg font-black group w-full sm:w-auto">
                  Démarrer l&apos;aventure
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-500/10 px-8 sm:px-10 h-14 sm:h-16 rounded-xl sm:rounded-2xl text-base sm:text-lg font-black backdrop-blur-sm bg-white/30 w-full sm:w-auto">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Voir la démo
                </Button>
              </div>
            </motion.div>
          </div>

          <div className="mt-12 sm:mt-16 perspective-1000 w-full max-w-[1400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, rotateX: 10, y: 40 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-[0_30px_60px_rgba(255,140,0,0.1)] sm:shadow-[0_50px_100px_rgba(255,140,0,0.15)] bg-white aspect-[3/4] xs:aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9]"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentHero}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute inset-0 z-10"
                >
                  <Image
                    src={heroSlides[currentHero].image}
                    alt={heroSlides[currentHero].title}
                    fill
                    className="object-cover"
                    priority
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                  
                  {/* Text Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-20 text-left">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="max-w-3xl"
                    >
                      <h3 className="text-2xl xs:text-3xl sm:text-4xl md:text-6xl font-black text-white mb-3 sm:mb-6 tracking-tighter leading-tight">
                        {heroSlides[currentHero].title}
                      </h3>
                      <p className="text-sm xs:text-base sm:text-xl md:text-2xl text-orange-100 font-medium leading-relaxed max-w-xl">
                        {heroSlides[currentHero].description}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Slider Controls */}
              <div className="absolute bottom-4 right-4 xs:bottom-6 xs:right-6 sm:bottom-12 sm:right-12 flex gap-2 sm:gap-3 z-20">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentHero(i)}
                    className={cn(
                      "h-1.5 xs:h-2 sm:h-3 rounded-full transition-all duration-500",
                      currentHero === i ? "w-6 xs:w-8 sm:w-12 bg-orange-500 shadow-lg shadow-orange-500/50" : "w-1.5 xs:w-2 sm:w-3 bg-white/50 hover:bg-white"
                    )}
                    aria-label={`Aller à l'image ${i + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 sm:py-24 relative overflow-hidden px-4">
          <div className="container">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-12 sm:mb-16">
              <h2 className="text-3xl xs:text-4xl font-black tracking-tight sm:text-6xl text-slate-900 dark:text-white leading-tight">
                Une technologie <br /><span className="text-orange-500">au service du goût</span>
              </h2>
              <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-orange-500 rounded-full" />
              <p className="max-w-[95%] sm:max-w-[85%] leading-relaxed text-slate-600 dark:text-slate-400 text-lg sm:text-xl font-medium mt-4 sm:mt-6">
                Nous fusionnons le meilleur de la gastronomie ivoirienne avec une expérience numérique sans couture.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
              {featureCategories.map((category, index) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="flex flex-col h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-orange-100 dark:border-orange-500/20 hover:border-orange-300 hover:scale-[1.02] sm:hover:scale-[1.03] transition-all duration-500 rounded-[2rem] sm:rounded-[2.5rem] p-4 group">
                    <CardHeader className="flex-col items-start gap-3 sm:gap-4">
                      <div className={cn("p-4 sm:p-5 rounded-2xl sm:rounded-3xl transition-transform group-hover:rotate-6 duration-300 shadow-sm", category.color)}>
                        <category.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                      </div>
                      <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 pt-1 sm:pt-2">
                        {category.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
                        {category.features.map((feature) => (
                          <li key={feature} className="flex items-center group/item">
                            <div className="mr-3 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-orange-500/30 group-hover/item:scale-150 group-hover/item:bg-orange-500 transition-all" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section / Presentation */}
        <section id="about" className="py-16 sm:py-24 bg-slate-900 text-white relative overflow-hidden rounded-[2.5rem] sm:rounded-[4rem] mx-4 sm:mx-10 my-6 sm:my-10">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="container relative z-10 px-6 sm:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
              <div className="text-left space-y-6 sm:space-y-8">
                <Badge className="bg-orange-500 hover:bg-orange-600 px-5 sm:px-6 py-1.5 sm:py-2 rounded-full font-black uppercase tracking-widest text-[10px] sm:text-xs">Notre Mission</Badge>
                <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-black leading-[1] sm:leading-[0.95]">Digitaliser la <br className="hidden sm:block" /><span className="text-orange-500">capitale</span> avec passion.</h2>
                <p className="text-base sm:text-xl text-slate-400 leading-relaxed font-light max-w-xl">
                  Yakro Go n&apos;est pas qu&apos;une application de livraison. C&apos;est un écosystème conçu pour valoriser les artisans culinaires de Yamoussoukro tout en offrant aux habitants un service de classe mondiale.
                </p>
                <div className="grid grid-cols-2 gap-6 sm:gap-8 pt-4">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-4xl sm:text-5xl font-black text-orange-500">50+</p>
                    <p className="text-slate-400 font-bold uppercase tracking-tighter text-[10px] sm:text-sm">Partenaires</p>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-4xl sm:text-5xl font-black text-orange-500">15min</p>
                    <p className="text-slate-400 font-bold uppercase tracking-tighter text-[10px] sm:text-sm">Moyenne Livraison</p>
                  </div>
                </div>
              </div>
              <div className="relative aspect-square sm:aspect-video lg:aspect-square mt-8 lg:mt-0">
                <div className="absolute inset-0 bg-orange-500/20 rounded-[2rem] sm:rounded-[4rem] blur-2xl sm:blur-3xl" />
                <div className="relative h-full w-full rounded-[2rem] sm:rounded-[3.5rem] border border-white/10 overflow-hidden shadow-2xl">
                    <Image 
                        src="/assets/marketing/hero-basilica.png" 
                        alt="Vision Yakro Go" 
                        fill 
                        className="object-cover opacity-60 hover:opacity-80 transition-opacity duration-700"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/10 backdrop-blur-md p-6 sm:p-10 rounded-full border border-white/20">
                            <Sparkles className="h-12 w-12 sm:h-20 sm:w-20 text-orange-500 animate-pulse" />
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 sm:py-24 text-center px-4">
          <div className="container">
            <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 bg-white dark:bg-slate-900/50 rounded-[2.5rem] sm:rounded-[3.5rem] p-8 xs:p-12 sm:p-24 shadow-2xl shadow-orange-500/5 border border-orange-50/50 dark:border-orange-500/10">
                <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-tight">
                    Prêt à goûter <br /><span className="text-orange-500">au futur ?</span>
                </h2>
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                    Rejoignez les milliers d&apos;utilisateurs qui font déjà confiance à Yakro Go pour leurs repas quotidiens.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 pt-4">
                    <Button size="lg" onClick={() => router.push('/login')} className="bg-orange-500 hover:bg-orange-600 text-white px-8 sm:px-16 h-16 sm:h-20 text-lg sm:text-xl font-black rounded-xl sm:rounded-[2rem] shadow-xl shadow-orange-500/30 group w-full sm:w-auto">
                        Commander maintenant
                        <Zap className="ml-2 h-6 w-6 fill-white" />
                    </Button>
                    <Button size="lg" variant="ghost" className="text-slate-900 dark:text-white h-16 sm:h-20 px-8 sm:px-10 text-lg sm:text-xl font-black hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl sm:rounded-[2rem] w-full sm:w-auto">
                        En savoir plus
                    </Button>
                </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-orange-200/30 py-12 bg-white/40 dark:bg-slate-900/40 px-4">
        <div className="container flex flex-col items-center justify-between gap-12 md:flex-row">
          <div className="flex flex-col items-center md:items-start gap-6">
            <Logo size="md" />
            <p className="text-slate-500 font-medium text-center md:text-left max-w-xs text-sm sm:text-base">
              La première plateforme de livraison intelligente dédiée à la capitale de la Côte d&apos;Ivoire.
            </p>
            <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"><Shield size={18} /></div>
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"><MapPin size={18} /></div>
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"><Clock size={18} /></div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 w-full md:w-auto">
            <div className="space-y-4">
                <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px] sm:text-xs">Produit</h4>
                <nav className="flex flex-col gap-2 sm:gap-3">
                    <Link href="#" className="text-sm font-bold text-slate-500 hover:text-orange-500">Restaurants</Link>
                    <Link href="#" className="text-sm font-bold text-slate-500 hover:text-orange-500">Livreurs</Link>
                    <Link href="#" className="text-sm font-bold text-slate-500 hover:text-orange-500">Partenaires</Link>
                </nav>
            </div>
            <div className="space-y-4">
                <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px] sm:text-xs">Compagnie</h4>
                <nav className="flex flex-col gap-2 sm:gap-3">
                    <Link href="#" className="text-sm font-bold text-slate-500 hover:text-orange-500">À propos</Link>
                    <Link href="#" className="text-sm font-bold text-slate-500 hover:text-orange-500">Contact</Link>
                    <Link href="#" className="text-sm font-bold text-slate-500 hover:text-orange-500">Blog</Link>
                </nav>
            </div>
            <div className="space-y-4">
                <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px] sm:text-xs">Légal</h4>
                <nav className="flex flex-col gap-2 sm:gap-3">
                    <Link href="#" className="text-sm font-bold text-slate-500 hover:text-orange-500">Mentions</Link>
                    <Link href="#" className="text-sm font-bold text-slate-500 hover:text-orange-500">Confidentialité</Link>
                </nav>
            </div>
          </div>
        </div>
        <div className="container mt-12 pt-8 border-t border-orange-100 text-center">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">© {new Date().getFullYear()} Yakro Go. Made with ❤️ in Yamoussoukro.</span>
        </div>
      </footer>
    </div>
  );
}
