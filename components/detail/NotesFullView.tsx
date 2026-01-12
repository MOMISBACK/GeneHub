/**
 * NotesFullView - Full screen notes view for detail screens
 * Displays all notes in a scrollable list with creation capabilities
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
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
} from '../../lib/knowledge';

interface Props {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  notes: EntityNote[];
  onRefresh: () => void;
  loading?: boolean;
}

export function NotesFullView({ entityType, entityId, entityName, notes, onRefresh, loading }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTagModal, setShowTagModal] = useState<string | null>(null);

  // Format tag display name - tags are already properly formatted
  const getTagDisplayName = (tag: Tag): string => {
    return tag.name;
  };

  // Navigate to entity when clicking on a linked tag
  const handleTagPress = (tag: Tag) => {
    if (!tag.entity_type || !tag.entity_id) {
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
    Alert.alert(
      'Supprimer',
      'Supprimer cette note ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteNote(noteId);
              onRefresh();
            } catch (e) {
              console.error('Error deleting note:', e);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }, [onRefresh]);

  // Start editing
  const startEdit = (note: EntityNote) => {
    setEditingNoteId(note.id);
    setEditText(note.content);
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
      return d.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderNote = ({ item: note }: { item: EntityNote }) => (
    <View style={[
      styles.noteCard, 
      { backgroundColor: colors.surface, borderColor: colors.borderHairline },
      note.isLinkedViaTag && [styles.linkedNote, { borderLeftColor: colors.accent }]
    ]}>
      {/* Indicateur pour les notes liées via tag */}
      {note.isLinkedViaTag && (
        <View style={[styles.linkedBadge, { backgroundColor: colors.accent + '15' }]}>
          <Icon name="link" size={10} color={colors.accent} />
          <Text style={[styles.linkedBadgeText, { color: colors.accent }]}>
            Liée via tag
          </Text>
        </View>
      )}
      
      {editingNoteId === note.id ? (
        // Edit mode
        <View style={styles.editContainer}>
          <TextInput
            style={[styles.editInput, { color: colors.text, borderColor: colors.borderHairline, backgroundColor: colors.bg }]}
            value={editText}
            onChangeText={setEditText}
            multiline
            autoFocus
          />
          <View style={styles.editActions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              onPress={() => handleUpdateNote(note.id)}
            >
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Sauver</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.bg }]}
              onPress={() => setEditingNoteId(null)}
            >
              <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        // View mode
        <>
          <Text style={[styles.noteContent, { color: colors.text }]}>{note.content}</Text>
          
          {/* Tags */}
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
                  #{getTagDisplayName(tag)}
                </Text>
              </Pressable>
            ))}
            
            {/* Add tag button - opens modal directly */}
            <Pressable
              style={[styles.addTagBtn, { borderColor: colors.borderHairline }]}
              onPress={() => setShowTagModal(note.id)}
            >
              <Text style={[styles.addTagText, { color: colors.textMuted }]}>+ tag</Text>
            </Pressable>
          </View>

          {/* Date and actions */}
          <View style={styles.noteFooter}>
            <Text style={[styles.noteDate, { color: colors.textMuted }]}>
              {formatDate(note.created_at)}
            </Text>
            <View style={styles.noteActions}>
              <Pressable onPress={() => startEdit(note)} style={styles.iconBtn} hitSlop={8}>
                <Icon name="edit" size={14} color={colors.textMuted} />
              </Pressable>
              <Pressable onPress={() => handleDeleteNote(note.id)} style={styles.iconBtn} hitSlop={8}>
                <Icon name="trash" size={14} color={colors.error} />
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tag Create Modal */}
      <TagCreateModal
        visible={!!showTagModal}
        onClose={() => setShowTagModal(null)}
        onCreated={handleTagCreated}
      />

      {/* Add note input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Écrire une nouvelle note..."
          placeholderTextColor={colors.textMuted}
          value={newNoteText}
          onChangeText={setNewNoteText}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[
            styles.addNoteBtn,
            { backgroundColor: newNoteText.trim() ? colors.accent : colors.bg },
          ]}
          onPress={handleAddNote}
          disabled={!newNoteText.trim() || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="add" size={20} color={newNoteText.trim() ? '#fff' : colors.textMuted} />
          )}
        </Pressable>
      </View>

      {/* Notes list */}
      {notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="notes" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Aucune note
          </Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Commencez à prendre des notes sur {entityName}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(note) => note.id}
          renderItem={renderNote}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 80,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addNoteBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
  },
  emptyTitle: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  noteCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noteContent: {
    ...typography.body,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: 4,
  },
  tagText: {
    ...typography.caption,
    fontWeight: '500',
  },
  addTagBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addTagText: {
    ...typography.caption,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  noteDate: {
    ...typography.caption,
  },
  noteActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconBtn: {
    padding: 4,
  },
  editContainer: {
    gap: spacing.sm,
  },
  editInput: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  actionBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  // Styles pour les notes liées via tag
  linkedNote: {
    borderLeftWidth: 3,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  linkedBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '500',
  },
});
