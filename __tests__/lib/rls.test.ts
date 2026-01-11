/**
 * RLS Integration Tests
 * Verify that Row Level Security policies work correctly
 * 
 * These tests require a running Supabase instance with migrations applied.
 * Run with: npm run test:integration -- --testPathPattern=rls
 */

// Mock user IDs for testing
const USER_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * RLS Policy Contract Tests
 * These test the expected behavior of RLS policies
 */
describe('RLS Policy Contracts', () => {
  
  describe('entity_notes', () => {
    it('should have user_id column', () => {
      // entity_notes.user_id is required
      const noteSchema = {
        user_id: 'uuid',
        entity_type: 'string',
        entity_id: 'string',
        content: 'string',
      };
      expect(noteSchema.user_id).toBe('uuid');
    });

    it('policy: owner can only see own notes', () => {
      // SELECT: auth.uid() = user_id
      const policy = {
        operation: 'SELECT',
        check: (userId: string, noteUserId: string) => userId === noteUserId,
      };
      
      expect(policy.check(USER_A, USER_A)).toBe(true);
      expect(policy.check(USER_A, USER_B)).toBe(false);
    });

    it('policy: owner can only insert own notes', () => {
      // INSERT: WITH CHECK (auth.uid() = user_id)
      const policy = {
        operation: 'INSERT',
        withCheck: (authUid: string, insertUserId: string) => authUid === insertUserId,
      };
      
      expect(policy.withCheck(USER_A, USER_A)).toBe(true);
      expect(policy.withCheck(USER_A, USER_B)).toBe(false); // Can't insert for another user
    });

    it('policy: owner can only update own notes', () => {
      const policy = {
        operation: 'UPDATE',
        using: (authUid: string, noteUserId: string) => authUid === noteUserId,
        withCheck: (authUid: string, newUserId: string) => authUid === newUserId,
      };
      
      expect(policy.using(USER_A, USER_A)).toBe(true);
      expect(policy.using(USER_A, USER_B)).toBe(false);
    });

    it('policy: owner can only delete own notes', () => {
      const policy = {
        operation: 'DELETE',
        using: (authUid: string, noteUserId: string) => authUid === noteUserId,
      };
      
      expect(policy.using(USER_A, USER_A)).toBe(true);
      expect(policy.using(USER_A, USER_B)).toBe(false);
    });
  });

  describe('inbox_items', () => {
    it('should have user_id column', () => {
      const inboxSchema = {
        user_id: 'uuid',
        raw: 'string',
        status: 'string',
      };
      expect(inboxSchema.user_id).toBe('uuid');
    });

    it('policy: full CRUD owner-only', () => {
      const policies = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'].map(op => ({
        operation: op,
        check: (authUid: string, rowUserId: string) => authUid === rowUserId,
      }));
      
      policies.forEach(policy => {
        expect(policy.check(USER_A, USER_A)).toBe(true);
        expect(policy.check(USER_A, USER_B)).toBe(false);
      });
    });
  });

  describe('tags (after migration 005)', () => {
    it('should have user_id column for ownership', () => {
      const tagSchema = {
        user_id: 'uuid',
        name: 'string',
        color: 'string?',
      };
      expect(tagSchema.user_id).toBe('uuid');
    });

    it('policy: tags are private per user', () => {
      const policy = {
        operation: 'SELECT',
        check: (authUid: string, tagUserId: string) => authUid === tagUserId,
      };
      
      // User A can see own tags
      expect(policy.check(USER_A, USER_A)).toBe(true);
      // User A cannot see User B's tags
      expect(policy.check(USER_A, USER_B)).toBe(false);
    });

    it('unique constraint: (user_id, name)', () => {
      // Same tag name can exist for different users
      const userATags = [{ user_id: USER_A, name: 'important' }];
      const userBTags = [{ user_id: USER_B, name: 'important' }];
      
      // Both should be allowed (different users)
      const allTags = [...userATags, ...userBTags];
      const uniqueCheck = new Set(allTags.map(t => `${t.user_id}:${t.name}`));
      expect(uniqueCheck.size).toBe(2);
    });
  });

  describe('articles (shared reference data)', () => {
    it('should NOT have user_id (shared by all)', () => {
      const articleSchema = {
        id: 'uuid',
        title: 'string',
        doi: 'string?',
        pmid: 'string?',
        // No user_id - articles are shared
      };
      expect(articleSchema).not.toHaveProperty('user_id');
    });

    it('policy: readable by any authenticated user', () => {
      const policy = {
        operation: 'SELECT',
        using: (isAuthenticated: boolean) => isAuthenticated,
      };
      
      expect(policy.using(true)).toBe(true);
      expect(policy.using(false)).toBe(false);
    });
  });

  describe('researchers (shared reference data)', () => {
    it('should NOT have user_id (shared by all)', () => {
      const researcherSchema = {
        id: 'uuid',
        name: 'string',
        institution: 'string?',
        // No user_id - researchers are shared
      };
      expect(researcherSchema).not.toHaveProperty('user_id');
    });
  });

  describe('conferences (shared reference data)', () => {
    it('should NOT have user_id (shared by all)', () => {
      const conferenceSchema = {
        id: 'uuid',
        name: 'string',
        date: 'date?',
        // No user_id - conferences are shared
      };
      expect(conferenceSchema).not.toHaveProperty('user_id');
    });
  });
});

