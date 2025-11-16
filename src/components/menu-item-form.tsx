
'use client';

import * as React from 'react';
import { useForm, useFieldArray, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader, Trash, Plus, Upload } from 'lucide-react';
import Image from 'next/image';

const optionSchema = z.object({
  nom: z.string().min(1, "Le nom ne peut être vide."),
  prix: z.coerce.number().min(0, "Le prix ne peut être négatif."),
});

export const menuItemFormSchema = z.object({
  nom: z.string().min(3, "Le nom doit contenir au moins 3 caractères."),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères."),
  prix: z.coerce.number().min(0, "Le prix ne peut pas être négatif."),
  image: z.string().optional(),
  indiceImage: z.string().optional(),
  accompagnementsDisponibles: z.array(optionSchema).optional(),
  boissonsDisponibles: z.array(optionSchema).optional(),
});

export type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

interface MenuItemFormProps {
  form: UseFormReturn<MenuItemFormValues>;
  onSubmit: (data: MenuItemFormValues, imageFile: File | null) => Promise<void>;
  isLoading: boolean;
  children: React.ReactNode; // For submit/cancel buttons
  imageFile?: File | null;
  onImageChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function MenuItemForm({
  form,
  onSubmit,
  isLoading,
  children,
  imageFile,
  onImageChange
}: MenuItemFormProps) {
  
  const [localImagePreview, setLocalImagePreview] = React.useState<string | null>(null);
  const [localImageFile, setLocalImageFile] = React.useState<File | null>(null);
  
  const currentImageFile = imageFile !== undefined ? imageFile : localImageFile;
  const currentImageChangeHandler = onImageChange || ((e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setLocalImageFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
              setLocalImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  });
  
  const imageToDisplay = localImagePreview || form.getValues('image');

  const { fields: sideFields, append: appendSide, remove: removeSide } = useFieldArray({
    control: form.control,
    name: "accompagnementsDisponibles"
  });
  
  const { fields: drinkFields, append: appendDrink, remove: removeDrink } = useFieldArray({
    control: form.control,
    name: "boissonsDisponibles"
  });

  const handleFormSubmit = (data: MenuItemFormValues) => {
    onSubmit(data, currentImageFile);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
        <div>
          <Label htmlFor="image-upload-form" className="cursor-pointer">
            <div className="relative w-full h-40 rounded-md border border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50">
              {imageToDisplay ? (
                <Image src={imageToDisplay} alt="Aperçu" fill className="object-cover rounded-md" />
              ) : (
                <div className="text-center">
                  <Upload />
                  <p>Choisir une image</p>
                </div>
              )}
            </div>
          </Label>
          <Input id="image-upload-form" type="file" accept="image/*" className="hidden" onChange={currentImageChangeHandler} />
        </div>
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du plat</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea {...field} rows={3} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prix (FCFA)</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <Label>Accompagnements</Label>
          {sideFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input {...form.register(`accompagnementsDisponibles.${index}.nom`)} placeholder="Nom" />
              <Input {...form.register(`accompagnementsDisponibles.${index}.prix`)} type="number" placeholder="Prix" className="w-32" />
              <Button type="button" variant="outline" size="icon" onClick={() => removeSide(index)}><Trash /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendSide({ nom: '', prix: 0 })}><Plus /> Ajouter un accompagnement</Button>
        </div>
        
        <div className="space-y-2">
          <Label>Boissons</Label>
          {drinkFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input {...form.register(`boissonsDisponibles.${index}.nom`)} placeholder="Nom" />
              <Input {...form.register(`boissonsDisponibles.${index}.prix`)} type="number" placeholder="Prix" className="w-32" />
              <Button type="button" variant="outline" size="icon" onClick={() => removeDrink(index)}><Trash /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendDrink({ nom: '', prix: 0 })}><Plus /> Ajouter une boisson</Button>
        </div>
        
        {children}
      </form>
    </Form>
  );
}
