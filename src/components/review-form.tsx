'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Camera, Loader, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const reviewFormSchema = z.object({
  nomUtilisateur: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }).max(50),
  commentaire: z.string().min(10, { message: 'Le commentaire doit contenir au moins 10 caractères.' }).max(1000),
  note: z.number().min(1, { message: 'Veuillez sélectionner une note.' }),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
  onSubmit: (data: ReviewFormValues, photo: File | null) => Promise<void>;
  isSubmitting?: boolean;
}

const StarRatingInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  const [hover, setHover] = React.useState(0);
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
              className={cn('w-6 h-6 cursor-pointer', ratingValue <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')}
            />
          </button>
        );
      })}
    </div>
  );
};

export function ReviewForm({ onSubmit, isSubmitting = false }: ReviewFormProps) {
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { nomUtilisateur: '', commentaire: '', note: 0 },
  });
  const [photo, setPhoto] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      form.setError('commentaire', { message: 'Photo trop lourde (max 4 Mo).' });
      return;
    }
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (data: ReviewFormValues) => {
    await onSubmit(data, photo);
    form.reset();
    removePhoto();
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
                <Textarea placeholder="Le service était excellent..." rows={3} {...field} />
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

        <div className="space-y-2">
          <Label>Photo (facultatif)</Label>
          {photoPreview ? (
            <div className="relative h-40 w-40 rounded-lg overflow-hidden border">
              <Image src={photoPreview} alt="Aperçu" fill className="object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7"
                onClick={removePhoto}
                aria-label="Retirer la photo"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Label
              htmlFor="review-photo"
              className="cursor-pointer flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50"
            >
              <Camera className="h-4 w-4" />
              Ajouter une photo de votre plat
            </Label>
          )}
          <Input id="review-photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
          Envoyer l'avis
        </Button>
      </form>
    </Form>
  );
}
