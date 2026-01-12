-- Migration 008: Reset all user data
-- This migration clears all user-generated data to fix tag system inconsistencies
-- Run: supabase db push

-- ============================================
-- IMPORTANT: This resets ALL user data
-- Keep only the base schema and sample data
-- ============================================

-- 1. Clear all private user data first (due to foreign keys)
TRUNCATE TABLE public.note_tags CASCADE;
TRUNCATE TABLE public.entity_tags CASCADE;
TRUNCATE TABLE public.collection_items CASCADE;
TRUNCATE TABLE public.collections CASCADE;
TRUNCATE TABLE public.inbox_items CASCADE;
TRUNCATE TABLE public.entity_notes CASCADE;
TRUNCATE TABLE public.tags CASCADE;

-- 2. Clear relation tables
TRUNCATE TABLE public.article_researchers CASCADE;
TRUNCATE TABLE public.gene_researchers CASCADE;
TRUNCATE TABLE public.gene_articles CASCADE;
TRUNCATE TABLE public.conference_researchers CASCADE;
TRUNCATE TABLE public.conference_articles CASCADE;

-- 3. Clear main entities (optional - uncomment to fully reset)
TRUNCATE TABLE public.articles CASCADE;
TRUNCATE TABLE public.researchers CASCADE;
TRUNCATE TABLE public.conferences CASCADE;

-- 4. Optionally clear genes data (careful - this resets favorites too)
-- TRUNCATE TABLE public.saved_genes CASCADE;

-- ============================================
-- Re-seed with clean sample data
-- ============================================

-- Tags (basic labels - without user_id for shared tags)
-- Note: These will be created per-user when needed

-- Sample Researchers
INSERT INTO public.researchers (id, name, institution, specialization, email, orcid) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Dr. Maria Rodriguez', 'MIT', 'E. coli transcription regulation', 'mrodriguez@mit.edu', '0000-0001-2345-6789'),
  ('00000000-0000-0000-0000-000000000002', 'Prof. James Chen', 'Stanford University', 'Bacterial DNA repair mechanisms', 'jchen@stanford.edu', '0000-0002-3456-7890'),
  ('00000000-0000-0000-0000-000000000003', 'Dr. Sarah Thompson', 'Harvard Medical School', 'Antibiotic resistance', 'sthompson@hms.harvard.edu', NULL),
  ('00000000-0000-0000-0000-000000000004', 'Prof. Kenji Yamamoto', 'University of Tokyo', 'Bacterial cell division', 'yamamoto@u-tokyo.ac.jp', '0000-0003-4567-8901'),
  ('00000000-0000-0000-0000-000000000005', 'Dr. Emma Wilson', 'Cambridge University', 'E. coli metabolism', 'ewilson@cam.ac.uk', '0000-0004-5678-9012')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  institution = EXCLUDED.institution,
  specialization = EXCLUDED.specialization,
  email = EXCLUDED.email,
  orcid = EXCLUDED.orcid;

-- Sample Articles with external_source/external_id
INSERT INTO public.articles (id, title, journal, year, doi, pmid, abstract, external_source, external_id) VALUES
  ('00000000-0000-0000-0001-000000000001', 'DnaA regulation of chromosome replication initiation in E. coli', 'Nature Microbiology', 2024, '10.1038/s41564-024-00001-1', '39000001', 'We investigated the role of DnaA protein in controlling chromosome replication initiation...', 'pubmed', '39000001'),
  ('00000000-0000-0000-0001-000000000002', 'FtsZ dynamics during bacterial cell division', 'Cell', 2023, '10.1016/j.cell.2023.06.001', '37500002', 'FtsZ is essential for bacterial cytokinesis. Here we show using super-resolution microscopy...', 'pubmed', '37500002'),
  ('00000000-0000-0000-0001-000000000003', 'RecA-mediated DNA repair pathways in E. coli', 'Molecular Cell', 2024, '10.1016/j.molcel.2024.02.001', '38000003', 'The RecA protein plays a central role in homologous recombination and DNA repair...', 'pubmed', '38000003'),
  ('00000000-0000-0000-0001-000000000004', 'LexA repressor and the SOS response', 'PNAS', 2023, '10.1073/pnas.2023.001', '36500004', 'The SOS response is triggered by DNA damage and regulated by LexA repressor...', 'pubmed', '36500004')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  journal = EXCLUDED.journal,
  year = EXCLUDED.year,
  doi = EXCLUDED.doi,
  pmid = EXCLUDED.pmid,
  abstract = EXCLUDED.abstract,
  external_source = EXCLUDED.external_source,
  external_id = EXCLUDED.external_id;

