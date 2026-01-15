/**
 * Tests for Knowledge Base API functions
 * Uses manual mocking approach for Supabase client
 */

// Mock responses storage
let mockData: any = null;
let mockError: any = null;
let mockInsertData: any = null;
let mockInsertError: any = null;
let mockUser: any = { id: 'user123', email: 'test@example.com' };

// Create mock implementation that will be used by jest.mock factory
const mockFromImpl = jest.fn();
const mockAuthGetUser = jest.fn();
let mockInsertImpl: jest.Mock;

// Mock the supabase module BEFORE imports
jest.mock('../../src/lib/supabase', () => ({
  supabaseWithAuth: {
    from: (...args: any[]) => mockFromImpl(...args),
    auth: {
      getUser: (...args: any[]) => mockAuthGetUser(...args),
    },
  },
}));

import {
  listResearchers,
  getResearcher,
  createResearcher,
  updateResearcher,
  deleteResearcher,
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  listConferences,
  getConference,
  createConference,
  updateConference,
  deleteConference,
  linkArticleToResearcher,
  unlinkArticleFromResearcher,
  linkConferenceToResearcher,
  unlinkConferenceFromResearcher,
  linkGeneToConference,
  linkArticleToConference,
  createNote,
  updateNote,
  deleteNote,
  listNotesForEntity,
  createTag,
  getOrCreateEntityTag,
  deleteTag,
  getNotesForTag,
  searchAll,
  searchWithFilters,
} from '../../src/lib/knowledge';

