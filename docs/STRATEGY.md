# GeneHub Bacteria - Stratégie v3

> Dernière mise à jour: 11 Janvier 2026

## 🎯 Vision

Base de connaissances pour la recherche en microbiologie sur **E. coli K-12** :
- **Protéines/Gènes** : données via APIs (UniProt, NCBI, EcoCyc)
- **Chercheurs** : répertoire manuel
- **Articles** : publications avec liens DOI/PMID
- **Conférences** : événements scientifiques
- **Notes interconnectées** via système de **tags**

---

## 📊 Architecture des Données

### Entités Principales

| Entité | Source | Stockage | RLS |
|--------|--------|----------|-----|
| **Protéines** | APIs externes | Cache local + Supabase | N/A (cache local) |
| **Chercheurs** | Import manuel | Supabase | Owner only |
| **Articles** | Import manuel/PubMed/Crossref | Supabase | Owner only |
| **Conférences** | Import manuel | Supabase | Owner only |
| **Notes** | Utilisateur | Supabase (par user) | Owner only |
| **Tags** | Utilisateur | Supabase (par user) | Owner only |
| **Inbox** | Utilisateur | Supabase (par user) | Owner only |
| **Collections** | Utilisateur | Supabase (par user) | Owner only |

### Relations (Many-to-Many)

```
┌──────────┐     ┌──────────────┐     ┌───────────┐
│  Gène    │────▶│gene_researchers│◀────│ Chercheur │
└──────────┘     └──────────────┘     └───────────┘
     │                                       │
     │           ┌─────────────┐             │
     └──────────▶│gene_articles│◀────────────┤
                 └─────────────┘             │
                       ▲                     │
                       │                     │
               ┌───────────┐           ┌─────────────────┐
               │  Article  │◀─────────▶│article_researchers│
               └───────────┘           └─────────────────┘
                       │
                       ▼
          ┌────────────────────┐     ┌────────────┐
          │conference_articles │◀───▶│ Conférence │
          └────────────────────┘     └────────────┘
                                           │
          ┌────────────────────────────────┘
          ▼
┌───────────────────────┐
│conference_researchers │
└───────────────────────┘
```

### Système de Notes avec Tags

```
┌─────────────────────────────────────────────────┐
│                    NOTE                          │
├─────────────────────────────────────────────────┤
│ entity_type: 'gene' | 'researcher' | 'article'  │
│ entity_id: string                               │
│ content: "Texte de la note..."                  │
│ user_id: UUID                                   │
└─────────────────────────────────────────────────┘
          │
          │ note_tags
          ▼
┌─────────────────────────────────────────────────┐
│                    TAGS                          │
├─────────────────────────────────────────────────┤
│ #LacZ  #membrane  #Dr.Dubois  #opéron-lactose  │
└─────────────────────────────────────────────────┘
```

**Fonctionnement** :
1. L'utilisateur écrit une note sur n'importe quelle entité
2. Il peut ajouter des tags (`#LacZ`, `#membrane`, etc.)
3. Les tags permettent de retrouver toutes les notes liées
4. Page "Notes" globale avec filtre par tag

---

## 📱 Navigation (5 tabs + stacks)

| Tab | Écran | Contenu |
|-----|-------|---------||
| **Protéines** | GenesScreen | Liste + recherche API |
| **Chercheurs** | ResearchersScreen | Répertoire manuel |
| **Articles** | ArticlesScreen | Publications |
| **Conférences** | ConferencesScreen | Événements |
| **Inbox** | InboxScreen | Quick capture |

### Écrans Stack

- `GeneDetailScreen` : Infos API + chercheurs liés + articles liés + notes
- `ResearcherDetailScreen` : Profil + protéines étudiées + articles + notes
- `ArticleDetailScreen` : Métadonnées + auteurs + gènes + notes
- `ConferenceDetailScreen` : Infos + participants + gènes + notes
- `CollectionsScreen` : Liste des collections
- `CollectionDetailScreen` : Items d'une collection
- `NotesScreen` : Toutes les notes avec filtres
- `TagsScreen` : Gestion des tags
- `PrivacyScreen` : Export / suppression données
- `SearchScreen` : Recherche globale sectionnée

