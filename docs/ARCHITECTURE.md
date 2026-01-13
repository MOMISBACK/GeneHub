# GeneHub Architecture

> Dernière mise à jour: 13 Janvier 2026  
> Refactorisé avec hooks pattern, Knowledge Base API, Collections, Sync Status, Inbox amélioré, Import DOI/PMID amélioré  
> ✨ **Design System v3.2** - Refonte visuelle moderne (voir [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md))

## 📁 Structure du Projet

```
genehub-bacteria/
├── src/
│   ├── components/
│   │   ├── Icons.tsx              # Icônes Unicode
│   │   ├── TabIcons.tsx           # Icônes SVG pour tabs
│   │   ├── SyncStatusBar.tsx      # ✨ Indicateur sync (pending/failed)
│   │   ├── collections/           # ✨ Système Collections
│   │   │   ├── AddToCollectionButton.tsx
│   │   │   └── index.ts
│   │   ├── inbox/                 # ✨ Composants Inbox
│   │   │   └── EntityPicker.tsx   # Sélecteur d'entités pour lier notes
│   │   └── gene-detail/           # Composants GeneDetail
│   │       ├── Cards.tsx          
│   │       ├── Section.tsx
│   │       ├── Tag.tsx
│   │       ├── InfoRow.tsx
│   │       ├── LinkPill.tsx
│   │       ├── SourceBadge.tsx
│   │       ├── FunctionText.tsx
│   │       └── index.ts
│   │
│   ├── screens/                   # 17 écrans
│   │   ├── GenesScreen.tsx        # Tab "Genes" - Liste des gènes sauvegardés
│   │   ├── GeneDetailScreen.tsx   # Détail d'un gène
│   │   ├── SearchScreen.tsx       # Recherche globale sectionnée
│   │   ├── ResearchersScreen.tsx  # Tab "Chercheurs" - Répertoire
│   │   ├── ResearcherDetailScreen.tsx
│   │   ├── ArticlesScreen.tsx     # Tab "Articles" - Publications ✨ Import DOI/PMID
│   │   ├── ArticleDetailScreen.tsx
│   │   ├── ConferencesScreen.tsx  # Tab "Conférences"
│   │   ├── ConferenceDetailScreen.tsx
│   │   ├── InboxScreen.tsx        # ✨ Inbox - Quick capture + filtrage par status
│   │   ├── NotesScreen.tsx        # ✨ Notes globales avec filtres
│   │   ├── TagsScreen.tsx         # Gestion des tags
│   │   ├── CollectionsScreen.tsx  # ✨ Collections
│   │   ├── CollectionDetailScreen.tsx # ✨ Items d'une collection
│   │   ├── PrivacyScreen.tsx      # ✨ Data & Privacy
│   │   ├── ProfileScreen.tsx      # Tab "Profile"
│   │   ├── SettingsScreen.tsx     # Tab "Settings"
│   │   └── LoginScreen.tsx        # Auth Google OAuth
│   │
│   ├── lib/
│   │   ├── api.ts                 # API calls (NCBI, UniProt, etc.)
│   │   ├── auth.ts                # Google OAuth (expo-web-browser)
│   │   ├── cache.ts               # AsyncStorage cache
│   │   ├── db.ts                  # Gene database operations
│   │   ├── export.ts              # ✨ Export BibTeX/Markdown/JSON
│   │   ├── crossref.ts            # ✨ Crossref DOI import + search
│   │   ├── pubmed.ts              # ✨ PubMed PMID import
│   │   ├── network.ts             # Network status
│   │   ├── supabase.ts            # Supabase clients
│   │   ├── syncStore.ts           # ✨ Zustand store (pending/failed)
│   │   ├── utils.ts               # Utilitaires
│   │   │
│   │   ├── hooks/                 # Custom hooks
│   │   │   ├── useGeneData.ts     # Loading, caching, save/unsave
│   │   │   ├── useInbox.ts        # ✨ Inbox items CRUD
│   │   │   ├── useFunctionReferences.ts  # Citations PubMed
│   │   │   └── index.ts
│   │   │
│   │   ├── knowledge/             # ✨ Knowledge Base Services (façade)
│   │   │   ├── index.ts           # Façade - re-exports tous les services
│   │   │   ├── client.ts          # Supabase client + helpers
│   │   │   ├── researchers.service.ts
│   │   │   ├── articles.service.ts
│   │   │   ├── conferences.service.ts
│   │   │   ├── tags.service.ts
│   │   │   ├── notes.service.ts
│   │   │   ├── search.service.ts  # Recherche Knowledge Base
│   │   │   └── collections.service.ts # ✨ Collections CRUD
│   │   │
│   │   └── inbox/                 # Inbox parsing & conversion
│   │       ├── parse.ts           # Détection PMID/DOI/URL
│   │       ├── convert.ts         # Conversion en articles/notes
│   │       └── index.ts
│   │
│   ├── types/
│   │   ├── domain.ts              # Types gènes
│   │   ├── knowledge.ts           # Types Knowledge Base
│   │   └── collections.ts         # ✨ Types Collections
│   │
│   ├── navigation/
│   ├── theme/                     # ✨ Design System v3.2 - Clarity Evolution
│   │   ├── design-tokens.ts       # ✨ Nouveau - Tokens de design complets
│   │   ├── clarity.ts             # Thèmes Clarity (dark/light/high-contrast)
│   │   ├── themes.ts              # Définitions et exports de thèmes
│   │   ├── ThemeContext.tsx       # Context React pour le thème
│   │   └── index.ts               # Point d'entrée
│   └── i18n/
│
├── supabase/
│   ├── schema.sql                 # Schema MVP
│   ├── migrations/
│   │   ├── 001_api_management.sql
│   │   ├── 002_knowledge_base.sql # Researchers, Articles, Conferences
│   │   ├── 003_tag_entity_links.sql # Tags avec entity_type/entity_id
│   │   ├── 004_inbox.sql          # ✨ Inbox items
│   │   ├── 005_tags_ownership.sql # ✨ Tags user_id + RLS
│   │   ├── 006_articles_external_ids.sql # ✨ external_source/id
│   │   ├── 007_collections.sql    # ✨ Collections + dedup
│   │   └── 008_reset_data.sql     # ✨ Reset all user data (clean slate)
│   └── functions/
│       ├── gene-summary/          
│       └── gene-biocyc/           
│
└── __tests__/                     # 254 tests ✅
    └── lib/
        ├── utils.test.ts          # 36 tests
        ├── validation.test.ts     # 32 tests
        ├── knowledge.test.ts      # 32 tests (Knowledge Base API)
        ├── inbox-parse.test.ts    # ✨ 36 tests (PMID/DOI/URL parsing)
        ├── rls.test.ts            # ✨ 22 tests (RLS policies)
        └── export.test.ts         # ✨ 14 tests (Export formats)
```