-- Sample Conferences
INSERT INTO public.conferences (id, name, city, country, date, end_date, website, description) VALUES
  ('00000000-0000-0000-0002-000000000001', 'ASM Microbe 2024', 'Atlanta', 'USA', '2024-06-13', '2024-06-17', 'https://asm.org/Events/ASM-Microbe/Home', 'Annual meeting of the American Society for Microbiology'),
  ('00000000-0000-0000-0002-000000000002', 'EMBO Conference on Bacterial Cell Biology', 'Heidelberg', 'Germany', '2024-09-15', '2024-09-19', 'https://embo.org', 'European conference on bacterial cell biology'),
  ('00000000-0000-0000-0002-000000000003', 'Gordon Research Conference: Microbial Stress Response', 'Ventura', 'USA', '2025-02-09', '2025-02-14', 'https://grc.org', 'GRC on how bacteria respond to environmental stress')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  date = EXCLUDED.date,
  end_date = EXCLUDED.end_date,
  website = EXCLUDED.website,
  description = EXCLUDED.description;

-- Link researchers to articles (authorship)
INSERT INTO public.article_researchers (article_id, researcher_id, author_position, is_corresponding) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 1, TRUE),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', 2, FALSE),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000004', 1, TRUE),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000002', 1, TRUE),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000003', 2, FALSE),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 1, FALSE),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000005', 2, TRUE)
ON CONFLICT DO NOTHING;

-- Link researchers to genes they study
INSERT INTO public.gene_researchers (gene_symbol, organism, researcher_id, role) VALUES
  ('dnaA', 'Escherichia coli', '00000000-0000-0000-0000-000000000001', 'Principal Investigator'),
  ('dnaA', 'Escherichia coli', '00000000-0000-0000-0000-000000000002', 'Collaborator'),
  ('ftsZ', 'Escherichia coli', '00000000-0000-0000-0000-000000000004', 'Principal Investigator'),
  ('recA', 'Escherichia coli', '00000000-0000-0000-0000-000000000002', 'Principal Investigator'),
  ('recA', 'Escherichia coli', '00000000-0000-0000-0000-000000000003', 'Collaborator'),
  ('lexA', 'Escherichia coli', '00000000-0000-0000-0000-000000000001', 'Collaborator'),
  ('gyrA', 'Escherichia coli', '00000000-0000-0000-0000-000000000003', 'Principal Investigator')
ON CONFLICT DO NOTHING;

-- Link articles to genes
INSERT INTO public.gene_articles (gene_symbol, organism, article_id) VALUES
  ('dnaA', 'Escherichia coli', '00000000-0000-0000-0001-000000000001'),
  ('ftsZ', 'Escherichia coli', '00000000-0000-0000-0001-000000000002'),
  ('recA', 'Escherichia coli', '00000000-0000-0000-0001-000000000003'),
  ('lexA', 'Escherichia coli', '00000000-0000-0000-0001-000000000004'),
  ('recA', 'Escherichia coli', '00000000-0000-0000-0001-000000000004')
ON CONFLICT DO NOTHING;

-- Link researchers to conferences
INSERT INTO public.conference_researchers (conference_id, researcher_id, role) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 'Speaker'),
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000002', 'Attendee'),
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000003', 'Poster Presenter'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000004', 'Keynote Speaker'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000005', 'Attendee'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000002', 'Speaker'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000003', 'Attendee')
ON CONFLICT DO NOTHING;

-- ============================================
-- Summary: Database reset complete
-- - All user-generated data cleared
-- - Sample researchers, articles, conferences restored
-- - Tags will be created fresh per-user
-- ============================================
