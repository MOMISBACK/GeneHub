-- GeneHub Knowledge Base Schema
-- Version 2: Researchers, Articles, Conferences with Notes & Tags
-- Apply in Supabase SQL editor after 001_api_management.sql

-- ============================================================================
-- RESEARCHERS (Chercheurs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.researchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  institution TEXT,
  city TEXT,
  country TEXT,
  email TEXT,
  specialization TEXT,
  orcid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_researchers_name ON public.researchers(name);
CREATE INDEX IF NOT EXISTS idx_researchers_institution ON public.researchers(institution);

-- ============================================================================
-- ARTICLES (Publications)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  journal TEXT,
  year INTEGER,
  doi TEXT UNIQUE,
  pmid TEXT UNIQUE,
  url TEXT,
  abstract TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_title ON public.articles(title);
CREATE INDEX IF NOT EXISTS idx_articles_year ON public.articles(year);
CREATE INDEX IF NOT EXISTS idx_articles_doi ON public.articles(doi);
CREATE INDEX IF NOT EXISTS idx_articles_pmid ON public.articles(pmid);

-- ============================================================================
-- CONFERENCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE,
  end_date DATE,
  location TEXT,
  city TEXT,
  country TEXT,
  website TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conferences_name ON public.conferences(name);
CREATE INDEX IF NOT EXISTS idx_conferences_date ON public.conferences(date);

-- ============================================================================
-- TAGS (for interconnection)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT, -- Optional: hex color for UI
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);

-- ============================================================================
-- RELATIONS: Gene <-> Researcher
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gene_researchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gene_symbol TEXT NOT NULL,
  organism TEXT NOT NULL DEFAULT 'Escherichia coli',
  researcher_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  role TEXT, -- 'lead', 'contributor', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gene_symbol, organism, researcher_id)
);

CREATE INDEX IF NOT EXISTS idx_gene_researchers_gene ON public.gene_researchers(gene_symbol, organism);
CREATE INDEX IF NOT EXISTS idx_gene_researchers_researcher ON public.gene_researchers(researcher_id);

-- ============================================================================
-- RELATIONS: Gene <-> Article
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gene_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gene_symbol TEXT NOT NULL,
  organism TEXT NOT NULL DEFAULT 'Escherichia coli',
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gene_symbol, organism, article_id)
);

CREATE INDEX IF NOT EXISTS idx_gene_articles_gene ON public.gene_articles(gene_symbol, organism);
CREATE INDEX IF NOT EXISTS idx_gene_articles_article ON public.gene_articles(article_id);

-- ============================================================================
-- RELATIONS: Article <-> Researcher (authors)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.article_researchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  researcher_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  author_position INTEGER, -- 1 = first author, etc.
  is_corresponding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, researcher_id)
);

CREATE INDEX IF NOT EXISTS idx_article_researchers_article ON public.article_researchers(article_id);
CREATE INDEX IF NOT EXISTS idx_article_researchers_researcher ON public.article_researchers(researcher_id);

-- ============================================================================
-- RELATIONS: Conference <-> Researcher (participants)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conference_researchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  researcher_id UUID NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  role TEXT, -- 'speaker', 'organizer', 'attendee'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conference_id, researcher_id)
);

CREATE INDEX IF NOT EXISTS idx_conference_researchers_conference ON public.conference_researchers(conference_id);
CREATE INDEX IF NOT EXISTS idx_conference_researchers_researcher ON public.conference_researchers(researcher_id);

-- ============================================================================
-- RELATIONS: Conference <-> Article (presented papers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conference_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  presentation_type TEXT, -- 'talk', 'poster'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conference_id, article_id)
);

-- ============================================================================
-- RELATIONS: Conference <-> Gene
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conference_genes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  gene_symbol TEXT NOT NULL,
  organism TEXT NOT NULL DEFAULT 'Escherichia coli',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conference_id, gene_symbol, organism)
);

