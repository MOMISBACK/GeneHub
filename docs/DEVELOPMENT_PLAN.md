# GeneHub - Plan de Développement

> Mis à jour le 11 Janvier 2026

## 📊 État Actuel

| Composant | État | Notes |
|-----------|------|-------|
| **Auth Google** | ✅ | Fonctionne sur Dev Build uniquement |
| **API Gènes** | ✅ | NCBI, UniProt, BioCyc, STRING, PDB |
| **Knowledge Base API** | ✅ | 8 services modularisés |
| **Inbox (Capture rapide)** | ✅ | PMID/DOI/URL/text auto-detect |
| **PubMed Import** | ✅ | PMID → Article avec métadonnées |
| **Crossref Import** | ✅ | DOI → Article avec métadonnées |
| **Notes globales** | ✅ | NotesScreen avec filtres |
| **Collections** | ✅ | Migration 007, UI complète |
| **Privacy & Export** | ✅ | PrivacyScreen, BibTeX/MD/JSON |
| **Researcher Card QR** | ✅ | Partage via QR code (privacy by design) |
| **Écrans** | ✅ | 19 écrans complets |
| **Tests** | ✅ | 225 tests passent |
| **TypeScript** | ✅ | 0 erreurs |
| **RLS (Row Level Security)** | ✅ | Audit complet + Migration 005 |
| **Articles external_source/id** | ✅ | Migration 006 |
| **Déduplication articles** | ✅ | Index unique (external_source, external_id) |
| **Sentry Monitoring** | ✅ | @sentry/react-native installé |
| **Icons SVG** | ✅ | react-native-svg (nav bar) |
| **Zustand (Sync Store)** | ✅ | Pending/failed mutations tracking |

---

## ✅ Researcher Card QR (11 Jan 2026)

### Concept
- **Model A**: QR contient les données directement (pas de serveur)
- **Privacy by design**: L'utilisateur choisit chaque champ à partager
- **Pas de réseau social**: Échange 1-to-1 uniquement

### Payload (ResearcherCardV1)
```json
{
  "v": 1,
  "type": "researcher_card",
  "issued_at": "2026-01-11T...",
  "profile": {
    "name": "Dr. Test",
    "institution": "MIT",
    "email": "test@mit.edu",
    "orcid": "0000-0002-1234-5678",
    "url": "https://lab.mit.edu",
    "keywords": ["genomics", "bacteria"]
  }
}
```

### Bibliothèque (`src/lib/researcherCard.ts`)
- [x] `normalizeEmail()` - Lowercase + trim + validation
- [x] `normalizeOrcid()` - URL/préfixe/dashes handling
- [x] `normalizeUrl()` - Auto-prefix https
- [x] `normalizeKeywords()` - Trim, max 12, max 32 chars
- [x] `buildResearcherCard(profile, options)` - Construction avec privacy
- [x] `serializeCard(card, maxSize)` - JSON avec truncation QR
- [x] `parseResearcherCard(input)` - Parse + normalize
- [x] `validateResearcherCard(card)` - Schema validation
- [x] `tryParseCard(input)` - Safe Result type

### Écrans
- [x] `MyQrScreen` - Génération QR + toggles de confidentialité
- [x] `ScanQrScreen` - Scan caméra (natif) + paste JSON (web)

### Dépendances
- [x] `react-native-qrcode-svg` - Génération QR (natif)
- [x] `expo-barcode-scanner` - Scan caméra (natif)

### Merge Strategy
- [x] `findExistingResearcher()` - Match ORCID (priorité 1) puis email
- [x] `mergeResearcherData()` - Ne pas écraser les valeurs existantes
- [x] `importResearcherFromCard()` - Créer ou fusionner

### Navigation
- [x] Route `MyQr` + `ScanQr` dans `types.ts`
- [x] Screens ajoutés dans `AppNavigator.tsx`
- [x] Bouton "Mon QR" dans `ProfileScreen` header
- [x] Bouton QR scan dans `ResearchersScreen` header

### Tests (53 tests)
- [x] `__tests__/lib/researcherCard.test.ts`
- [x] Normalisation (email, orcid, url, keywords)
- [x] Build card avec/sans options
- [x] Serialize avec truncation
- [x] Parse et validation
- [x] Edge cases (unicode, special chars, roundtrip)
- [x] Privacy options
- [x] QR size constraints

---

## ✅ Migration 006: Articles External IDs (11 Jan 2026)

