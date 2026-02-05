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
  children: React.ReactNode;
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
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Image du plat</Label>
          <Label htmlFor="image-upload-form" className="cursor-pointer block">
            <div className="relative w-full h-48 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors overflow-hidden">
              {imageToDisplay ? (
                <Image src={imageToDisplay} alt="Aperçu" fill className="object-cover" />
              ) : (
                <div className="text-center space-y-2">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Insérer une photo</p>
                  <p className="text-xs opacity-60">PNG, JPG jusqu'à 5MB</p>
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
              <FormControl><Input {...field} className="rounded-xl" /></FormControl>
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
              <FormControl><Textarea {...field} rows={3} className="rounded-xl" /></FormControl>
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
              <FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-3">
          <Label>Accompagnements</Label>
          <div className="space-y-2">
            {sideFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input {...form.register(`accompagnementsDisponibles.${index}.nom`)} placeholder="Nom" className="rounded-xl" />
                <Input {...form.register(`accompagnementsDisponibles.${index}.prix`)} type="number" placeholder="Prix" className="w-32 rounded-xl" />
                <Button type="button" variant="outline" size="icon" onClick={() => removeSide(index)} className="rounded-xl"><Trash className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => appendSide({ nom: '', prix: 0 })} className="rounded-xl"><Plus className="h-4 w-4 mr-2" /> Ajouter un accompagnement</Button>
        </div>
        
        <div className="space-y-3">
          <Label>Boissons</Label>
          <div className="space-y-2">
            {drinkFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input {...form.register(`boissonsDisponibles.${index}.nom`)} placeholder="Nom" className="rounded-xl" />
                <Input {...form.register(`boissonsDisponibles.${index}.prix`)} type="number" placeholder="Prix" className="w-32 rounded-xl" />
                <Button type="button" variant="outline" size="icon" onClick={() => removeDrink(index)} className="rounded-xl"><Trash className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => appendDrink({ nom: '', prix: 0 })} className="rounded-xl"><Plus className="h-4 w-4 mr-2" /> Ajouter une boisson</Button>
        </div>
        
        {children}
      </form>
    </Form>
  );
}
