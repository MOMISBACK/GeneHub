/**
 * NotesSection - Section de notes avec tags pour les écrans de détail
 * Tags cliquables : naviguent vers l'entité liée
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme, typography, spacing, radius } from '../../theme';
import { Icon } from '../Icons';
import { TagCreateModal } from '../tags';
import type { EntityNote, Tag, EntityType } from '../../types/knowledge';
import type { RootStackParamList } from '../../navigation/types';
import {
  createNote,
  updateNote,
  deleteNote,
  addTagToNote,
  removeTagFromNote,
  listTags,
} from '../../lib/knowledge';

interface Props {
  entityType: EntityType;
  entityId: string;
  notes: EntityNote[];
  onRefresh: () => void;
  loading?: boolean;
}

export function NotesSection({ entityType, entityId, notes, onRefresh, loading }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [newNoteText, setNewNoteText] = useState('');
  const [newTagText, setNewTagText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTagInput, setShowTagInput] = useState<string | null>(null);
  const [showTagModal, setShowTagModal] = useState<string | null>(null); // noteId to add tag to
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  // Navigate to entity when clicking on a linked tag
  const handleTagPress = (tag: Tag) => {
    if (!tag.entity_type || !tag.entity_id) {
      // Simple label tag - go to tags screen
      navigation.push('Tags');
      return;
    }

    switch (tag.entity_type) {
      case 'gene':
        const [symbol, organism] = tag.entity_id.includes('_') 
          ? tag.entity_id.split('_') 
          : [tag.entity_id, 'Escherichia coli'];
        navigation.push('GeneDetail', { symbol, organism });
        break;
      case 'researcher':
        navigation.push('ResearcherDetail', { researcherId: tag.entity_id });
        break;
      case 'article':
        navigation.push('ArticleDetail', { articleId: tag.entity_id });
        break;
      case 'conference':
        navigation.push('ConferenceDetail', { conferenceId: tag.entity_id });
        break;
    }
  };

  // Add new note
  const handleAddNote = useCallback(async () => {
    if (!newNoteText.trim()) return;
    setSaving(true);
    try {
      await createNote({
        entity_type: entityType,
        entity_id: entityId,
        content: newNoteText.trim(),
      });
      setNewNoteText('');
      onRefresh();
    } catch (e) {
      console.error('Error creating note:', e);
    } finally {
      setSaving(false);
    }
  }, [newNoteText, entityType, entityId, onRefresh]);

  // Update note
  const handleUpdateNote = useCallback(async (noteId: string) => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await updateNote(noteId, editText.trim());
      setEditingNoteId(null);
      setEditText('');
      onRefresh();
    } catch (e) {
      console.error('Error updating note:', e);
    } finally {
      setSaving(false);
    }
  }, [editText, onRefresh]);

  // Delete note
  const handleDeleteNote = useCallback(async (noteId: string) => {
    setSaving(true);
    try {
      await deleteNote(noteId);
      onRefresh();
    } catch (e) {
      console.error('Error deleting note:', e);
    } finally {
      setSaving(false);
    }
  }, [onRefresh]);

  // Start editing
  const startEdit = (note: EntityNote) => {
    setEditingNoteId(note.id);
    setEditText(note.content);
  };

  // Load available tags
  const loadTags = useCallback(async () => {
    try {
      const tags = await listTags();
      setAvailableTags(tags);
    } catch (e) {
      console.error('Error loading tags:', e);
    }
  }, []);

  // Show tag input for a note
  const openTagInput = (noteId: string) => {
    setShowTagInput(noteId);
    setNewTagText('');
    loadTags();
  };

  // Open tag create modal
  const openTagModal = (noteId: string) => {
    setShowTagModal(noteId);
  };

  // Handle tag created from modal
  const handleTagCreated = async (tag: Tag) => {
    if (!showTagModal) return;
    setSaving(true);
    try {
      await addTagToNote(showTagModal, tag.id);
      setShowTagModal(null);
      onRefresh();
    } catch (e) {
      console.error('Error adding tag to note:', e);
    } finally {
      setSaving(false);
    }
  };

  // Add existing tag to note
  const handleAddExistingTag = useCallback(async (noteId: string, tag: Tag) => {
    setSaving(true);
    try {
      await addTagToNote(noteId, tag.id);
      setShowTagInput(null);
      onRefresh();
    } catch (e) {
      console.error('Error adding tag:', e);
    } finally {
      setSaving(false);
    }
  }, [onRefresh]);

  // Remove tag from note
  const handleRemoveTag = useCallback(async (noteId: string, tagId: string) => {
    setSaving(true);
    try {
      await removeTagFromNote(noteId, tagId);
      onRefresh();
    } catch (e) {
      console.error('Error removing tag:', e);
    } finally {
      setSaving(false);
    }
  }, [onRefresh]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* Tag Create Modal */}
      <TagCreateModal
        visible={!!showTagModal}
        onClose={() => setShowTagModal(null)}
        onCreated={handleTagCreated}
      />

      {/* Header */}
      <View style={styles.header}>
        <Icon name="notes" size={16} color={colors.text} />
        <Text style={[styles.title, { color: colors.text }]}>Notes</Text>
        {loading && <ActivityIndicator size="small" color={colors.accent} />}
      </View>

      {/* Add note input */}
      <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Ajouter une note..."
          placeholderTextColor={colors.textMuted}
          value={newNoteText}
          onChangeText={setNewNoteText}
          multiline
          maxLength={1000}
        />
        <Pressable
          style={[
            styles.addBtn,
            { backgroundColor: newNoteText.trim() ? colors.accent : colors.bg },
          ]}
          onPress={handleAddNote}
          disabled={!newNoteText.trim() || saving}
        >
          <Text style={[styles.addBtnText, { color: newNoteText.trim() ? colors.buttonPrimaryText : colors.textMuted }]}>
            +
          </Text>
        </Pressable>
      </View>

      {/* Notes list */}
      {notes.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Aucune note pour le moment
        </Text>
      ) : (
        notes.map((note) => (
          <View
            key={note.id}
            style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
          >
            {editingNoteId === note.id ? (
              // Edit mode
              <View style={styles.editContainer}>
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.borderHairline }]}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  autoFocus
                />
                <View style={styles.editActions}>
                  <Pressable
                    style={[styles.editBtn, { backgroundColor: colors.accent }]}
                    onPress={() => handleUpdateNote(note.id)}
                  >
                    <Text style={[styles.editBtnText, { color: colors.buttonPrimaryText }]}>Sauver</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.editBtn, { backgroundColor: colors.bg }]}
                    onPress={() => setEditingNoteId(null)}
                  >
                    <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>Annuler</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              // View mode
              <>
                <Text style={[styles.noteContent, { color: colors.text }]}>{note.content}</Text>
                
                {/* Tags - Cliquables pour naviguer */}
                <View style={styles.tagsRow}>
                  {note.tags?.map((tag) => (
                    <Pressable
                      key={tag.id}
                      style={[
                        styles.tag, 
                        { 
                          backgroundColor: (tag.color || colors.accent) + '20', 
                          borderColor: tag.color || colors.accent,
                        }
                      ]}
                      onPress={() => handleTagPress(tag)}
                      onLongPress={() => handleRemoveTag(note.id, tag.id)}
                    >
                      {tag.entity_type && (
                        <Icon 
                          name={tag.entity_type === 'gene' ? 'dna' : tag.entity_type === 'researcher' ? 'people' : tag.entity_type === 'article' ? 'doc' : 'calendar'} 
                          size={10} 
                          color={tag.color || colors.accent} 
                        />
                      )}
                      <Text style={[styles.tagText, { color: tag.color || colors.accent }]}>
                        #{tag.name}
                      </Text>
                    </Pressable>
                  ))}
                  
                  {/* Add tag buttons */}
                  {showTagInput === note.id ? (
                    <View style={styles.tagInputRow}>
                      {/* Quick select existing tags */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.existingTags}>
                        {availableTags
                          .filter((t) => !note.tags?.some((nt) => nt.id === t.id))
                          .slice(0, 5)
                          .map((tag) => (
                            <Pressable
                              key={tag.id}
                              style={[styles.suggestionTag, { backgroundColor: colors.bg }]}
                              onPress={() => handleAddExistingTag(note.id, tag)}
                            >
                              <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                                #{tag.name}
                              </Text>
                            </Pressable>
                          ))}
                      </ScrollView>
                      {/* Create new tag button */}
                      <Pressable
                        style={[styles.newTagBtn, { backgroundColor: colors.accent }]}
                        onPress={() => {
                          setShowTagInput(null);
                          openTagModal(note.id);
                        }}
                      >
                        <Text style={[styles.newTagText, { color: colors.buttonPrimaryText }]}>+ Nouveau</Text>
                      </Pressable>
                      <Pressable onPress={() => setShowTagInput(null)} style={styles.closeTagInput}>
                        <Icon name="close" size={14} color={colors.textMuted} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={[styles.addTagBtn, { borderColor: colors.borderHairline }]}
                      onPress={() => openTagInput(note.id)}
                    >
                      <Icon name="tag" size={12} color={colors.textMuted} />
                      <Text style={[styles.addTagText, { color: colors.textMuted }]}>+</Text>
                    </Pressable>
                  )}
                </View>

                {/* Note footer */}
                <View style={styles.noteFooter}>
                  <Text style={[styles.noteDate, { color: colors.textMuted }]}>
                    {formatDate(note.updated_at)}
                  </Text>
                  <View style={styles.noteActions}>
                    <Pressable style={styles.actionBtn} onPress={() => startEdit(note)}>
                      <Icon name="pencil" size={14} color={colors.textMuted} />
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => handleDeleteNote(note.id)}>
                      <Icon name="trash" size={14} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.body,
    minHeight: 40,
    maxHeight: 100,
    padding: spacing.sm,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 20,
    fontWeight: '300',
  },

  emptyText: {
    ...typography.bodySmall,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },

  noteCard: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  noteContent: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  tagText: {
    ...typography.caption,
    fontWeight: '500',
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  addTagText: {
    ...typography.caption,
  },

  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    flex: 1,
  },
  existingTags: {
    flexGrow: 0,
    flexShrink: 1,
  },
  suggestionTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginRight: spacing.xs,
  },
  suggestionText: {
    ...typography.caption,
  },
  newTagBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  newTagText: {
    ...typography.caption,
    fontWeight: '600',
  },
  closeTagInput: {
    padding: spacing.xs,
  },

  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteDate: {
    ...typography.caption,
  },
  noteActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    padding: spacing.xs,
  },

  editContainer: {
    gap: spacing.sm,
  },
  editInput: {
    ...typography.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minHeight: 60,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  editBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  editBtnText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
});