### Colonnes ajoutées
- [x] `external_source` - Source: pubmed, crossref, manual
- [x] `external_id` - ID externe: PMID ou DOI

### Backfill
- [x] Articles existants avec pmid → external_source='pubmed'
- [x] Articles existants avec doi → external_source='crossref'

### Index
- [x] `idx_articles_external_source`
- [x] `idx_articles_external_id`

---

## ✅ Migration 007: Collections & Déduplication (11 Jan 2026)

### Déduplication Articles
- [x] Index unique `(external_source, external_id)` WHERE NOT NULL
- [x] Empêche les imports dupliqués PubMed/Crossref

### Collections Tables
- [x] `collections` - user_id, name, color, icon, is_pinned
- [x] `collection_items` - polymorphique (gene/article/researcher/conference)

### RLS Policies
- [x] Owner-only sur collections et collection_items

### UI
- [x] CollectionsScreen - Liste/créer/épingler
- [x] CollectionDetailScreen - Items d'une collection
- [x] AddToCollectionButton - Bouton réutilisable

---

## ✅ Privacy & Sync Status (11 Jan 2026)

### PrivacyScreen
- [x] Info "Vos données sont privées"
- [x] Export BibTeX (articles)
- [x] Export Markdown (notes)
- [x] Export JSON (tout)
- [x] "Supprimer toutes mes données"

### SyncStatusBar
- [x] Zustand store (syncStore.ts)
- [x] Indicateur pending/failed
- [x] Bouton "Réessayer"
- [x] Mode offline

---

## ✅ Sécurité & RLS (11 Jan 2026)

### Audit RLS complet
- [x] `entity_notes` → user_id + RLS owner-only ✅
- [x] `inbox_items` → user_id + RLS owner-only ✅
- [x] `notes` (legacy) → user_id + RLS owner-only ✅
- [x] `gene_views` → user_id + RLS owner-only ✅

### Migration 005: Tags Ownership
- [x] `tags` → ajout user_id + RLS owner-only
- [x] `entity_tags` → ajout user_id + RLS owner-only
- [x] `note_tags` → ajout user_id + RLS owner-only
- [x] Unique constraint `(user_id, name)` sur tags

### Décision d'Architecture
- **Articles, Researchers, Conferences** = Données partagées (tous auth)
- **Tags, Notes, Inbox** = Données privées (owner-only)

### Tests RLS (22 tests)
- [x] `__tests__/lib/rls.test.ts` - Policy contracts
- [x] Tests d'isolation des données
- [x] Tests service layer user_id

---

## ✅ Crossref DOI Import (11 Jan 2026)

### Service
- [x] `src/lib/crossref.ts` - Client API Crossref
- [x] `normalizeDoi()` - Normalisation DOI
- [x] `fetchCrossrefArticle()` - Fetch métadonnées
- [x] `crossrefToArticle()` - Conversion → ArticleInsert

### Intégration
- [x] `convertDoiToArticle()` utilise Crossref avec fallback

---

## ✅ Export de Données (11 Jan 2026)

### Formats
- [x] **BibTeX** - Citations académiques (.bib)
- [x] **Markdown** - Notes avec tags (.md)
- [x] **CSV** - Articles et chercheurs (.csv)
- [x] **JSON** - Export complet (.json)

### Tests (14 tests)
- [x] `__tests__/lib/export.test.ts`

---

## ✅ UI Améliorations (11 Jan 2026)

### Icons SVG (Navigation)
- [x] `src/components/TabIcons.tsx` - Icons vectoriels
- [x] DNA, People, Document, Calendar, Inbox

### Recherche Globale Sectionnée
- [x] `SearchScreen` avec `SectionList`
- [x] Headers par type avec icons et compteurs

---

## ✅ Améliorations Techniques (11 Jan 2026)

### 1. Compatibilité Web
- [x] `src/lib/platform.ts` - Guards et abstractions Platform.OS
- [x] `src/lib/storage.ts` - Storage unifié (AsyncStorage + localStorage)
- [x] Helpers: `openURL()`, `copyToClipboard()`, `isWeb`, `isNative`
- [x] Script `npm run build:web` pour export web

### 2. Supabase & Migrations
- [x] `scripts/db-setup.sh` - CLI pour migrations
- [x] `supabase/seed.sql` - Données de test (5 chercheurs, 4 articles, 3 conférences)
- [x] Scripts npm: `db:setup`, `db:migrate`, `db:reset`, `db:seed`

