-- Migration: Add entity links to tags
-- Tags can now link to a specific entity (gene, researcher, article, conference)
-- This enables navigation: click on #lacZ → go to lacZ gene page

-- Add entity_type and entity_id to tags table
ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS entity_type TEXT,
ADD COLUMN IF NOT EXISTS entity_id TEXT;

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_tags_entity ON public.tags(entity_type, entity_id);

-- Add comment explaining the columns
COMMENT ON COLUMN public.tags.entity_type IS 'Type of linked entity: gene, researcher, article, conference, or NULL for simple labels';
COMMENT ON COLUMN public.tags.entity_id IS 'ID of linked entity (UUID for most, symbol_organism for genes)';
