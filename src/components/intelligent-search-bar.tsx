'use client';

import * as React from 'react';
import { Search, Sparkles, Loader, X, Zap, Mic } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { intelligentSearchAction } from '@/app/actions/ai-actions';
import type { IntelligentSearchOutput } from '@/ai/flows/search-flow';
import { Badge } from './ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Types pour l'API SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

interface IntelligentSearchBarProps {
  onSearchChange: (searchTerm: string) => void;
  onInterpretedSearchChange: (interpreted: IntelligentSearchOutput | null) => void;
  className?: string;
}

export function IntelligentSearchBar({ onSearchChange, onInterpretedSearchChange, className }: IntelligentSearchBarProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [interpretedResult, setInterpretedResult] = React.useState<IntelligentSearchOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognitionInstance | null>(null);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as unknown as { 
        SpeechRecognition: unknown; 
        webkitSpeechRecognition: unknown; 
      }).SpeechRecognition || (window as unknown as { 
        webkitSpeechRecognition: unknown; 
      }).webkitSpeechRecognition;
      
      const SpeechRecognitionConstructor = SpeechRecognition as { new(): SpeechRecognitionInstance };
      recognitionRef.current = new SpeechRecognitionConstructor();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results;
        let transcript = '';
        for (let i = 0; i < results.length; i++) {
          transcript += results[i][0].transcript;
        }
        
        setSearchTerm(transcript);
        onSearchChange(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, [onSearchChange]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        setIsListening(true);
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
        setIsListening(false);
      }
    }
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 600);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearchChange('');
    setInterpretedResult(null);
    onInterpretedSearchChange(null);
  }

  React.useEffect(() => {
    if (debouncedSearchTerm.length > 2) {
      setIsAiLoading(true);
      intelligentSearchAction({ query: debouncedSearchTerm })
        .then(result => {
            if (result.success) {
                setInterpretedResult(result.data);
                onInterpretedSearchChange(result.data);
            }
        })
        .catch(console.error)
        .finally(() => setIsAiLoading(false));
    } else {
      setInterpretedResult(null);
      onInterpretedSearchChange(null);
    }
  }, [debouncedSearchTerm, onInterpretedSearchChange]);

  return (
    <div className={cn("w-full relative group", className)}>
      <motion.div 
        animate={{ 
          scale: isFocused ? 1.01 : 1,
          boxShadow: isFocused ? "0 10px 25px -5px rgb(0 0 0 / 0.1)" : "0 4px 6px -1px rgb(0 0 0 / 0.1)"
        }}
        className={cn(
          "relative overflow-hidden transition-all duration-500 rounded-2xl p-[1.5px]",
          isFocused ? "bg-gradient-to-r from-orange-600 via-orange-400 to-orange-500" : "bg-slate-200 dark:bg-slate-800"
        )}
      >
        <div className="relative flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden">
          <div className="pl-4 flex items-center justify-center">
             <Search className={cn("h-5 w-5 transition-colors duration-300", isFocused ? "text-orange-500" : "text-slate-400")} />
          </div>
          
          <Input
            type="search"
            placeholder="Kedjenou, burger, pas cher..."
            className="w-full border-none bg-transparent h-12 sm:h-14 text-base sm:text-lg focus-visible:ring-0 placeholder:text-slate-400/70 placeholder:italic dark:text-white"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          <div className="pr-3 flex items-center gap-2 sm:gap-3">
             <AnimatePresence mode="wait">
                {isAiLoading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0, rotate: 0 }}
                    animate={{ opacity: 1, rotate: 360 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sparkles"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.2, rotate: 10 }}
                  >
                    <Sparkles className={cn("h-4 w-4 sm:h-5 sm:w-5 transition-colors", searchTerm ? "text-orange-500 fill-orange-500/20" : "text-slate-300")} />
                  </motion.div>
                )}
             </AnimatePresence>

              {searchTerm && (
                <button 
                  onClick={clearSearch}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  title="Effacer"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              )}

              <button 
                onClick={toggleListening}
                className={cn(
                  "p-2 rounded-full transition-all duration-300 relative",
                  isListening ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                )}
                title={isListening ? "Arrêter l'écoute" : "Recherche vocale"}
              >
                {isListening ? (
                  <>
                    <Mic className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
                    <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-20" />
                  </>
                ) : (
                  <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {interpretedResult && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-orange-500/20 rounded-2xl shadow-2xl z-50 flex flex-col gap-2 sm:gap-3"
          >
            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
               <Zap className="h-3 w-3 text-orange-500 fill-orange-500 animate-pulse" />
               Assistant Yakro-IA
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {interpretedResult.intent && (
                    <Badge variant="outline" className="bg-orange-500/5 text-orange-600 border-orange-200/50 italic px-2 sm:px-3 text-[10px] sm:text-xs py-0.5 sm:py-1">
                        {interpretedResult.intent}
                    </Badge>
                )}
                {interpretedResult.cuisine?.map((c, i) => (
                    <Badge key={`c-${i}`} className="bg-emerald-500/10 text-emerald-600 border-emerald-200 uppercase text-[9px] sm:text-[10px] py-0.5 sm:py-1">
                        {c}
                    </Badge>
                ))}
                {interpretedResult.keywords?.map((k, i) => (
                    <Badge key={`k-${i}`} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] sm:text-[10px] py-0.5 sm:py-1">
                        {k}
                    </Badge>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