## 📚 Import d'Articles (DOI/PMID)

### Nouvel Article - Import Rapide

Le modal "Nouvel article" offre deux modes:

#### Mode Import Rapide (défaut)
1. **Coller un identifiant** - DOI (`10.1038/...`) ou PMID (`12345678`)
2. **Auto-détection** - Le type est identifié automatiquement
3. **Récupération** - Cliquer sur le bouton recherche
4. **Aperçu** - Les métadonnées sont affichées (titre, journal, année, DOI/PMID)
5. **Ajouter** - L'article est créé avec toutes les infos

#### Mode Saisie Manuelle
1. **Titre avec autocomplete** - Suggestions Crossref en tapant
2. **Sélection** - Choisir une suggestion remplit automatiquement les champs
3. **Compléter** - Ajouter/modifier les métadonnées manuellement

### APIs Utilisées
- **PubMed (NCBI E-utilities)** - Pour PMID, récupère titre, abstract, auteurs, DOI
- **Crossref** - Pour DOI, récupère métadonnées + recherche par titre

### Code Source
- `src/screens/ArticlesScreen.tsx` - Modal amélioré avec deux modes
- `src/lib/pubmed.ts` - Client PubMed avec rate limiting
- `src/lib/crossref.ts` - Client Crossref + `searchCrossrefByTitle()`

## 🏷️ Tags et Entity Linking

### Convention de Nommage

| Type | Format du nom | Format entity_id | Exemple |
|------|---------------|------------------|---------|
| Label | user-defined | null | `#important` |
| Gène | `symbol-orgcode` | `symbol_organism` (lowercase) | `#cnox-eco` → `cnox_escherichia coli` |
| Chercheur | entity name | UUID | `#dupont` → `uuid` |
| Article | entity name | UUID | `#article123` → `uuid` |
| Conférence | entity name | UUID | `#asm2026` → `uuid` |

### Codes Organismes

| Organisme | Code |
|-----------|------|
| Escherichia coli | eco |
| Bacillus subtilis | bsu |
| Staphylococcus aureus | sau |
| Pseudomonas aeruginosa | pae |
| Mycobacterium tuberculosis | mtb |

### Auto-Linking via Inbox

Quand une note texte est ajoutée avec un tag lié à une entité:
1. Le système détecte `tag.entity_type` et `tag.entity_id`
2. Crée automatiquement une `entity_note` avec ces valeurs
3. La note apparaît dans la section Notes de l'entité cible

### Couleurs par Type

| Type | Couleur |
|------|---------|
| Label | Indigo `#6366f1` |
| Gène | Bleu `#3b82f6` |
| Chercheur | Vert `#22c55e` |
| Article | Rose `#ec4899` |
| Conférence | Ambre `#f59e0b` |

## � Cross-Entity Notes via Tags

Les notes peuvent apparaître sur plusieurs entités grâce au système de tags liés.

### Principe

Une note apparaît sur la page d'une entité si:
1. **Direct** - La note a été créée sur cette entité (`entity_type` + `entity_id` correspondent)
2. **Via Tag** - La note a un tag lié à cette entité

