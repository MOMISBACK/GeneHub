# GeneHub Design System - Refonte Visuelle 2026

> **Version**: Atlas v3.2 - Clarity Evolution  
> **Date**: 13 janvier 2026  
> **Statut**: ✅ Implémenté

## 📋 Vue d'ensemble

Refonte visuelle complète du design system GeneHub avec un thème sombre moderne et scientifique, optimisé pour les écrans de laboratoire.

## 🎨 Palette de couleurs principale

### Thème sombre (par défaut)

| Couleur | Usage | Code HEX | Variable Token |
|---------|-------|----------|----------------|
| **Nuit Profonde** | Fond principal | `#0C0E0F` | `nuitProfonde` |
| **Ardoise** | Surfaces secondaires | `#1A1C1E` | `ardoise` |
| **Graphite Clair** | Contours / séparations | `#2C2F33` | `graphiteClair` |
| **Blanc Cassé** | Texte principal | `#F4F6F7` | `blancCasse` |
| **Gris Brume** | Texte secondaire | `#A7B0B5` | `grisBrume` |
| **Accent Bleu** | Couleur principale interactive | `#3AA0F4` | `accentBleu` |
| **Accent Cyan** | Hover links, surbrillance | `#63D2F9` | `accentCyan` |
| **Vert Menthe** | Succès / validation | `#4FE1B8` | `vertMenthe` |
| **Rouge Cerise** | Erreurs / alertes | `#E65C5C` | `rougeCerise` |
| **Violet Spectre** | Élément scientifique / tag conf | `#8F77F4` | `violetSpectre` |
| **Jaune Ambre** | Attention / notes importantes | `#FFC656` | `jauneAmbre` |

### Règle des 5-10%

Sur un fond sombre, les couleurs vives (accents) sont limitées à 5-10% de la surface pour :
- Boutons primaires
- Tags et badges
- Highlights de données
- États actifs

## ✍️ Typographie

### Polices

- **Interface**: Inter (Google Fonts)
- **Monospace**: IBM Plex Mono (séquences, code, citations)

### Échelle typographique

| Élément | Taille | Poids | Line Height | Usage |
|---------|--------|-------|-------------|-------|
| **H1** | 32px | 700 | 40px | Titres principaux (ex: "groEL — chaperonine ATP‑dépendante") |
| **H2** | 24px | 600 | 32px | Sections (ex: "Fonction & structure") |
| **H3** | 18px | 500 | 26px | Sous-sections (ex: "Interactions connues") |
| **Body** | 16px | 400 | 25.6px | Texte de paragraphe (line-height 1.6) |
| **Body Small** | 15px | 400 | 24px | Texte courant dense |
| **Small** | 13px | 400 | 20.8px | Dates, tags, citations |
| **Mono** | 14px | 400 | 22.4px | Séquences, code |

**Ratio de ligne**: 1.6 pour une lisibilité optimale sur écrans de laboratoire.

## 🧱 Grille & espacements

### Système base 8px

| Token | Valeur | Usage |
|-------|--------|-------|
| `xxs` | 2px | Micro-espacements |
| `xs` | 4px | Espacements fins |
| `sm` | 8px | Spacing de base |
| `md` | 12px | Spacing medium |
| `lg` | 16px | Padding standard composants |
| `xl` | 20px | Spacing large |
| `xxl` | 24px | Entre sections |
| `xxxl` | 32px | Entre blocs majeurs |

### Espacements sémantiques

| Élément | Espacement |
|---------|------------|
| Entre sections | 24-32px |
| Entre titre ↔ texte | 8-12px |
| Entre cartes | 16-20px |
| Padding composants | 16px |

### Largeurs maximales

- **Contenu principal**: 960px
- **Notes**: 700px
- **Champs de formulaire**: 480px

## 🧩 Design des composants

### Boutons

#### Primaire
```typescript
{
  bg: '#3AA0F4',           // accentBleu
  bgHover: '#63D2F9',      // accentCyan
  text: '#FFFFFF',
  borderRadius: 6,
  minHeight: 44,           // Accessibilité tactile
  shadow: 'rgba(0, 0, 0, 0.25)'
}
```

