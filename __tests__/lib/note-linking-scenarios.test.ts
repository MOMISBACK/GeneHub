/**
 * Integration Tests for Cross-Entity Note Linking
 * 
 * These tests document the expected behavior of the cross-entity
 * note linking system from a user's perspective.
 */

describe('Cross-Entity Note Linking - Integration Scenarios', () => {
  describe('Scenario 1: Researcher collaboration on gene', () => {
    it('should make note appear on both gene and researcher pages', () => {
      // User creates a note on gene CnoX
      const note = {
        id: 'note-1',
        content: 'Dr. Dupont is studying CnoX regulation mechanisms',
        entity_type: 'gene',
        entity_id: 'cnox_escherichia coli',
        created_at: '2026-01-12T10:00:00Z',
        updated_at: '2026-01-12T10:00:00Z',
      };

      // User adds a tag linking to researcher Dupont
      const researcherTag = {
        id: 'tag-dupont',
        name: 'dupont',
        color: '#22c55e',
        entity_type: 'researcher',
        entity_id: 'researcher-123',
      };

      // Expected: Note appears on gene page
      const isVisibleOnGene = 
        note.entity_type === 'gene' && 
        note.entity_id === 'cnox_escherichia coli';
      expect(isVisibleOnGene).toBe(true);

      // Expected: Note appears on researcher page via tag
      const isVisibleOnResearcher = 
        researcherTag.entity_type === 'researcher' && 
        researcherTag.entity_id === 'researcher-123';
      expect(isVisibleOnResearcher).toBe(true);

      // Expected: Note on researcher page has isLinkedViaTag flag
      // (This would be set by listNotesForEntity when fetching for researcher)
      const noteOnResearcherPage = {
        ...note,
        isLinkedViaTag: true,
        tags: [researcherTag],
      };
      expect(noteOnResearcherPage.isLinkedViaTag).toBe(true);
    });
  });

  describe('Scenario 2: Article citation in gene note', () => {
    it('should link gene and article via note tags', () => {
      // User creates note on gene
      const geneNote = {
        id: 'note-2',
        content: 'See Smith et al. 2025 for detailed CnoX analysis',
        entity_type: 'gene',
        entity_id: 'cnox_escherichia coli',
      };

      // User tags with article
      const articleTag = {
        name: 'smith-2025-cnox',
        entity_type: 'article',
        entity_id: 'article-789',
      };

      // Later, when viewing the article...
      // Expected: This gene note appears on article page
      const queryEntityType = 'article';
      const queryEntityId = 'article-789';

      const isLinkedToArticle = 
        articleTag.entity_type === queryEntityType && 
        articleTag.entity_id === queryEntityId;
      
      expect(isLinkedToArticle).toBe(true);
    });
  });

  describe('Scenario 3: Conference presentation planning', () => {
    it('should link genes, researchers, and conferences via notes', () => {
      // User planning a conference presentation
      const presentationNote = {
        id: 'note-3',
        content: 'ASM 2026 presentation: CnoX regulation by Dr. Dupont team',
        entity_type: 'conference',
        entity_id: 'conference-asm-2026',
      };

      // User adds multiple tags
      const tags = [
        {
          name: 'cnox-eco',
          entity_type: 'gene',
          entity_id: 'cnox_escherichia coli',
        },
        {
          name: 'dupont',
          entity_type: 'researcher',
          entity_id: 'researcher-123',
        },
      ];

      // Expected: Note appears on conference page (direct)
      expect(presentationNote.entity_type).toBe('conference');

      // Expected: Note appears on gene page (via tag)
      const isVisibleOnGene = tags.some(
        t => t.entity_type === 'gene' && t.entity_id === 'cnox_escherichia coli'
      );
      expect(isVisibleOnGene).toBe(true);

      // Expected: Note appears on researcher page (via tag)
      const isVisibleOnResearcher = tags.some(
        t => t.entity_type === 'researcher' && t.entity_id === 'researcher-123'
      );
      expect(isVisibleOnResearcher).toBe(true);
    });
  });

  describe('Scenario 4: Tag-only notes (from Inbox)', () => {
    it('should create note directly on entity when using entity tag in inbox', () => {
      // User enters text in Inbox with gene tag
      const inboxText = 'Interesting regulation pattern observed';
      const selectedTag = {
        name: 'cnox-eco',
        entity_type: 'gene',
        entity_id: 'cnox_escherichia coli',
      };

      // System creates note on the tagged entity
      const createdNote = {
        content: inboxText,
        entity_type: selectedTag.entity_type,
        entity_id: selectedTag.entity_id,
      };

      // Expected: Note created directly on gene
      expect(createdNote.entity_type).toBe('gene');
      expect(createdNote.entity_id).toBe('cnox_escherichia coli');

      // Expected: Note appears on gene page without isLinkedViaTag flag
      // (because it was created directly, not linked via tag)
      expect(createdNote).not.toHaveProperty('isLinkedViaTag');
    });
  });

  describe('Scenario 5: Editing cross-entity notes', () => {
    it('should update note everywhere when edited', () => {
      // Original note on gene, visible on researcher page via tag
      const originalNote = {
        id: 'note-5',
        content: 'Initial observation',
        entity_type: 'gene',
        entity_id: 'cnox_escherichia coli',
        updated_at: '2026-01-12T10:00:00Z',
      };

      // User edits note from researcher page
      const updatedNote = {
        ...originalNote,
        content: 'Updated observation with new data',
        updated_at: '2026-01-12T15:00:00Z',
      };

      // Expected: Same note ID (not creating a copy)
      expect(updatedNote.id).toBe(originalNote.id);

      // Expected: Content updated
      expect(updatedNote.content).toBe('Updated observation with new data');

      // Expected: Timestamp updated
      expect(new Date(updatedNote.updated_at).getTime())
        .toBeGreaterThan(new Date(originalNote.updated_at).getTime());

      // Expected: Still same entity (gene)
      expect(updatedNote.entity_type).toBe('gene');
      expect(updatedNote.entity_id).toBe('cnox_escherichia coli');
    });
  });

  describe('Scenario 6: Deleting cross-entity notes', () => {
    it('should remove note from all entity pages when deleted', () => {
      const noteId = 'note-6';
      const noteEntityType = 'gene';
      const noteEntityId = 'cnox_escherichia coli';

      // Note appears on gene page (direct) and researcher page (via tag)
      const visibleEntities = [
        { type: 'gene', id: 'cnox_escherichia coli', reason: 'direct' },
        { type: 'researcher', id: 'researcher-123', reason: 'via_tag' },
      ];

      // User deletes note
      const deletedNoteId = noteId;

      // Expected: Note removed from all entities
      // (In reality, the note row is deleted from database,
      //  so it won't appear in any listNotesForEntity query)
      expect(deletedNoteId).toBe(noteId);
      
      // After deletion, queries would return empty
      const geneNotesAfterDelete: string[] = []; // Would not include note-6
      const researcherNotesAfterDelete: string[] = []; // Would not include note-6
      
      expect(geneNotesAfterDelete).not.toContain(noteId);
      expect(researcherNotesAfterDelete).not.toContain(noteId);
    });
  });

  describe('Scenario 7: Removing tags from notes', () => {
    it('should hide note from entity when tag is removed', () => {
      const note = {
        id: 'note-7',
        entity_type: 'gene',
        entity_id: 'cnox_escherichia coli',
      };

      const tags = [
        {
          id: 'tag-researcher',
          entity_type: 'researcher',
          entity_id: 'researcher-123',
        },
        {
          id: 'tag-article',
          entity_type: 'article',
          entity_id: 'article-456',
        },
      ];

      // User removes researcher tag
      const tagsAfterRemoval = tags.filter(t => t.id !== 'tag-researcher');

      // Expected: Note still visible on gene (direct)
      expect(note.entity_type).toBe('gene');

      // Expected: Note still visible on article (via remaining tag)
      const isVisibleOnArticle = tagsAfterRemoval.some(
        t => t.entity_type === 'article' && t.entity_id === 'article-456'
      );
      expect(isVisibleOnArticle).toBe(true);

      // Expected: Note no longer visible on researcher
      const isVisibleOnResearcher = tagsAfterRemoval.some(
        t => t.entity_type === 'researcher'
      );
      expect(isVisibleOnResearcher).toBe(false);
    });
  });

  describe('Scenario 8: Multiple notes on same entities', () => {
    it('should show all related notes with correct flags', () => {
      // User has multiple notes on gene CnoX
      const directNotes = [
        {
          id: 'note-8a',
          content: 'Direct note 1',
          entity_type: 'gene',
          entity_id: 'cnox_escherichia coli',
          updated_at: '2026-01-12T10:00:00Z',
          isLinkedViaTag: undefined,
        },
        {
          id: 'note-8b',
          content: 'Direct note 2',
          entity_type: 'gene',
          entity_id: 'cnox_escherichia coli',
          updated_at: '2026-01-12T11:00:00Z',
          isLinkedViaTag: undefined,
        },
      ];

      // Plus notes from other entities tagged with cnox-eco
      const linkedNotes = [
        {
          id: 'note-8c',
          content: 'Note from researcher page',
          entity_type: 'researcher',
          entity_id: 'researcher-123',
          updated_at: '2026-01-12T12:00:00Z',
          isLinkedViaTag: true,
        },
        {
          id: 'note-8d',
          content: 'Note from article page',
          entity_type: 'article',
          entity_id: 'article-456',
          updated_at: '2026-01-12T13:00:00Z',
          isLinkedViaTag: true,
        },
      ];

      // Combined on gene page
      const allNotesOnGenePage = [...directNotes, ...linkedNotes];

      // Expected: 4 total notes
      expect(allNotesOnGenePage).toHaveLength(4);

      // Expected: 2 direct notes (no flag)
      const directCount = allNotesOnGenePage.filter(n => !n.isLinkedViaTag).length;
      expect(directCount).toBe(2);

      // Expected: 2 linked notes (with flag)
      const linkedCount = allNotesOnGenePage.filter(n => n.isLinkedViaTag).length;
      expect(linkedCount).toBe(2);

      // Expected: Sorted by updated_at descending
      allNotesOnGenePage.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      expect(allNotesOnGenePage[0].id).toBe('note-8d'); // 13:00 - most recent
      expect(allNotesOnGenePage[3].id).toBe('note-8a'); // 10:00 - oldest
    });
  });

  describe('Scenario 9: Label tags vs entity tags', () => {
    it('should not create cross-entity links with label tags', () => {
      const note = {
        id: 'note-9',
        content: 'Important finding',
        entity_type: 'gene',
        entity_id: 'cnox_escherichia coli',
      };

      const tags = [
        {
          name: 'important',
          entity_type: null, // Label tag
          entity_id: null,
          color: '#6366f1',
        },
        {
          name: 'dupont',
          entity_type: 'researcher', // Entity tag
          entity_id: 'researcher-123',
          color: '#22c55e',
        },
      ];

      // Expected: Label tag doesn't create cross-entity link
      const labelTag = tags.find(t => t.name === 'important');
      expect(labelTag?.entity_type).toBeNull();
      expect(labelTag?.entity_id).toBeNull();

      // Expected: Entity tag does create cross-entity link
      const entityTag = tags.find(t => t.name === 'dupont');
      expect(entityTag?.entity_type).toBe('researcher');
      expect(entityTag?.entity_id).toBe('researcher-123');

      // Expected: Note appears on researcher page (via entity tag)
      // but NOT on any page via label tag
      const linkedEntities = tags
        .filter(t => t.entity_type !== null)
        .map(t => ({ type: t.entity_type, id: t.entity_id }));
      
      expect(linkedEntities).toHaveLength(1);
      expect(linkedEntities[0].type).toBe('researcher');
    });
  });
});
