'use client';

import * as React from 'react';
import {
    AlertTriangle,
    Clock,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getOverdueOrderAlerts } from '@/lib/order-alerts';
import { requestBrowserNotificationPermission, fireBrowserNotification } from '@/lib/browser-notifications';

export function AdminAlerts() {
    const { orders } = useData();
    const { user } = useAuth();
    const [now, setNow] = React.useState(() => new Date());

    React.useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(interval);
    }, []);

    const alerts = React.useMemo(() => {
        const recipient = user?.uid ?? 'admin';
        const raw = getOverdueOrderAlerts(orders, recipient, { now, scope: 'all' });
        return raw.map(n => {
            const order = orders.find(o => o.id === n.orderId);
            const isAcceptanceLate = order?.statut === 'Placée';
            return {
                id: n.id,
                orderId: n.orderId!,
                ageMinutes: n.ageMinutes ?? 0,
                type: isAcceptanceLate ? 'danger' as const : 'warning' as const,
                title: isAcceptanceLate ? "RETARD D'ACCEPTATION" : 'PRÉPARATION CRITIQUE',
                message: isAcceptanceLate
                    ? `${order?.nomRestaurant ?? 'Restaurant'} n'a pas encore validé la commande #${n.orderId!.slice(-5)}`
                    : `La commande #${n.orderId!.slice(-5)} dépasse les délais de production standards.`,
                time: `${n.ageMinutes} MIN`,
            };
        });
    }, [orders, user, now]);

    const notifiedAlertsRef = React.useRef<Set<string>>(new Set());

    React.useEffect(() => {
        alerts.forEach(alert => {
            if (notifiedAlertsRef.current.has(alert.id)) return;
            fireBrowserNotification(`⚠️ ${alert.title}`, {
                body: alert.message,
                icon: '/favicon.ico',
            });
            notifiedAlertsRef.current.add(alert.id);
        });

        const currentAlertIds = new Set(alerts.map(a => a.id));
        notifiedAlertsRef.current.forEach(id => {
            if (!currentAlertIds.has(id)) {
                notifiedAlertsRef.current.delete(id);
            }
        });
    }, [alerts]);

    React.useEffect(() => {
        // Politely request the OS-level permission once on mount; ignored if
        // already granted/denied. Without this the existing notification path
        // was silently dead.
        void requestBrowserNotificationPermission();
    }, []);

    if (alerts.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 backdrop-blur-3xl border border-white/5 p-12 rounded-[2.5rem] relative overflow-hidden group shadow-2xl"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-50" />
                <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="h-20 w-20 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mb-2 shadow-[0_0_40px_rgba(249,115,22,0.1)] group-hover:scale-110 transition-transform duration-500">
                        <ShieldCheck className="h-10 w-10 text-orange-500" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Périmètre <span className="text-orange-500">Sécurisé</span></h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 max-w-[250px]">AUCUNE ANOMALIE DÉTECTÉE DANS LE FLUX OPÉRATIONNEL</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
                <div className="space-y-1">
                    <h3 className="text-sm font-black italic uppercase tracking-widest text-white flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        Alertes Prioritaires
                    </h3>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">INTERVENTION TECHNIQUE REQUISE</p>
                </div>
                <Badge variant="destructive" className="h-6 px-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black italic uppercase tracking-widest rounded-full">{alerts.length}</Badge>
            </div>
            
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {alerts.map((alert, idx) => (
                        <motion.div
                            key={alert.id}
                            layout
                            initial={{ opacity: 0, x: 20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                                "group relative p-6 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:border-orange-500/30",
                                alert.type === 'danger' ? "bg-red-500/5" : "bg-orange-500/5"
                            )}
                        >
                            <div className={cn(
                                "absolute top-0 left-0 w-1 h-full rounded-full opacity-40 group-hover:opacity-100 transition-opacity",
                                alert.type === 'danger' ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                            )} />
                            
                            <div className="flex gap-6">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-110 shadow-lg",
                                    alert.type === 'danger' 
                                        ? "bg-red-500/10 border-red-500/20 text-red-500" 
                                        : "bg-orange-500/10 border-orange-500/20 text-orange-500"
                                )}>
                                    {alert.type === 'danger' ? <AlertTriangle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-black text-xs italic uppercase tracking-wider text-white group-hover:text-orange-500 transition-colors">{alert.title}</h4>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{alert.time}</span>
                                    </div>
                                    
                                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed mb-6 group-hover:text-slate-200 transition-colors">
                                        {alert.message}
                                    </p>
                                    
                                    <div className="flex items-center gap-3">
                                        <Button variant="outline" size="sm" className="h-9 px-5 bg-white/5 border-white/10 hover:bg-orange-500 hover:text-white hover:border-orange-500 rounded-xl text-[9px] font-black italic uppercase tracking-widest transition-all">
                                            INTERVENIR
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-9 px-4 text-slate-500 hover:text-white rounded-xl text-[9px] font-black italic uppercase tracking-widest gap-2">
                                            DÉTAILS <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant?: 'destructive' | 'default', className?: string }) {
    return (
        <span className={cn(
            "px-2 py-0.5 text-[10px] font-black rounded-full",
            variant === 'destructive' ? "bg-red-500 text-white" : "bg-slate-900 text-white",
            className
        )}>
            {children}
        </span>
    );
}