#### Secondaire
```typescript
{
  bg: 'transparent',
  bgHover: '#173347',
  text: '#3AA0F4',
  border: '1px solid #3AA0F4',
  borderRadius: 6,
  minHeight: 44
}
```

#### Ghost / Tertiaire
```typescript
{
  bg: 'transparent',
  bgHover: '#1D2125',
  text: '#A7B0B5',         // grisBrume
  borderRadius: 6,
  minHeight: 44
}
```

### Champs de saisie

```typescript
{
  bg: '#1A1C1E',           // ardoise
  text: '#F4F6F7',         // blancCasse
  placeholder: '#787D80',
  border: '#2C2F33',       // graphiteClair
  borderFocus: '#3AA0F4',  // accentBleu
  borderRadius: 6,
  glow: 'rgba(58, 160, 244, 0.13)' // Sur focus
}
```

### Cartes d'information

```typescript
{
  bg: '#1A1C1E',           // ardoise
  border: '1px solid #2C2F33',
  borderRadius: 10,
  shadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
  // Sur hover:
  hoverShadow: '0 4px 16px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(58, 160, 244, 0.06)',
  hoverTransform: 'translateY(-2px)'
}
```

### Navigation / Tabs

```typescript
{
  bg: '#0C0E0F',           // nuitProfonde
  borderTop: '1px solid #2C2F33',
  iconSize: 24,
  labelSize: 12,
  activeColor: '#3AA0F4', // accentBleu
  inactiveColor: '#A7B0B5', // grisBrume
  transition: '200ms ease'
}
```

### Tags / Badges

**Format standard**:
```typescript
{
  borderRadius: 8,
  padding: '4px 8px',
  fontSize: 13,
  fontWeight: 500
}
```

**Par type d'entité** (thème sombre):

| Type | Background | Texte | Bordure |
|------|------------|-------|---------|
| **Gène** | `#173347` | `#63D2F9` | `rgba(99, 210, 249, 0.3)` |
| **Chercheur** | `#15392C` | `#4FE1B8` | `rgba(79, 225, 184, 0.3)` |
| **Conférence** | `#21164F` | `#8F77F4` | `rgba(143, 119, 244, 0.3)` |
| **Organisme** | `#433B28` | `#FFC656` | `rgba(255, 198, 86, 0.3)` |
| **Temporel** | `#26292B` | `#A7B0B5` | `rgba(167, 176, 181, 0.3)` |
| **Article** | `#173347` | `#63D2F9` | `rgba(99, 210, 249, 0.3)` |

### Notes

```typescript
{
  bg: '#131516',
  maxWidth: 700,
  separator: '1px solid #2C2F33',
  // Bouton "+ Ajouter une note":
  button: {
    bg: '#3AA0F4',
    borderRadius: 20,    // Arrondi fort
    icon: '✏️'
  }
}
```

## 🧠 Icônes & système visuel

### Bibliothèque

**Recommandé**: Tabler Icons ou Lucide (SVG clairs et fins)

### Tailles standard

- **Small**: 16px
- **Medium**: 20px (taille par défaut)
- **Large**: 24px (navigation)

### Style

- **Stroke width**: 1.5px max
- **Couleur par défaut**: `#A7B0B5` (grisBrume)
- **Couleur hover**: `#3AA0F4` (accentBleu)

### Icônes par section

| Section | Icône | Couleur |
|---------|-------|---------|
| Inbox | `inbox` | Bleu clair (`#63D2F9`) |
| Notes | `file-text` | Gris brume (`#A7B0B5`) |
| Gènes | `dna` | Cyan clair (`#63D2F9`) |
| Chercheurs | `user` | Vert menthe (`#4FE1B8`) |
| Conférences | `calendar-event` | Violet (`#8F77F4`) |
| Recherche | `search` | Gris clair (`#A7B0B5`) |

## 🧮 États interactifs

| État | Effet | Implémentation |
|------|-------|----------------|
| **Hover** | Teinte du fond +5% + curseur pointer | `opacity: 0.9` ou légère augmentation luminosité |
| **Focus** | Outline 2px + glow | `outline: 2px solid #3AA0F4; box-shadow: 0 0 0 4px rgba(58, 160, 244, 0.13)` |
| **Sélectionné** | Background clair + texte bleu | `bg: #1F2326; color: #3AA0F4` |
| **Désactivé** | Opacité 0.5 + curseur not-allowed | `opacity: 0.5; cursor: not-allowed` |
| **Loading** | Spinner fin bleu animé | `color: #3AA0F4; animation: 1.2s linear infinite` |

