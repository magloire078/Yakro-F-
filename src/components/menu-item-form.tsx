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
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Signature Visuelle</Label>
                    <Label htmlFor="image-upload-form" className="cursor-pointer block group">
                        <div className="relative w-full h-56 rounded-none border border-white/5 bg-white/5 flex flex-col items-center justify-center text-gray-500 hover:bg-white/10 hover:border-orange-500/50 transition-all duration-500 overflow-hidden shadow-2xl">
                            {imageToDisplay ? (
                                <>
                                    {imageToDisplay.includes('res.cloudinary.com') ? (
                                        <CldImage
                                            src={imageToDisplay}
                                            alt="Aperçu"
                                            fill
                                            crop="fill"
                                            gravity="auto"
                                            className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
                                        />
                                    ) : (
                                        <Image 
                                            src={imageToDisplay} 
                                            alt="Aperçu" 
                                            fill 
                                            sizes="(max-width: 768px) 100vw, 400px"
                                            className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-60" 
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <Upload className="h-8 w-8 text-orange-500 mb-2" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Changer l&apos;Image</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="p-4 bg-orange-500/10 rounded-full w-fit mx-auto group-hover:scale-110 transition-transform duration-500">
                                        <Upload className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Immortaliser le Plat</p>
                                        <p className="text-[9px] font-medium text-gray-500 mt-1 uppercase tracking-widest">Formats Haute Fidélité Uniquement</p>
                                    </div>
                                </div>
                            )}
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                    </Label>
                    <Input id="image-upload-form" type="file" accept="image/*" className="hidden" onChange={currentImageChangeHandler} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="nom"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Nom du Chef-d&apos;œuvre</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        placeholder="Ex: Le Yakro Royal"
                                        className="h-14 bg-white/5 border-white/5 focus:border-orange-500/50 focus:ring-0 rounded-none text-white font-bold placeholder:text-gray-700 transition-all" 
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] font-bold uppercase tracking-tighter" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="categorie"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Catégorie Gastronomique</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-14 bg-white/5 border-white/5 focus:border-orange-500/50 focus:ring-0 rounded-none text-white font-bold transition-all">
                                            <SelectValue placeholder="SÉLECTIONNER UNE CATÉGORIE" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-[#121214] border-white/10 text-white rounded-none">
                                        <SelectItem value="Entrées" className="focus:bg-orange-500 focus:text-white uppercase font-bold text-[10px] tracking-widest py-3">Entrées</SelectItem>
                                        <SelectItem value="Plats" className="focus:bg-orange-500 focus:text-white uppercase font-bold text-[10px] tracking-widest py-3">Plats</SelectItem>
                                        <SelectItem value="Desserts" className="focus:bg-orange-500 focus:text-white uppercase font-bold text-[10px] tracking-widest py-3">Desserts</SelectItem>
                                        <SelectItem value="Boissons" className="focus:bg-orange-500 focus:text-white uppercase font-bold text-[10px] tracking-widest py-3">Boissons</SelectItem>
                                        <SelectItem value="Autres" className="focus:bg-orange-500 focus:text-white uppercase font-bold text-[10px] tracking-widest py-3">Autres</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px] font-bold uppercase tracking-tighter" />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="prix"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Valeur Prestige (FCFA)</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    {...field} 
                                    placeholder="0"
                                    className="h-14 bg-white/5 border-white/5 focus:border-orange-500/50 focus:ring-0 rounded-none text-orange-500 font-black italic text-xl transition-all" 
                                />
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold uppercase tracking-tighter" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Récit Gastronomique</FormLabel>
                            <FormControl>
                                <Textarea 
                                    {...field} 
                                    rows={4} 
                                    placeholder="Décrivez l'expérience sensorielle de ce plat..."
                                    className="bg-white/5 border-white/5 focus:border-orange-500/50 focus:ring-0 rounded-none text-gray-300 font-medium placeholder:text-gray-700 transition-all resize-none" 
                                />
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold uppercase tracking-tighter" />
                        </FormItem>
                    )}
                />

                {/* Accompagnements */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Accompagnements Signature</Label>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => appendSide({ nom: '', prix: 0 })} 
                            className="h-8 px-3 bg-white/5 hover:bg-orange-500/20 text-orange-500 rounded-none font-black italic uppercase tracking-tighter text-[9px] border border-white/5"
                        >
                            <Plus className="h-3 w-3 mr-2" /> Ajouter
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {sideFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-3 animate-fade-in">
                                <Input 
                                    {...form.register(`accompagnementsDisponibles.${index}.nom`)} 
                                    placeholder="Libellé" 
                                    className="h-12 bg-white/5 border-white/5 focus:border-orange-500/50 rounded-none text-white font-bold text-sm" 
                                />
                                <Input 
                                    {...form.register(`accompagnementsDisponibles.${index}.prix`)} 
                                    type="number" 
                                    placeholder="Prix" 
                                    className="h-12 w-32 bg-white/5 border-white/5 focus:border-orange-500/50 rounded-none text-orange-500 font-black italic" 
                                />
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeSide(index)} 
                                    className="h-12 w-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-none border border-red-500/20"
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Boissons */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Sélection de Boissons</Label>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => appendDrink({ nom: '', prix: 0 })} 
                            className="h-8 px-3 bg-white/5 hover:bg-orange-500/20 text-orange-500 rounded-none font-black italic uppercase tracking-tighter text-[9px] border border-white/5"
                        >
                            <Plus className="h-3 w-3 mr-2" /> Ajouter
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {drinkFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-3 animate-fade-in">
                                <Input 
                                    {...form.register(`boissonsDisponibles.${index}.nom`)} 
                                    placeholder="Nom de la boisson" 
                                    className="h-12 bg-white/5 border-white/5 focus:border-orange-500/50 rounded-none text-white font-bold text-sm" 
                                />
                                <Input 
                                    {...form.register(`boissonsDisponibles.${index}.prix`)} 
                                    type="number" 
                                    placeholder="Prix" 
                                    className="h-12 w-32 bg-white/5 border-white/5 focus:border-orange-500/50 rounded-none text-orange-500 font-black italic" 
                                />
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeDrink(index)} 
                                    className="h-12 w-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-none border border-red-500/20"
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ingredients / Stock Automation */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Ingrédients & Automatisation</Label>
                            <p className="text-[9px] text-gray-400 font-medium italic">Le stock sera déduit automatiquement à la livraison.</p>
                        </div>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => appendIngredient({ stockItemId: '', nom: '', quantite: 0, unite: '' })} 
                            className="h-8 px-3 bg-white/5 hover:bg-orange-500/20 text-orange-500 rounded-none font-black italic uppercase tracking-tighter text-[9px] border border-white/5"
                        >
                            <Plus className="h-3 w-3 mr-2" /> Lier Ingrédient
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {ingredientFields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-white/5 border border-white/5 animate-fade-in relative group">
                                <div className="md:col-span-5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1 block">Article en Stock</Label>
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
                                                <SelectTrigger className="h-12 bg-black/20 border-white/5 focus:border-orange-500/50 rounded-none text-white font-bold text-sm">
                                                    <SelectValue placeholder="Choisir un ingrédient" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#121214] border-white/10 text-white rounded-none">
                                                    {stocks.map((stock) => (
                                                        <SelectItem 
                                                            key={stock.id} 
                                                            value={stock.id}
                                                            className="focus:bg-orange-500 focus:text-white uppercase font-bold text-[10px] tracking-widest py-3"
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
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1 block">Quantité / Plat</Label>
                                    <Input 
                                        {...form.register(`ingredients.${index}.quantite`)} 
                                        type="number" 
                                        step="0.01"
                                        placeholder="0.00" 
                                        className="h-12 bg-black/20 border-white/5 focus:border-orange-500/50 rounded-none text-orange-500 font-black italic" 
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1 block">Unité</Label>
                                    <Input 
                                        {...form.register(`ingredients.${index}.unite`)} 
                                        disabled
                                        className="h-12 bg-black/10 border-white/5 rounded-none text-gray-400 font-bold text-xs uppercase" 
                                    />
                                </div>
                                <div className="md:col-span-2 flex items-end">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeIngredient(index)} 
                                        className="h-12 w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-none border border-red-500/20"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {ingredientFields.length === 0 && (
                            <div className="py-8 border border-dashed border-white/10 flex flex-col items-center justify-center space-y-2 opacity-50">
                                <Tag className="h-6 w-6 text-gray-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Aucun ingrédient lié</span>
                            </div>
                        )}
                    </div>
                </div>

                {children}
            </form>
        </Form>
    );
}
