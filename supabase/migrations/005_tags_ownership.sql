-- Migration 005: Tags + Entity Tags Ownership
-- Fix: Tags should be per-user to ensure privacy
-- Articles/Researchers/Conferences remain shared (reference data)

-- ============================================
-- 1. Add user_id to tags
-- ============================================
ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);

-- ============================================
-- 2. Add user_id to entity_tags
-- ============================================
ALTER TABLE public.entity_tags
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_entity_tags_user_id ON public.entity_tags(user_id);

-- ============================================
-- 3. Update RLS policies for tags (owner-only)
-- ============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "tags_select" ON public.tags;
DROP POLICY IF EXISTS "tags_insert" ON public.tags;

-- New owner-only policies
CREATE POLICY "tags_select_own" ON public.tags
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "tags_insert_own" ON public.tags
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tags_update_own" ON public.tags
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tags_delete_own" ON public.tags
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 4. Update RLS policies for entity_tags (owner-only)
-- ============================================

-- Drop existing permissive policy
DROP POLICY IF EXISTS "entity_tags_all" ON public.entity_tags;

-- New owner-only policies
CREATE POLICY "entity_tags_select_own" ON public.entity_tags
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "entity_tags_insert_own" ON public.entity_tags
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "entity_tags_update_own" ON public.entity_tags
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "entity_tags_delete_own" ON public.entity_tags
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 5. Update unique constraint on tags
-- Tags are unique per user (same tag name can exist for different users)
-- ============================================
ALTER TABLE public.tags DROP CONSTRAINT IF EXISTS tags_name_key;
ALTER TABLE public.tags ADD CONSTRAINT tags_user_name_unique UNIQUE (user_id, name);

-- ============================================
-- 6. Note tags inherit ownership from notes (already owner-protected via entity_notes)
-- But we add user_id for direct queries
-- ============================================
ALTER TABLE public.note_tags
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_note_tags_user_id ON public.note_tags(user_id);

-- Drop existing permissive policy
DROP POLICY IF EXISTS "note_tags_all" ON public.note_tags;

-- New owner-only policies
CREATE POLICY "note_tags_select_own" ON public.note_tags
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "note_tags_insert_own" ON public.note_tags
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "note_tags_delete_own" ON public.note_tags
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- Comments
-- ============================================
COMMENT ON COLUMN public.tags.user_id IS 'Owner of the tag - tags are private per user';
COMMENT ON COLUMN public.entity_tags.user_id IS 'Owner - user who applied this tag to the entity';
COMMENT ON COLUMN public.note_tags.user_id IS 'Owner - inherited from note owner';

-- ============================================
-- Design Decision Notes:
-- ============================================
-- Articles, Researchers, Conferences = SHARED reference data
--   (any authenticated user can create/view/edit)
--   Rationale: Academic resources are collaborative
--
-- Tags, Entity_Tags, Note_Tags = PRIVATE per user
--   (owner-only CRUD)
--   Rationale: Personal organization shouldn't leak
--
-- Entity_Notes, Inbox_Items = PRIVATE per user
--   (owner-only CRUD)
--   Rationale: Personal notes and captures are private