### 3. Data Layer & Cache
- [x] `src/lib/dataLayer.ts` - Gestionnaire centralisé
- [x] Stratégie SWR (Stale-While-Revalidate)
- [x] TTL par type: Gènes 24h, KB 5min, Prefs ∞
- [x] Queue offline pour mutations

### 4. Edge Functions
- [x] `supabase/functions/_shared/errors.ts` - Erreurs standardisées
- [x] Types d'erreurs: NOT_FOUND, VALIDATION, RATE_LIMITED, TIMEOUT, EXTERNAL_API
- [x] Request tracking avec ID unique
- [x] Retry helper avec backoff exponentiel

### 5. Architecture Knowledge Base
- [x] Split en services: `researchers`, `articles`, `conferences`, `notes`, `tags`, `search`
- [x] Facade `index.ts` pour rétrocompatibilité
- [x] Client partagé avec helpers auth

### 6. Recherche Globale
- [x] `src/lib/globalSearch.ts` - Unifie gènes + KB
- [x] 50+ gènes E. coli préchargés pour recherche rapide
- [x] `quickSearch()` pour autocomplete (sync, local)
- [x] `globalSearch()` pour résultats complets

### 7. Tests
- [x] Tests unitaires: 100 passent
- [x] Tests d'intégration: `__tests__/integration/`
- [x] Script: `npm run test:integration`

### 8. Release Engineering
- [x] `eas.json` - Config preview/production avec env vars
- [x] `src/lib/monitoring.ts` - Stub Sentry (prêt pour installation)

---

## ✅ Inbox - Capture Rapide (11 Jan 2026)

### Migration & Types
- [x] `supabase/migrations/004_inbox.sql` - Table + RLS + indexes
- [x] `src/types/inbox.ts` - Types TS complets

### Parser (36 tests)
- [x] `src/lib/inbox/parse.ts` - Détection automatique
- [x] PMID: `PMID:12345678`, `pubmed.ncbi.nlm.nih.gov/...`, 7-8 digits
- [x] DOI: `10.xxxx/...`, `doi.org/...`, `doi:...`
- [x] URL: `http://`, `https://`
- [x] Text: tout le reste

### Service & Hook
- [x] `src/lib/inbox/inbox.service.ts` - CRUD complet
- [x] `src/lib/hooks/useInbox.ts` - Hook React avec optimistic updates
- [x] Actions: add, archive, restore, delete, markConverted

### UI
- [x] `src/screens/InboxScreen.tsx` - Tab 5
- [x] Quick input avec détection live
- [x] Badges colorés par type
- [x] Swipe to archive, long press to delete

---

## ✅ PR4: Import PubMed (11 Jan 2026)

