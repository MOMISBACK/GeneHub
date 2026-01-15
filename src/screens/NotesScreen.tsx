/**
 * NotesScreen - All notes across all entities
 */

import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList, MainTabsParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { useI18n } from '../i18n';
import { Icon } from '../components/Icons';
import { listAllNotes, getNotesCountByEntityType, createNoteForEntity } from '../lib/knowledge/notes.service';
import { addTagToNote } from '../lib/knowledge/tags.service';
import type { EntityNote, EntityType } from '../types/knowledge';
import type { Tag } from '../types/knowledge';
import { TagSelectorInline } from '../components/inbox/TagSelectorInline';
import { showAlert, showSuccess } from '../lib/alert';
import { TagCreateModal } from '../components/tags/TagCreateModal';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Notes'>,
  NativeStackScreenProps<RootStackParamList>
>;

// Entity type display config
const ENTITY_CONFIG: Record<EntityType, { label: string; icon: string; color: string }> = {
  gene: { label: 'Gène', icon: '⧬', color: '#4C8B98' },
  researcher: { label: 'Chercheur', icon: '◉', color: '#7B68EE' },
  article: { label: 'Article', icon: '▤', color: '#D4AF37' },
  conference: { label: 'Conférence', icon: '▦', color: '#20B2AA' },
};

