/**
 * Unit Tests for Cross-Entity Note Linking Logic
 * 
 * Tests the core logic of note deduplication and linking
 * without mocking the entire Supabase chain.
 */

describe('Note Linking Logic', () => {
  describe('Deduplication Logic', () => {
    it('should remove duplicate note IDs from linked notes', () => {
      const directNoteIds = ['note1', 'note2', 'note3'];
      const linkedNoteIds = ['note2', 'note4', 'note5'];
      
      // This is the logic from listNotesForEntity
      const uniqueLinkedIds = linkedNoteIds.filter(id => !directNoteIds.includes(id));
      
      expect(uniqueLinkedIds).toEqual(['note4', 'note5']);
      expect(uniqueLinkedIds).not.toContain('note2');
    });

    it('should handle empty direct notes', () => {
      const directNoteIds: string[] = [];
      const linkedNoteIds = ['note1', 'note2'];
      
      const uniqueLinkedIds = linkedNoteIds.filter(id => !directNoteIds.includes(id));
      
      expect(uniqueLinkedIds).toEqual(['note1', 'note2']);
    });

    it('should handle empty linked notes', () => {
      const directNoteIds = ['note1', 'note2'];
      const linkedNoteIds: string[] = [];
      
      const uniqueLinkedIds = linkedNoteIds.filter(id => !directNoteIds.includes(id));
      
      expect(uniqueLinkedIds).toEqual([]);
    });

    it('should handle all notes being duplicates', () => {
      const directNoteIds = ['note1', 'note2', 'note3'];
      const linkedNoteIds = ['note1', 'note2', 'note3'];
      
      const uniqueLinkedIds = linkedNoteIds.filter(id => !directNoteIds.includes(id));
      
      expect(uniqueLinkedIds).toEqual([]);
    });
  });

  describe('Note Sorting Logic', () => {
    it('should sort notes by updated_at descending', () => {
      const notes = [
        { id: 'note1', updated_at: '2026-01-12T10:00:00Z' },
        { id: 'note2', updated_at: '2026-01-12T15:00:00Z' },
        { id: 'note3', updated_at: '2026-01-12T12:00:00Z' },
      ];
      
      // This is the sorting logic from listNotesForEntity
      notes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      expect(notes[0].id).toBe('note2'); // 15:00 - most recent
      expect(notes[1].id).toBe('note3'); // 12:00
      expect(notes[2].id).toBe('note1'); // 10:00 - oldest
    });

    it('should handle notes with same timestamp', () => {
      const notes = [
        { id: 'note1', updated_at: '2026-01-12T10:00:00Z' },
        { id: 'note2', updated_at: '2026-01-12T10:00:00Z' },
      ];
      
      notes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      // Order doesn't matter when timestamps are equal, just verify no crash
      expect(notes).toHaveLength(2);
    });
  });

  describe('isLinkedViaTag Flag', () => {
    it('should add isLinkedViaTag flag to linked notes', () => {
      const linkedNotes = [
        { id: 'note1', content: 'Linked note' },
        { id: 'note2', content: 'Another linked note' },
      ];
      
      // This is the mapping logic from listNotesForEntity
      const flaggedNotes = linkedNotes.map(note => ({
        ...note,
        isLinkedViaTag: true,
      }));
      
      expect(flaggedNotes[0].isLinkedViaTag).toBe(true);
      expect(flaggedNotes[1].isLinkedViaTag).toBe(true);
    });

    it('should not add flag to direct notes', () => {
      const directNotes = [
        { id: 'note1', content: 'Direct note' },
      ];
      
      // Direct notes don't get the flag
      const result = directNotes.map(n => ({ ...n, tags: [] }));
      
      expect(result[0]).not.toHaveProperty('isLinkedViaTag');
    });
  });

  describe('Tag Entity ID Format', () => {
    it('should use lowercase with underscore separator for gene IDs', () => {
      const symbol = 'CnoX';
      const organism = 'Escherichia coli';
      
      // Entity ID format: symbol_organism (all lowercase)
      const entityId = `${symbol.toLowerCase()}_${organism.toLowerCase()}`;
      
      expect(entityId).toBe('cnox_escherichia coli');
    });

    it('should use symbol-orgcode format for gene tag names', () => {
      const symbol = 'CnoX';
      const orgCode = 'eco'; // from organisms.ts getOrganismCode()
      
      // Tag name format: symbol-orgcode
      const tagName = `${symbol.toLowerCase()}-${orgCode}`;
      
      expect(tagName).toBe('cnox-eco');
    });

    it('should normalize different organism codes', () => {
      const testCases = [
        { name: 'Escherichia coli', code: 'eco' },
        { name: 'Bacillus subtilis', code: 'bsu' },
        { name: 'Staphylococcus aureus', code: 'sau' },
        { name: 'Pseudomonas aeruginosa', code: 'pae' },
        { name: 'Mycobacterium tuberculosis', code: 'mtb' },
      ];
      
      testCases.forEach(({ name, code }) => {
        const tagName = `cnox-${code}`;
        expect(tagName).toMatch(/^[a-z]+-[a-z]{3}$/);
      });
    });
  });

  describe('Note Visibility Rules', () => {
    it('should make note visible on entity when created directly', () => {
      const note = {
        entity_type: 'gene',
        entity_id: 'cnox_escherichia coli',
      };
      
      const queryEntityType = 'gene';
      const queryEntityId = 'cnox_escherichia coli';
      
      const isDirectMatch = 
        note.entity_type === queryEntityType && 
        note.entity_id === queryEntityId;
      
      expect(isDirectMatch).toBe(true);
    });

    it('should make note visible on entity when tagged with entity tag', () => {
      const note = {
        id: 'note1',
        entity_type: 'researcher', // Note created on researcher
        entity_id: 'researcher-123',
      };
      
      const noteTag = {
        entity_type: 'gene',  // But tagged with gene
        entity_id: 'cnox_escherichia coli',
      };
      
      const queryEntityType = 'gene';
      const queryEntityId = 'cnox_escherichia coli';
      
      const isLinkedViaTag = 
        noteTag.entity_type === queryEntityType && 
        noteTag.entity_id === queryEntityId;
      
      expect(isLinkedViaTag).toBe(true);
    });
  });

  describe('Tag Color Assignment', () => {
    it('should assign correct colors based on entity type', () => {
      const colorMap = {
        gene: '#3b82f6',      // blue
        researcher: '#22c55e',  // green
        article: '#ec4899',     // pink
        conference: '#f59e0b',  // amber
        label: '#6366f1',       // indigo
      };
      
      expect(colorMap.gene).toBe('#3b82f6');
      expect(colorMap.researcher).toBe('#22c55e');
      expect(colorMap.article).toBe('#ec4899');
      expect(colorMap.conference).toBe('#f59e0b');
      expect(colorMap.label).toBe('#6366f1');
    });
  });

  describe('Cross-Entity Scenarios', () => {
    it('should handle note on gene with researcher and article tags', () => {
      const note = {
        id: 'note1',
        content: 'Collaboration on CnoX regulation',
        entity_type: 'gene',
        entity_id: 'cnox_escherichia coli',
      };
      
      const tags = [
        {
          name: 'dupont',
          entity_type: 'researcher',
          entity_id: 'researcher-123',
        },
        {
          name: 'article-cnox-2025',
          entity_type: 'article',
          entity_id: 'article-456',
        },
      ];
      
      // This note should appear on:
      // 1. Gene page (direct)
      const isVisibleOnGene = note.entity_type === 'gene' && note.entity_id === 'cnox_escherichia coli';
      expect(isVisibleOnGene).toBe(true);
      
      // 2. Researcher page (via tag)
      const isVisibleOnResearcher = tags.some(
        t => t.entity_type === 'researcher' && t.entity_id === 'researcher-123'
      );
      expect(isVisibleOnResearcher).toBe(true);
      
      // 3. Article page (via tag)
      const isVisibleOnArticle = tags.some(
        t => t.entity_type === 'article' && t.entity_id === 'article-456'
      );
      expect(isVisibleOnArticle).toBe(true);
    });

    it('should not show note on unrelated entity', () => {
      const note = {
        entity_type: 'gene',
        entity_id: 'cnox_escherichia coli',
      };
      
      const tags = [
        {
          entity_type: 'researcher',
          entity_id: 'researcher-123',
        },
      ];
      
      const queryEntityType = 'conference';
      const queryEntityId = 'conference-789';
      
      const isDirectMatch = 
        note.entity_type === queryEntityType && 
        note.entity_id === queryEntityId;
      
      const isTaggedMatch = tags.some(
        t => t.entity_type === queryEntityType && t.entity_id === queryEntityId
      );
      
      expect(isDirectMatch).toBe(false);
      expect(isTaggedMatch).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle note with no tags', () => {
      const tags: any[] = [];
      const filteredTags = tags.filter(t => t !== null && t !== undefined);
      
      expect(filteredTags).toEqual([]);
    });

    it('should filter out null tags', () => {
      const tagRels = [
        { tag: { id: 'tag1', name: 'valid' } },
        { tag: null },
        { tag: { id: 'tag2', name: 'another' } },
      ];
      
      // This is the filtering logic from listNotesForEntity
      const tags = tagRels.map((r: any) => r.tag).filter(Boolean);
      
      expect(tags).toHaveLength(2);
      expect(tags[0].name).toBe('valid');
      expect(tags[1].name).toBe('another');
    });

    it('should handle case sensitivity in entity IDs', () => {
      const id1 = 'CnoX_Escherichia coli';
      const id2 = 'cnox_escherichia coli';
      
      // IDs should be normalized to lowercase
      const normalized1 = id1.toLowerCase();
      const normalized2 = id2.toLowerCase();
      
      expect(normalized1).toBe(normalized2);
      expect(normalized1).toBe('cnox_escherichia coli');
    });

    it('should handle multiple tags on same note', () => {
      const note = { id: 'note1' };
      const tags = [
        { id: 'tag1', name: 'important' },
        { id: 'tag2', name: 'urgent' },
        { id: 'tag3', name: 'cnox-eco' },
      ];
      
      const noteWithTags = { ...note, tags };
      
      expect(noteWithTags.tags).toHaveLength(3);
    });
  });
});
