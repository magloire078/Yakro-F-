'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { assistantChatAction } from '@/app/actions/ai-actions';
import { buildAssistantCatalog } from '@/lib/assistant';
import type { AssistantSuggestion, ConversationTurn } from '@/ai/flows/assistant-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Loader2, ShoppingBag, Clock, Mic, MicOff } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage extends ConversationTurn {
  suggestions?: AssistantSuggestion[];
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Salut, je suis l'Assistant YakroFe ! Dis-moi ton budget, ton quartier ou ton envie du jour, et je te trouve un plat qui correspond.",
};

export default function AssistantPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { restaurants, menuItems, getMenuItem, isLoading: dataLoading } = useData();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [messages, setMessages] = React.useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const catalog = React.useMemo(() => buildAssistantCatalog(menuItems, restaurants), [menuItems, restaurants]);

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const conversationHistory: ConversationTurn[] = messages.map(({ role, content }) => ({ role, content }));
    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const result = await assistantChatAction({
        message: trimmed,
        conversationHistory,
        availableMenuItems: catalog,
        userLocation: userProfile?.adresseParDefaut,
      });

      if (!result.success) {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: "Désolé, je n'ai pas pu réfléchir à votre demande pour le moment. Réessayez dans un instant.",
        }]);
        return;
      }

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: result.data.reply,
        suggestions: result.data.suggestions,
      }]);
    } catch (error) {
      console.error('assistantChatAction threw:', error);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Désolé, je n'ai pas pu réfléchir à votre demande pour le moment. Réessayez dans un instant.",
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => sendMessage(input);

  const { isSupported: isSpeechSupported, isListening, startListening, stopListening } = useSpeechRecognition(
    (transcript) => {
      setInput(transcript);
      sendMessage(transcript);
    }
  );

  const handleAddSuggestion = (suggestion: AssistantSuggestion) => {
    const menuItem = getMenuItem(suggestion.menuItemId);
    if (!menuItem) {
      toast({ variant: 'destructive', title: 'Article indisponible', description: "Ce plat n'est plus au menu." });
      return;
    }
    addToCart({ ...menuItem, quantite: 1 });
    toast({ title: 'Ajouté au panier', description: `${menuItem.nom} a été ajouté à votre panier.` });
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 px-6">
        <Sparkles className="h-12 w-12 text-primary/40" />
        <h2 className="text-2xl font-headline">Connectez-vous pour parler à l&apos;assistant</h2>
        <Button asChild className="rounded-2xl">
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-2rem)] max-w-2xl mx-auto">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-headline text-lg text-slate-900 dark:text-white">Assistant YakroFe</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ton conseiller gourmand local</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex flex-col gap-3', msg.role === 'user' ? 'items-end' : 'items-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-lg'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-lg'
                )}
              >
                {msg.content}
              </div>

              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="w-full max-w-[85%] space-y-2">
                  {msg.suggestions.map((s) => {
                    const menuItem = getMenuItem(s.menuItemId);
                    const restaurant = restaurants.find((r) => r.id === s.restaurantId);
                    if (!menuItem) return null;
                    return (
                      <div
                        key={s.menuItemId}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{menuItem.nom}</p>
                          <p className="text-[11px] text-slate-400 truncate">{restaurant?.nom}</p>
                          <p className="text-[11px] text-slate-400 italic mt-0.5">{s.raison}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-500">
                            <span>{menuItem.prix.toLocaleString('fr-FR')} FCFA</span>
                            {restaurant && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {restaurant.tempsDeLivraison} min
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="rounded-xl shrink-0 bg-primary hover:bg-primary/90"
                          onClick={() => handleAddSuggestion(s)}
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {isSending && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Loader2 className="h-4 w-4 animate-spin" /> L&apos;assistant réfléchit...
          </div>
        )}
        {isListening && (
          <div className="flex items-center gap-2 text-primary text-xs font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Je vous écoute...
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
        {isSpeechSupported && (
          <Button
            type="button"
            variant="outline"
            onClick={() => (isListening ? stopListening() : startListening())}
            disabled={isSending}
            className={cn(
              'rounded-2xl shrink-0',
              isListening && 'bg-primary/10 border-primary text-primary'
            )}
            aria-label={isListening ? 'Arrêter le micro' : 'Parler à l\'assistant'}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
        <Input
          placeholder="Ex: J'ai 2500 FCFA et je suis à Dioulakro"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          disabled={isSending}
          className="rounded-2xl"
        />
        <Button
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          className="rounded-2xl shrink-0 bg-primary hover:bg-primary/90"
          aria-label="Envoyer"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
