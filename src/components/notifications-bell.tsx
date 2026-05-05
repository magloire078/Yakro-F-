'use client';

import * as React from 'react';
import { Bell, AlertTriangle, ShoppingBag, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useData, markNotificationRead } from '@/contexts/data-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { getOverdueOrderAlerts } from '@/lib/order-alerts';

function formatDate(date: AppNotification['date']) {
    if (!date) return '';
    if (date instanceof Timestamp) {
        return date.toDate().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    }
    return '';
}

function notificationTimestamp(n: AppNotification): number {
    return n.date instanceof Timestamp ? n.date.toMillis() : 0;
}

interface NotificationView {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    body: string;
    href: string;
}

function describe(n: AppNotification): NotificationView {
    switch (n.type) {
        case 'STOCK_LOW':
            return {
                icon: AlertTriangle,
                title: `Stock bas : ${n.stockItemNom ?? 'item inconnu'}`,
                body: `Reste ${n.quantiteRestante ?? '?'} (seuil ${n.seuilAlerte ?? '?'})`,
                href: '/dashboard/stock',
            };
        case 'NEW_ORDER':
            return {
                icon: ShoppingBag,
                title: 'Nouvelle commande',
                body: n.total !== undefined ? `Total ${n.total.toLocaleString('fr-FR')} F` : 'Voir le détail',
                href: '/dashboard/orders',
            };
        case 'ORDER_OVERDUE':
            return {
                icon: Clock,
                title: 'Commande en retard',
                body: `Placée il y a ${n.ageMinutes ?? '?'} min sans préparation`,
                href: '/dashboard/orders',
            };
    }
}

export function NotificationsBell() {
    const { notifications, orders } = useData();
    const { db } = useFirebase();
    const { user } = useAuth();
    const [open, setOpen] = React.useState(false);
    const [now, setNow] = React.useState(() => new Date());

    // Tick once a minute so derived ORDER_OVERDUE entries re-evaluate.
    React.useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(interval);
    }, []);

    const overdue = React.useMemo(() => {
        if (!user) return [];
        return getOverdueOrderAlerts(orders, user.uid, { now });
    }, [orders, user, now]);

    const merged = React.useMemo(() => {
        const all = [...notifications, ...overdue];
        return all.sort((a, b) => notificationTimestamp(b) - notificationTimestamp(a));
    }, [notifications, overdue]);

    const unreadCount = React.useMemo(() => merged.filter(n => !n.read).length, [merged]);

    const handleClick = async (notif: AppNotification) => {
        // Derived alerts (overdue) have synthetic ids and aren't persisted.
        const isDerived = notif.id.startsWith('overdue-');
        if (!isDerived && !notif.read && db) {
            try {
                await markNotificationRead(db, notif.id);
            } catch {
                // error already emitted
            }
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-orange-500/10 hover:text-orange-500 rounded-xl transition-colors"
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lue${unreadCount > 1 ? 's' : ''})` : ''}`}
                >
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-lg shadow-orange-500/20 animate-in zoom-in">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="px-4 py-3 border-b">
                    <p className="text-sm font-bold">Notifications</p>
                    <p className="text-xs text-muted-foreground">
                        {unreadCount > 0
                            ? `${unreadCount} alerte${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                            : 'Tout est à jour'}
                    </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {merged.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            Aucune notification.
                        </div>
                    ) : (
                        merged.map(notif => {
                            const view = describe(notif);
                            const Icon = view.icon;
                            return (
                                <Link
                                    key={notif.id}
                                    href={view.href}
                                    onClick={() => handleClick(notif)}
                                    className={cn(
                                        'flex gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors',
                                        !notif.read && 'bg-orange-50/60 dark:bg-orange-500/10'
                                    )}
                                >
                                    <Icon className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold">{view.title}</p>
                                        <p className="text-xs text-muted-foreground">{view.body}</p>
                                        {notif.date && (
                                            <p className="text-[10px] text-muted-foreground/80 mt-1">
                                                {formatDate(notif.date)}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
