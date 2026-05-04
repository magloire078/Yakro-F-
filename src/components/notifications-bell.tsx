'use client';

import * as React from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useData, markNotificationRead } from '@/contexts/data-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

function formatDate(date: AppNotification['date']) {
    if (!date) return '';
    if (date instanceof Timestamp) {
        return date.toDate().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    }
    return '';
}

export function NotificationsBell() {
    const { notifications } = useData();
    const { db } = useFirebase();
    const [open, setOpen] = React.useState(false);

    const sorted = React.useMemo(() => {
        return [...notifications].sort((a, b) => {
            const ta = a.date instanceof Timestamp ? a.date.toMillis() : 0;
            const tb = b.date instanceof Timestamp ? b.date.toMillis() : 0;
            return tb - ta;
        });
    }, [notifications]);

    const unreadCount = React.useMemo(() => sorted.filter(n => !n.read).length, [sorted]);

    const handleClick = async (notif: AppNotification) => {
        if (!notif.read && db) {
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
                    {sorted.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            Aucune notification.
                        </div>
                    ) : (
                        sorted.map(notif => (
                            <Link
                                key={notif.id}
                                href="/dashboard/stock"
                                onClick={() => handleClick(notif)}
                                className={cn(
                                    'flex gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors',
                                    !notif.read && 'bg-orange-50/60 dark:bg-orange-500/10'
                                )}
                            >
                                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold">
                                        Stock bas : {notif.stockItemNom ?? 'item inconnu'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Reste {notif.quantiteRestante ?? '?'} (seuil {notif.seuilAlerte ?? '?'})
                                    </p>
                                    {notif.date && (
                                        <p className="text-[10px] text-muted-foreground/80 mt-1">
                                            {formatDate(notif.date)}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
