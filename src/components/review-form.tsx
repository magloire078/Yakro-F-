
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/componentsui/textarea';
import type { Review } from '@/lib/types';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const reviewFormSchema = z.object({
  nomUtilisateur: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }).max(50),
  commentaire: z.string().min(10, { message: 'Le commentaire doit contenir au moins 10 caractères.' }),
  note: z.number().min(1, { message: 'Veuillez sélectionner une note.'}),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
  onSubmit: (data: Omit<Review, 'id' | 'restaurantId'>) => void;
}

const StarRatingInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center" onMouseLeave={() => setHover(0)}>
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            type="button"
            key={ratingValue}
            onClick={() => onChange(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            className="focus:outline-none"
          >
            <Star
              className={cn("w-6 h-6 cursor-pointer", ratingValue <= (hover || value) ? "text-yellow-400 fill-yellow-400" : "text-gray-300")}
            />
          </button>
        );
      })}
    </div>
  );
};

export function ReviewForm({ onSubmit }: ReviewFormProps) {
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      nomUtilisateur: '',
      commentaire: '',
      note: 0,
    },
  });

  const handleSubmit = (data: ReviewFormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-6 border rounded-lg bg-card">
        <FormField
          control={form.control}
          name="nomUtilisateur"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Votre nom</FormLabel>
              <FormControl>
                <Input placeholder="ex: Koffi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="commentaire"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Votre commentaire</FormLabel>
              <FormControl>
                <Textarea placeholder="Le service était excellent..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Votre note</FormLabel>
                    <FormControl>
                        <StarRatingInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <Button type="submit">Envoyer l'avis</Button>
      </form>
    </Form>
  );
}
