# Guide Rapide - Design System v3.2

> **Référence rapide pour l'utilisation quotidienne du design system**

## 🚀 Quick Start

### Import du thème dans un composant

```typescript
import { useTheme, typography, spacing, radius } from '../theme';

function MyComponent() {
  const { theme } = useTheme();
  const colors = theme.colors;
  
  return (
    <View style={{ backgroundColor: colors.bg, padding: spacing.lg }}>
      <Text style={{ color: colors.text, ...typography.h2 }}>
        Titre
      </Text>
    </View>
  );
}
```

### Import des tokens avancés

```typescript
import { designTokens } from '../theme';

// Accès direct aux couleurs de base
const buttonBg = designTokens.baseColors.accentBleu;

// Accès aux styles pré-définis
const cardStyle = designTokens.cardStyles.dark;
```

## 🎨 Couleurs les plus utilisées

### Thème sombre (par défaut)

```typescript
colors.bg               // #0C0E0F - Fond principal
colors.bgSecondary      // #1A1C1E - Surfaces (cartes)
colors.text             // #F4F6F7 - Texte principal
colors.textSecondary    // #A7B0B5 - Texte secondaire
colors.accent           // #3AA0F4 - Boutons, liens
colors.accentLight      // #63D2F9 - Hover
colors.success          // #4FE1B8 - Succès
colors.error            // #E65C5C - Erreur
colors.warning          // #FFC656 - Attention
colors.border           // #2C2F33 - Bordures
```

## 📝 Typographie

### Utilisation directe

```typescript
import { typography } from '../theme';

<Text style={typography.h1}>Titre principal</Text>
<Text style={typography.h2}>Sous-titre</Text>
<Text style={typography.body}>Texte courant</Text>
<Text style={typography.caption}>Petite note</Text>
<Text style={typography.mono}>Code ou séquence</Text>
```

### Tailles disponibles

- `h1`: 32px / 700 - Titres principaux
- `h2`: 24px / 600 - Sections
- `h3`: 18px / 500 - Sous-sections
- `body`: 16px / 400 - Texte par défaut
- `bodySmall`: 15px / 400 - Texte dense
- `caption`: 13px / 400 - Petits textes
- `mono`: 14px / 400 - Code/séquences

## 📐 Espacements

```typescript
import { spacing } from '../theme';

padding: spacing.lg      // 16px - Standard
margin: spacing.xxl      // 24px - Entre sections
gap: spacing.sm          // 8px - Petits gaps
```

### Valeurs

- `xxs`: 2px
- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `lg`: 16px ⭐ (standard)
- `xl`: 20px
- `xxl`: 24px ⭐ (sections)
- `xxxl`: 32px

## 🔘 Boutons

### Bouton primaire

```typescript
<Pressable
  style={{
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
    minHeight: 44,
  }}
>
  <Text style={{ color: '#FFFFFF', ...typography.label }}>
    Action
  </Text>
</Pressable>
```

### Bouton secondaire

```typescript
<Pressable
  style={{
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
    minHeight: 44,
  }}
>
  <Text style={{ color: colors.accent, ...typography.label }}>
    Action
  </Text>
</Pressable>
```

## 🎴 Cartes

```typescript
<View
  style={{
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  }}
>
  {/* Contenu */}
</View>
```

## 🏷️ Tags

```typescript
// Tag gène
<View
  style={{
    backgroundColor: colors.chipGeneBg,
    borderWidth: 1,
    borderColor: colors.chipGeneBorder,
    borderRadius: radius.md,
    paddingVertical: 4,
    paddingHorizontal: 8,
  }}
>
  <Text style={{ 
    color: colors.chipGeneText, 
    fontSize: 13,
    fontWeight: '500' 
  }}>
    groEL
  </Text>
</View>
```

### Types de tags disponibles

- `chipGene*` - Bleu cyan
- `chipPerson*` - Vert menthe
- `chipConference*` - Violet
- `chipDate*` - Gris
- `chipReference*` - Cyan

## 📥 Champs de saisie

```typescript
<TextInput
  style={{
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    padding: spacing.lg,
    color: colors.text,
    fontSize: 16,
  }}
  placeholderTextColor={colors.inputPlaceholder}
  placeholder="Rechercher..."
/>
```

### Avec focus

