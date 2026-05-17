# Yakro Fê — Système visuel

Le système visuel "Yakro Elite" qui s'applique partout : app, plaquettes,
réseaux sociaux, packaging, signalétique livreurs, présentations.

---

## 1. Logo

### 1.A — Variante principale (logo + wordmark)

```
┌────────────────────┐
│  ▢   YAKRO         │
│      FÊ            │
└────────────────────┘
```

- **Symbole** : monogramme « Y » stylisé dans un carré arrondi (`rounded-2xl`),
  fond orange `#F97316`, lettre blanche.
- **Wordmark** : « YAKRO FÊ » en deux lignes, **font-black italic
  uppercase tracking-tighter**, couleur orange `#F97316`.
- **Espace de protection** : minimum 1 hauteur de "Y" autour du logo.

> 💡 À faire produire en SVG par un graphiste à partir de cette description.
> Le code de l'app contient déjà le composant `Icons.logo` qui peut
> servir de base de travail.

### 1.B — Variantes

| Usage | Variante |
|---|---|
| Fond clair (papier blanc, packaging clair) | Logo orange + wordmark orange |
| Fond sombre (app, présentations) | Logo orange + wordmark **blanc** |
| Monochrome (gravure, tampon, fax) | Tout noir ou tout blanc selon support |
| Très petit (favicon, badge livreur, < 32px) | Symbole seul (sans wordmark) |
| Moto / casque livreur | Symbole grand format orange sur fond noir |

### 1.C — Tailles minimales

- **Web / app** : 32 px de hauteur minimum (symbole), 96 px (logo + wordmark).
- **Print** : 8 mm de hauteur minimum (symbole), 25 mm (logo + wordmark).

### 1.D — Interdits stricts

- ❌ Étirer / déformer le logo.
- ❌ Changer les couleurs (sauf variantes 1.B autorisées).
- ❌ Ajouter une ombre portée, contour, effet de relief.
- ❌ Encadrer le logo dans une autre forme.
- ❌ Apposer le logo sur une photo sans aplat de protection (carré sombre
  semi-transparent derrière).
- ❌ Utiliser le wordmark sans le symbole quand l'espace permet les deux.

---

## 2. Palette de couleurs

### 2.A — Couleurs primaires

| Rôle | Nom | Hex | RGB | Usage |
|---|---|---|---|---|
| **Primary** | Yakro Orange | `#F97316` | `249 115 22` | CTA, accents, badges actifs, logo |
| **Background dark** | Yakro Dark | `#0A0A0B` | `10 10 11` | Fond app premium, sidebar, dashboards |
| **Background light** | Yakro White | `#FFFFFF` | `255 255 255` | Fond app client mode jour |
| **Text primary dark** | Slate 900 | `#0F172A` | `15 23 42` | Textes sur fond clair |
| **Text primary light** | White | `#FFFFFF` | `255 255 255` | Textes sur fond sombre |

### 2.B — Couleurs secondaires (utilisation parcimonieuse)

| Rôle | Nom | Hex | Usage |
|---|---|---|---|
| **Success** | Emerald 500 | `#10B981` | Commande livrée, paiement OK |
| **Warning** | Amber 500 | `#F59E0B` | Stock bas, retard léger |
| **Danger** | Red 500 | `#EF4444` | Erreur paiement, commande annulée |
| **Muted** | Slate 500 | `#64748B` | Métadonnées, texte secondaire |
| **Border subtle** | white/5 | `rgba(255,255,255,0.05)` | Bordures sur fond sombre (glassmorphism) |

### 2.C — Règles d'usage

- **Orange = uniquement pour ce qui est cliquable, important ou actif.**
  Jamais pour décorer une grande surface (ça le banalise).
- **Noir = la signature premium.** Le mode sombre n'est pas optionnel
  pour le dashboard restaurateur / livreur — c'est l'identité.
- **Le vert / rouge / ambre sont des codes fonctionnels**, pas
  esthétiques. Si tu te demandes "quelle couleur mettre ici ?",
  la réponse par défaut est : aucune (tons de gris).

---

## 3. Typographie

### 3.A — Familles utilisées

| Police | Usage | Source |
|---|---|---|
| **Sora** | UI principale, titres dashboard, boutons, labels | Google Fonts |
| **Belleza** | Titres décoratifs, hero sections, citations | Google Fonts |
| **Alegreya** | Corps long (rare — articles blog, mentions légales) | Google Fonts |
| **Inter** *(fallback)* | Système | Google Fonts |

### 3.B — Hiérarchie typographique

```
Hero / signature             Belleza  56-72 px  font-black italic uppercase
Titre de section             Sora     32-40 px  font-black uppercase
Sous-titre                   Sora     20-24 px  font-bold
Corps standard               Sora     14-16 px  font-medium
Métadonnée / label           Sora     10-11 px  font-black uppercase tracking-widest
Corps long (prose)           Alegreya 16-18 px  font-regular
```

