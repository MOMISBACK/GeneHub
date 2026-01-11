# GeneHub Architecture

> Dernière mise à jour: 11 Janvier 2026  
> Refactorisé avec hooks pattern, Knowledge Base API, Collections, Sync Status

## 📁 Structure du Projet

```
genehub-bacteria/
├── src/
│   ├── components/
│   │   ├── Icons.tsx              # Icônes SVG
│   │   ├── SyncStatusBar.tsx      # ✨ Indicateur sync (pending/failed)
│   │   ├── annotations/           # Système Notes v2
│   │   │   ├── NotesPanel.tsx     # Panneau principal
│   │   │   ├── NoteCard.tsx       # Carte individuelle
│   │   │   └── index.ts           # Exports
│   │   ├── collections/           # ✨ Système Collections
│   │   │   ├── AddToCollectionButton.tsx
│   │   │   └── index.ts
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
│   │   ├── ArticlesScreen.tsx     # Tab "Articles" - Publications
│   │   ├── ArticleDetailScreen.tsx
│   │   ├── ConferencesScreen.tsx  # Tab "Conférences"
│   │   ├── ConferenceDetailScreen.tsx
│   │   ├── InboxScreen.tsx        # ✨ Inbox - Quick capture
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
│   │   ├── crossref.ts            # ✨ Crossref DOI import
│   │   ├── network.ts             # Network status
│   │   ├── supabase.ts            # Supabase clients
│   │   ├── syncStore.ts           # ✨ Zustand store (pending/failed)
│   │   ├── utils.ts               # Utilitaires
│   │   │
│   │   ├── hooks/                 # Custom hooks
│   │   │   ├── useGeneData.ts     # Loading, caching, save/unsave
│   │   │   ├── useAnnotations.ts  # Notes CRUD
│   │   │   ├── useFunctionReferences.ts  # Citations PubMed
│   │   │   └── index.ts
│   │   │
│   │   ├── knowledge/             # ✨ Knowledge Base Services
│   │   │   ├── client.ts          # Supabase client + helpers
│   │   │   ├── researchers.service.ts
│   │   │   ├── articles.service.ts
│   │   │   ├── conferences.service.ts
│   │   │   ├── tags.service.ts
│   │   │   ├── notes.service.ts
│   │   │   ├── inbox.service.ts   # ✨ Inbox quick capture
│   │   │   ├── collections.service.ts # ✨ Collections CRUD
│   │   │   └── index.ts
│   │   │
│   │   └── annotations/           # Système annotations (legacy)
│   │       ├── model.ts           
│   │       ├── storage.ts         
│   │       └── ...
│   │
│   ├── types/
│   │   ├── domain.ts              # Types gènes
│   │   ├── knowledge.ts           # Types Knowledge Base
│   │   └── collections.ts         # ✨ Types Collections
│   │
│   ├── navigation/
│   ├── theme/
│   └── i18n/
│
├── supabase/
│   ├── schema.sql                 # Schema MVP
│   ├── migrations/
│   │   ├── 001_api_management.sql
│   │   ├── 002_knowledge_base.sql # Researchers, Articles, Conferences
│   │   ├── 003_inbox.sql          # ✨ Inbox items
│   │   ├── 004_notes_entity.sql   # ✨ Notes avec entity_type
│   │   ├── 005_tags_ownership.sql # ✨ Tags user_id + RLS
│   │   ├── 006_articles_external_ids.sql # ✨ external_source/id
│   │   └── 007_collections.sql    # ✨ Collections + dedup
│   └── functions/
│       ├── gene-summary/          
│       └── gene-biocyc/           
│
└── __tests__/                     # 172 tests ✅
    └── lib/
        ├── utils.test.ts          # 36 tests
        ├── validation.test.ts     # 32 tests
        ├── knowledge.test.ts      # 32 tests (Knowledge Base API)
        ├── inbox-parse.test.ts    # ✨ 36 tests (PMID/DOI/URL parsing)
        ├── rls.test.ts            # ✨ 22 tests (RLS policies)
        └── export.test.ts         # ✨ 14 tests (Export formats)
```

## 🔑 Hooks Pattern

```typescript
// useGeneData - Données gène avec cache
const { loading, data, biocycData, error, isSaved, refresh, toggleSave } = 
  useGeneData(symbol, organism, t);

// useNotes - Notes avec tags
const { notes, loading, createNote, updateNote, deleteNote } = 
  useNotes(entityType, entityId);

// useFunctionReferences - Citations PubMed
const { refCitations, loadingRefs } = useFunctionReferences(functionReferences);
```

## 📊 Métriques Actuelles

| Métrique | Valeur |
|----------|--------|
| Lignes src/ | ~15,000 |
| Écrans | 17 |
| Tests | 172 ✅ |
| Migrations | 7 |
| Coverage utils.ts | 98.5% |

## 🎯 Composants Actifs

### Screens (17)
- **Gènes**: GenesScreen, GeneDetailScreen, SearchScreen
- **Knowledge Base**: ResearchersScreen, ResearcherDetailScreen, ArticlesScreen, ArticleDetailScreen, ConferencesScreen, ConferenceDetailScreen
- **Organisation**: InboxScreen, NotesScreen, TagsScreen, CollectionsScreen, CollectionDetailScreen
- **User**: ProfileScreen, SettingsScreen, PrivacyScreen, LoginScreen

### Hooks (3)
- useGeneData, useAnnotations, useFunctionReferences

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

## ⚠️ Points d'Attention

1. **Google OAuth** - Fonctionne uniquement sur Dev Build (pas Expo Go, pas web)
2. **Migrations SQL** - 6 migrations à appliquer via `supabase db push`
3. **Zustand** - Installé pour sync status tracking
