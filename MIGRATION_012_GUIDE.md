# Migration 012 - Chercheurs Associés

## Appliquer la migration

1. Ouvre ton dashboard Supabase : https://supabase.com/dashboard
2. Sélectionne ton projet GeneHub
3. Va dans **SQL Editor**
4. Copie le contenu de `supabase/migrations/012_researcher_collaborators.sql`
5. Colle-le dans l'éditeur
6. Clique sur **Run**

## Vérification

Pour vérifier que la migration a bien été appliquée :

```sql
-- Vérifie que la table existe
SELECT * FROM researcher_collaborators LIMIT 1;

-- Vérifie les policies RLS
SELECT * FROM pg_policies WHERE tablename = 'researcher_collaborators';
```

## Fonctionnalité

Une fois la migration appliquée, tu pourras :
- Ajouter des chercheurs associés (collègues, membres d'équipe, collaborateurs)
- Les voir dans la section "Chercheurs associés" du Recap
- Les supprimer avec un long press
- Naviguer vers leur fiche en cliquant dessus

## Rollback (si besoin)

```sql
-- Supprimer la table et ses policies
DROP TABLE IF EXISTS public.researcher_collaborators CASCADE;
```
