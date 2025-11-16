
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import type { MenuItem } from '@/lib/types';
import { Loader } from 'lucide-react';
import { MenuItemForm, type MenuItemFormValues, menuItemFormSchema } from './menu-item-form';
import { updateMenuItemAction } from '@/app/actions/menu-item-actions';


interface EditMenuItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem;
}

export function EditMenuItemDialog({ isOpen, onClose, menuItem }: EditMenuItemDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      nom: menuItem.nom,
      description: menuItem.description,
      prix: menuItem.prix,
      image: menuItem.image,
      accompagnementsDisponibles: menuItem.accompagnementsDisponibles || [],
      boissonsDisponibles: menuItem.boissonsDisponibles || [],
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        nom: menuItem.nom,
        description: menuItem.description,
        prix: menuItem.prix,
        image: menuItem.image,
        accompagnementsDisponibles: menuItem.accompagnementsDisponibles || [],
        boissonsDisponibles: menuItem.boissonsDisponibles || [],
      });
    }
  }, [isOpen, menuItem, form]);

  const onSubmit = async (data: MenuItemFormValues, imageFile: File | null) => {
    setIsSubmitting(true);
    try {
        const formData = new FormData();
        formData.append('itemId', menuItem.id);
        formData.append('data', JSON.stringify(data));
        if (imageFile) {
            formData.append('image', imageFile);
        }
        await updateMenuItemAction(formData);

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
        
        <MenuItemForm
          form={form}
          onSubmit={onSubmit}
          isLoading={isSubmitting}
        >
            <DialogFooter className="sticky bottom-0 bg-background pt-4 -mx-1 -mb-1 px-1 pb-1">
                <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader className="animate-spin" />}
                    Enregistrer les modifications
                </Button>
            </DialogFooter>
        </MenuItemForm>

      </DialogContent>
    </Dialog>
  );
}