### Service
- [x] `src/lib/pubmed.ts` - Client API NCBI E-utilities
- [x] Rate limiting (350ms entre requêtes)
- [x] Parser XML → PubMedArticle
- [x] Batch fetch (jusqu'à 10 PMIDs)

### Conversion
- [x] `src/lib/inbox/convert.ts` - Conversion service
- [x] `convertPmidToArticle()` - Fetch + créer Article
- [x] `convertDoiToArticle()` - Placeholder DOI
- [x] `convertUrlToArticle()` - Placeholder URL
- [x] `autoConvertInboxItem()` - Auto-détection

### Types
- [x] `external_source` et `external_id` sur Article

---

## ✅ PR5: Notes Globales (11 Jan 2026)

### Service
- [x] `createNoteForEntity()` - Helper création
- [x] `getNotesCountByEntityType()` - Compteurs

### Screen
- [x] `src/screens/NotesScreen.tsx` - Liste toutes les notes
- [x] Filtres par type d'entité (gène, chercheur, article, conférence)
- [x] Recherche dans le contenu
- [x] Navigation vers l'entité source

### Navigation
- [x] Route `Notes` dans RootStackParamList
- [x] Screen ajouté dans AppNavigator

---

## 🚀 Prochaines Étapes (MVP Play Store)

### Priorité 1 — Fait ✅
- [x] **Migration 006** - Colonnes external_source/external_id
- [x] **Migration 007** - Collections + déduplication
- [x] **Appliquer migrations** - supabase db push

### Priorité 2 — Intégration UI (Cette semaine)
- [x] PrivacyScreen avec exports
- [x] **Lien Settings → Privacy** dans SettingsScreen
- [x] **Lien Settings → Collections** dans SettingsScreen
- [x] **SyncStatusBar** intégré dans App.tsx (root layout)
- [x] **AddToCollectionButton** sur ArticleDetailScreen + GeneDetailScreen

### Priorité 3 — Monitoring & Build
- [x] **Sentry** - @sentry/react-native installé + configuré
- [ ] **Test Dev Build**: `npx expo prebuild && npx expo run:android`
- [ ] **EAS Build** pour distribution

### Priorité 4 — Polish
- [ ] Splash screen et icônes
- [ ] Performance profiling
- [ ] Test sur devices réels

### Moyen terme
- [ ] Import ORCID (récupérer publications d'un chercheur)
- [ ] Visualisation graphe de relations
- [ ] Autocomplete de tags dans NotesSection

---

## 📁 Nouveaux Fichiers

```
src/lib/
├── platform.ts          # Guards web/native
├── storage.ts           # AsyncStorage abstraction
├── dataLayer.ts         # Cache SWR centralisé
├── globalSearch.ts      # Recherche unifiée
├── monitoring.ts        # Sentry error monitoring
├── pubmed.ts            # Client PubMed API
├── crossref.ts          # Client Crossref API (DOI)
├── export.ts            # Export BibTeX/MD/CSV/JSON
├── syncStore.ts         # ✨ Zustand store (sync status)
├── researcherCard.ts    # ✨ Build/parse/validate QR cards
├── knowledge/           # KB splitté
│   ├── client.ts
│   ├── researchers.service.ts
│   ├── articles.service.ts
│   ├── conferences.service.ts
│   ├── notes.service.ts
│   ├── tags.service.ts
│   ├── search.service.ts
│   ├── inbox.service.ts
│   ├── collections.service.ts  # ✨
│   └── index.ts
└── inbox/               # Capture rapide
    ├── parse.ts         # Détection PMID/DOI/URL
    ├── inbox.service.ts # CRUD
    ├── convert.ts       # Conversion → Article/Note
    └── index.ts

src/components/
├── TabIcons.tsx         # Icons SVG navigation
├── SyncStatusBar.tsx    # ✨ Indicateur sync
└── collections/         # ✨
    ├── AddToCollectionButton.tsx
    └── index.ts

src/types/
├── inbox.ts             # Types Inbox
├── collections.ts       # ✨ Types Collections
└── researcherCard.ts    # ✨ Types QR Card

src/screens/
├── InboxScreen.tsx      # Tab 5
├── NotesScreen.tsx      # Toutes les notes
├── CollectionsScreen.tsx     # ✨
├── CollectionDetailScreen.tsx # ✨
├── PrivacyScreen.tsx    # ✨
├── MyQrScreen.tsx       # ✨ Générer QR profil
└── ScanQrScreen.tsx     # ✨ Scanner QR chercheur

src/lib/hooks/
└── useInbox.ts          # Hook React

scripts/
└── db-setup.sh          # CLI Supabase

supabase/
├── seed.sql             # Données de test
├── migrations/
│   ├── 004_inbox.sql    # Table inbox_items
│   ├── 005_tags_ownership.sql  # user_id + RLS pour tags
│   ├── 006_articles_external_ids.sql  # ✨
│   └── 007_collections.sql  # ✨ Collections + dedup
└── functions/_shared/
    └── errors.ts        # Erreurs standardisées

__tests__/
├── lib/
│   ├── inbox-parse.test.ts  # 36 tests
│   ├── rls.test.ts          # 22 tests
│   ├── export.test.ts       # 14 tests
│   └── researcherCard.test.ts  # ✨ 58 tests
└── integration/
    └── knowledge.integration.test.ts
```

---

## 📋 Scripts NPM

```bash
# Dev
npm start              # Expo dev server
npm run web            # Web dev
npm run android        # Android dev

# Build
npm run build:web      # Export web statique

# Tests
npm test               # Tests unitaires
npm run test:integration  # Tests d'intégration
npm run test:coverage  # Avec coverage
npm run typecheck      # Vérification TypeScript

# Database
npm run db:setup       # Initialiser local Supabase
npm run db:migrate     # Appliquer migrations
npm run db:reset       # Reset + migrate
npm run db:seed        # Ajouter données de test
```

---

## 🔑 Variables d'Environnement

```env
# Supabase (requis)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Monitoring (requis en production)
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=genehub-bacteria

# Google OAuth (dans Supabase Dashboard)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```
