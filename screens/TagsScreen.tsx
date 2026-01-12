/**
 * TagsScreen - Browse all tags and find related notes
 * Accessible from Settings or as a utility screen
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { Icon } from '../components/Icons';
import { listTags, deleteTag, getNotesForTag } from '../lib/knowledge';
import type { Tag, EntityNote } from '../types/knowledge';

type Props = NativeStackScreenProps<RootStackParamList, 'Tags'>;

export function TagsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [tagNotes, setTagNotes] = useState<EntityNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTags();
      setTags(data);
    } catch (e) {
      console.error('Error loading tags:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadNotesForTag = useCallback(async (tag: Tag) => {
    setSelectedTag(tag);
    setLoadingNotes(true);
    try {
      const notes = await getNotesForTag(tag.id);
      setTagNotes(notes);
    } catch (e) {
      console.error('Error loading notes for tag:', e);
      setTagNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  const handleDeleteTag = (tag: Tag) => {
    Alert.alert(
      'Supprimer le tag',
      `Voulez-vous supprimer le tag #${tag.name}? Il sera retiré de toutes les notes.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTag(tag.id);
              load();
              if (selectedTag?.id === tag.id) {
                setSelectedTag(null);
                setTagNotes([]);
              }
            } catch (e) {
              console.error('Error deleting tag:', e);
            }
          },
        },
      ]
    );
  };

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const navigateToEntity = (note: EntityNote) => {
    switch (note.entity_type) {
      case 'gene':
        const [symbol, organism] = note.entity_id.split('_');
        navigation.push('GeneDetail', { symbol, organism: organism || 'Escherichia coli' });
        break;
      case 'researcher':
        navigation.push('ResearcherDetail', { researcherId: note.entity_id });
        break;
      case 'article':
        navigation.push('ArticleDetail', { articleId: note.entity_id });
        break;
      case 'conference':
        navigation.push('ConferenceDetail', { conferenceId: note.entity_id });
        break;
    }
  };

  const getEntityLabel = (type: string) => {
    switch (type) {
      case 'gene': return 'Protéine';
      case 'researcher': return 'Chercheur';
      case 'article': return 'Article';
      case 'conference': return 'Conférence';
      default: return type;
    }
  };

  const renderTag = ({ item }: { item: Tag }) => (
    <Pressable
      style={[
        styles.tagItem,
        { 
          backgroundColor: selectedTag?.id === item.id ? colors.accent + '20' : colors.surface,
          borderColor: selectedTag?.id === item.id ? colors.accent : colors.borderHairline,
        },
      ]}
      onPress={() => loadNotesForTag(item)}
      onLongPress={() => handleDeleteTag(item)}
    >
      <Text style={[styles.tagName, { color: selectedTag?.id === item.id ? colors.accent : colors.text }]}>
        #{item.name}
      </Text>
    </Pressable>
  );

  const renderNote = ({ item }: { item: EntityNote }) => (
    <Pressable
      style={[styles.noteItem, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
      onPress={() => navigateToEntity(item)}
    >
      <View style={[styles.entityBadge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.entityType, { color: colors.textMuted }]}>
          {getEntityLabel(item.entity_type)}
        </Text>
      </View>
      <Text style={[styles.noteContent, { color: colors.text }]} numberOfLines={3}>
        {item.content}
      </Text>
      <View style={styles.noteTags}>
        {item.tags?.map((tag) => (
          <Text key={tag.id} style={[styles.noteTag, { color: colors.accent }]}>
            #{tag.name}
          </Text>
        ))}
      </View>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tags</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
        <Icon name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Rechercher un tag..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Tags List */}
      <View style={styles.tagsSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} style={styles.loader} />
        ) : (
          <FlatList
            data={filteredTags}
            keyExtractor={(item) => item.id}
            renderItem={renderTag}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsList}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {search ? 'Aucun tag trouvé' : 'Aucun tag créé'}
              </Text>
            }
          />
        )}
      </View>

      {/* Notes for Selected Tag */}
      {selectedTag && (
        <View style={styles.notesSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Notes avec #{selectedTag.name}
          </Text>
          {loadingNotes ? (
            <ActivityIndicator size="small" color={colors.accent} style={styles.loader} />
          ) : (
            <FlatList
              data={tagNotes}
              keyExtractor={(item) => item.id}
              renderItem={renderNote}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Aucune note avec ce tag
                </Text>
              }
            />
          )}
        </View>
      )}

      {!selectedTag && (
        <View style={styles.placeholder}>
          <Icon name="tag" size={32} color={colors.textMuted} />
          <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
            Sélectionnez un tag pour voir les notes associées
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: { padding: spacing.sm },
  backIcon: { fontSize: 24, fontWeight: '300' },
  headerTitle: { flex: 1, ...typography.body, fontWeight: '600', textAlign: 'center' },
  
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.sm,
  },
  
  tagsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  tagsList: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  tagName: {
    ...typography.body,
    fontWeight: '500',
  },
  
  notesSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  noteItem: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  entityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  entityType: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteContent: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  noteTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  noteTag: {
    ...typography.caption,
  },
  
  loader: {
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    padding: spacing.lg,
  },
  
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  placeholderText: {
    ...typography.body,
    textAlign: 'center',
  },
});
