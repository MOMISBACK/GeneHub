/**
 * NotesScreen - All notes across all entities
 */

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

import type { RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { useI18n } from '../i18n';
import { Icon } from '../components/Icons';
import { listAllNotes, getNotesCountByEntityType } from '../lib/knowledge/notes.service';
import type { EntityNote, EntityType } from '../types/knowledge';

type Props = NativeStackScreenProps<RootStackParamList, 'Notes'>;

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
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Icon name="back" size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Mes Notes</Text>
          <View style={styles.headerBadge}>
            <Text style={[styles.headerBadgeText, { color: colors.accent }]}>
              {totalCount}
            </Text>
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
