# GeneHub Bacteria - Copilot Instructions

> **Last updated**: January 12, 2026 (v3 - Knowledge Base + Collections + Inbox)

These instructions are **authoritative** for this repo. Follow them systematically.

---

## Operating Rules (Always)

### 1) Workflow rule for "big redesign"
If the user says **"do not code yet"**:
- First: **audit** current code paths + data model
- Then: propose **architecture + migration plan**
- Only after explicit user approval: start implementing UI/components/storage.

### 2) Style / UX constraints
- Current direction: **zéro gradient, monochrome, minimal**.
- Don't add decorative colors, emojis, shadows, or new visual noise.
- Do not hard-code new hex colors inside screens/components.

### 3) i18n
- User-visible strings must come from `useI18n()` (`t...`) unless there is a strong reason.
- When adding UI, add translations in `src/i18n/translations/*`.

### 4) Data correctness
- A gene that doesn't exist must not render a "fake" detail page.
- Prefer explicit "not found" errors from the backend and proper UI errors.

### 5) Tests (required)
- If you touch any pure logic in `src/lib/utils.ts`, add/adjust Jest tests in `__tests__/lib/utils.test.ts`.
- Run `npm test` after changes and keep coverage thresholds passing.

---

## Knowledge Base Architecture (v2 - Jan 11, 2026)

### Data Model

**Entities** (stored in Supabase):
- `researchers` - Chercheurs (name, institution, specialization, email)
- `articles` - Publications (title, journal, year, DOI, PMID)
- `conferences` - Événements (name, date, location)
- `tags` - Tags pour interconnexion
- `entity_notes` - Notes par entité (privées par user)

**Relations** (many-to-many):
- `gene_researchers` - Gène ↔ Chercheur
- `gene_articles` - Gène ↔ Article
- `article_researchers` - Article ↔ Auteurs
- `conference_researchers` - Conférence ↔ Participants
- `conference_articles` - Conférence ↔ Articles présentés
- `note_tags` - Note ↔ Tags

### Notes System (simple)
- Plain text content
- Tags for interconnection (#LacZ, #membrane, etc.)
- Private per user (RLS)
- NO chips, NO complex tokenization

### Navigation (5 tabs)
- **Genes** - Liste des protéines sauvegardées
- **Inbox** - Quick capture et filtrage
- **Knowledge** - Chercheurs, Articles, Conférences (Supabase)
- **Collections** - Groupes d'items organisés
- **Profile** - Paramètres utilisateur

### Design compliance rules
- **NO gradients** — Use `colors.accent` with `colors.buttonPrimaryText` for headers
- **NO emojis** — Use `src/components/Icons.tsx` or plain text indicators
- **NO hard-coded colors** — All colors must come from `useTheme()` or `useColors()`

---

## Current App Reality (Jan 11, 2026)

- Favorites stored in AsyncStorage via `src/lib/cache.ts`
- Gene detail fetches from APIs (NCBI, UniProt, BioCyc)
- Knowledge base (researchers, articles, conferences) stored in Supabase
- Notes are simple text with tags (not chips)

---

## File Structure

```
src/
├── components/
│   ├── Icons.tsx           # Unicode icons
│   ├── TabIcons.tsx        # SVG icons for tabs
│   ├── SyncStatusBar.tsx   # Sync indicator
│   ├── collections/        # Collection components
│   ├── inbox/              # Inbox components
│   ├── notes/              # Notes components
│   ├── tags/               # Tag components
│   └── gene-detail/        # Gene detail components
├── screens/                # 20 screens
│   ├── GenesScreen.tsx     # Tab 1: Proteins list
│   ├── GeneDetailScreen.tsx
│   ├── InboxScreen.tsx     # Tab 2: Quick capture
│   ├── ResearchersScreen.tsx
│   ├── ArticlesScreen.tsx
│   ├── ConferencesScreen.tsx
│   ├── CollectionsScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── SettingsScreen.tsx
│   └── ... (other detail screens)
├── lib/
│   ├── api.ts              # External API calls
│   ├── auth.ts             # Supabase auth
│   ├── cache.ts            # AsyncStorage cache
│   ├── db.ts               # Supabase operations
│   ├── crossref.ts         # DOI import
│   ├── pubmed.ts           # PMID import
│   ├── globalSearch.ts     # Unified search
│   ├── knowledge/          # Knowledge Base services (façade)
│   ├── inbox/              # Inbox parsing
│   └── hooks/              # Custom hooks
├── navigation/
│   ├── AppNavigator.tsx
│   ├── MainTabs.tsx        # 5 tabs
│   └── types.ts
└── theme/                  # Design system
```
