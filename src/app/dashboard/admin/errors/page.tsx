'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { ArrowLeft, AlertTriangle, Check, Loader, RefreshCcw, Search } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useFirebase } from '@/contexts/firebase-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { ErrorReport } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function AdminErrorsPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const { db } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();

    const [errors, setErrors] = React.useState<ErrorReport[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState('');
    const [showResolved, setShowResolved] = React.useState(false);
    const [updatingId, setUpdatingId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        if (userProfile && userProfile.roleSysteme !== 'SuperAdmin') {
            router.push('/');
            return;
        }
        if (userProfile?.roleSysteme !== 'SuperAdmin') return;

        const q = query(collection(db, 'erreurs'), orderBy('date', 'desc'));
        const unsub = onSnapshot(
            q,
            snap => {
                setErrors(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ErrorReport, 'id'>) })));
                setLoading(false);
            },
            () => {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les logs.' });
                setLoading(false);
            }
        );
        return () => unsub();
    }, [authLoading, user, userProfile, db, router, toast]);

    const filtered = React.useMemo(() => {
        const term = filter.trim().toLowerCase();
        return errors.filter(e => {
            if (!showResolved && e.resolu) return false;
            if (!term) return true;
            return (
                e.message.toLowerCase().includes(term) ||
                e.path.toLowerCase().includes(term) ||
                (e.userEmail || '').toLowerCase().includes(term)
            );
        });
    }, [errors, filter, showResolved]);

    const stats = React.useMemo(() => ({
        total: errors.length,
        ouvertes: errors.filter(e => !e.resolu).length,
        boundary: errors.filter(e => e.source === 'boundary').length,
    }), [errors]);

    const handleResolve = async (id: string, resolu: boolean) => {
        setUpdatingId(id);
        try {
            await updateDoc(doc(db, 'erreurs', id), { resolu });
            toast({ title: resolu ? 'Marqué résolu' : 'Réouvert' });
        } catch {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Mise à jour impossible.' });
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading || !userProfile || userProfile.roleSysteme !== 'SuperAdmin') {
        return <div className="flex h-full w-full items-center justify-center"><Loader className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    return (
        <div className="container mx-auto space-y-6 pb-12">
            <Button variant="ghost" asChild>
                <Link href="/dashboard/admin">
                    <ArrowLeft className="h-4 w-4" />
                    Retour au tableau de bord admin
                </Link>
            </Button>

            <div className="flex items-center gap-4">
                <AlertTriangle className="h-10 w-10 text-destructive" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-headline text-primary">Logs d'erreurs</h1>
                    <p className="text-muted-foreground">Erreurs JavaScript remontées par les clients en temps réel.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Non résolues</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-destructive">{stats.ouvertes}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Crashs (ErrorBoundary)</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-amber-600">{stats.boundary}</div></CardContent>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filtrer par message, page ou email…"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="pl-9"
                        aria-label="Filtrer les erreurs"
                    />
                </div>
                <Button variant={showResolved ? 'default' : 'outline'} onClick={() => setShowResolved(s => !s)}>
                    {showResolved ? 'Masquer résolues' : 'Inclure résolues'}
                </Button>
            </div>

            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune erreur à afficher.</CardContent></Card>
                ) : filtered.map(e => (
                    <Card key={e.id} className={e.resolu ? 'opacity-60' : ''}>
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-base truncate">{e.message}</CardTitle>
                                    <CardDescription className="text-xs">
                                        {new Date(e.date).toLocaleString('fr-FR')} • {e.path} • {e.userEmail || 'Anonyme'}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="outline" className="capitalize">{e.source}</Badge>
                                    {e.resolu ? (
                                        <Badge className="bg-green-600">Résolue</Badge>
                                    ) : (
                                        <Badge variant="destructive">Ouverte</Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {e.stack && (
                                <details>
                                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">Stack trace</summary>
                                    <pre className="mt-2 rounded-md bg-muted p-3 text-[10px] whitespace-pre-wrap break-words max-h-64 overflow-auto">
                                        {e.stack}
                                    </pre>
                                </details>
                            )}
                            <div className="flex justify-end">
                                <Button
                                    variant={e.resolu ? 'outline' : 'default'}
                                    size="sm"
                                    onClick={() => handleResolve(e.id, !e.resolu)}
                                    disabled={updatingId === e.id}
                                >
                                    {updatingId === e.id && <Loader className="h-3 w-3 animate-spin" />}
                                    {e.resolu ? <RefreshCcw className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                    {e.resolu ? 'Réouvrir' : 'Marquer résolue'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
