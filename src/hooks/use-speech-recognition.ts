'use client';

import * as React from 'react';

/**
 * Minimal shape of the (non-standard, vendor-prefixed) Web Speech API —
 * not part of TypeScript's DOM lib, so declared locally rather than
 * pulling in a types package for a handful of fields.
 */
interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseSpeechRecognitionResult {
  /** false in browsers without SpeechRecognition support (e.g. Firefox). */
  isSupported: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
}

/**
 * Thin wrapper around the browser's SpeechRecognition API. `onResult` is
 * called once with the final transcript of an utterance — there is no
 * interim/streaming text, keeping the caller's state simple.
 */
export function useSpeechRecognition(onResult: (transcript: string) => void, lang = 'fr-FR'): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = React.useRef(onResult);
  onResultRef.current = onResult;

  const isSupported = typeof window !== 'undefined'
    && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stopListening = React.useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = React.useCallback(() => {
    if (!isSupported || isListening) return;

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) onResultRef.current(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [isSupported, isListening, lang]);

  React.useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return { isSupported, isListening, startListening, stopListening };
}
