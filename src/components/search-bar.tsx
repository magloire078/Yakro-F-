// src/components/search-bar.tsx
'use client';

import * as React from 'react';
import { Search, Sparkles, Loader, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { intelligentSearch, IntelligentSearchOutput } from '@/ai/flows/search-flow';
import { Badge } from './ui/badge';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchBarProps {
  onSearchChange: (searchTerm: string) => void;
  initialSearchTerm: string;
}

export function SearchBar({ onSearchChange, initialSearchTerm }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = React.useState(initialSearchTerm);
  const [interpretedSearch, setInterpretedSearch] = React.useState<IntelligentSearchOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    onSearchChange(value); // Propagate changes immediately for simple filtering
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearchChange('');
    setInterpretedSearch(null);
  }

  React.useEffect(() => {
    if (debouncedSearchTerm.length > 3) {
      setIsAiLoading(true);
      intelligentSearch({ query: debouncedSearchTerm })
        .then(setInterpretedSearch)
        .catch(console.error)
        .finally(() => setIsAiLoading(false));
    } else {
      setInterpretedSearch(null);
    }
  }, [debouncedSearchTerm]);

  return (
    <div className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="J'ai envie de..."
          className="w-full rounded-full p-3 pl-10 text-base bg-card border-2 border-primary/20 focus:border-primary"
          value={searchTerm}
          onChange={handleSearchChange}
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
      {interpretedSearch && (
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>Recherche IA:</span>
            {interpretedSearch.cuisine?.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
            {interpretedSearch.keywords?.map(k => <Badge key={k} variant="secondary">{k}</Badge>)}
            {interpretedSearch.searchTerms?.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
        </div>
      )}
    </div>
  );
}
