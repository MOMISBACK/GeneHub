/**
 * Integration Tests for Knowledge Base API
 * 
 * These tests require a Supabase project (local or remote).
 * Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.
 * 
 * Run: npm run test:integration
 */

import {
  listResearchers,
  createResearcher,
  getResearcher,
  updateResearcher,
  deleteResearcher,
  listArticles,
  createArticle,
  deleteArticle,
  listConferences,
  createConference,
  deleteConference,
  listTags,
  createTag,
  deleteTag,
  linkGeneToResearcher,
  unlinkGeneFromResearcher,
  linkArticleToResearcher,
  searchAll,
} from '../../src/lib/knowledge';

// Skip tests if no Supabase config
const SKIP_INTEGRATION = !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY;

const describeIf = SKIP_INTEGRATION ? describe.skip : describe;

describeIf('Knowledge Base Integration Tests', () => {
  // Track created resources for cleanup
  const createdIds: { researchers: string[]; articles: string[]; conferences: string[]; tags: string[] } = {
    researchers: [],
    articles: [],
    conferences: [],
    tags: [],
  };

  // Cleanup after all tests
  afterAll(async () => {
    // Delete in reverse order of dependencies
    for (const id of createdIds.tags) {
      try { await deleteTag(id); } catch {}
    }
    for (const id of createdIds.conferences) {
      try { await deleteConference(id); } catch {}
    }
    for (const id of createdIds.articles) {
      try { await deleteArticle(id); } catch {}
    }
    for (const id of createdIds.researchers) {
      try { await deleteResearcher(id); } catch {}
    }
  });

  describe('Researchers', () => {
    it('should list researchers', async () => {
      const researchers = await listResearchers();
      expect(Array.isArray(researchers)).toBe(true);
    });

    it('should create a researcher', async () => {
      const researcher = await createResearcher({
        name: 'Test Researcher',
        institution: 'Test University',
        specialization: 'E. coli genetics',
        email: 'test@example.com',
      });

      expect(researcher.id).toBeDefined();
      expect(researcher.name).toBe('Test Researcher');
      createdIds.researchers.push(researcher.id);
    });

    it('should get a researcher with relations', async () => {
      const id = createdIds.researchers[0];
      if (!id) return;

      const researcher = await getResearcher(id);
      expect(researcher).not.toBeNull();
      expect(researcher?.id).toBe(id);
      expect(researcher?.genes).toBeDefined();
      expect(researcher?.articles).toBeDefined();
    });

    it('should update a researcher', async () => {
      const id = createdIds.researchers[0];
      if (!id) return;

      const updated = await updateResearcher(id, {
        institution: 'Updated University',
      });

      expect(updated.institution).toBe('Updated University');
    });
  });

  describe('Articles', () => {
    it('should list articles', async () => {
      const articles = await listArticles();
      expect(Array.isArray(articles)).toBe(true);
    });

    it('should create an article', async () => {
      const article = await createArticle({
        title: 'Test Article Title',
        journal: 'Test Journal',
        year: 2024,
        doi: '10.1234/test.2024.001',
      });

      expect(article.id).toBeDefined();
      expect(article.title).toBe('Test Article Title');
      createdIds.articles.push(article.id);
    });
  });

  describe('Conferences', () => {
    it('should list conferences', async () => {
      const conferences = await listConferences();
      expect(Array.isArray(conferences)).toBe(true);
    });

    it('should create a conference', async () => {
      const conference = await createConference({
        name: 'Test Conference',
        city: 'Test City',
        country: 'Test Country',
        date: '2024-06-01',
      });

      expect(conference.id).toBeDefined();
      expect(conference.name).toBe('Test Conference');
      createdIds.conferences.push(conference.id);
    });
  });

  describe('Tags', () => {
    it('should list tags', async () => {
      const tags = await listTags();
      expect(Array.isArray(tags)).toBe(true);
    });

    it('should create a tag', async () => {
      const tag = await createTag({
        name: 'test-tag-' + Date.now(),
        color: '#FF0000',
      });

      expect(tag.id).toBeDefined();
      expect(tag.color).toBe('#FF0000');
      createdIds.tags.push(tag.id);
    });
  });

  describe('Relations', () => {
    it('should link researcher to gene', async () => {
      const researcherId = createdIds.researchers[0];
      if (!researcherId) return;

      await expect(
        linkGeneToResearcher('dnaA', 'Escherichia coli', researcherId, 'PI')
      ).resolves.not.toThrow();
    });

    it('should unlink researcher from gene', async () => {
      const researcherId = createdIds.researchers[0];
      if (!researcherId) return;

      await expect(
        unlinkGeneFromResearcher('dnaA', 'Escherichia coli', researcherId)
      ).resolves.not.toThrow();
    });

    it('should link article to researcher', async () => {
      const researcherId = createdIds.researchers[0];
      const articleId = createdIds.articles[0];
      if (!researcherId || !articleId) return;

      await expect(
        linkArticleToResearcher(articleId, researcherId, 1, true)
      ).resolves.not.toThrow();
    });
  });

  describe('Search', () => {
    it('should search across all entities', async () => {
      const results = await searchAll('test');
      expect(Array.isArray(results)).toBe(true);
      // Should find our test data
      expect(results.some(r => 
        r.type === 'researcher' && r.data.name === 'Test Researcher'
      )).toBe(true);
    });
  });
});