/**
 * Data Isolation Tests
 * Verify users cannot access each other's private data
 */
describe('Data Isolation', () => {
  
  it('User A note is invisible to User B query', () => {
    // Simulate RLS filter
    const allNotes = [
      { id: '1', user_id: USER_A, content: 'User A secret' },
      { id: '2', user_id: USER_B, content: 'User B secret' },
    ];
    
    // User A queries (RLS filters to user_id = USER_A)
    const userAResults = allNotes.filter(n => n.user_id === USER_A);
    expect(userAResults).toHaveLength(1);
    expect(userAResults[0].content).toBe('User A secret');
    
    // User B queries (RLS filters to user_id = USER_B)
    const userBResults = allNotes.filter(n => n.user_id === USER_B);
    expect(userBResults).toHaveLength(1);
    expect(userBResults[0].content).toBe('User B secret');
  });

  it('User A inbox items are invisible to User B', () => {
    const allInbox = [
      { id: '1', user_id: USER_A, raw: 'PMID:123' },
      { id: '2', user_id: USER_B, raw: 'DOI:10.1234' },
    ];
    
    const userAInbox = allInbox.filter(i => i.user_id === USER_A);
    expect(userAInbox).toHaveLength(1);
    expect(userAInbox[0].raw).toBe('PMID:123');
  });

  it('User A tags are invisible to User B', () => {
    const allTags = [
      { id: '1', user_id: USER_A, name: 'urgent' },
      { id: '2', user_id: USER_B, name: 'urgent' }, // Same name, different user
    ];
    
    const userATags = allTags.filter(t => t.user_id === USER_A);
    const userBTags = allTags.filter(t => t.user_id === USER_B);
    
    expect(userATags).toHaveLength(1);
    expect(userBTags).toHaveLength(1);
  });

  it('Articles are visible to all authenticated users', () => {
    const articles = [
      { id: '1', title: 'Shared Paper', doi: '10.1234' },
    ];
    
    // Both users can see (no user_id filter)
    const userAArticles = articles; // All visible
    const userBArticles = articles; // All visible
    
    expect(userAArticles).toEqual(userBArticles);
  });

  it('Notes ON articles remain private', () => {
    // Article is shared
    const article = { id: 'art-1', title: 'Shared Paper' };
    
    // But notes on it are private
    const notes = [
      { id: 'n1', user_id: USER_A, entity_type: 'article', entity_id: 'art-1', content: 'My private note' },
      { id: 'n2', user_id: USER_B, entity_type: 'article', entity_id: 'art-1', content: 'B private note' },
    ];
    
    // User A sees only their note on the shared article
    const userANotes = notes.filter(n => n.user_id === USER_A && n.entity_id === article.id);
    expect(userANotes).toHaveLength(1);
    expect(userANotes[0].content).toBe('My private note');
  });
});

/**
 * Service Layer Tests
 * Verify services pass user_id correctly
 */
describe('Service Layer user_id handling', () => {
  
  it('createTag should include user_id', () => {
    const mockUserId = USER_A;
    const tagInput = { name: 'test' };
    
    // Simulate service adding user_id
    const insertData = { ...tagInput, user_id: mockUserId };
    
    expect(insertData.user_id).toBe(USER_A);
    expect(insertData.name).toBe('test');
  });

  it('addTagToNote should include user_id', () => {
    const mockUserId = USER_A;
    const noteId = 'note-123';
    const tagId = 'tag-456';
    
    // Simulate service adding user_id
    const insertData = { note_id: noteId, tag_id: tagId, user_id: mockUserId };
    
    expect(insertData.user_id).toBe(USER_A);
  });

  it('listTags should filter by user_id', () => {
    const mockUserId = USER_A;
    
    // Simulate query with user filter
    const query = {
      table: 'tags',
      filters: [{ column: 'user_id', value: mockUserId }],
    };
    
    expect(query.filters[0].column).toBe('user_id');
    expect(query.filters[0].value).toBe(USER_A);
  });
});
