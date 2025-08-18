
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from './ui/label';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import type { MenuItem, MenuOption } from '@/lib/types';
import { Loader, Trash, Plus, Upload } from 'lucide-react';
import Image from 'next/image';
import { Badge } from './ui/badge';

interface EditMenuItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem;
}

const optionSchema = z.object({
  name: z.string().min(1, "Le nom ne peut être vide."),
  price: z.coerce.number().min(0, "Le prix ne peut être négatif."),
});

const editMenuItemSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères."),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères."),
  price: z.coerce.number().min(0, "Le prix ne peut pas être négatif."),
  availableSides: z.array(optionSchema).optional(),
  availableDrinks: z.array(optionSchema).optional(),
});

type EditMenuItemFormValues = z.infer<typeof editMenuItemSchema>;

export function EditMenuItemDialog({ isOpen, onClose, menuItem }: EditMenuItemDialogProps) {
  const { updateMenuItem } = useData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(menuItem.image || null);


  const form = useForm<EditMenuItemFormValues>({
    resolver: zodResolver(editMenuItemSchema),
    defaultValues: {
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      availableSides: menuItem.availableSides || [],
      availableDrinks: menuItem.availableDrinks || [],
    },
  });

  const { fields: sideFields, append: appendSide, remove: removeSide } = useFieldArray({
    control: form.control,
    name: "availableSides"
  });
  
  const { fields: drinkFields, append: appendDrink, remove: removeDrink } = useFieldArray({
    control: form.control,
    name: "availableDrinks"
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        availableSides: menuItem.availableSides || [],
        availableDrinks: menuItem.availableDrinks || [],
      });
      setImagePreview(menuItem.image || null);
      setImageFile(null);
    }
  }, [isOpen, menuItem, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: EditMenuItemFormValues) => {
    setIsSubmitting(true);
    try {
      await updateMenuItem(menuItem.id, data, imageFile);
      toast({
        title: 'Plat mis à jour',
        description: 'Les modifications ont été enregistrées.',
      });
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le plat.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le plat</DialogTitle>
          <DialogDescription>
            Apportez des modifications à "{menuItem.name}". Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1 pr-4">
             <div>
                <Label htmlFor="image-upload-edit" className="cursor-pointer">
                    <div className="relative w-full h-40 rounded-md border border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50">
                        {imagePreview ? (
                            <Image src={imagePreview} alt="Aperçu" fill className="object-cover rounded-md" />
                        ) : (
                           <div className="text-center">
                             <Upload />
                             <p>Changer l'image</p>
                           </div>
                        )}
                    </div>
                </Label>
                <Input id="image-upload-edit" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
             </div>
            <div>
                <Label htmlFor="name">Nom du plat</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-destructive text-sm mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...form.register('description')} />
                {form.formState.errors.description && <p className="text-destructive text-sm mt-1">{form.formState.errors.description.message}</p>}
            </div>
            <div>
                <Label htmlFor="price">Prix (FCFA)</Label>
                <Input id="price" type="number" {...form.register('price')} />
                {form.formState.errors.price && <p className="text-destructive text-sm mt-1">{form.formState.errors.price.message}</p>}
            </div>
            
            <div className="space-y-2">
                <Label>Accompagnements</Label>
                 <div className="flex flex-wrap gap-1 mb-2">
                  {sideFields.map((field, index) => (
                      <Badge key={field.id} variant="secondary" className="flex items-center gap-1.5">
                          {field.name} (+{field.price} F)
                          <Trash className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeSide(index)} />
                      </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                    <Input {...form.register(`availableSides.${sideFields.length}.name`)} placeholder="Nom (Ex: Alloco)" />
                    <Input {...form.register(`availableSides.${sideFields.length}.price`)} type="number" placeholder="Prix" className="w-32"/>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendSide({ name: '', price: 0 })}>
                        <Plus /> Ajouter
                    </Button>
                </div>
            </div>
            
            <div className="space-y-2">
                <Label>Boissons</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {drinkFields.map((field, index) => (
                      <Badge key={field.id} variant="secondary" className="flex items-center gap-1.5">
                          {field.name} (+{field.price} F)
                          <Trash className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeDrink(index)} />
                      </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                    <Input {...form.register(`availableDrinks.${drinkFields.length}.name`)} placeholder="Nom (Ex: Bissap)"/>
                    <Input {...form.register(`availableDrinks.${drinkFields.length}.price`)} type="number" placeholder="Prix" className="w-32"/>
                     <Button type="button" variant="outline" size="sm" onClick={() => appendDrink({ name: '', price: 0 })}>
                        <Plus /> Ajouter
                    </Button>
                </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-background pt-4 -mx-1 -mb-1 px-1 pb-1">
                <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader className="animate-spin" />}
                    Enregistrer
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
