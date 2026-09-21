# Yakro Fê — Mémo de marque (1 page)

> À imprimer recto-verso, à coller au mur de l'open-space, à partager
> à tout intervenant externe (graphiste, dev, copywriter, photographe,
> influenceur…).

---

## Qui on est

> **La première application de livraison faite à Yakro pour Yakro.**

Cinq mots qui résument la marque : **Premium · Local · Précis ·
Chaleureux · Direct.**

---

## Couleurs

| | Hex | Usage |
|---|---|---|
| 🟧 **Yakro Orange** | `#F97316` | CTA, accents, logo |
| ⬛ **Yakro Dark** | `#0A0A0B` | Fond premium |
| ⬜ **White** | `#FFFFFF` | Fond clair |
| 🟩 Success | `#10B981` | Validations |
| 🟨 Warning | `#F59E0B` | Stock bas, retard |
| 🟥 Danger | `#EF4444` | Erreurs |

---

## Typographie

```
Hero        Belleza   font-black italic uppercase
Titres      Sora      font-black uppercase tracking-tighter
Corps       Sora      font-medium
Labels      Sora      font-black uppercase tracking-widest 10-11px
```

---

## Logo

- Symbole orange `#F97316` + wordmark **YAKRO FÊ**.
- Toujours espace de protection ≥ 1 hauteur de "Y".
- Jamais étiré, jamais d'ombre, jamais sur photo sans aplat.

---

## Voix

| ✅ Toujours | ❌ Jamais |
|---|---|
| Phrases courtes (< 15 mots) | Jargon corporate |
| Verbes actifs | « Nous nous excusons platement » |
| 1 emoji max, fonctionnel | Émojis décoratifs |
| Vouvoiement transactionnel | Familiarité forcée |
| Excuse sincère + action concrète | Promesse vague |

**Mots signature** : *Yakro · Yakroois·es · Restaurant Fondateur · votre
commande · votre livreur*.

**Mots interdits** : *disrupter · révolutionnaire · écosystème ·
phygital · expérience client*.

---

## Photographie

> Cinéma, pas catalogue.

- Lumière naturelle, golden hour pour l'urbain, latérale pour le plat.
- Pas de fond blanc stérile pour les plats — toujours surface bois /
  pagne / contexte resto.
- Post-prod chaude, légèrement désaturée, grain organique discret.
- Crops : 4:5 IG feed, 9:16 stories, 16:9 hero, 1:1 cartes app.

---

## Composants signature

```tsx
// Carte glassmorphism (fond sombre)
className="bg-white/5 backdrop-blur-xl border border-white/5
           rounded-[2rem] shadow-2xl"

// CTA principal
className="bg-orange-500 hover:bg-orange-600 text-white
           font-black italic uppercase tracking-widest
           rounded-2xl shadow-2xl shadow-orange-500/20 h-14 px-8"

// Badge "Restaurant Fondateur"
className="bg-orange-500/10 border border-orange-500/30
           text-orange-500 text-[10px] font-black
           uppercase tracking-widest rounded-full"
```

---

## En cas de doute

1. Le détail proposé est-il **élégant ET sobre** ? → OK
2. Y a-t-il **plus d'1 emoji / 2 couleurs vives / 3 effets** ? → Trop.
3. Une cliente cadre yakrooise de 35 ans **trouverait-elle ça classe** ? →
   Test ultime.

Si non, simplifier.