### Exemple

1. Créer une note sur le gène **CnoX** avec le contenu "Collaboration intéressante"
2. Ajouter le tag `#dupont` (lié au chercheur Dupont) à cette note
3. La note apparaîtra:
   - Sur la page CnoX (direct)
   - Sur la page du chercheur Dupont (via tag `#dupont`)

### Indicateur Visuel

Les notes liées via tag ont un badge "Liée via tag" et une bordure colorée à gauche pour les distinguer des notes natives.

### Comportement Édition/Suppression

- Éditer une note liée modifie la note originale (elle est partagée)
- Supprimer une note la supprime partout
- Retirer le tag d'une note la fait disparaître de l'entité liée

### Implémentation

```typescript
// listNotesForEntity dans knowledge.ts et notes.service.ts
// 1. Récupère les notes directes
// 2. Trouve les tags liés à l'entité
// 3. Trouve les notes ayant ces tags
// 4. Fusionne et déduplique avec isLinkedViaTag flag

interface EntityNote {
  // ... autres champs
  isLinkedViaTag?: boolean; // true si note apparaît via tag
}
```

## �🔑 Hooks Pattern

```typescript
// useGeneData - Données gène avec cache
const { loading, data, biocycData, error, isSaved, refresh, toggleSave } = 
  useGeneData(symbol, organism, t);

// useFunctionReferences - Citations PubMed
const { refCitations, loadingRefs } = useFunctionReferences(functionReferences);

// useInbox - Items inbox avec CRUD
const { items, loading, addItem, deleteItem, updateStatus, archiveItem } = 
  useInbox();
```

## 📊 Métriques Actuelles

| Métrique | Valeur |
|----------|--------|
| Lignes src/ | ~15,000 |
| Écrans | 20 |
| Tests | 254 ✅ |
| Migrations | 8 |
| Coverage utils.ts | 98.5% |

## 🎯 Composants Actifs

### Screens (20)
- **Gènes**: GenesScreen, GeneDetailScreen, SearchScreen
- **Knowledge Base**: ResearchersScreen, ResearcherDetailScreen, ArticlesScreen, ArticleDetailScreen, ConferencesScreen, ConferenceDetailScreen
- **Organisation**: InboxScreen, NotesScreen, TagsScreen, CollectionsScreen, CollectionDetailScreen
- **User**: ProfileScreen, SettingsScreen, PrivacyScreen, LoginScreen
- **QR** (désactivé): MyQrScreen, ScanQrScreen

### Hooks (5)
- useGeneData, useFunctionReferences, useInbox, useNetworkStatus, useColors

### Services (8)
- researchers.service, articles.service, conferences.service
- tags.service, notes.service, inbox.service, collections.service
- export.ts, crossref.ts

### Edge Functions (2)
- gene-summary, gene-biocyc

### State Management
- **Zustand**: syncStore (pending/failed mutations)
- **React Context**: Theme, i18n

## 🔒 Sécurité RLS

| Table | Accès |
|-------|-------|
| articles, researchers, conferences | Lecture: tous auth |
| notes, tags, inbox_items | Owner only |
| collections, collection_items | Owner only |

## 📥 Inbox (Quick Capture)

L'Inbox permet de capturer rapidement des références pour traitement ultérieur:

### Workflow
1. **Saisie** - Coller PMID, DOI, URL ou texte libre
2. **Auto-détection** - Type identifié automatiquement
3. **Sélection de tags** - Tags liés à des entités pour auto-link
4. **Conversion** :
   - PMID → Article (import PubMed)
   - DOI → Article (métadonnées CrossRef)
   - URL → Article (lien externe)
   - Texte + tag entité → Note créée directement sur l'entité
   - Texte seul → Item inbox standard
5. **Organisation** - Archive ou suppression

### Filtrage par Status
- **Inbox** (▣) - Items en attente de traitement
- **Convertis** (✓) - Items convertis en articles/notes  
- **Archivés** (▤) - Items archivés pour référence

### Auto-Linking de Notes

Les items texte peuvent être automatiquement liés via tags:
1. Sélectionner un tag lié à une entité (ex: `#cnox-eco`)
2. Entrer du texte libre
3. Au submit, une note est créée directement sur l'entité
4. Pas besoin de passer par le workflow manuel

### Actions sur Items
- **Tap** → Menu contextuel avec options de conversion
- **Bouton ✕** → Suppression avec confirmation

## ⚠️ Points d'Attention

1. **Google OAuth** - Fonctionne uniquement sur Dev Build (pas Expo Go, pas web)
3. **Migrations SQL** - 8 migrations à appliquer via `supabase db push`
3. **Zustand** - Installé pour sync status tracking
4. **QR Code** - Fonctionnalité temporairement désactivée (problème modules natifs)
5. **Tags Gènes** - Format `symbol-orgcode` obligatoire pour unicité (ex: `cnox-eco`)
