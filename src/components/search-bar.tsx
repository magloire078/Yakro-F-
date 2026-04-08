
// src/components/search-bar.tsx
'use client';

import * as React from 'react';
import { Search, Sparkles, Loader, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { intelligentSearchAction } from '@/app/actions/ai-actions';
import type { IntelligentSearchOutput } from '@/ai/flows/search-flow';
import { Badge } from './ui/badge';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchBarProps {
  onSearchChange: (searchTerm: string) => void;
  onInterpretedSearchChange: (interpreted: IntelligentSearchOutput | null) => void;
}

export function SearchBar({ onSearchChange, onInterpretedSearchChange }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [interpretedResult, setInterpretedResult] = React.useState<IntelligentSearchOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

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
    if (debouncedSearchTerm.length > 3) {
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
    <div className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="J'ai envie de..."
          className="w-full rounded-full p-3 pl-10 text-base bg-card border-2 border-primary/20 focus:border-primary"
          value={searchTerm}
          onChange={handleInputChange}
        />
        {isAiLoading ? (
            <Loader className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
        ) : (
            <Sparkles className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
        )}
        {searchTerm && (
             <X className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground cursor-pointer" onClick={clearSearch} />
        )}
      </div>
      {interpretedResult && (
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>Recherche IA:</span>
            {interpretedResult.cuisine?.map((c, i) => <Badge key={`cuisine-${c}-${i}`} variant="secondary">{c}</Badge>)}
            {interpretedResult.keywords?.map((k, i) => <Badge key={`keyword-${k}-${i}`} variant="secondary">{k}</Badge>)}
            {interpretedResult.searchTerms?.map((s, i) => <Badge key={`term-${s}-${i}`} variant="secondary">{s}</Badge>)}
        </div>
      )}
    </div>
  );
}