---

## 🛠️ APIs Externes

| Source | Données | Rate Limit |
|--------|---------|------------|
| **NCBI Gene** | ID, localisation, synonymes | 3 req/s |
| **UniProt** | Fonction, GO, domaines, séquence | Fair use |
| **EcoCyc/BioCyc** | Pathways, régulation | 1 req/s |
| **PDB** | Structures 3D | Illimité |
| **STRING** | Interactions | 1 req/s |

---

## 🗄️ Schéma Base de Données

Migrations dans `/supabase/migrations/`:
- `001_api_management.sql` - Gestion API
- `002_knowledge_base.sql` - Researchers, Articles, Conferences, Tags
- `003_inbox.sql` - Inbox items (quick capture)
- `004_notes_entity.sql` - Notes avec entity_type
- `005_tags_ownership.sql` - Tags user_id + RLS strict
- `006_articles_external_ids.sql` - Colonnes external_source/id + backfill
- `007_collections.sql` - Collections + index unique déduplication

Tables principales :
- `researchers` - Chercheurs (owner-only)
- `articles` - Publications avec UNIQUE(doi), UNIQUE(pmid), UNIQUE(external_source, external_id) (owner-only)
- `conferences` - Conférences (owner-only)
- `tags` - Tags privés par user
- `notes` - Notes par entité (privées par user)
- `inbox_items` - Quick capture (privés par user)
- `collections` - Collections (privées par user)
- `collection_items` - Items polymorphiques dans collections
- `gene_researchers`, `gene_articles`, etc. - Relations

---

## 🚀 Roadmap

### Phase 1 - Infrastructure ✅
- [x] Schéma SQL Knowledge Base (002_knowledge_base.sql)
- [x] Types TypeScript (knowledge.ts)
- [x] API CRUD complète (services modularized)
- [x] Tests Knowledge Base (32 tests)
- [x] Auth Google OAuth

### Phase 2 - Écrans Knowledge Base ✅
- [x] ResearchersScreen + ResearcherDetailScreen
- [x] ArticlesScreen + ArticleDetailScreen
- [x] ConferencesScreen + ConferenceDetailScreen
- [x] TagsScreen

### Phase 3 - Notes avec Tags ✅
- [x] Composant NotesSection réutilisable
- [x] Intégration dans GeneDetailScreen
- [x] Intégration dans ResearcherDetailScreen
- [x] Intégration dans ArticleDetailScreen
- [x] Intégration dans ConferenceDetailScreen
- [x] NotesScreen globale avec filtres

### Phase 4 - Inbox & Import ✅
- [x] InboxScreen avec quick capture
- [x] Auto-détection PMID/DOI/URL
- [x] Import PubMed API
- [x] Import Crossref API
- [x] Conversion inbox → article

### Phase 5 - Collections & Privacy ✅
- [x] Collections system (migration 006)
- [x] CollectionsScreen
- [x] CollectionDetailScreen
- [x] AddToCollectionButton
- [x] PrivacyScreen (export/delete)
- [x] SyncStatusBar (pending/failed)
- [x] RLS audit (22 tests)

### Phase 6 - Search & UI ✅
- [x] SearchScreen sectionnée
- [x] Export BibTeX/Markdown/JSON
- [x] Tags ownership (user_id)

### Phase 7 - Production
- [ ] Migration Supabase production
- [ ] EAS Build pour iOS/Android
- [ ] Test sur devices réels
- [ ] Performance & optimisations
- [ ] Visualisation graphe de relations

---

## 🎨 Design System

- **Zéro gradient** - Design monochrome minimal
- **Pas d'emoji** - Icônes unicode simples
- **Couleurs depuis theme** - Pas de hex hardcodé
- **i18n** - Toutes les strings via `useI18n()`
