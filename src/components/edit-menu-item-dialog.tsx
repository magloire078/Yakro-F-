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
import { useFirebase } from '@/contexts/firebase-provider';
import { doc, updateDoc } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const uploadImage = async (fileOrDataUrl: File | string, path: string): Promise<string> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration missing.");
  }

  const formData = new FormData();
  formData.append('file', fileOrDataUrl);
  formData.append('upload_preset', uploadPreset);
  formData.append('public_id', path);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
};


interface EditMenuItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem;
}

export function EditMenuItemDialog({ isOpen, onClose, menuItem }: EditMenuItemDialogProps) {
  const { db } = useFirebase();
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
    const itemDocRef = doc(db, 'plats', menuItem.id);
    const updateData: Partial<MenuItem> = { ...data };

    try {
      if (imageFile) {
        const imageUrl = await uploadImage(imageFile, `plats/${menuItem.id}`);
        updateData.image = imageUrl;
      }

      await updateDoc(itemDocRef, updateData).catch(e => {
        const permissionError = new FirestorePermissionError({
          path: itemDocRef.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw e;
      });

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
