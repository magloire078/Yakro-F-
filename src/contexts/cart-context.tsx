'use client';

import * as React from 'react';
import type { CartItem, MenuItem, Order, MenuOption, PaymentMethod } from '@/lib/types';
import { useData } from './data-context';
import { useAuth } from './auth-context';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { addDoc, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { useFirebase } from './firebase-provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { applyPromoCode, type PromoApplication } from '@/lib/promo-codes';
import {
  PAYMENT_METHODS,
  getPaymentMethod,
  simulatePrepaidPayment,
  validatePaymentReference,
} from '@/lib/payment';
import {
  computeOrderPoints,
  computePointsFromOrders,
  getTierForPoints,
  computeLoyaltyDeliveryDiscount,
} from '@/lib/loyalty';
import { getDefaultAddress, getUserAddresses } from '@/lib/addresses';
import type { SavedAddress, HappyHour } from '@/lib/types';
import { getActiveHappyHour, applyHappyHourDiscount } from '@/lib/promotions';
import {
  canUseFilleulDiscount,
  FILLEUL_DISCOUNT_FCFA,
  FILLEUL_MIN_SUBTOTAL,
  PARRAIN_BONUS_POINTS,
} from '@/lib/referrals';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'image'>) => void;
  reorderItems: (items: Omit<CartItem, 'image'>[]) => void;
  removeFromCart: (itemId: string, side?: string, drink?: string) => void;
  updateQuantity: (itemId: string, quantity: number, side?: string, drink?: string) => void;
  clearCart: () => void;
  placeOrder: () => Promise<void>;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartDiscount: number;
  cartLoyaltyDiscount: number;
  cartReferralDiscount: number;
  cartTotal: number;
  cartCount: number;
  promoCode: PromoApplication | null;
  applyPromo: (code: string) => { ok: true } | { ok: false; error: string };
  removePromo: () => void;
  scheduledFor: string | null;
  setScheduledFor: (iso: string | null) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  paymentReference: string;
  setPaymentReference: (ref: string) => void;
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string | null) => void;
  savedAddresses: SavedAddress[];
  deliveryInstructions: string;
  setDeliveryInstructions: (notes: string) => void;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

const getInitialCart = (): CartItem[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        const item = window.localStorage.getItem('yakro-fe-cart');
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.warn('Error reading localStorage cart', error);
        return [];
    }
};

const COMMISSION_RATE = 0.15; // 15% commission

const getUserLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      }
    );
  });
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = React.useState<CartItem[]>(getInitialCart);
  const [promoCode, setPromoCode] = React.useState<PromoApplication | null>(null);
  const [scheduledFor, setScheduledFor] = React.useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('especes');
  const [paymentReference, setPaymentReference] = React.useState<string>('');
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(null);
  const [deliveryInstructions, setDeliveryInstructions] = React.useState<string>('');
  const { getRestaurant, orders } = useData();
  const { user, userProfile } = useAuth();
  const { db } = useFirebase();

  // Pré-remplit le téléphone Mobile Money depuis le profil utilisateur si disponible.
  React.useEffect(() => {
    if (!paymentReference && userProfile?.telephone) {
      setPaymentReference(userProfile.telephone);
    }
  }, [userProfile?.telephone]); // eslint-disable-line react-hooks/exhaustive-deps

  const savedAddresses = React.useMemo(() => getUserAddresses(userProfile), [userProfile]);

  // Sélectionne automatiquement l'adresse par défaut si aucune n'est encore choisie.
  React.useEffect(() => {
    if (selectedAddressId) return;
    const def = getDefaultAddress(userProfile);
    if (def) setSelectedAddressId(def.id);
  }, [userProfile, selectedAddressId]);

  React.useEffect(() => {
    try {
        window.localStorage.setItem('yakro-fe-cart', JSON.stringify(cartItems));
    } catch (error) {
        console.warn('Error writing to localStorage cart', error);
    }
  }, [cartItems]);

  const addToCart = (item: Omit<CartItem, 'image'>) => {
    if (cartItems.length > 0 && cartItems[0].restaurantId !== item.restaurantId) {
        if(confirm("Votre panier contient déjà des plats d'un autre restaurant. Voulez-vous le vider pour commander ici ?")) {
            setCartItems([{ ...item, quantite: 1 }]);
        }
        return;
    }

    setCartItems(prevItems => {
      const uniqueItemKey = `${item.id}-${item.accompagnementSelectionne?.nom || 'none'}-${item.boissonSelectionnee?.nom || 'none'}`;
      
      const existingItem = prevItems.find(i => 
        `${i.id}-${i.accompagnementSelectionne?.nom || 'none'}-${i.boissonSelectionnee?.nom || 'none'}` === uniqueItemKey
      );

      if (existingItem) {
        return prevItems.map(i =>
          `${i.id}-${i.accompagnementSelectionne?.nom || 'none'}-${i.boissonSelectionnee?.nom || 'none'}` === uniqueItemKey 
          ? { ...i, quantite: i.quantite + item.quantite } 
          : i
        );
      }
      return [...prevItems, item];
    });
  };

  const getUniqueKey = (itemId: string, side?: string, drink?: string) => {
    return `${itemId}-${side || 'none'}-${drink || 'none'}`;
  }

  const removeFromCart = (itemId: string, side?: string, drink?: string) => {
    const keyToRemove = getUniqueKey(itemId, side, drink);
    setCartItems(prevItems => prevItems.filter(i => 
        getUniqueKey(i.id, i.accompagnementSelectionne?.nom, i.boissonSelectionnee?.nom) !== keyToRemove
    ));
  };

  const updateQuantity = (itemId: string, quantity: number, side?: string, drink?: string) => {
    const keyToUpdate = getUniqueKey(itemId, side, drink);
    if (quantity <= 0) {
      removeFromCart(itemId, side, drink);
    } else {
      setCartItems(prevItems =>
        prevItems.map(i => (getUniqueKey(i.id, i.accompagnementSelectionne?.nom, i.boissonSelectionnee?.nom) === keyToUpdate ? { ...i, quantite: quantity } : i))
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setPromoCode(null);
    setScheduledFor(null);
    setDeliveryInstructions('');
  };

  const reorderItems = (items: Omit<CartItem, 'image'>[]) => {
    if (items.length === 0) return;
    const merged: CartItem[] = [];
    const keyOf = (i: Omit<CartItem, 'image'>) =>
      `${i.id}-${i.accompagnementSelectionne?.nom || 'none'}-${i.boissonSelectionnee?.nom || 'none'}`;
    for (const item of items) {
      const key = keyOf(item);
      const existing = merged.find(m => keyOf(m) === key);
      if (existing) {
        existing.quantite += item.quantite;
      } else {
        merged.push({ ...item });
      }
    }
    setCartItems(merged);
  };

  const cartHappyHour = React.useMemo<HappyHour | null>(() => {
    if (cartItems.length === 0) return null;
    const restaurant = getRestaurant(cartItems[0].restaurantId);
    return getActiveHappyHour(restaurant);
  }, [cartItems, getRestaurant]);

  const cartSubtotal = React.useMemo(() => {
    return cartItems.reduce((total, item) => {
      const itemPrice = applyHappyHourDiscount(item.prix, cartHappyHour);
      const sidePrice = item.accompagnementSelectionne?.prix || 0;
      const drinkPrice = item.boissonSelectionnee?.prix || 0;
      return total + (itemPrice + sidePrice + drinkPrice) * item.quantite;
    }, 0);
  }, [cartItems, cartHappyHour]);

  const cartBaseDeliveryFee = React.useMemo(() => {
      if (cartItems.length === 0) return 0;
      const restaurantId = cartItems[0].restaurantId;
      const restaurant = getRestaurant(restaurantId);
      return restaurant?.fraisDeLivraison || 0;
  }, [cartItems, getRestaurant]);

  const userLoyaltyTier = React.useMemo(() => {
    if (!user) return getTierForPoints(0).tier;
    const points = computePointsFromOrders(orders, user.uid);
    return getTierForPoints(points).tier;
  }, [orders, user]);

  const cartLoyaltyDiscount = React.useMemo(
    () => computeLoyaltyDeliveryDiscount(userLoyaltyTier, cartBaseDeliveryFee),
    [userLoyaltyTier, cartBaseDeliveryFee]
  );

  // Frais affichés au client (avant code promo de livraison gratuite).
  const cartDeliveryFee = React.useMemo(
    () => Math.max(0, cartBaseDeliveryFee - cartLoyaltyDiscount),
    [cartBaseDeliveryFee, cartLoyaltyDiscount]
  );

  // Recalcule le promo si sous-total/livraison changent (peut invalider le minimum)
  React.useEffect(() => {
    if (!promoCode) return;
    const result = applyPromoCode(promoCode.code.code, cartSubtotal, cartDeliveryFee);
    if (!result.ok) {
      setPromoCode(null);
    } else {
      setPromoCode(result.application);
    }
  }, [cartSubtotal, cartDeliveryFee]); // eslint-disable-line react-hooks/exhaustive-deps

  const cartDiscount = React.useMemo(() => {
    if (!promoCode) return 0;
    return promoCode.reduction + (promoCode.fraisLivraisonOffert ? cartDeliveryFee : 0);
  }, [promoCode, cartDeliveryFee]);

  const userHasDeliveredOrders = React.useMemo(() => {
    if (!user) return true;
    return orders.some(o => o.userId === user.uid && o.statut === 'Livrée');
  }, [orders, user]);

  const cartReferralDiscount = React.useMemo(() => {
    if (cartSubtotal < FILLEUL_MIN_SUBTOTAL) return 0;
    if (!canUseFilleulDiscount(userProfile, userHasDeliveredOrders)) return 0;
    return FILLEUL_DISCOUNT_FCFA;
  }, [cartSubtotal, userProfile, userHasDeliveredOrders]);

  const cartTotal = React.useMemo(() => {
    return Math.max(0, cartSubtotal + cartDeliveryFee - cartDiscount - cartReferralDiscount);
  }, [cartSubtotal, cartDeliveryFee, cartDiscount, cartReferralDiscount]);

  const cartCount = React.useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantite, 0);
  }, [cartItems]);

  const applyPromo = (code: string) => {
    const result = applyPromoCode(code, cartSubtotal, cartDeliveryFee);
    if (!result.ok) return { ok: false as const, error: result.error };
    setPromoCode(result.application);
    return { ok: true as const };
  };

  const removePromo = () => setPromoCode(null);

  const placeOrder = async () => {
    if (!user || !userProfile) {
        throw new Error("Vous devez être connecté pour passer une commande.");
    }
     if (cartItems.length === 0) {
        throw new Error("Votre panier est vide.");
    }

    const chosenAddress =
      savedAddresses.find(a => a.id === selectedAddressId) ||
      getDefaultAddress(userProfile);
    if (!chosenAddress) {
        throw new Error("Veuillez ajouter une adresse de livraison dans votre profil.");
    }

    const paymentInfo = getPaymentMethod(paymentMethod);
    if (paymentInfo.needsPhone || paymentInfo.needsCard) {
        const ref = paymentReference.replace(/\s+/g, '');
        const validation = validatePaymentReference(paymentMethod, ref);
        if (!validation.ok) throw new Error(validation.error);
    }

    // Vérifie qu'aucun plat du panier n'a été marqué indisponible entre temps.
    const { menuItems: allMenuItems } = useData.getState();
    const unavailable = cartItems.find(ci => {
        const m = allMenuItems.find(mi => mi.id === ci.id);
        return m?.indisponible;
    });
    if (unavailable) {
        throw new Error(`« ${unavailable.nom} » est désormais indisponible. Retirez-le pour valider.`);
    }

    // Si l'adresse a des coordonnées, on les utilise; sinon on tente la géoloc.
    const addressCoords = chosenAddress.latitude && chosenAddress.longitude
      ? { latitude: chosenAddress.latitude, longitude: chosenAddress.longitude }
      : null;
    const location = addressCoords ?? (await getUserLocation());
    const restaurantId = cartItems[0].restaurantId;
    const restaurant = getRestaurant(restaurantId);

    const commissionAmount = cartSubtotal * COMMISSION_RATE;
    const netRevenue = cartSubtotal - commissionAmount;
    const discount = cartDiscount;
    const pointsGagnes = computeOrderPoints(cartSubtotal);

    const itemsForOrder = cartItems.map(item => {
        const placeholder = getPlaceholderImage(item.indiceImage);
        const image = (item.image && !item.image.includes('picsum.photos')) ? item.image : placeholder.url;
        return {
            ...item,
            image,
        }
    });

    const newOrder: Omit<Order, 'id'> = {
        userId: user.uid,
        plats: itemsForOrder,
        sousTotal: cartSubtotal,
        fraisDeLivraison: promoCode?.fraisLivraisonOffert ? 0 : cartDeliveryFee,
        total: cartTotal,
        tauxCommission: COMMISSION_RATE,
        montantCommission: commissionAmount,
        revenuNet: netRevenue,
        pointsGagnes,
        methodePaiement: paymentMethod,
        statutPaiement: paymentInfo.initialStatus,
        ...(paymentInfo.needsPhone || paymentInfo.needsCard
          ? { referencePaiement: paymentReference.replace(/\s+/g, '') }
          : {}),
        ...(promoCode && {
            codePromo: promoCode.code.code,
            reductionPromo: discount,
        }),
        ...(cartReferralDiscount > 0 && { reductionParrainage: cartReferralDiscount }),
        ...(scheduledFor && { programmePour: scheduledFor }),
        ...(deliveryInstructions.trim() && { instructionsLivraison: deliveryInstructions.trim() }),
        libelleAdresse: chosenAddress.libelle,
        date: new Date().toISOString(),
        nomRestaurant: restaurant?.nom || 'Restaurant inconnu',
        restaurantId: restaurantId,
        statut: 'Placée',
        adresseClient: chosenAddress.adresse,
        adresseRestaurant: restaurant?.adresse || 'Adresse du restaurant non spécifiée',
        telephoneClient: userProfile.telephone || 'Numéro non spécifié',
        ...(location && {
            latitudeClient: location.latitude,
            longitudeClient: location.longitude,
        }),
        ...(restaurant?.latitude && { latitudeRestaurant: restaurant.latitude }),
        ...(restaurant?.longitude && { longitudeRestaurant: restaurant.longitude }),
    };

    const orderDocRef = doc(collection(db, "commandes"));

    try {
        await setDoc(orderDocRef, newOrder);
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: orderDocRef.path,
            operation: 'create',
            requestResourceData: newOrder,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }

    // Persiste le bonus parrainage : marque le filleul + écrit dans le ledger
    // /parrainages que le parrain interrogera depuis son code public.
    if (cartReferralDiscount > 0 && userProfile.parraineParCode) {
        const code = userProfile.parraineParCode;
        // Empêche l'auto-parrainage (filet de sécurité côté client).
        if (code !== userProfile.codeParrainage) {
            updateDoc(doc(db, 'utilisateurs', user.uid), { bonusParrainageUtilise: true })
                .catch(() => { /* silencieux : recalcul à la prochaine commande */ });

            addDoc(collection(db, 'parrainages'), {
                parrainCode: code,
                filleulUid: user.uid,
                pointsBonus: PARRAIN_BONUS_POINTS,
                date: new Date().toISOString(),
            }).catch(() => { /* silencieux : non bloquant pour la commande */ });
        }
    }

    clearCart();
    window.dispatchEvent(new CustomEvent('place-order'));

    // Paiement prépayé : on simule la confirmation en arrière-plan.
    // À remplacer par une intégration PSP réelle (webhook serveur).
    if (paymentInfo.prepayé) {
        simulatePrepaidPayment().then(({ success }) => {
            updateDoc(orderDocRef, {
                statutPaiement: success ? 'Confirmé' : 'Échoué',
            }).catch(() => {
                // Silencieux : l'utilisateur peut réessayer depuis le suivi.
            });
        });
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, reorderItems, removeFromCart, updateQuantity, clearCart, cartSubtotal, cartDeliveryFee, cartDiscount, cartLoyaltyDiscount, cartReferralDiscount, cartTotal, cartCount, placeOrder, promoCode, applyPromo, removePromo, scheduledFor, setScheduledFor, paymentMethod, setPaymentMethod, paymentReference, setPaymentReference, selectedAddressId, setSelectedAddressId, savedAddresses, deliveryInstructions, setDeliveryInstructions }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
