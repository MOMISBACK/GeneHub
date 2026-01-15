# Rapport de pistes de développement — 15 Janvier 2026

## Objectif produit (minimum de fonctions)
Une app **ultra‑efficace de prise de notes scientifiques** centrée sur :
- Capture rapide (Inbox)
- Notes structurées et interconnectées (tags)
- Recherche instantanée
- Focus “offline‑first” et vitesse d’usage

## Phase 0 — Cadrage (GO)

### 3 cas d’usage prioritaires (à verrouiller)
1) **Capturer une idée scientifique en 5–10s**
   - Une note brute, sans friction.
2) **Relier une note à d’autres idées/personnes/références via tags**
   - Tags simples, auto‑complétion, lien immédiat.
3) **Retrouver une note rapidement**
   - Recherche locale sur contenu + tags.

### “Freeze list” (tout le reste est gelé)
- Écrans KB dédiés (Researchers/Articles/Conferences) : gelés.
- Collections : gelées.
- QR / cartes chercheurs : gelé.
- API automatiques gènes : gelées.
- Visualisations complexes : gelées.

### Scope minimal validé pour les prochains sprints
- Notes (création, édition, suppression)
- Tags (création, auto‑complétion, liaison)
- Recherche notes/tags
- Inbox comme interface de capture (si conservée)

### Définition de “Done” Phase 0
- Les 3 cas d’usage sont **documentés et figés**.
- Une “freeze list” est validée et communiquée.
- Les prochaines phases n’ajoutent rien hors scope minimal.

## Phase 1 — Notes‑first (implémentation)

### Objectif
Un flux **unique** de capture de note (texte + tags) qui devient l’entrée principale de l’app.

### Actions produit/UI
1) **Quick Capture** = écran principal (tab 1)
   - Champ texte multiline + bouton “Ajouter tag”.
   - Suggestions de tags (auto‑complétion) + création rapide.
2) **Inbox devient secondaire**
   - Inbox = historique des captures (même source de données que notes).
3) **Navigation simplifiée**
   - Tabs visibles : Notes / Recherche / Profil (ou Settings).
   - KB accessible uniquement via recherche ou via tag.

### Actions techniques
- Réutiliser `createNote` comme source unique.
- Ajouter un composant simple `QuickCapture` (si absent) réutilisable.
- Brancher `TagCreateModal` en mode rapide (sans surcharge KB).
- Mettre en place une route “Notes” par défaut (tab initial).

### Définition de Done (Phase 1)
- 1 seul flux pour créer une note.
- Les tags sont visibles et modifiables immédiatement.
- La création de note nécessite **≤ 2 actions**.

## Constats clés (retards / mal conçu / sur‑fonctionnel)

### 1) Focus produit dilué (retard de cadrage)
- La base “Knowledge Base” (articles/chercheurs/conférences) tire l’app vers un mini‑CRM, alors que le besoin exprimé est “notes + tags + liens d’idées”.
- **Risque** : complexité, maintenance lourde, UX dispersée.

### 2) Notes & tags = core, mais encore trop “secondaires”
- L’UI donne autant de place à la KB qu’aux notes.
- Le tagging lié aux entités est puissant, mais le flux “notes-first” n’est pas la voie principale.

### 3) Concepts redondants
- “Collections” + “Tags” se chevauchent (organisation vs liaison). Pour un produit minimal, **tags seuls** suffisent dans 90% des cas.

### 4) UX capture trop “métadonnée”
- Le flux d’ajout d’articles ou de chercheurs est lourd pour une app de notes rapide.
- Le besoin principal est “capturer une idée + relier”.

### 5) Retards tech orientés produit
- Recherche globale encore majoritairement “KB‑first”, pas “notes‑first”.
- Cache/data layer encore fragmenté (même si l’unification a commencé).

## Pistes de développement (du plus critique au moins critique)

### P0 — Recentrage produit “notes + tags + liens”
1) **Home unique “Quick Capture”**
   - 1 champ unique, création de note instantanée.
   - Ajout de tags inline + suggestions (autocomplete).

2) **Notes‑first navigation**
   - Onglet principal = Notes.
   - KB (articles/chercheurs/conférences) devient “annexe”, accessible via recherche ou tags.

3) **Tags comme “relations”**
   - Rendre explicite que les tags lient des idées/entités.
   - Ajouter un mini‑graphe de liens (simple liste, pas de visualisation lourde).

### P1 — Simplification des fonctionnalités
4) **Déprioriser “Collections”**
   - Optionnel ou masqué par défaut.
   - Le tag doit suffire comme outil d’organisation.

5) **Réduire le workflow KB**
   - Pas de création manuelle systématique.
   - Tout passe par les notes + tags ; KB s’alimente en arrière‑plan.

### P2 — Efficacité & vitesse
6) **Recherche notes‑first + index local**
   - Le moteur doit prioriser contenu notes et tags.
   - KB passe en second plan (fallback).

7) **Mode offline clair**
   - Indicateur visible “offline” + file d’attente simple.

### P3 — Qualité UX
8) **Uniformiser le naming des tags**
   - Interdire emoji, format stable, tags lisibles.

9) **Templates de notes scientifiques**
   - Modèles simples : “Hypothèse”, “Expérience”, “Résultat”, “Référence”.

## Features à considérer “en retard”
- Recherche locale optimisée sur notes + tags.
- Flux “capture rapide” centralisé.
- Vrai mode offline simple (queue + retry, sans complexité).

## Features “mal conçues” ou sur‑fonctionnelles (à simplifier)
- KB trop riche vs usage notes.
- Collections redondantes.
- Multiplication d’écrans (trop de destinations).

## Prochaine étape recommandée (sprint minimal)
1) Mettre **Notes** au centre (tab principal + écran unique d’entrée).
2) Réduire la friction de capture (1 champ + tags).
3) Rechercher prioritairement dans notes/tags.
