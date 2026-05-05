'use client';

import * as React from 'react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash, Plus, Upload, Tag } from 'lucide-react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { useData } from '@/contexts/data-context';

const optionSchema = z.object({
  nom: z.string().min(1, "Le nom ne peut être vide."),
  prix: z.coerce.number().min(0, "Le prix ne peut être négatif."),
});

export const menuItemFormSchema = z.object({
  nom: z.string().min(3, "Le nom doit contenir au moins 3 caractères."),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères."),
  prix: z.coerce.number().min(0, "Le prix ne peut pas être négatif."),
  categorie: z.string().min(1, "La catégorie est requise."),
  image: z.string().optional(),
  indiceImage: z.string().optional(),
  accompagnementsDisponibles: z.array(optionSchema).optional(),
  boissonsDisponibles: z.array(optionSchema).optional(),
  ingredients: z.array(z.object({
    stockItemId: z.string().min(1, "L'ingrédient est requis."),
    nom: z.string(),
    quantite: z.coerce.number().min(0, "La quantité ne peut être négative."),
    unite: z.string(),
  })).optional(),
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

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
    control: form.control,
    name: "ingredients"
  });

  const { stocks } = useData();

  const handleFormSubmit = (data: MenuItemFormValues) => {
    onSubmit(data, currentImageFile);
  };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 max-h-[70vh] overflow-y-auto p-1 pr-4 custom-scrollbar">
                {/* Elite Image Uploader */}
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 block">Image du Plat</Label>
                    <Label htmlFor="image-upload-form" className="cursor-pointer block group">
                        <div className="relative w-full h-56 rounded-2xl border border-slate-200/60 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-orange-500/50 transition-all duration-500 overflow-hidden shadow-sm">
                            {imageToDisplay ? (
                                <>
                                    {imageToDisplay.includes('res.cloudinary.com') ? (
                                        <CldImage
                                            src={imageToDisplay}
                                            alt="Aperçu"
                                            fill
                                            crop="fill"
                                            gravity="auto"
                                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                        />
                                    ) : (
                                        <Image 
                                            src={imageToDisplay} 
                                            alt="Aperçu" 
                                            fill 
                                            sizes="(max-width: 768px) 100vw, 400px"
                                            className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-sm">
                                        <Upload className="h-8 w-8 text-white mb-2" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Changer l&apos;Image</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center space-y-4 p-8">
                                    <div className="p-4 bg-white border border-slate-100 rounded-full w-fit mx-auto group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                        <Upload className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-slate-900 font-black italic uppercase tracking-tighter text-xl leading-none">Ajouter une image</p>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Format recommandé: 1:1 ou 4:3</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Label>
                    <Input id="image-upload-form" type="file" accept="image/*" className="hidden" onChange={currentImageChangeHandler} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="nom"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nom du Plat</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        placeholder="Ex: Le Yakro Royal"
                                        className="h-14 bg-slate-50 border-slate-200/60 rounded-xl focus-visible:ring-orange-500 focus-visible:border-orange-500 text-slate-900 font-medium transition-all shadow-sm" 
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="categorie"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Catégorie</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-14 bg-slate-50 border-slate-200/60 rounded-xl focus:ring-orange-500 text-slate-900 font-bold transition-all shadow-sm">
                                            <SelectValue placeholder="SÉLECTIONNER" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-xl shadow-xl">
                                        <SelectItem value="Entrées" className="focus:bg-orange-500 focus:text-white uppercase font-bold text-[10px] tracking-widest py-3 cursor-pointer">Entrées</SelectItem>
                                        <SelectItem value="Plats" className="focus:bg-orange-500 focus:text-white uppercase font-bold text-[10px] tracking-widest py-3 cursor-pointer">Plats</SelectItem>
                                        <SelectItem value="Desserts" className="focus:bg-orange-500 focus:text-white uppercase font-bold text-[10px] tracking-widest py-3 cursor-pointer">Desserts</SelectItem>
                                        <SelectItem value="Boissons" className="focus:bg-orange-500 focus:text-white uppercase font-bold text-[10px] tracking-widest py-3 cursor-pointer">Boissons</SelectItem>
                                        <SelectItem value="Autres" className="focus:bg-orange-500 focus:text-white uppercase font-bold text-[10px] tracking-widest py-3 cursor-pointer">Autres</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="prix"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Prix (FCFA)</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    {...field} 
                                    placeholder="0"
                                    className="h-14 bg-slate-50 border-slate-200/60 rounded-xl focus-visible:ring-orange-500 focus-visible:border-orange-500 text-orange-500 font-black italic text-xl transition-all shadow-sm" 
                                />
                            </FormControl>
                            <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Description</FormLabel>
                            <FormControl>
                                <Textarea 
                                    {...field} 
                                    rows={4} 
                                    placeholder="Décrivez l'expérience sensorielle de ce plat..."
                                    className="bg-slate-50 border-slate-200/60 rounded-xl focus-visible:ring-orange-500 focus-visible:border-orange-500 text-slate-900 font-medium placeholder:text-slate-400 transition-all resize-none shadow-sm" 
                                />
                            </FormControl>
                            <FormMessage className="text-[10px] uppercase font-bold text-red-500" />
                        </FormItem>
                    )}
                />

                {/* Accompagnements */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Accompagnements</Label>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => appendSide({ nom: '', prix: 0 })} 
                            className="h-8 px-3 bg-slate-50 hover:bg-orange-500/10 text-orange-500 rounded-lg font-black italic uppercase tracking-tighter text-[9px] border border-slate-200/60 transition-all shadow-sm"
                        >
                            <Plus className="h-3 w-3 mr-2" /> Ajouter
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {sideFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Input 
                                    {...form.register(`accompagnementsDisponibles.${index}.nom`)} 
                                    placeholder="Libellé" 
                                    className="h-12 bg-slate-50 border-slate-200/60 rounded-xl text-slate-900 font-bold text-sm focus-visible:ring-orange-500 shadow-sm" 
                                />
                                <Input 
                                    {...form.register(`accompagnementsDisponibles.${index}.prix`)} 
                                    type="number" 
                                    placeholder="Prix" 
                                    className="h-12 w-32 bg-slate-50 border-slate-200/60 rounded-xl text-orange-500 font-black italic focus-visible:ring-orange-500 shadow-sm" 
                                />
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeSide(index)} 
                                    className="h-12 w-12 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-100 transition-colors shadow-sm"
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Boissons */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Boissons</Label>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => appendDrink({ nom: '', prix: 0 })} 
                            className="h-8 px-3 bg-slate-50 hover:bg-orange-500/10 text-orange-500 rounded-lg font-black italic uppercase tracking-tighter text-[9px] border border-slate-200/60 transition-all shadow-sm"
                        >
                            <Plus className="h-3 w-3 mr-2" /> Ajouter
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {drinkFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Input 
                                    {...form.register(`boissonsDisponibles.${index}.nom`)} 
                                    placeholder="Nom de la boisson" 
                                    className="h-12 bg-slate-50 border-slate-200/60 rounded-xl text-slate-900 font-bold text-sm focus-visible:ring-orange-500 shadow-sm" 
                                />
                                <Input 
                                    {...form.register(`boissonsDisponibles.${index}.prix`)} 
                                    type="number" 
                                    placeholder="Prix" 
                                    className="h-12 w-32 bg-slate-50 border-slate-200/60 rounded-xl text-orange-500 font-black italic focus-visible:ring-orange-500 shadow-sm" 
                                />
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeDrink(index)} 
                                    className="h-12 w-12 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-100 transition-colors shadow-sm"
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ingredients / Stock Automation */}
                <div className="space-y-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Ingrédients & Automatisation</Label>
                            <p className="text-[9px] text-slate-400 font-medium italic">Le stock sera déduit automatiquement à la livraison.</p>
                        </div>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => appendIngredient({ stockItemId: '', nom: '', quantite: 0, unite: '' })} 
                            className="h-8 px-3 bg-slate-50 hover:bg-orange-500/10 text-orange-500 rounded-lg font-black italic uppercase tracking-tighter text-[9px] border border-slate-200/60 transition-all shadow-sm"
                        >
                            <Plus className="h-3 w-3 mr-2" /> Lier Ingrédient
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {ingredientFields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 bg-slate-50 border border-slate-200/60 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 relative group shadow-sm">
                                <div className="md:col-span-5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Article en Stock</Label>
                                    <FormField
                                        control={form.control}
                                        name={`ingredients.${index}.stockItemId`}
                                        render={({ field: selectField }) => (
                                            <Select 
                                                onValueChange={(val) => {
                                                    selectField.onChange(val);
                                                    const stockItem = stocks.find(s => s.id === val);
                                                    if (stockItem) {
                                                        form.setValue(`ingredients.${index}.nom`, stockItem.nom);
                                                        form.setValue(`ingredients.${index}.unite`, stockItem.unite);
                                                    }
                                                }} 
                                                value={selectField.value}
                                            >
                                                <SelectTrigger className="h-12 bg-white border-slate-100 focus:border-orange-500/50 rounded-xl text-slate-900 font-bold text-sm shadow-inner">
                                                    <SelectValue placeholder="Choisir un ingrédient" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-xl shadow-xl">
                                                    {stocks.map((stock) => (
                                                        <SelectItem 
                                                            key={stock.id} 
                                                            value={stock.id}
                                                            className="focus:bg-orange-500 focus:text-white uppercase font-bold text-[10px] tracking-widest py-3 cursor-pointer"
                                                        >
                                                            {stock.nom} ({stock.quantite} {stock.unite} restants)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Quantité / Plat</Label>
                                    <Input 
                                        {...form.register(`ingredients.${index}.quantite`)} 
                                        type="number" 
                                        step="0.01"
                                        placeholder="0.00" 
                                        className="h-12 bg-white border-slate-100 focus:border-orange-500/50 rounded-xl text-orange-500 font-black italic shadow-inner" 
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Unité</Label>
                                    <div className="h-12 bg-slate-100/50 border border-slate-100 rounded-xl flex items-center px-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">
                                        {form.watch(`ingredients.${index}.unite`) || '---'}
                                    </div>
                                </div>
                                <div className="md:col-span-2 flex items-end">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeIngredient(index)} 
                                        className="h-12 w-full bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-100 transition-colors shadow-sm"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {ingredientFields.length === 0 && (
                            <div className="py-12 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-3 bg-slate-50/50">
                                <div className="p-3 bg-white rounded-full shadow-sm">
                                    <Tag className="h-6 w-6 text-slate-300" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aucun ingrédient lié à cette recette</span>
                            </div>
                        )}
                    </div>
                </div>

                {children}
            </form>
        </Form>
    );
}