export function NotesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [notes, setNotes] = useState<EntityNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all');
  const [quickText, setQuickText] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagRefreshKey, setTagRefreshKey] = useState(0);
  const [counts, setCounts] = useState<Record<EntityType, number>>({
    gene: 0,
    researcher: 0,
    article: 0,
    conference: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [notesData, countsData] = await Promise.all([
        listAllNotes(),
        getNotesCountByEntityType(),
      ]);
      setNotes(notesData);
      setCounts(countsData);
    } catch (e: any) {
      if (!e.message?.includes('does not exist')) {
        setError(e.message);
      }
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [load, navigation]);

  const handleQuickAdd = useCallback(async () => {
    const trimmed = quickText.trim();
    if (!trimmed) return;

    const entityLinkedTags = selectedTags.filter(t => t.entity_type && t.entity_id);
    if (entityLinkedTags.length === 0) {
      showAlert('Ajoutez un tag lié', 'Sélectionnez au moins un tag lié à une fiche.');
      return;
    }

    setAdding(true);
    try {
      let createdCount = 0;

      for (const tag of entityLinkedTags) {
        const note = await createNoteForEntity(
          tag.entity_type as EntityType,
          tag.entity_id as string,
          trimmed
        );

        for (const t of selectedTags) {
          await addTagToNote(note.id, t.id);
        }

        createdCount++;
      }

      if (createdCount > 0) {
        showSuccess('Note créée', `Ajoutée à ${createdCount} fiche(s).`);
        setQuickText('');
        setSelectedTags([]);
        load();
      }
    } finally {
      setAdding(false);
    }
  }, [quickText, selectedTags, load]);

  // Filter and search
  const filteredNotes = notes.filter(note => {
    // Type filter
    if (filterType !== 'all' && note.entity_type !== filterType) {
      return false;
    }
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        note.content.toLowerCase().includes(query) ||
        note.entity_id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  // Navigate to entity detail
  const handleNotePress = useCallback((note: EntityNote) => {
    switch (note.entity_type) {
      case 'gene':
        // Gene notes store "symbol_organism" in entity_id (lowercase)
        const [symbol, organism] = note.entity_id.split('_');
        navigation.navigate('GeneDetail', { symbol, organism: organism || 'Escherichia coli' });
        break;
      case 'researcher':
        navigation.navigate('ResearcherDetail', { researcherId: note.entity_id });
        break;
      case 'article':
        navigation.navigate('ArticleDetail', { articleId: note.entity_id });
        break;
      case 'conference':
        navigation.navigate('ConferenceDetail', { conferenceId: note.entity_id });
        break;
    }
  }, [navigation]);

  const renderNote = useCallback(({ item }: { item: EntityNote }) => {
    const config = ENTITY_CONFIG[item.entity_type];
    
    return (
      <Pressable
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
        onPress={() => handleNotePress(item)}
      >
        {/* Entity type badge */}
        <View style={[styles.typeBadge, { backgroundColor: config.color + '20' }]}>
          <Text style={[styles.typeBadgeIcon, { color: config.color }]}>
            {config.icon}
          </Text>
        </View>
        
        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardText, { color: colors.text }]} numberOfLines={3}>
            {item.content}
          </Text>
          
          {/* Meta row */}
          <View style={styles.metaRow}>
            <Text style={[styles.entityType, { color: config.color }]}>
              {config.label}
            </Text>
            <Text style={[styles.entityId, { color: colors.textMuted }]}>
              {item.entity_id.length > 20 
                ? item.entity_id.slice(0, 20) + '...' 
                : item.entity_id}
            </Text>
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {formatDate(item.updated_at)}
            </Text>
          </View>
          
          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.slice(0, 3).map((tag: any) => (
                <View 
                  key={tag.id} 
                  style={[styles.tag, { backgroundColor: (tag.color || colors.accent) + '20' }]}
                >
                  <Text style={[styles.tagText, { color: tag.color || colors.accent }]}>
                    #{tag.name}
                  </Text>
                </View>
              ))}
              {item.tags.length > 3 && (
                <Text style={[styles.moreTagsText, { color: colors.textMuted }]}>
                  +{item.tags.length - 3}
                </Text>
              )}
            </View>
          )}
        </View>
        
        <Icon name="chevronRight" size={14} color={colors.textMuted} />
      </Pressable>
    );
  }, [colors, handleNotePress]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.text }]}>Mes Notes</Text>
          <View style={styles.headerBadge}>
            <Text style={[styles.headerBadgeText, { color: colors.accent }]}>
              {totalCount}
            </Text>
          </View>
        </View>

        {/* Quick capture */}
        <View style={[styles.quickCapture, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
        >
          <TextInput
            style={[styles.quickInput, { color: colors.text }]}
            placeholder="Capture rapide…"
            placeholderTextColor={colors.textMuted}
            value={quickText}
            onChangeText={setQuickText}
            multiline
          />
          <View style={styles.quickActions}>
            <TagSelectorInline
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              refreshKey={tagRefreshKey}
            />
            <Pressable
              style={[styles.quickTagBtn, { backgroundColor: colors.bg, borderColor: colors.borderHairline }]}
              onPress={() => setShowTagModal(true)}
            >
              <Icon name="tag" size={14} color={colors.textMuted} />
              <Text style={[styles.quickTagText, { color: colors.textMuted }]}>Nouveau tag</Text>
            </Pressable>
            <Pressable
              style={[styles.quickAddBtn, { backgroundColor: quickText.trim() ? colors.accent : colors.bg }]}
              onPress={handleQuickAdd}
              disabled={!quickText.trim() || adding}
            >
              {adding ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={[styles.quickAddText, { color: quickText.trim() ? '#000' : colors.textMuted }]}>Ajouter</Text>
              )}
            </Pressable>
          </View>
        </View>
        
        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
          <Icon name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher dans les notes..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Icon name="close" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        
        {/* Filter chips */}
        <View style={styles.filterRow}>
          <Pressable
            style={[
              styles.filterChip,
              filterType === 'all' && { backgroundColor: colors.accent },
              filterType !== 'all' && { backgroundColor: colors.surface, borderColor: colors.borderHairline, borderWidth: 1 },
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[
              styles.filterChipText,
              { color: filterType === 'all' ? '#fff' : colors.text },
            ]}>
              Tous ({totalCount})
            </Text>
          </Pressable>
          
          {(Object.keys(ENTITY_CONFIG) as EntityType[]).map(type => (
            <Pressable
              key={type}
              style={[
                styles.filterChip,
                filterType === type && { backgroundColor: ENTITY_CONFIG[type].color },
                filterType !== type && { backgroundColor: colors.surface, borderColor: colors.borderHairline, borderWidth: 1 },
              ]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[
                styles.filterChipText,
                { color: filterType === type ? '#fff' : colors.text },
              ]}>
                {ENTITY_CONFIG[type].icon} {counts[type]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <TagCreateModal
        visible={showTagModal}
        onClose={() => setShowTagModal(false)}
        onCreated={(tag) => {
          setSelectedTags((prev) => {
            if (prev.some(t => t.id === tag.id)) return prev;
            return [...prev, tag];
          });
          setTagRefreshKey((prev) => prev + 1);
          setShowTagModal(false);
        }}
      />

      {/* Content */}
      {loading && notes.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: colors.accent }]} onPress={load}>
            <Text style={styles.retryBtnText}>{t.common.retry}</Text>
          </Pressable>
        </View>
      ) : filteredNotes.length === 0 ? (
        <View style={styles.center}>
          <Icon name="note" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchQuery || filterType !== 'all' ? 'Aucun résultat' : 'Aucune note'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {searchQuery || filterType !== 'all' 
              ? 'Essayez un autre filtre ou recherche'
              : 'Ajoutez des notes sur les gènes, chercheurs, articles...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          renderItem={renderNote}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} colors={[colors.accent]} />
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  quickCapture: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  quickInput: {
    ...typography.body,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  quickActions: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  quickTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quickTagText: {
    ...typography.caption,
  },
  quickAddBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  quickAddText: {
    ...typography.body,
    fontWeight: '600',
  },
  title: {
    ...typography.h1,
    flex: 1,
  },
  headerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  headerBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  filterChipText: {
    ...typography.caption,
    fontWeight: '500',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  retryBtnText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
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
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  typeBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeIcon: {
    fontSize: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardText: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  entityType: {
    ...typography.caption,
    fontWeight: '600',
  },
  entityId: {
    ...typography.caption,
    flex: 1,
  },
  date: {
    ...typography.caption,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagText: {
    ...typography.caption,
    fontSize: 11,
  },
  moreTagsText: {
    ...typography.caption,
    fontSize: 11,
  },
});
