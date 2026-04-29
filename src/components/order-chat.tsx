'use client';

import * as React from 'react';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Send, Loader, MessageCircle } from 'lucide-react';
import { useFirebase } from '@/contexts/firebase-provider';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatRole } from '@/lib/types';

interface OrderChatProps {
  orderId: string;
  myRole: ChatRole;
  /** Si false (commande livrée/annulée), désactive l'envoi mais garde l'affichage. */
  active?: boolean;
}

export function OrderChat({ orderId, myRole, active = true }: OrderChatProps) {
  const { db } = useFirebase();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const q = query(
      collection(db, 'commandes', orderId, 'messages'),
      orderBy('date', 'asc')
    );
    const unsub = onSnapshot(
      q,
      snap => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) })));
      },
      () => {
        // silencieux : permission insuffisante (commande pas encore prise par un livreur).
      }
    );
    return () => unsub();
  }, [db, orderId]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!user || !text.trim() || !active) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'commandes', orderId, 'messages'), {
        fromUid: user.uid,
        fromRole: myRole,
        text: text.trim().slice(0, 500),
        date: new Date().toISOString(),
      });
      setText('');
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Envoi impossible',
        description: e?.message || 'Réessayez dans un instant.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4" />
          Discussion {myRole === 'client' ? 'avec le livreur' : 'avec le client'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-72">
        <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
          <div className="space-y-2 py-3">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">
                Aucun message pour le moment.
                <br />
                Échangez ici si besoin (changement d'adresse, étage, etc.).
              </p>
            ) : (
              messages.map(m => {
                const mine = m.fromUid === user?.uid;
                return (
                  <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                        mine
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      )}
                    >
                      <p className="whitespace-pre-line break-words">{m.text}</p>
                      <p className={cn('text-[10px] mt-1', mine ? 'opacity-80' : 'text-muted-foreground')}>
                        {new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-2 flex gap-2">
          <Input
            placeholder={active ? 'Écrire un message…' : 'Conversation terminée'}
            value={text}
            onChange={e => setText(e.target.value.slice(0, 500))}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={!active || sending}
          />
          <Button onClick={handleSend} disabled={!text.trim() || !active || sending} size="icon" aria-label="Envoyer">
            {sending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
