
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
import { Loader, Trash, Plus } from 'lucide-react';
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
    }
  }, [isOpen, menuItem, form]);

  const onSubmit = async (data: EditMenuItemFormValues) => {
    setIsSubmitting(true);
    try {
      await updateMenuItem(menuItem.id, data);
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
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
                {sideFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <Input {...form.register(`availableSides.${index}.name`)} placeholder="Nom" />
                        <Input {...form.register(`availableSides.${index}.price`)} type="number" placeholder="Prix" className="w-24"/>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSide(index)}><Trash/></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendSide({ name: '', price: 0 })}><Plus /> Ajouter un accompagnement</Button>
            </div>
            
            <div className="space-y-2">
                <Label>Boissons</Label>
                {drinkFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <Input {...form.register(`availableDrinks.${index}.name`)} placeholder="Nom"/>
                        <Input {...form.register(`availableDrinks.${index}.price`)} type="number" placeholder="Prix" className="w-24"/>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDrink(index)}><Trash/></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendDrink({ name: '', price: 0 })}><Plus /> Ajouter une boisson</Button>
            </div>

            <DialogFooter className="sticky bottom-0 bg-background pt-4">
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
