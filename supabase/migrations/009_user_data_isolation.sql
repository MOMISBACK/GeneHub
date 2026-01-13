-- Migration 009: User Data Isolation
-- Adds user_id to shared tables and enforces strict RLS
-- Each user's data is completely independent

-- ============================================================================
-- 1. ADD user_id TO RESEARCHERS
-- ============================================================================

-- Add column (nullable first for existing data)
ALTER TABLE public.researchers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_researchers_user_id ON public.researchers(user_id);

-- Drop old permissive policies
DROP POLICY IF EXISTS "researchers_select" ON public.researchers;
DROP POLICY IF EXISTS "researchers_insert" ON public.researchers;
DROP POLICY IF EXISTS "researchers_update" ON public.researchers;
DROP POLICY IF EXISTS "researchers_delete" ON public.researchers;

-- Create strict user-only policies
CREATE POLICY "researchers_select_own" ON public.researchers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "researchers_insert_own" ON public.researchers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "researchers_update_own" ON public.researchers
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "researchers_delete_own" ON public.researchers
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 2. ADD user_id TO ARTICLES
-- ============================================================================

ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_articles_user_id ON public.articles(user_id);

-- Drop old permissive policies
DROP POLICY IF EXISTS "articles_select" ON public.articles;
DROP POLICY IF EXISTS "articles_insert" ON public.articles;
DROP POLICY IF EXISTS "articles_update" ON public.articles;
DROP POLICY IF EXISTS "articles_delete" ON public.articles;

-- Create strict user-only policies
CREATE POLICY "articles_select_own" ON public.articles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "articles_insert_own" ON public.articles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "articles_update_own" ON public.articles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "articles_delete_own" ON public.articles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 3. ADD user_id TO CONFERENCES
-- ============================================================================

ALTER TABLE public.conferences 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_conferences_user_id ON public.conferences(user_id);

-- Drop old permissive policies
DROP POLICY IF EXISTS "conferences_select" ON public.conferences;
DROP POLICY IF EXISTS "conferences_insert" ON public.conferences;
DROP POLICY IF EXISTS "conferences_update" ON public.conferences;
DROP POLICY IF EXISTS "conferences_delete" ON public.conferences;

-- Create strict user-only policies
CREATE POLICY "conferences_select_own" ON public.conferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "conferences_insert_own" ON public.conferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conferences_update_own" ON public.conferences
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conferences_delete_own" ON public.conferences
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 4. ADD user_id TO TAGS (user-specific tags)
-- ============================================================================

ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);

-- Update unique constraint: tags are unique per user, not globally
ALTER TABLE public.tags DROP CONSTRAINT IF EXISTS tags_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_name ON public.tags(user_id, name);

-- Drop old permissive policies
DROP POLICY IF EXISTS "tags_select" ON public.tags;
DROP POLICY IF EXISTS "tags_insert" ON public.tags;
DROP POLICY IF EXISTS "tags_select_own" ON public.tags;
DROP POLICY IF EXISTS "tags_insert_own" ON public.tags;
DROP POLICY IF EXISTS "tags_update_own" ON public.tags;
DROP POLICY IF EXISTS "tags_delete_own" ON public.tags;

-- Create strict user-only policies
CREATE POLICY "tags_select_own" ON public.tags
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "tags_insert_own" ON public.tags
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tags_update_own" ON public.tags
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tags_delete_own" ON public.tags
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 5. ADD user_id TO RELATION TABLES
-- ============================================================================

-- Gene <-> Researcher relations
ALTER TABLE public.gene_researchers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_gene_researchers_user ON public.gene_researchers(user_id);

-- Gene <-> Article relations
ALTER TABLE public.gene_articles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_gene_articles_user ON public.gene_articles(user_id);

-- Article <-> Researcher relations
ALTER TABLE public.article_researchers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_article_researchers_user ON public.article_researchers(user_id);

-- Conference <-> Researcher relations
ALTER TABLE public.conference_researchers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_conference_researchers_user ON public.conference_researchers(user_id);

-- Conference <-> Article relations
ALTER TABLE public.conference_articles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_conference_articles_user ON public.conference_articles(user_id);

-- Conference <-> Gene relations
ALTER TABLE public.conference_genes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_conference_genes_user ON public.conference_genes(user_id);

-- Entity tags relations
ALTER TABLE public.entity_tags 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_entity_tags_user ON public.entity_tags(user_id);

-- Note tags relations
ALTER TABLE public.note_tags 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_note_tags_user ON public.note_tags(user_id);

-- ============================================================================
-- 6. UPDATE RLS FOR RELATION TABLES
-- ============================================================================

-- Drop old generic policies and recreate user-specific ones
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'gene_researchers', 'gene_articles', 'article_researchers',
    'conference_researchers', 'conference_articles', 'conference_genes',
    'entity_tags', 'note_tags'
  ])
  LOOP
    -- Drop ALL existing policies (old and potentially existing new ones)
    EXECUTE format('DROP POLICY IF EXISTS "%s_all" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_select_own" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert_own" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update_own" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete_own" ON public.%I', tbl, tbl);
    
    -- Create user-specific policies
    EXECUTE format('CREATE POLICY "%s_select_own" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_insert_own" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_update_own" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_delete_own" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================================
-- 7. CLEAN UP OLD SHARED DATA (orphaned data without user_id)
-- ============================================================================

-- Delete orphaned data (no user_id = old shared data)
DELETE FROM public.note_tags WHERE user_id IS NULL;
DELETE FROM public.entity_tags WHERE user_id IS NULL;
DELETE FROM public.conference_genes WHERE user_id IS NULL;
DELETE FROM public.conference_articles WHERE user_id IS NULL;
DELETE FROM public.conference_researchers WHERE user_id IS NULL;
DELETE FROM public.article_researchers WHERE user_id IS NULL;
DELETE FROM public.gene_articles WHERE user_id IS NULL;
DELETE FROM public.gene_researchers WHERE user_id IS NULL;
DELETE FROM public.tags WHERE user_id IS NULL;
DELETE FROM public.conferences WHERE user_id IS NULL;
DELETE FROM public.articles WHERE user_id IS NULL;
DELETE FROM public.researchers WHERE user_id IS NULL;

-- ============================================================================
-- 8. MAKE user_id NOT NULL (after cleanup)
-- ============================================================================

-- Note: Run these only after verifying data is clean
-- ALTER TABLE public.researchers ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.articles ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.conferences ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.tags ALTER COLUMN user_id SET NOT NULL;

-- For now, leave nullable to allow gradual migration
-- Future migration can enforce NOT NULL

COMMENT ON COLUMN public.researchers.user_id IS 'Owner of this researcher entry - required for RLS';
COMMENT ON COLUMN public.articles.user_id IS 'Owner of this article entry - required for RLS';
COMMENT ON COLUMN public.conferences.user_id IS 'Owner of this conference entry - required for RLS';
COMMENT ON COLUMN public.tags.user_id IS 'Owner of this tag - tags are user-specific';