```typescript
const [isFocused, setFocused] = useState(false);

<TextInput
  style={{
    backgroundColor: colors.inputBg,
    borderWidth: isFocused ? 2 : 1,
    borderColor: isFocused ? colors.accent : colors.inputBorder,
    borderRadius: radius.sm,
    padding: spacing.lg,
    color: colors.text,
  }}
  onFocus={() => setFocused(true)}
  onBlur={() => setFocused(false)}
/>
```

## 🎯 Border Radius

```typescript
import { radius } from '../theme';

borderRadius: radius.sm   // 6px - Boutons
borderRadius: radius.md   // 8px - Tags
borderRadius: radius.lg   // 10px - Cartes
borderRadius: radius.full // 9999px - Pills
```

## 🎨 Couleurs par type d'entité

### Thème sombre

```typescript
// Gène
bg: '#173347'
text: '#63D2F9'
border: 'rgba(99, 210, 249, 0.3)'

// Chercheur
bg: '#15392C'
text: '#4FE1B8'
border: 'rgba(79, 225, 184, 0.3)'

// Conférence
bg: '#21164F'
text: '#8F77F4'
border: 'rgba(143, 119, 244, 0.3)'

// Organisme
bg: '#433B28'
text: '#FFC656'
border: 'rgba(255, 198, 86, 0.3)'
```

## ✨ États interactifs

### Hover

```typescript
<Pressable
  style={({ pressed }) => ({
    backgroundColor: pressed ? colors.cardHover : colors.card,
    opacity: pressed ? 0.9 : 1,
  })}
>
  {/* Contenu */}
</Pressable>
```

### Disabled

```typescript
<Pressable
  disabled={isDisabled}
  style={{
    backgroundColor: colors.accent,
    opacity: isDisabled ? 0.5 : 1,
  }}
>
  <Text style={{ color: '#FFF' }}>Action</Text>
</Pressable>
```

## 🔍 Recherche

### Barre de recherche

```typescript
<View style={{
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.inputBg,
  borderWidth: 1,
  borderColor: colors.inputBorder,
  borderRadius: radius.sm,
  paddingHorizontal: spacing.md,
  gap: spacing.sm,
}}>
  <Text style={{ color: colors.textMuted, fontSize: 20 }}>⌕</Text>
  <TextInput
    style={{ flex: 1, color: colors.text, fontSize: 16 }}
    placeholder="Rechercher..."
    placeholderTextColor={colors.inputPlaceholder}
  />
</View>
```

## 📊 Sections

### Section avec titre

```typescript
<View style={{ gap: spacing.sm }}>
  <Text style={{ ...typography.h3, color: colors.text }}>
    Section
  </Text>
  <View style={{ gap: spacing.xs }}>
    {/* Contenu */}
  </View>
</View>
```

## 💡 Bonnes pratiques

### ✅ À faire

- Utiliser `colors.*` depuis le theme
- Respecter les espacements (base 8px)
- Taille minimum 44px pour les boutons
- Contraste minimum 4.5:1
- Line-height 1.6 pour le texte

### ❌ À éviter

- Couleurs hardcodées en HEX
- Espacements arbitraires (13px, 17px...)
- Boutons < 44px de hauteur
- Texte gris sur fond gris clair
- Line-height < 1.4

## 🎁 Composants réutilisables

### Séparateur

```typescript
<View style={{
  height: 1,
  backgroundColor: colors.border,
  marginVertical: spacing.lg,
}} />
```

### Badge de statut

```typescript
<View style={{
  backgroundColor: colors.successBg,
  borderRadius: radius.md,
  paddingVertical: 4,
  paddingHorizontal: 8,
}}>
  <Text style={{ 
    color: colors.success, 
    fontSize: 12,
    fontWeight: '500' 
  }}>
    Validé
  </Text>
</View>
```

## 📱 Responsive

### Safe Area

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MyScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ 
      paddingTop: insets.top + spacing.md,
      paddingBottom: insets.bottom,
    }}>
      {/* Contenu */}
    </View>
  );
}
```

## 🔗 Liens utiles

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Documentation complète
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture
- [CHANGELOG_DESIGN.md](./CHANGELOG_DESIGN.md) - Historique des changements

---

**Version**: 3.2.0  
**Dernière mise à jour**: 13 janvier 2026
