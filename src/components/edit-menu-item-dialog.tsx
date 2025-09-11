
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";


interface EditMenuItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem;
}

const optionSchema = z.object({
  nom: z.string().min(1, "Le nom ne peut être vide."),
  prix: z.coerce.number().min(0, "Le prix ne peut être négatif."),
});

const editMenuItemSchema = z.object({
  nom: z.string().min(3, "Le nom doit contenir au moins 3 caractères."),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères."),
  prix: z.coerce.number().min(0, "Le prix ne peut pas être négatif."),
  accompagnementsDisponibles: z.array(optionSchema).optional(),
  boissonsDisponibles: z.array(optionSchema).optional(),
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
      nom: menuItem.nom,
      description: menuItem.description,
      prix: menuItem.prix,
      accompagnementsDisponibles: menuItem.accompagnementsDisponibles || [],
      boissonsDisponibles: menuItem.boissonsDisponibles || [],
    },
  });

  const { fields: sideFields, append: appendSide, remove: removeSide } = useFieldArray({
    control: form.control,
    name: "accompagnementsDisponibles"
  });
  
  const { fields: drinkFields, append: appendDrink, remove: removeDrink } = useFieldArray({
    control: form.control,
    name: "boissonsDisponibles"
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        nom: menuItem.nom,
        description: menuItem.description,
        prix: menuItem.prix,
        accompagnementsDisponibles: menuItem.accompagnementsDisponibles || [],
        boissonsDisponibles: menuItem.boissonsDisponibles || [],
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
            Apportez des modifications à "{menuItem.nom}". Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
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
                            <FormControl><Textarea {...field} /></FormControl>
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
                            <Input {...form.register(`accompagnementsDisponibles.${index}.prix`)} type="number" placeholder="Prix" className="w-32"/>
                            <Button type="button" variant="outline" size="icon" onClick={() => removeSide(index)}><Trash /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendSide({ nom: '', prix: 0 })}><Plus /> Ajouter un accompagnement</Button>
                </div>
                
                <div className="space-y-2">
                    <Label>Boissons</Label>
                     {drinkFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                            <Input {...form.register(`boissonsDisponibles.${index}.nom`)} placeholder="Nom"/>
                            <Input {...form.register(`boissonsDisponibles.${index}.prix`)} type="number" placeholder="Prix" className="w-32"/>
                            <Button type="button" variant="outline" size="icon" onClick={() => removeDrink(index)}><Trash /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendDrink({ nom: '', prix: 0 })}><Plus /> Ajouter une boisson</Button>
                </div>

                <DialogFooter className="sticky bottom-0 bg-background pt-4 -mx-1 -mb-1 px-1 pb-1">
                    <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader className="animate-spin" />}
                        Enregistrer les modifications
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