### 3.C — Règles de mise en forme

- **Titres principaux** : *italic* + *uppercase* + *tracking-tighter*. C'est
  la signature visuelle "Yakro Elite", non négociable.
- **Pas de soulignement** sauf pour les liens dans des paragraphes de
  prose.
- **Tracking-widest** sur tous les labels < 12 px (donne le côté
  mode/luxe).
- **Italique** réservé : marque "Yakro Fê", citations, accents
  éditoriaux. Pas de phrase entière en italique.

---

## 4. Iconographie

### 4.A — Bibliothèque officielle : `lucide-react`

Toutes les icônes de l'app et de la com sont issues de
[lucide.dev](https://lucide.dev). C'est une famille cohérente, libre,
moderne, qui matche le ton "premium minimal".

### 4.B — Règles d'usage

- **Stroke width** : `1.75` (par défaut Lucide) ou `2` pour les icônes
  "actives".
- **Tailles standard** : `16 px` (inline texte), `20 px` (boutons),
  `24 px` (navigation), `32-40 px` (hero / features).
- **Couleur** : héritée du parent (`currentColor`), donc orange si dans
  un contexte orange, blanc/dark si dans un contexte texte.
- **Pas de remplissage** sauf pour signaler un état actif (étoile pleine
  vs étoile contour pour favori actif vs inactif).

### 4.C — Icônes signature à utiliser systématiquement

| Concept | Icône Lucide |
|---|---|
| Logo / marque | (le symbole Yakro custom, pas Lucide) |
| Restaurant | `ChefHat` |
| Plat | `UtensilsCrossed` |
| Livreur / livraison | `Bike` |
| Commande | `ClipboardList` ou `Receipt` |
| Stock | `Package` |
| Notification | `Bell` |
| Premium / fondateur | `ShieldCheck` ou `Crown` (rare) |
| Localisation | `MapPin` |
| Recherche | `Search` |

---

## 5. Composants signature

### 5.A — Glassmorphism

Le pattern visuel central du design Yakro Elite :

```tsx
className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-2xl"
```

À utiliser pour : cartes de tableau de bord, panneaux d'alerte,
modales, popovers, headers.

⚠️ Toujours sur fond sombre. Sur fond clair, utiliser un aplat blanc
avec ombre douce (`bg-white shadow-lg rounded-2xl border border-slate-100`).

### 5.B — CTA principal

```tsx
className="bg-orange-500 hover:bg-orange-600 text-white font-black italic
           uppercase tracking-widest rounded-2xl shadow-2xl shadow-orange-500/20
           h-14 px-8"
```

### 5.C — Badge "Restaurant Fondateur"

```tsx
className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
           bg-orange-500/10 border border-orange-500/30 text-orange-500
           text-[10px] font-black uppercase tracking-widest"
```

---

## 6. Animation

- **Durations standard** : `duration-200` (interactions immédiates),
  `duration-500` (transitions de page), `duration-700` (animations
  d'entrée).
- **Easing** : `ease-out` par défaut, `ease-in-out` pour les loops.
- **Animations signature** :
  - `animate-slow-zoom` (fond hero qui respire lentement)
  - `animate-float` (élément qui flotte légèrement)
  - `animate-pulse` (notification non lue, état "live")
  - Entrée systématique : `fade-in slide-in-from-bottom-4 duration-500`

---

## 7. Espacement & rythme

- Échelle Tailwind par défaut (`4 px` modulo).
- **Padding section** : `py-20 md:py-32`.
- **Padding card** : `p-6` (compact), `p-10` (standard), `p-12` (hero).
- **Gap entre éléments d'une liste** : `gap-4` (cartes), `gap-1.5`
  (navigation).
- **Border radius** : `rounded-2xl` (boutons / cards), `rounded-[2rem]`
  (panneaux signature), `rounded-full` (badges, avatars).

---

## 8. Erreurs fréquentes à corriger

| ❌ Erreur typique | ✅ Correction |
|---|---|
| Tableau avec bordures pleines visibles | Utiliser `border-b border-white/5` discret |
| Bouton orange sur fond orange clair | Toujours fort contraste ou utiliser variante outline |
| Icône colorée en bleu / vert / rouge "pour faire joli" | Hériter de la couleur parent (`currentColor`) |
| Police par défaut (Arial / Helvetica) | Toujours forcer `font-sora` ou `font-belleza` selon contexte |
| Border-radius incohérent (4 px à un endroit, 12 px à l'autre) | S'aligner sur les 3 valeurs canoniques (`rounded-2xl` / `rounded-[2rem]` / `rounded-full`) |
| Trop d'emojis dans les textes UI | Maximum 1 emoji par bloc, et seulement fonctionnel |