describe('Knowledge Base API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockData = null;
    mockError = null;
    mockInsertData = null;
    mockInsertError = null;
    
    // Mock auth.getUser() to return a valid user
    mockAuthGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    
    // Helper to get current mock values
    const getResponse = () => ({ data: mockData, error: mockError });
    const getInsertResponse = () => ({
      data: mockInsertData ?? mockData,
      error: mockInsertError ?? mockError,
    });

    const makeEqResult = () => ({
      order: jest.fn(() => Promise.resolve(getResponse())),
      then: (resolve: any, reject: any) => Promise.resolve(getResponse()).then(resolve, reject),
    });

    const selectEqChain: any = {
      eq: jest.fn(() => selectEqChain),
      single: jest.fn(() => Promise.resolve(getResponse())),
      order: jest.fn(() => Promise.resolve(getResponse())),
      select: jest.fn(() => Promise.resolve(getResponse())),
      in: jest.fn(() => makeEqResult()),
    };
    
    // Setup mockFrom to return chainable mock
    mockInsertImpl = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn(() => Promise.resolve(getInsertResponse())),
      }),
    });

    mockFromImpl.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn(() => Promise.resolve(getResponse())),
        eq: jest.fn(() => selectEqChain),
        single: jest.fn(() => Promise.resolve(getResponse())),
        or: jest.fn().mockReturnValue({
          limit: jest.fn(() => Promise.resolve(getResponse())),
        }),
        in: jest.fn().mockReturnValue({
          eq: jest.fn(() => makeEqResult()),
        }),
      }),
      insert: mockInsertImpl,
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn(() => Promise.resolve(getResponse())),
            }),
          }),
          select: jest.fn().mockReturnValue({
            single: jest.fn(() => Promise.resolve(getResponse())),
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn(() => Promise.resolve(getResponse())),
        }),
      }),
    });
  });

  // ============ Researchers ============

  describe('Researcher Operations', () => {
    const mockResearcher = {
      id: '123',
      name: 'Dr. Jane Smith',
      email: 'jane@example.com',
      institution: 'MIT',
      specialization: 'Genomics',
      bio: 'Expert in bacterial genomics',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    test('listResearchers returns all researchers', async () => {
      mockData = [mockResearcher];
      mockError = null;

      const result = await listResearchers();

      expect(mockFromImpl).toHaveBeenCalledWith('researchers');
      expect(result).toEqual([mockResearcher]);
    });

    test('listResearchers handles errors', async () => {
      mockData = null;
      mockError = { message: 'Database error' };

      await expect(listResearchers()).rejects.toThrow('Database error');
    });

    test('getResearcher returns researcher with relations', async () => {
      mockData = mockResearcher;
      mockError = null;

      const result = await getResearcher('123');

      expect(result).toBeDefined();
      expect(mockFromImpl).toHaveBeenCalledWith('researchers');
    });

    test('getResearcher returns null for non-existent researcher', async () => {
      mockData = null;
      mockError = { code: 'PGRST116' };

      const result = await getResearcher('nonexistent');
      expect(result).toBeNull();
    });

    test('createResearcher creates new researcher', async () => {
      const newResearcher = {
        name: 'Dr. John Doe',
        email: 'john@example.com',
        institution: 'Stanford',
      };

      mockData = { ...mockResearcher, ...newResearcher };
      mockError = null;

      const result = await createResearcher(newResearcher);

      expect(mockFromImpl).toHaveBeenCalledWith('researchers');
      expect(result.name).toBe(newResearcher.name);
    });

    test('updateResearcher updates existing researcher', async () => {
      const updates = { specialization: 'Proteomics' };

      mockData = { ...mockResearcher, ...updates };
      mockError = null;

      const result = await updateResearcher('123', updates);

      expect(mockFromImpl).toHaveBeenCalledWith('researchers');
      expect(result.specialization).toBe(updates.specialization);
    });

    test('deleteResearcher removes researcher', async () => {
      mockData = null;
      mockError = null;

      await deleteResearcher('123');

      expect(mockFromImpl).toHaveBeenCalledWith('researchers');
    });
  });

  // ============ Articles ============

  describe('Article Operations', () => {
    const mockArticle = {
      id: 'a123',
      title: 'Novel E. coli mechanisms',
      authors: ['Smith J', 'Doe J'],
      journal: 'Nature',
      year: 2025,
      doi: '10.1234/nature.2025.123',
      abstract: 'Study of E. coli',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    test('listArticles returns all articles', async () => {
      mockData = [mockArticle];
      mockError = null;

      const result = await listArticles();

      expect(mockFromImpl).toHaveBeenCalledWith('articles');
      expect(result).toEqual([mockArticle]);
    });

    test('getArticle returns article with relations', async () => {
      mockData = []; // Will be used for multiple select queries (authors, genes, etc.)
      mockError = null;

      const result = await getArticle('a123');

      expect(result).toBeDefined();
      expect(mockFromImpl).toHaveBeenCalledWith('articles');
    });

    test('createArticle creates new article', async () => {
      const newArticle = {
        title: 'New Study',
        authors: ['Author A'],
        journal: 'Science',
        year: 2026,
      };

      mockData = { ...mockArticle, ...newArticle };
      mockError = null;

      const result = await createArticle(newArticle);

      expect(mockFromImpl).toHaveBeenCalledWith('articles');
      expect(result.title).toBe(newArticle.title);
    });

    test('updateArticle updates existing article', async () => {
      const updates = { year: 2026 };

      mockData = { ...mockArticle, ...updates };
      mockError = null;

      const result = await updateArticle('a123', updates);

      expect(mockFromImpl).toHaveBeenCalledWith('articles');
      expect(result.year).toBe(2026);
    });

    test('deleteArticle removes article', async () => {
      mockData = null;
      mockError = null;

      await deleteArticle('a123');

      expect(mockFromImpl).toHaveBeenCalledWith('articles');
    });
  });

  // ============ Conferences ============

  describe('Conference Operations', () => {
    const mockConference = {
      id: 'c123',
      name: 'International Microbiology Conference',
      date: '2026-06-15',
      city: 'Boston',
      country: 'USA',
      description: 'Annual conference',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    test('listConferences returns all conferences', async () => {
      mockData = [mockConference];
      mockError = null;

      const result = await listConferences();

      expect(mockFromImpl).toHaveBeenCalledWith('conferences');
      expect(result).toEqual([mockConference]);
    });

    test('createConference creates new conference', async () => {
      const newConf = {
        name: 'New Conference',
        date: '2026-09-01',
        city: 'Paris',
      };

      mockData = { ...mockConference, ...newConf };
      mockError = null;

      const result = await createConference(newConf);

      expect(mockFromImpl).toHaveBeenCalledWith('conferences');
      expect(result.name).toBe(newConf.name);
    });

    test('updateConference updates existing conference', async () => {
      const updates = { city: 'London' };

      mockData = { ...mockConference, ...updates };
      mockError = null;

      const result = await updateConference('c123', updates);

      expect(mockFromImpl).toHaveBeenCalledWith('conferences');
      expect(result.city).toBe('London');
    });

    test('deleteConference removes conference', async () => {
      mockData = null;
      mockError = null;

      await deleteConference('c123');

      expect(mockFromImpl).toHaveBeenCalledWith('conferences');
    });
  });

  // ============ Relations ============

  describe('Relation Operations', () => {
    test('linkArticleToResearcher creates link', async () => {
      mockData = { article_id: 'a1', researcher_id: 'r1' };
      mockError = null;

      await linkArticleToResearcher('a1', 'r1');

      expect(mockFromImpl).toHaveBeenCalledWith('article_researchers');
    });

    test('unlinkArticleFromResearcher removes link', async () => {
      mockData = null;
      mockError = null;

      await unlinkArticleFromResearcher('a1', 'r1');

      expect(mockFromImpl).toHaveBeenCalledWith('article_researchers');
    });

    test('linkConferenceToResearcher creates link', async () => {
      mockData = { conference_id: 'c1', researcher_id: 'r1' };
      mockError = null;

      await linkConferenceToResearcher('c1', 'r1');

      expect(mockFromImpl).toHaveBeenCalledWith('conference_researchers');
    });

    test('linkGeneToConference creates link', async () => {
      mockData = { gene_symbol: 'lacZ', organism: 'E. coli', conference_id: 'c1' };
      mockError = null;

      await linkGeneToConference('lacZ', 'E. coli', 'c1');

      expect(mockFromImpl).toHaveBeenCalledWith('conference_genes');
    });

    test('linkArticleToConference creates link', async () => {
      mockData = { article_id: 'a1', conference_id: 'c1' };
      mockError = null;

      await linkArticleToConference('a1', 'c1');

      expect(mockFromImpl).toHaveBeenCalledWith('conference_articles');
    });
  });

  // ============ Notes & Tags ============

  describe('Notes and Tags Operations', () => {
    const mockNote = {
      id: 'n123',
      entity_type: 'researcher' as const,
      entity_id: 'r123',
      content: 'Important note',
      tags: ['genomics', 'research'],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    test('createNote creates new note', async () => {
      mockData = mockNote;
      mockError = null;

      const result = await createNote({
        entity_type: 'researcher',
        entity_id: 'r123',
        content: 'Important note',
      });

      expect(mockFromImpl).toHaveBeenCalledWith('entity_notes');
      expect(result.content).toBe('Important note');
    });

    test('updateNote updates existing note', async () => {
      const updatedContent = 'Updated note';

      mockData = { ...mockNote, content: updatedContent };
      mockError = null;

      const result = await updateNote('n123', updatedContent);

      expect(mockFromImpl).toHaveBeenCalledWith('entity_notes');
      expect(result.content).toBe('Updated note');
    });

    test('deleteNote removes note', async () => {
      mockData = null;
      mockError = null;

      await deleteNote('n123');

      expect(mockFromImpl).toHaveBeenCalledWith('entity_notes');
    });

    test('getNotesForEntity returns entity notes', async () => {
      mockData = [mockNote];
      mockError = null;

      const result = await listNotesForEntity('researcher', 'r123');

      expect(mockFromImpl).toHaveBeenCalledWith('entity_notes');
      expect(result).toBeDefined();
    });

    test('createTag creates new tag', async () => {
      const mockTag = { name: 'genomics', color: '#FF0000' };

      mockInsertData = mockTag;
      mockError = null;

      const result = await createTag({ name: 'genomics' });

      expect(mockFromImpl).toHaveBeenCalledWith('tags');
    });

    test('deleteTag removes tag', async () => {
      mockData = null;
      mockError = null;

      await deleteTag('genomics');

      expect(mockFromImpl).toHaveBeenCalledWith('tags');
    });

    test('getNotesForTag returns notes with tag', async () => {
      mockData = [{ note_id: 'n123' }]; // First call returns note IDs
      mockError = null;

      await getNotesForTag('genomics');

      expect(mockFromImpl).toHaveBeenCalledWith('note_tags');
      // entity_notes will be called only if noteIds.length > 0
    });

    test('getOrCreateEntityTag uses gene naming convention', async () => {
      mockData = null; // No existing tag
      mockInsertData = {
        id: 't1',
        name: 'lacz-eco',
        entity_type: 'gene',
        entity_id: 'lacZ_Escherichia coli',
      };

      const result = await getOrCreateEntityTag('gene', 'lacZ_Escherichia coli', 'lacZ');

      expect(mockInsertImpl).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'lacz-eco',
          entity_type: 'gene',
          entity_id: 'lacZ_Escherichia coli',
        })
      );
      expect(result.name).toBe('lacz-eco');
    });

    test('getOrCreateEntityTag uses researcher last name', async () => {
      mockData = null; // No existing tag
      mockInsertData = {
        id: 't2',
        name: 'curie',
        entity_type: 'researcher',
        entity_id: 'r1',
      };

      const result = await getOrCreateEntityTag('researcher', 'r1', 'Marie Curie');

      expect(mockInsertImpl).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'curie',
          entity_type: 'researcher',
          entity_id: 'r1',
        })
      );
      expect(result.name).toBe('curie');
    });
  });

  // ============ Search ============

  describe('Search Operations', () => {
    test('searchAll returns results from all entities', async () => {
      const mockResearcher = { id: 'r1', name: 'Dr. Smith' };
      const mockArticle = { id: 'a1', title: 'E. coli study' };
      const mockConference = { id: 'c1', name: 'Microbiology Conf' };

      // searchAll calls from() 3 times, set mockData as array
      mockData = [mockResearcher]; // First call for researchers
      mockError = null;

      const result = await searchAll('smith');

      expect(mockFromImpl).toHaveBeenCalledWith('researchers');
      expect(mockFromImpl).toHaveBeenCalledWith('articles');
      expect(mockFromImpl).toHaveBeenCalledWith('conferences');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('searchAll handles empty results', async () => {
      mockData = [];
      mockError = null;

      const result = await searchAll('nonexistent');

      expect(result).toBeDefined();
    });

    test('searchWithFilters limits entity types', async () => {
      mockData = [{ id: 'r1', name: 'Dr. Ada' }];
      mockError = null;

      const result = await searchWithFilters('ada', { types: ['researcher'], limit: 5 });

      const calledTables = mockFromImpl.mock.calls.map((call) => call[0]);
      expect(calledTables).toEqual(['researchers']);
      expect(result).toEqual([{ type: 'researcher', data: { id: 'r1', name: 'Dr. Ada' } }]);
    });
  });

  // ============ Error Handling ============

  describe('Error Handling', () => {
    test('handles database not initialized error', async () => {
      mockData = null;
      mockError = { code: '42P01', message: 'relation does not exist' };

      await expect(listResearchers()).rejects.toThrow(
        'Base de données non initialisée'
      );
    });

    test('handles generic errors', async () => {
      mockData = null;
      mockError = { message: 'Network error' };

      await expect(listResearchers()).rejects.toThrow('Network error');
    });
  });
});
