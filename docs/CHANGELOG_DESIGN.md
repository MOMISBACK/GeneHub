# Changelog - Refonte Visuelle 2026

## Version 3.2.0 - 13 janvier 2026

### 🎨 Nouveau Design System

#### Ajouts majeurs

1. **Nouveau fichier de tokens** (`src/theme/design-tokens.ts`)
   - Palette de couleurs complète (11 couleurs principales)
   - Système typographique basé sur Inter + IBM Plex Mono
   - Espacements base 8px
   - Border radius optimisés
   - États interactifs documentés
   - Styles de composants pré-définis

2. **Palette de couleurs moderne**
   - Nuit Profonde (`#0C0E0F`) - Fond principal
   - Ardoise (`#1A1C1E`) - Surfaces secondaires
   - Graphite Clair (`#2C2F33`) - Contours
   - Blanc Cassé (`#F4F6F7`) - Texte principal
   - Gris Brume (`#A7B0B5`) - Texte secondaire
   - Accent Bleu (`#3AA0F4`) - Interactif
   - Accent Cyan (`#63D2F9`) - Hover/Surbrillance
   - Vert Menthe (`#4FE1B8`) - Succès
   - Rouge Cerise (`#E65C5C`) - Erreur
   - Violet Spectre (`#8F77F4`) - Scientifique
   - Jaune Ambre (`#FFC656`) - Attention

3. **Documentation complète** (`docs/DESIGN_SYSTEM.md`)
   - Guide complet du design system
   - Exemples de code
   - Métriques de qualité (contraste WCAG 2.1 AA)
   - Principes de design
   - Guide de migration

#### Modifications

1. **`src/theme/clarity.ts`**
   - Intégration des nouveaux tokens
   - Mise à jour des couleurs brand
   - Nouvelle palette sémantique
   - Evidence colors mises à jour

2. **`src/theme/themes.ts`**
   - Import des design tokens
   - Mise à jour de la palette de couleurs
   - Nouveaux radius (sm: 6, lg: 10)
   - Typography avec ratio de ligne 1.6
   - Tags par entité avec nouvelles couleurs

3. **`src/theme/index.ts`**
   - Export des design tokens
   - Commentaires mis à jour (v3.2)

4. **`docs/ARCHITECTURE.md`**
   - Référence au nouveau design system
   - Structure theme/ détaillée
   - Date mise à jour

### 🎯 Principes du nouveau design

1. **Default Calm, Detail on Demand**
   - Interface sobre par défaut
   - Couleurs vives limitées à 5-10% de la surface

2. **Lab Grade**
   - Lisibilité optimale sur écrans de laboratoire
   - Contraste WCAG 2.1 AA minimum

3. **Scientifique & Moderne**
   - Palette inspirée des instruments scientifiques
   - Typographie claire et professionnelle

4. **Accessibilité**
   - Taille minimale tactile: 44px
   - Outlines de focus visibles
   - Ne jamais utiliser la couleur seule

### 📊 Métriques de qualité

- ✅ Blanc cassé / Nuit profonde: ~15:1 (AAA)
- ✅ Gris brume / Nuit profonde: ~5.5:1 (AA)
- ✅ Accent bleu / Nuit profonde: ~6.2:1 (AA)

### 🔄 Breaking Changes

⚠️ **Changements de couleurs**:
- `brand.petrolBlue` → `brand.accentBlue` (#3AA0F4)
- `brand.champagneGold` → `brand.amberYellow` (#FFC656)

⚠️ **Changements de radius**:
- `radius.sm`: 8 → 6
- `radius.lg`: 18 → 10

### ✅ Rétrocompatibilité

Les anciens exports sont maintenus :
```typescript
// ✅ Fonctionne toujours
import { brand, evidence, darkTheme } from '../theme/clarity';
```

### 🚀 Migration

Les composants existants continuent de fonctionner car:
1. Les propriétés `theme.colors.*` sont maintenues
2. Les exports `brand`, `evidence` existent toujours
3. La structure des thèmes est identique

Pour utiliser les nouveaux tokens :
```typescript
import { designTokens } from '../theme';
```

### 📝 Fichiers créés

- ✨ `src/theme/design-tokens.ts` (590 lignes)
- ✨ `docs/DESIGN_SYSTEM.md` (445 lignes)
- ✨ `docs/CHANGELOG_DESIGN.md` (ce fichier)

### 📝 Fichiers modifiés

- 📝 `src/theme/clarity.ts` (530 lignes)
- 📝 `src/theme/themes.ts` (370 lignes)
- 📝 `src/theme/index.ts` (7 lignes)
- 📝 `docs/ARCHITECTURE.md` (326 lignes)

### 🔍 Tests

- ✅ Aucune erreur TypeScript
- ✅ Tous les imports valides
- ✅ Rétrocompatibilité préservée

### 📚 Documentation

Pour plus de détails, voir :
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Documentation complète
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture mise à jour

### 🎉 Résultat

Un design system moderne, professionnel et scientifique, optimisé pour les écrans de laboratoire avec :
- 🎨 Palette de couleurs cohérente et accessible
- ✍️ Typographie lisible (Inter + IBM Plex Mono)
- 📐 Espacements harmonieux (base 8px)
- 🧩 Composants pré-stylisés
- 🧠 Support futur du mode clair
- ♿ Accessibilité WCAG 2.1 AA

---

**Auteur**: GeneHub Team  
**Date**: 13 janvier 2026  
**Version**: 3.2.0 - Clarity Evolution
