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
import { Loader, BookOpenCheck } from 'lucide-react';
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
      categorie: menuItem.categorie,
      image: menuItem.image,
      accompagnementsDisponibles: menuItem.accompagnementsDisponibles || [],
      boissonsDisponibles: menuItem.boissonsDisponibles || [],
      ingredients: menuItem.ingredients || [],
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        nom: menuItem.nom,
        description: menuItem.description,
        prix: menuItem.prix,
        categorie: menuItem.categorie,
        image: menuItem.image,
        accompagnementsDisponibles: menuItem.accompagnementsDisponibles || [],
        boissonsDisponibles: menuItem.boissonsDisponibles || [],
        ingredients: menuItem.ingredients || [],
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
    } catch {
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
      <DialogContent className="sm:max-w-2xl bg-[#0A0A0B] border border-white/10 rounded-none p-0 overflow-hidden shadow-2xl">
        {/* Header Section */}
        <div className="relative p-8 border-b border-white/5 bg-[#121214]">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
          <DialogHeader>
            <div className="inline-flex items-center gap-2 mb-4">
              <BookOpenCheck className="h-4 w-4 text-orange-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Raffinement Culinaire</span>
            </div>
            <DialogTitle className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
              Actualiser <span className="text-orange-500">&ldquo;{menuItem.nom}&rdquo;</span>
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-medium text-sm mt-2">
              Ajustez les paramètres de votre création pour maintenir l&apos;excellence Yakro Elite.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <MenuItemForm
            form={form}
            onSubmit={onSubmit}
            isLoading={isSubmitting}
          >
            <DialogFooter className="mt-8 pt-8 border-t border-white/5 gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                className="h-14 px-8 bg-white/5 hover:bg-white/10 text-white rounded-none font-bold uppercase tracking-widest text-[10px] transition-all"
              >
                Préserver l&apos;Actuel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white rounded-none font-black italic uppercase tracking-tighter transition-all duration-500 hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
              >
                {isSubmitting ? (
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <BookOpenCheck className="h-5 w-5 mr-2" />
                )}
                Confirmer l&apos;Excellence
              </Button>
            </DialogFooter>
          </MenuItemForm>
        </div>
      </DialogContent>
    </Dialog>
  );
}
