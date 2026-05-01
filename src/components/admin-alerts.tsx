'use client';

import * as React from 'react';
import { 
    AlertTriangle, 
    Clock, 
    Flame, 
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/data-context';
import { differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminAlerts() {
    const { orders } = useData();
    
    const alerts = React.useMemo(() => {
        const now = new Date();
        const activeAlerts: { id: string; type: 'warning' | 'danger' | 'info'; title: string; message: string; time: string; orderId?: string }[] = [];

        orders.forEach(order => {
            const orderDate = new Date(order.date);
            const diff = differenceInMinutes(now, orderDate);

            if (order.statut === 'Placée' && diff > 5) {
                activeAlerts.push({
                    id: `late-acc-${order.id}`,
                    type: 'danger',
                    title: 'Retard d\'Acceptation',
                    message: `${order.nomRestaurant} n'a pas encore accepté la commande #${order.id.slice(-5)}`,
                    time: `${diff} min`,
                    orderId: order.id
                });
            } else if (order.statut === 'En Préparation' && diff > 25) {
                activeAlerts.push({
                    id: `late-prep-${order.id}`,
                    type: 'warning',
                    title: 'Préparation Longue',
                    message: `La commande #${order.id.slice(-5)} est en cuisine depuis plus de 25 min.`,
                    time: `${diff} min`,
                    orderId: order.id
                });
            }
        });

        return activeAlerts;
    }, [orders]);
    
    // Tracking notified alerts to avoid duplicates
    const notifiedAlertsRef = React.useRef<Set<string>>(new Set());

    React.useEffect(() => {
        if (alerts.length > 0 && typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                alerts.forEach(alert => {
                    if (!notifiedAlertsRef.current.has(alert.id)) {
                        new Notification(`⚠️ ${alert.title}`, {
                            body: alert.message,
                            icon: '/favicon.ico'
                        });
                        notifiedAlertsRef.current.add(alert.id);
                    }
                });
            }
        }
        
        // Cleanup old alerts from ref if they are no longer in active alerts
        const currentAlertIds = new Set(alerts.map(a => a.id));
        notifiedAlertsRef.current.forEach(id => {
            if (!currentAlertIds.has(id)) {
                notifiedAlertsRef.current.delete(id);
            }
        });
    }, [alerts]);

    if (alerts.length === 0) {
        return (
            <Card className="border-none shadow-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-black">Tout est sous contrôle</h3>
                    <p className="text-sm text-slate-500 max-w-[200px]">Aucune alerte critique détectée pour le moment.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-black flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Alertes Prioritaires
                </h3>
                <Badge variant="destructive" className="rounded-full">{alerts.length}</Badge>
            </div>
            
            <AnimatePresence mode="popLayout">
                {alerts.map((alert) => (
                    <motion.div
                        key={alert.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                            "group relative p-4 rounded-2xl border-l-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.01]",
                            alert.type === 'danger' 
                                ? "bg-red-50/80 dark:bg-red-950/20 border-red-500" 
                                : "bg-orange-50/80 dark:bg-orange-950/20 border-orange-500"
                        )}
                    >
                        <div className="flex gap-4">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                alert.type === 'danger' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                            )}>
                                {alert.type === 'danger' ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-black text-sm truncate">{alert.title}</h4>
                                    <span className="text-[10px] font-bold opacity-60 uppercase">{alert.time}</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                                    {alert.message}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-7 px-3 text-[10px] font-black rounded-lg gap-1 border-none bg-white/50 dark:bg-slate-800/50">
                                        Contacter Restaurant
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-black rounded-lg gap-1">
                                        Détails <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
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
