'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Play,
  RotateCcw,
  Volume2,
  Vibrate,
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  PackageCheck,
  ExternalLink,
  Trash2,
  Sparkles,
  Terminal,
  ShieldCheck,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { playNewOrderSound, playSuccessSound } from '@/lib/sound-alerts';
import { currentIdToken } from '@/lib/auth-token';
import {
  createSimulatedOrderAction,
  advanceSimulatedOrderStatusAction,
  updateSimulatedLivreurPositionAction,
  cleanupSimulatedOrderAction,
} from '@/app/actions/e2e-actions';
import type { Order, PaymentMode } from '@/lib/types';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'gps';
  message: string;
}

export function E2EWorkbench() {
  const { toast } = useToast();

  const [activeStep, setActiveStep] = React.useState<number>(0);
  const [isRunningAutopilot, setIsRunningAutopilot] = React.useState<boolean>(false);
  const [currentOrderId, setCurrentOrderId] = React.useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = React.useState<Order['statut'] | null>(null);
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>('especes');
  const [gpsProgress, setGpsProgress] = React.useState<number>(0);
  const [logs, setLogs] = React.useState<LogEntry[]>([]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('fr-FR', { hour12: false });
    setLogs((prev) => [
      { id: Math.random().toString(), timestamp: time, type, message },
      ...prev.slice(0, 49),
    ]);
  };

  const logFailure = (message: string) => {
    addLog(message, 'warn');
    toast({
      variant: 'destructive',
      title: 'Action E2E impossible',
      description: message,
    });
  };

  // 1. Étape Création
  const handleCreateOrder = async () => {
    addLog(`Création d'une commande test E2E (Mode: ${paymentMode.toUpperCase()})...`);
    const idToken = await currentIdToken();
    const res = await createSimulatedOrderAction(idToken, {
      paymentMode,
      montantTotal: paymentMode === 'especes' ? 4500 : 5000,
    });

    if (!res.success || !res.orderId) {
      logFailure(res.message);
      return null;
    }

    setCurrentOrderId(res.orderId);
    setCurrentStatus('Placée');
    setActiveStep(1);
    playNewOrderSound();
    addLog(`Commande créée : #${res.orderId.slice(-6)} (Statut: Placée)`, 'success');
    toast({
      title: 'Commande de test créée !',
      description: `ID: #${res.orderId.slice(-6)} - Alerte sonore déclenchée.`,
    });
    return res.orderId;
  };

  // 2. Étape Préparation cuisine
  const handleStartCooking = async (orderId = currentOrderId) => {
    if (!orderId) return;
    addLog('Restaurateur : Prise en charge en cuisine...');
    const idToken = await currentIdToken();
    const res = await advanceSimulatedOrderStatusAction(idToken, orderId, 'En Préparation');
    if (!res.success) {
      logFailure(res.message);
      return;
    }
    setCurrentStatus('En Préparation');
    setActiveStep(2);
    addLog('Cuisine : Commande passée « En Préparation »', 'info');
  };

  // 3. Étape Commande Prête
  const handleOrderReady = async (orderId = currentOrderId) => {
    if (!orderId) return;
    addLog('Restaurateur : Commande prête au comptoir, alerte livreurs...');
    const idToken = await currentIdToken();
    const res = await advanceSimulatedOrderStatusAction(idToken, orderId, 'Prête');
    if (!res.success) {
      logFailure(res.message);
      return;
    }
    setCurrentStatus('Prête');
    setActiveStep(3);
    playSuccessSound();
    addLog('Comptoir : Commande « Prête » - Signal sonore de notification envoyé', 'success');
  };

  // 4. Étape Prise en charge livreur & Déplacement GPS
  const handleStartDelivery = async (orderId = currentOrderId) => {
    if (!orderId) return;
    addLog('Livreur : Prise en charge de la course et départ du restaurant...');
    const idToken = await currentIdToken();
    const res = await advanceSimulatedOrderStatusAction(idToken, orderId, 'En Route');
    if (!res.success) {
      logFailure(res.message);
      return;
    }
    setCurrentStatus('En Route');
    setActiveStep(4);
    addLog('Course : Statut « En Route » - Départ GPS', 'gps');

    // Simulation de trajet GPS progressif (4 étapes)
    for (const ratio of [0.25, 0.5, 0.75, 1.0]) {
      await new Promise((r) => setTimeout(r, 800));
      setGpsProgress(ratio);
      const gpsRes = await updateSimulatedLivreurPositionAction(idToken, 'livreur-e2e-test', ratio);
      if (gpsRes.success) {
        addLog(gpsRes.message, 'gps');
      } else {
        addLog(gpsRes.message, 'warn');
        break;
      }
    }
  };

  // 5. Étape Livraison finale & Encaissement
  const handleCompleteDelivery = async (orderId = currentOrderId) => {
    if (!orderId) return;
    addLog('Livreur : Arrivée chez le client et validation de la course...');
    if (paymentMode === 'especes') {
      addLog('Rappel de sécurité : Encaissement de 4 500 FCFA espèces validé', 'warn');
    }
    const idToken = await currentIdToken();
    const res = await advanceSimulatedOrderStatusAction(idToken, orderId, 'Livrée');
    if (!res.success) {
      logFailure(res.message);
      return;
    }
    setCurrentStatus('Livrée');
    setActiveStep(5);
    playSuccessSound();
    addLog('Succès : Commande « Livrée », paiement acté et stocks ajustés !', 'success');
    toast({
      title: 'Cycle E2E Réussi !',
      description: 'La commande a parcouru tous les états de bout en bout.',
    });
  };

  // Simulation automatique complète (Autopilot)
  const runAutopilot = async () => {
    if (isRunningAutopilot) return;
    setIsRunningAutopilot(true);
    addLog('🚀 Lancement du cycle automatique complet (Autopilot)...', 'info');

    try {
      const orderId = await handleCreateOrder();
      if (!orderId) throw new Error('Échec création');

      await new Promise((r) => setTimeout(r, 2200));
      await handleStartCooking(orderId);

      await new Promise((r) => setTimeout(r, 2200));
      await handleOrderReady(orderId);

      await new Promise((r) => setTimeout(r, 2200));
      await handleStartDelivery(orderId);

      await new Promise((r) => setTimeout(r, 1800));
      await handleCompleteDelivery(orderId);
    } catch (err) {
      addLog(`Interruption Autopilot : ${err}`, 'warn');
    } finally {
      setIsRunningAutopilot(false);
    }
  };

  // Nettoyage
  const handleCleanup = async () => {
    if (!currentOrderId) return;
    addLog('Nettoyage des données de test Firestore...');
    const idToken = await currentIdToken();
    const res = await cleanupSimulatedOrderAction(idToken, currentOrderId);
    if (!res.success) {
      logFailure(res.message);
      return;
    }
    addLog(res.message, 'info');
    setCurrentOrderId(null);
    setCurrentStatus(null);
    setActiveStep(0);
    setGpsProgress(0);
    toast({ title: 'Données nettoyées', description: 'La commande test a été retirée de la base.' });
  };

  return (
    <div className="space-y-6">
      {/* En-tête du Banc d'Essai */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border border-white/10 bg-card/60 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary font-bold px-2 py-0.5">
              E2E WORKBENCH
            </Badge>
            <span className="text-xs text-muted-foreground">Yamoussoukro Live Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-headline tracking-tight text-foreground mt-1">
            Simulateur de Commande de Bout en Bout
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Validez en conditions réelles tout le cycle : création client, carillons cuisine, dispatch livreur, carte GPS live et clôture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={runAutopilot}
            disabled={isRunningAutopilot}
            className="h-11 px-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm shadow-xl shadow-primary/20 transition-transform active:scale-95"
          >
            {isRunningAutopilot ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Autopilot en cours...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4 fill-current" />
                Lancer Autopilot E2E
              </>
            )}
          </Button>

          {currentOrderId && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleCleanup}
              title="Nettoyer les données test"
              className="h-11 w-11 rounded-2xl border-white/10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stepper Interactif des 5 Étapes */}
      <Card className="border border-white/10 bg-card/80 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-black uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Parcours de la Commande
            </CardTitle>
            {currentOrderId && (
              <Badge className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">
                #{currentOrderId.slice(-6)} • {currentStatus}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Sélection du mode de paiement avant de démarrer */}
          {activeStep === 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3.5 rounded-2xl bg-muted/40 border border-white/5">
              <span className="text-xs font-bold text-foreground shrink-0">Mode de paiement du test :</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant={paymentMode === 'especes' ? 'default' : 'outline'}
                  onClick={() => setPaymentMode('especes')}
                  className="rounded-xl h-8 text-xs font-bold flex-1 sm:flex-initial"
                >
                  <Banknote className="mr-1.5 h-3.5 w-3.5" />
                  Espèces à la livraison
                </Button>
                <Button
                  size="sm"
                  variant={paymentMode === 'orange_money' ? 'default' : 'outline'}
                  onClick={() => setPaymentMode('orange_money')}
                  className="rounded-xl h-8 text-xs font-bold flex-1 sm:flex-initial"
                >
                  <Smartphone className="mr-1.5 h-3.5 w-3.5" />
                  Mobile Money
                </Button>
              </div>
            </div>
          )}

          {/* Grille des Étapes */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Étape 1 */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                activeStep >= 1
                  ? 'border-primary/40 bg-primary/5 text-foreground'
                  : 'border-white/5 bg-muted/20 text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Étape 1</span>
                <Clock className={`h-4 w-4 ${activeStep >= 1 ? 'text-primary' : ''}`} />
              </div>
              <p className="font-bold text-sm">Panier & Commande</p>
              <p className="text-[11px] text-muted-foreground mt-1">Création avec articles locaux et calculs prix.</p>
              <Button
                size="sm"
                onClick={handleCreateOrder}
                disabled={activeStep > 0 || isRunningAutopilot}
                className="w-full mt-3 h-8 text-xs font-bold rounded-xl"
              >
                1. Créer la commande
              </Button>
            </div>

            {/* Étape 2 */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                activeStep >= 2
                  ? 'border-primary/40 bg-primary/5 text-foreground'
                  : 'border-white/5 bg-muted/20 text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Étape 2</span>
                <ChefHat className={`h-4 w-4 ${activeStep >= 2 ? 'text-primary' : ''}`} />
              </div>
              <p className="font-bold text-sm">En Préparation</p>
              <p className="text-[11px] text-muted-foreground mt-1">Acceptation et lancement en cuisine.</p>
              <Button
                size="sm"
                variant={activeStep === 1 ? 'default' : 'outline'}
                onClick={() => handleStartCooking()}
                disabled={activeStep !== 1 || isRunningAutopilot}
                className="w-full mt-3 h-8 text-xs font-bold rounded-xl"
              >
                2. Lancer cuisine
              </Button>
            </div>

            {/* Étape 3 */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                activeStep >= 3
                  ? 'border-primary/40 bg-primary/5 text-foreground'
                  : 'border-white/5 bg-muted/20 text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Étape 3</span>
                <Volume2 className={`h-4 w-4 ${activeStep >= 3 ? 'text-primary' : ''}`} />
              </div>
              <p className="font-bold text-sm">Commande Prête</p>
              <p className="text-[11px] text-muted-foreground mt-1">Son de cloche et alerte aux livreurs.</p>
              <Button
                size="sm"
                variant={activeStep === 2 ? 'default' : 'outline'}
                onClick={() => handleOrderReady()}
                disabled={activeStep !== 2 || isRunningAutopilot}
                className="w-full mt-3 h-8 text-xs font-bold rounded-xl"
              >
                3. Marquer prête
              </Button>
            </div>

            {/* Étape 4 */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                activeStep >= 4
                  ? 'border-primary/40 bg-primary/5 text-foreground'
                  : 'border-white/5 bg-muted/20 text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Étape 4</span>
                <Bike className={`h-4 w-4 ${activeStep >= 4 ? 'text-primary' : ''}`} />
              </div>
              <p className="font-bold text-sm">Course & GPS Live</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {gpsProgress > 0 ? `Trajet : ${Math.round(gpsProgress * 100)}%` : 'Départ restaurant vers client.'}
              </p>
              <Button
                size="sm"
                variant={activeStep === 3 ? 'default' : 'outline'}
                onClick={() => handleStartDelivery()}
                disabled={activeStep !== 3 || isRunningAutopilot}
                className="w-full mt-3 h-8 text-xs font-bold rounded-xl"
              >
                4. Démarrer course
              </Button>
            </div>

            {/* Étape 5 */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                activeStep >= 5
                  ? 'border-emerald-500/40 bg-emerald-500/5 text-foreground'
                  : 'border-white/5 bg-muted/20 text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Étape 5</span>
                <PackageCheck className={`h-4 w-4 ${activeStep >= 5 ? 'text-emerald-500' : ''}`} />
              </div>
              <p className="font-bold text-sm">Livrée & Clôturée</p>
              <p className="text-[11px] text-muted-foreground mt-1">Encaissement, stocks et points fidélité.</p>
              <Button
                size="sm"
                variant={activeStep === 4 ? 'default' : 'outline'}
                onClick={() => handleCompleteDelivery()}
                disabled={activeStep !== 4 || isRunningAutopilot}
                className="w-full mt-3 h-8 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                5. Valider livraison
              </Button>
            </div>
          </div>

          {/* Raccourcis vers les écrans réels de l'application */}
          {currentOrderId && (
            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span className="text-xs font-bold text-foreground">
                  Inspecter les écrans réels avec cette commande :
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" asChild className="h-8 rounded-xl text-xs font-bold">
                  <Link href={`/orders/track?id=${currentOrderId}`} target="_blank">
                    Suivi GPS Client <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="h-8 rounded-xl text-xs font-bold">
                  <Link href="/dashboard/orders" target="_blank">
                    Board Cuisine <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="h-8 rounded-xl text-xs font-bold">
                  <Link href="/livreur" target="_blank">
                    Espace Livreur <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testeur de Signaux Périphériques & Terminal Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Testeur Signaux */}
        <Card className="border border-white/10 bg-card/80 backdrop-blur-xl rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Signaux &amp; Hardware
            </CardTitle>
            <CardDescription className="text-xs">
              Vérifiez les carillons Web Audio et l&apos;API de vibration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={() => {
                playNewOrderSound();
                addLog('Test : Carillon nouvelle commande joué (D5-A5)', 'info');
              }}
              className="w-full justify-start h-10 rounded-xl text-xs font-bold"
            >
              <Volume2 className="mr-2 h-4 w-4 text-amber-500" />
              Son : Nouvelle Commande
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                playSuccessSound();
                addLog('Test : Carillon de succès joué (C5-G5)', 'success');
              }}
              className="w-full justify-start h-10 rounded-xl text-xs font-bold"
            >
              <Volume2 className="mr-2 h-4 w-4 text-emerald-500" />
              Son : Commande Prête / Livrée
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if ('vibrate' in navigator) {
                  navigator.vibrate?.([150, 80, 150]);
                  addLog('Test : Vibration haptique déclenchée', 'info');
                } else {
                  addLog('Vibration non supportée sur ce navigateur', 'warn');
                }
              }}
              className="w-full justify-start h-10 rounded-xl text-xs font-bold"
            >
              <Vibrate className="mr-2 h-4 w-4 text-primary" />
              Vibration Mobile
            </Button>
          </CardContent>
        </Card>

        {/* Console d'Audit Live */}
        <Card className="lg:col-span-2 border border-white/10 bg-card/80 backdrop-blur-xl rounded-3xl flex flex-col">
          <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              Journal d&apos;Événements E2E
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLogs([])}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Effacer
            </Button>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            <div className="h-56 overflow-y-auto space-y-1.5 font-mono text-xs rounded-2xl bg-black/50 border border-white/5 p-3">
              {logs.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-10">
                  En attente d&apos;événements. Cliquez sur « Lancer Autopilot E2E » ou sur une étape pour démarrer.
                </p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-muted-foreground/60 shrink-0">[{log.timestamp}]</span>
                    <span
                      className={
                        log.type === 'success'
                          ? 'text-emerald-400 font-bold'
                          : log.type === 'warn'
                          ? 'text-amber-400'
                          : log.type === 'gps'
                          ? 'text-sky-400'
                          : 'text-foreground'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