## ⚙️ Mode clair (support futur)

Le système est prévu pour supporter un mode clair avec les mêmes tokens CSS :

| Élément | Couleur |
|---------|---------|
| **Fond** | `#FAFAFB` |
| **Texte** | `#111315` |
| **Accent principal** | `#3AA0F4` (identique) |
| **Fond carte** | `#FFFFFF` avec bordure `#E1E4E8` |
| **Tags** | Teintes pastel correspondantes |

### Tokens CSS

Utiliser des tokens pour faciliter le switching :
```css
--color-bg
--color-text
--color-accent
--color-surface
/* etc. */
```

## 📦 Structure du code

### Fichiers du design system

```
src/theme/
├── design-tokens.ts     ✨ Nouveau - Tokens complets
├── clarity.ts           📝 Mis à jour - Thèmes clarity
├── themes.ts            📝 Mis à jour - Définitions de thèmes
├── ThemeContext.tsx     (Inchangé)
└── index.ts             📝 Mis à jour - Exports
```

### Utilisation dans les composants

```typescript
import { useTheme, designTokens } from '../theme';

function MyComponent() {
  const { theme } = useTheme();
  const colors = theme.colors;
  
  // Utilisation directe des couleurs du thème
  return (
    <View style={{ backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
}

// Pour des usages avancés, accéder aux tokens bruts
import { baseColors, typography } from '../theme/design-tokens';
```

## 🎯 Principes de design

### 1. Default Calm, Detail on Demand
- Interface sobre par défaut
- Les détails apparaissent au focus/hover
- Couleurs vives utilisées avec parcimonie

### 2. Lab Grade
- Lisibilité optimale sur écrans de laboratoire
- Contraste WCAG 2.1 AA minimum (≥ 4.5:1)
- Support lecture prolongée

### 3. Scientifique & Moderne
- Palette inspirée des instruments scientifiques
- Typographie claire et professionnelle
- Espaces respirants pour la concentration

### 4. Accessibilité
- Taille minimale tactile: 44px
- Outlines de focus visibles
- Ne jamais utiliser la couleur seule (toujours icône + label)

## 📊 Métriques de qualité

### Contraste (WCAG 2.1 AA)

| Paire de couleurs | Ratio | Status |
|-------------------|-------|--------|
| Blanc cassé / Nuit profonde | ~15:1 | ✅ AAA |
| Gris brume / Nuit profonde | ~5.5:1 | ✅ AA |
| Accent bleu / Nuit profonde | ~6.2:1 | ✅ AA |

### Performance

- ✅ Tokens en constantes TypeScript (zero runtime overhead)
- ✅ Couleurs en HEX (parsing rapide)
- ✅ Animations GPU-accelerated (transform, opacity)

## 🔄 Migration

### Breaking changes

⚠️ Certaines couleurs ont changé :
- `petrolBlue` → `accentBleu` (#3AA0F4)
- `champagneGold` → `jauneAmbre` (#FFC656)
- Radiis ajustés (sm: 8 → 6, lg: 18 → 10)

### Rétrocompatibilité

Les anciens exports sont maintenus pour compatibilité :
```typescript
// ✅ Fonctionne toujours
import { brand, evidence, darkTheme } from '../theme/clarity';

// ✨ Nouveau
import { designTokens } from '../theme';
```

## 🚀 Prochaines étapes

- [ ] Implémenter le mode clair complet
- [ ] Ajouter des animations micro-interactions
- [ ] Créer des composants Storybook
- [ ] Documenter les patterns d'accessibilité
- [ ] Ajouter des tests de contraste automatisés

## 📚 Références

- **Inter Font**: https://fonts.google.com/specimen/Inter
- **IBM Plex Mono**: https://fonts.google.com/specimen/IBM+Plex+Mono
- **Tabler Icons**: https://tabler-icons.io/
- **Lucide Icons**: https://lucide.dev/
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/

---

**Dernière mise à jour**: 13 janvier 2026  
**Contributeurs**: GeneHub Team