-- ============================================================================
-- ENTITY TAGS (polymorphic tagging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.entity_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'gene', 'researcher', 'article', 'conference'
  entity_id TEXT NOT NULL,   -- UUID as text or gene_symbol for genes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tag_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_tags_tag ON public.entity_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_entity ON public.entity_tags(entity_type, entity_id);

-- ============================================================================
-- NOTES with Tags (simple text + tags for interconnection)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.entity_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'gene', 'researcher', 'article', 'conference'
  entity_id TEXT NOT NULL,   -- UUID as text or gene_symbol for genes
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_notes_user ON public.entity_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_notes_entity ON public.entity_notes(entity_type, entity_id);

-- Note tags (many-to-many)
CREATE TABLE IF NOT EXISTS public.note_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.entity_notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(note_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_note_tags_note ON public.note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON public.note_tags(tag_id);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_researchers_updated_at ON public.researchers;
CREATE TRIGGER trg_researchers_updated_at
  BEFORE UPDATE ON public.researchers
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_articles_updated_at ON public.articles;
CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_conferences_updated_at ON public.conferences;
CREATE TRIGGER trg_conferences_updated_at
  BEFORE UPDATE ON public.conferences
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_entity_notes_updated_at ON public.entity_notes;
CREATE TRIGGER trg_entity_notes_updated_at
  BEFORE UPDATE ON public.entity_notes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Researchers: readable by anyone authenticated, writable by admin
ALTER TABLE public.researchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "researchers_select" ON public.researchers;
CREATE POLICY "researchers_select" ON public.researchers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "researchers_insert" ON public.researchers;
CREATE POLICY "researchers_insert" ON public.researchers
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "researchers_update" ON public.researchers;
CREATE POLICY "researchers_update" ON public.researchers
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "researchers_delete" ON public.researchers;
CREATE POLICY "researchers_delete" ON public.researchers
  FOR DELETE TO authenticated USING (true);

-- Articles
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "articles_select" ON public.articles;
CREATE POLICY "articles_select" ON public.articles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "articles_insert" ON public.articles;
CREATE POLICY "articles_insert" ON public.articles
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "articles_update" ON public.articles;
CREATE POLICY "articles_update" ON public.articles
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "articles_delete" ON public.articles;
CREATE POLICY "articles_delete" ON public.articles
  FOR DELETE TO authenticated USING (true);

-- Conferences
ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conferences_select" ON public.conferences;
CREATE POLICY "conferences_select" ON public.conferences
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "conferences_insert" ON public.conferences;
CREATE POLICY "conferences_insert" ON public.conferences
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "conferences_update" ON public.conferences;
CREATE POLICY "conferences_update" ON public.conferences
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "conferences_delete" ON public.conferences;
CREATE POLICY "conferences_delete" ON public.conferences
  FOR DELETE TO authenticated USING (true);

-- Tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tags_select" ON public.tags;
CREATE POLICY "tags_select" ON public.tags
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tags_insert" ON public.tags;
CREATE POLICY "tags_insert" ON public.tags
  FOR INSERT TO authenticated WITH CHECK (true);

-- Entity notes: only owner can CRUD
ALTER TABLE public.entity_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entity_notes_select_own" ON public.entity_notes;
CREATE POLICY "entity_notes_select_own" ON public.entity_notes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entity_notes_insert_own" ON public.entity_notes;
CREATE POLICY "entity_notes_insert_own" ON public.entity_notes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "entity_notes_update_own" ON public.entity_notes;
CREATE POLICY "entity_notes_update_own" ON public.entity_notes
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "entity_notes_delete_own" ON public.entity_notes;
CREATE POLICY "entity_notes_delete_own" ON public.entity_notes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Relation tables: readable by all, writable by all authenticated
ALTER TABLE public.gene_researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gene_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_genes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- Generic policy for relation tables
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
    EXECUTE format('DROP POLICY IF EXISTS "%s_all" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_all" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample tags
INSERT INTO public.tags (name, color) VALUES
  ('opéron lactose', '#6366f1'),
  ('régulation', '#8b5cf6'),
  ('structure', '#ec4899'),
  ('membrane', '#14b8a6'),
  ('transport', '#f59e0b'),
  ('réparation ADN', '#ef4444'),
  ('stress', '#64748b'),
  ('RecA', '#3b82f6')
ON CONFLICT (name) DO NOTHING;
