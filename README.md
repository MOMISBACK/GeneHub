# GeneHub Bacteria 🧬

Application mobile React Native / Expo pour explorer les gènes bactériens avec des données de UniProt, NCBI, BioCyc et plus.

## 🚀 Stack Technique

- **Frontend**: React Native 0.81 + Expo 54
- **Backend**: Supabase (Auth, Edge Functions, Database)
- **Navigation**: React Navigation 7 (Stack + Bottom Tabs)
- **State**: React Context (Theme, i18n)
- **Testing**: Jest + Babel

## 📁 Structure du Projet

```
genehub-bacteria/
├── src/
│   ├── components/       # Composants réutilisables
│   │   ├── Icons.tsx
│   │   └── gene-detail/  # Composants spécifiques au détail
│   ├── data/             # Données statiques (organismes)
│   ├── i18n/             # Traductions (fr, en, es, zh, ru, hi)
│   ├── lib/              # Utilitaires et services
│   │   ├── api.ts        # Appels API Supabase
│   │   ├── auth.ts       # Authentification Google OAuth
│   │   ├── cache.ts      # Cache local AsyncStorage
│   │   ├── db.ts         # Opérations base de données
│   │   ├── supabase.ts   # Client Supabase
│   │   └── utils.ts      # Fonctions utilitaires pures
│   ├── navigation/       # Configuration navigation
│   │   ├── AppNavigator.tsx
│   │   ├── MainTabs.tsx  # Navigation par onglets
│   │   └── types.ts
│   ├── screens/          # Écrans principaux
│   │   ├── HomeScreen.tsx
│   │   ├── GeneDetailScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── LoginScreen.tsx
│   └── theme/            # Thèmes et tokens de design
├── supabase/
│   └── functions/        # Edge Functions (Deno)
├── __tests__/            # Tests unitaires
└── ...
```

## 🎨 Design System

### Thème "Quiet Luxury"

**Light Mode**
- Background: `#F6F7F9`
- Surface: `#FFFFFF`
- Accent: `#2A7C6F` (teal)

**Dark Mode**
- Background: `#0B0F17`
- Surface: `#151A24`
- Accent: `#4FD1C5` (teal clair)

### Typography Scale
- `h1`: 32px / 700
- `h2`: 24px / 600
- `h3`: 20px / 600
- `body`: 16px / 400
- `caption`: 13px / 500
- `overline`: 11px / 600

### Spacing
- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 20px
- `xxl`: 24px

## 🧪 Tests

### Lancer les tests

```bash
# Tous les tests
npm test

# Mode watch
npm run test:watch

# Avec couverture
npm run test:coverage
```

### Tests Unitaires

**[__tests__/lib/utils.test.ts](__tests__/lib/utils.test.ts)** - 36 tests
- Normalisation des symboles et organismes
- Génération de clés de cache
- Validation de l'expiration du cache (24h)
- Conversion en exposants (superscript)
- Extraction des références PubMed
- Détection des noms de gènes bactériens (pattern: `[a-z]{2,4}[A-Z][0-9]?`)
- Formatage des erreurs API (401, 404, 502)

**[__tests__/lib/validation.test.ts](__tests__/lib/validation.test.ts)** - 32 tests
- Validation des types `GeneSummary`, `SavedGene`, `BiocycResponse`
- Validation des noms de gènes bactériens
- Normalisation des alias d'organismes (E. coli → Escherichia coli)
- Manipulation des dates ISO
- Génération d'URLs (PubMed, UniProt, NCBI, AlphaFold, STRING)

**[__tests__/lib/inbox-parse.test.ts](__tests__/lib/inbox-parse.test.ts)** - 36 tests
- Auto-détection PMID, DOI, URL
- Parsing PubMed/Crossref responses

**[__tests__/lib/rls.test.ts](__tests__/lib/rls.test.ts)** - 22 tests
- Tests RLS policies (notes, tags, inbox, collections)

**[__tests__/lib/export.test.ts](__tests__/lib/export.test.ts)** - 14 tests
- Export BibTeX, Markdown, JSON, CSV

### Couverture

```
File      | % Stmts | % Branch | % Funcs | % Lines
----------|---------|----------|---------|--------
utils.ts  |   98.5% |   92.85% |   100%  |  98.48%
```

### Fonctions Testées

```typescript
// Cache
normalizeSymbol(symbol: string): string
normalizeOrganism(organism: string): string
getCacheKey(symbol: string, organism: string): string
isCacheValid(cachedAt: number, durationMs?: number): boolean

// FunctionText Parsing
toSuperscript(num: number): string
parseText(text: string): { segments: TextSegment[]; references: Reference[] }

// API Errors
formatInvokeError(fnName: string, error: unknown): Error
```

## 🔧 Installation

```bash
# Cloner le repo
git clone <repo-url>
cd genehub-bacteria

# Installer les dépendances
npm install --legacy-peer-deps

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase

# Lancer l'app
npx expo start
```

## 🔑 Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Activer l'authentification Google OAuth
3. Ajouter `genehub://auth/callback` aux Redirect URLs
4. Déployer les Edge Functions:

```bash
cd supabase
supabase functions deploy gene-summary
supabase functions deploy gene-biocyc
```

## 📱 Fonctionnalités

- ✅ Recherche de gènes par symbole et organisme
- ✅ Affichage détaillé (fonction, localisation, interactions)
- ✅ Favoris avec cache local
- ✅ Données BioCyc (pathways, régulation, operons)
- ✅ Références PubMed cliquables
- ✅ Thème clair/sombre
- ✅ Multi-langue (FR, EN, ES, ZH, RU, HI)
- ✅ Authentification Google
- ✅ Knowledge Base (chercheurs, articles, conférences)
- ✅ Notes interconnectées avec tags
- ✅ Inbox quick capture (PMID/DOI/URL)
- ✅ Collections pour organiser
- ✅ Export BibTeX/Markdown/JSON
- ✅ Privacy & Data (suppression données)

## 📄 Licence

MIT
