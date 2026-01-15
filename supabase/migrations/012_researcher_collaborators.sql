-- GeneHub Migration 012: Researcher Collaborators
-- Adds researcher-to-researcher relationships (colleagues, collaborators, team members)

-- ============================================================================
-- RELATIONS: Researcher <-> Researcher (collaborators/colleagues)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.researcher_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  researcher_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  relationship_type TEXT, -- 'colleague', 'team_member', 'supervisor', 'collaborator', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, researcher_id, collaborator_id),
  CHECK (researcher_id != collaborator_id) -- Prevent self-referencing
);

CREATE INDEX IF NOT EXISTS idx_researcher_collaborators_researcher 
  ON public.researcher_collaborators(researcher_id);
CREATE INDEX IF NOT EXISTS idx_researcher_collaborators_collaborator 
  ON public.researcher_collaborators(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_researcher_collaborators_user 
  ON public.researcher_collaborators(user_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.researcher_collaborators ENABLE ROW LEVEL SECURITY;

-- Users can only see their own collaborator relationships
DROP POLICY IF EXISTS "researcher_collaborators_select_own" ON public.researcher_collaborators;
CREATE POLICY "researcher_collaborators_select_own"
  ON public.researcher_collaborators
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "researcher_collaborators_insert_own" ON public.researcher_collaborators;
CREATE POLICY "researcher_collaborators_insert_own"
  ON public.researcher_collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "researcher_collaborators_delete_own" ON public.researcher_collaborators;
CREATE POLICY "researcher_collaborators_delete_own"
  ON public.researcher_collaborators
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
