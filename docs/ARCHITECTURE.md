# GeneHub Architecture

> Dernière mise à jour: 15 Janvier 2026  
> Refactorisé avec hooks pattern, Knowledge Base API, Collections, Sync Status, Inbox amélioré, Import DOI/PMID amélioré  
> ✨ **Design System v3.2** - Refonte visuelle moderne (voir [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md))
> 🔒 **User Data Isolation** - Chaque utilisateur a ses propres données (RLS strict)
> 🚀 **API Cache** - Cache partagé pour NCBI, UniProt, Crossref, PubMed
> 📝 **Mode Notes** - Focus sur la prise de notes et l'interconnexion via tags (API auto-fetch désactivé)
> 🧪 **Audit code** - Voir [AUDIT_2026_01_15.md](./AUDIT_2026_01_15.md)

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
│   │   ├── GenesScreen.tsx        # Tab "Genes" - Création fiches + liste des gènes sauvegardés
│   │   ├── GeneDetailScreen.tsx   # Détail d'un gène (focus: notes et tags)
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
│   │   ├── auth.ts                # Google OAuth (expo-web-browser) ✨ Fix web logout
│   │   ├── cache.ts               # AsyncStorage cache
│   │   ├── db.ts                  # Gene database operations
│   │   ├── export.ts              # ✨ Export BibTeX/Markdown/JSON
│   │   ├── crossref.ts            # ✨ Crossref DOI import + search + authors
│   │   ├── pubmed.ts              # ✨ PubMed PMID import + authors
│   │   ├── apiCache.ts            # ✨ Shared API cache (NCBI, UniProt, Crossref, PubMed)
│   │   ├── alert.ts               # ✨ Cross-platform alerts (web + mobile)
│   │   ├── network.ts             # Network status
│   │   ├── supabase.ts            # Supabase clients
│   │   ├── syncStore.ts           # ✨ Zustand store (pending/failed)
│   │   ├── utils.ts               # Utilitaires
│   │   │
│   │   ├── hooks/                 # Custom hooks
│   │   │   ├── useGeneData.ts     # Loading, caching, save/unsave (API fetch désactivable)
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
│   │   ├── 008_reset_data.sql     # ✨ Reset all user data (clean slate)
│   │   ├── 009_user_data_isolation.sql # ✨ user_id + RLS strict sur toutes les tables
│   │   ├── 010_api_cache.sql      # ✨ Cache API partagé
│   │   └── 011_articles_authors.sql # ✨ Champ authors pour articles
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

## 🧬 Mode Notes pour les Gènes (Focus Actuel)

> **État actuel**: Les appels API automatiques (NCBI, UniProt, EcoCyc/BioCyc) sont **DÉSACTIVÉS**.
> L'application se concentre sur la création manuelle de fiches gènes et la prise de notes.

### Fonctionnement Actuel

#### Création de Fiche Gène
1. **Bouton "Nouveau"** dans l'écran Gènes
2. **Saisie du symbole** (ex: dnaA, lacZ, rpoB)
3. **Nom de protéine optionnel**
4. **Création** → Navigation automatique vers la fiche

#### Fiche Gène - Vue Unifiée
La fiche gène est maintenant une **vue unique** (plus de tabs Recap/Notes):
- **Carte "Informations"** en haut (symbole, organisme, protéine)
- **Section "Notes"** directement en dessous
- Possibilité d'ajouter des notes et des tags pour interconnecter

#### Notes Liées via Tag
Quand une note est liée via un tag (et non créée directement sur l'entité):
- **Affichage du tag de liaison** au lieu de "Liée via tag"
- Le tag est cliquable pour naviguer vers l'entité source
- La bordure gauche prend la couleur du tag

### Réactivation des API (Future)

Pour réactiver les résumés automatiques via API:

1. **Dans `src/lib/hooks/useGeneData.ts`**:
   ```typescript
   const ENABLE_API_FETCH = true;  // Était false
   ```

2. **Dans `src/screens/GeneDetailScreen.tsx`**:
   ```typescript
   const SHOW_API_SECTIONS = true;  // Était false
   ```

### Ce qui est conservé (mais désactivé)
- Edge Functions: `gene-summary`, `gene-biocyc`
- Types API: `GeneSummary`, `BiocycGeneData`
- Code de fetch API dans `useGeneData.ts`
- Sections UI dans `GeneDetailScreen.tsx` (Sources, Fonction, Interactions, Structures, Pathways, Liens externes)

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

Les notes liées via tag ont:
- Un **badge avec le tag de liaison** (ex: `#dupont` pour une note d'un chercheur)
- Le badge est **cliquable** pour naviguer vers l'entité source
- Une **bordure colorée à gauche** (couleur du tag)

### Tags → Relations dans Recap

Les tags dans les notes remplissent automatiquement les sections du Recap:

**Exemple - Chercheur:**
1. Créer une note sur le chercheur "Dupont"
2. Ajouter le tag `#dnak` (lié au gène dnaK)
3. Dans le Recap de Dupont, section "Protéines étudiées":
   - dnaK apparaît avec un badge tag et bordure pointillée (vient d'un tag)

**Entités extraites des tags:**
| Section | Tags extraits |
|---------|---------------|
| Protéines étudiées | `entity_type = 'gene'` |
| Publications | `entity_type = 'article'` |
| Conférences | `entity_type = 'conference'` |

**Indicateurs visuels:**
- **Bordure pointillée** - Relation vient d'un tag (vs bordure solide = relation directe)
- **Badge tag** - Préfixe sur les items issus de tags

### Comportement Édition/Suppression

- Éditer une note liée modifie la note originale (elle est partagée)
- Supprimer une note la supprime partout
- Retirer le tag d'une note la fait disparaître de l'entité liée

### Implémentation

```typescript
// listNotesForEntity dans notes.service.ts
// 1. Récupère les notes directes
// 2. Trouve les tags liés à l'entité (avec leurs données complètes)
// 3. Trouve les notes ayant ces tags
// 4. Fusionne et déduplique avec isLinkedViaTag flag + linkingTag

interface EntityNote {
  // ... autres champs
  isLinkedViaTag?: boolean;  // true si note apparaît via tag
  linkingTag?: Tag;          // Le tag qui lie cette note (pour affichage)
}
```

## �🔑 Hooks Pattern

```typescript
// useGeneData - Données gène avec cache (API fetch désactivé par défaut)
// Note: ENABLE_API_FETCH = false → pas d'appels NCBI/UniProt/BioCyc
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

### Edge Functions (2) - Désactivées par défaut
- gene-summary - Résumé via NCBI/UniProt (ENABLE_API_FETCH = false)
- gene-biocyc - Données BioCyc/EcoCyc (ENABLE_API_FETCH = false)

### State Management
- **Zustand**: syncStore (pending/failed mutations)
- **React Context**: Theme, i18n

## 🔒 Sécurité RLS

| Table | Accès |
|-------|-------|
| articles, researchers, conferences | Owner only |
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
2. **Migrations SQL** - 8 migrations à appliquer via `supabase db push`
3. **Zustand** - Installé pour sync status tracking
4. **QR Code** - Fonctionnalité temporairement désactivée (problème modules natifs)
5. **Tags Gènes** - Format `symbol-orgcode` obligatoire pour unicité (ex: `cnox-eco`)
6. **API Gènes désactivées** - `ENABLE_API_FETCH = false` dans useGeneData.ts, `SHOW_API_SECTIONS = false` dans GeneDetailScreen.tsx
