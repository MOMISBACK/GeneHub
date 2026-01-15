/**
 * InboxScreen - Quick capture tab for links, PMIDs, DOIs, and notes
 * 
 * Features:
 * - Quick add PMID, DOI, URL, or text notes
 * - Filter by status: Inbox / Converted / Archived
 * - Convert items to articles or link text to existing entities
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MainTabsParamList, RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { useI18n } from '../i18n';
import { Icon } from '../components/Icons';
import { GlobalSearchButton, SettingsButton } from '../components/header';
import { showAlert, showConfirm, showError, showSuccess } from '../lib/alert';
import { useInbox } from '../lib/hooks';
import { 
  getTypeLabel, 
  getTypeColor, 
  detectInboxType,
  convertPmidToArticle,
  convertDoiToArticle,
  convertUrlToArticle,
  convertTextToNote,
} from '../lib/inbox';
import { EntityPicker, SelectedEntity } from '../components/inbox/EntityPicker';
import { TagSelectorInline } from '../components/inbox/TagSelectorInline';
import { createNoteForEntity } from '../lib/knowledge/notes.service';
import type { InboxItem, InboxDetectedType, InboxStatus } from '../types/inbox';
import type { Tag } from '../types/knowledge';

type StatusFilter = InboxStatus | 'all';

const STATUS_TABS: { key: StatusFilter; label: string; icon: string }[] = [
  { key: 'inbox', label: 'Inbox', icon: '▣' },
  { key: 'converted', label: 'Convertis', icon: '✓' },
  { key: 'archived', label: 'Archivés', icon: '▤' },
];

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Inbox'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function InboxScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  // Status filter
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('inbox');
  const { items, loading, error, counts, refresh, add, archive, restore, remove } = useInbox({ status: statusFilter });
  
  const [input, setInput] = useState('');
  const [detectedType, setDetectedType] = useState<InboxDetectedType | null>(null);
  const [adding, setAdding] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Entity picker for linking text to entities
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const [itemToLink, setItemToLink] = useState<InboxItem | null>(null);

  // Tags for auto-linking
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [advancedMode, setAdvancedMode] = useState(false);

  // Live detection as user types
  const handleInputChange = useCallback((text: string) => {
    setInput(text);
    if (text.trim().length > 2) {
      const result = detectInboxType(text);
      setDetectedType(result.type);
    } else {
      setDetectedType(null);
    }
  }, []);

  // Quick add with auto-linking via tags
  const handleAdd = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setAdding(true);
    Keyboard.dismiss();
    
    try {
      // Get entity-linked tags
      const entityLinkedTags = selectedTags.filter(t => t.entity_type && t.entity_id);
      
      // If it's text and we have entity-linked tags, auto-create notes
      if (detectedType === 'text' && entityLinkedTags.length > 0) {
        let successCount = 0;
        const entityNames: string[] = [];
        
        for (const tag of entityLinkedTags) {
          try {
            await createNoteForEntity(
              tag.entity_type as 'gene' | 'researcher' | 'article' | 'conference',
              tag.entity_id!,
              trimmed
            );
            successCount++;
            entityNames.push(tag.name);
          } catch (e) {
            console.error(`Error creating note for ${tag.name}:`, e);
          }
        }

        if (successCount > 0) {
          showSuccess('Notes créées', `Note ajoutée à ${entityNames.join(', ')}`);
        }

        setInput('');
        setDetectedType(null);
        setSelectedTags([]);
      } else {
        // Normal add to inbox
        const tagNames = selectedTags.map(t => t.name);
        const item = await add(trimmed, { tags: tagNames });
        if (item) {
          setInput('');
          setDetectedType(null);
          setSelectedTags([]);
        }
      }
    } finally {
      setAdding(false);
    }
  }, [input, add, detectedType, selectedTags]);

  // Convert PMID to Article
  const handleConvertPmid = useCallback(async (item: InboxItem) => {
    setConverting(item.id);
    try {
      const result = await convertPmidToArticle(item.id);
      if (result.success) {
        showSuccess('Article importé', result.title || 'Article créé avec succès');
        // Auto-navigate to article
        navigation.navigate('ArticleDetail', { articleId: result.entityId });
        refresh();
      } else {
        showError('Erreur', result.error || 'Import échoué');
      }
    } finally {
      setConverting(null);
    }
  }, [navigation, refresh]);

  // Convert DOI to Article
  const handleConvertDoi = useCallback(async (item: InboxItem) => {
    setConverting(item.id);
    try {
      const result = await convertDoiToArticle(item.id);
      if (result.success) {
        showSuccess('Article créé', 'Article créé avec DOI.');
        navigation.navigate('ArticleDetail', { articleId: result.entityId });
        refresh();
      } else {
        showError('Erreur', result.error || 'Création échouée');
      }
    } finally {
      setConverting(null);
    }
  }, [navigation, refresh]);

  // Convert URL to Article
  const handleConvertUrl = useCallback(async (item: InboxItem) => {
    setConverting(item.id);
    try {
      const result = await convertUrlToArticle(item.id);
      if (result.success) {
        showSuccess('Article créé', 'Article créé avec URL.');
        navigation.navigate('ArticleDetail', { articleId: result.entityId });
        refresh();
      } else {
        showError('Erreur', result.error || 'Création échouée');
      }
    } finally {
      setConverting(null);
    }
  }, [navigation, refresh]);

  // Handle entity selection for linking text to entity
  const handleEntitySelect = useCallback(async (entity: SelectedEntity) => {
    if (!itemToLink) return;

    setConverting(itemToLink.id);
    try {
      const result = await convertTextToNote(itemToLink.id, {
        entityType: entity.type,
        entityId: entity.id,
        useRawAsContent: true,
      });
      if (result.success) {
        showSuccess('Note créée', `Note liée à ${entity.displayName}`);
        refresh();
      } else {
        showError('Erreur', result.error || 'Création échouée');
      }
    } finally {
      setConverting(null);
      setItemToLink(null);
    }
  }, [itemToLink, refresh]);

  // Open entity picker
  const handleLinkToEntity = useCallback((item: InboxItem) => {
    setItemToLink(item);
    setShowEntityPicker(true);
  }, []);

  // Restore from archived
  const handleRestore = useCallback(async (id: string) => {
    const success = await restore(id);
    if (success) {
      refresh();
    }
  }, [restore, refresh]);

  // Swipe to archive
  const handleArchive = useCallback(async (id: string) => {
    const confirmed = await showConfirm(
      'Archiver',
      'Archiver cet élément ?',
      'Archiver',
      'Annuler'
    );
    if (confirmed) {
      archive(id);
    }
  }, [archive]);

  // Long press to delete
  const handleDelete = useCallback(async (id: string) => {
    const confirmed = await showConfirm(
      'Supprimer',
      'Supprimer définitivement ?',
      'Supprimer',
      'Annuler',
      true
    );
    if (confirmed) {
      remove(id);
    }
  }, [remove]);

  // Item press - show conversion options
  const handleItemPress = useCallback(async (item: InboxItem) => {
    if (converting) return; // Prevent double taps
    
    // On web, we'll use a simpler approach with individual actions
    // Based on detected type, offer the primary action directly
    
    if (Platform.OS === 'web') {
      if (!advancedMode && item.detected_type !== 'text') {
        const confirmed = await showConfirm(
          'Archiver',
          'Mode avancé désactivé. Archiver cet élément ? ',
          'Archiver',
          'Annuler'
        );
        if (confirmed) handleArchive(item.id);
        return;
      }
      // Web: Direct action based on type
      if (item.detected_type === 'pmid') {
        const confirmed = await showConfirm(
          'Importer depuis PubMed',
          `PMID: ${item.normalized || item.raw}`,
          'Importer',
          'Annuler'
        );
        if (confirmed) handleConvertPmid(item);
      } else if (item.detected_type === 'doi') {
        const confirmed = await showConfirm(
          'Créer Article (DOI)',
          `DOI: ${item.normalized || item.raw}`,
          'Créer',
          'Annuler'
        );
        if (confirmed) handleConvertDoi(item);
      } else if (item.detected_type === 'url') {
        const confirmed = await showConfirm(
          'Créer Article (URL)',
          item.normalized || item.raw,
          'Créer',
          'Annuler'
        );
        if (confirmed) handleConvertUrl(item);
      } else if (item.detected_type === 'text') {
        handleLinkToEntity(item);
      } else {
        // Show delete option for unknown types
        const deleteConfirmed = await showConfirm(
          'Supprimer',
          'Supprimer cet élément ?',
          'Supprimer',
          'Annuler',
          true
        );
        if (deleteConfirmed) handleDelete(item.id);
      }
      return;
    }
    
    // Mobile: Use ActionSheet-style Alert
    const { Alert } = require('react-native');
    const typeLabel = item.detected_type ? getTypeLabel(item.detected_type) : 'Texte';
    
    // Build actions based on type
    const actions: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      { text: 'Annuler', style: 'cancel' },
    ];

    // Type-specific conversion actions
    if (advancedMode && item.detected_type === 'pmid') {
      actions.push({
        text: '📄 Importer depuis PubMed',
        onPress: () => handleConvertPmid(item),
      });
    }
    
    if (advancedMode && item.detected_type === 'doi') {
      actions.push({
        text: '📄 Créer Article (DOI)',
        onPress: () => handleConvertDoi(item),
      });
    }
    
    if (advancedMode && item.detected_type === 'url') {
      actions.push({
        text: '📄 Créer Article (URL)',
        onPress: () => handleConvertUrl(item),
      });
    }
    
    if (item.detected_type === 'text') {
      actions.push({
        text: '📝 Lier à une fiche existante',
        onPress: () => handleLinkToEntity(item),
      });
    }

    // Actions for archived items
    if (item.status === 'archived') {
      actions.push({
        text: '↩️ Restaurer dans Inbox',
        onPress: () => handleRestore(item.id),
      });
    } else {
      // Common actions for non-archived
      actions.push({
        text: 'Archiver',
        onPress: () => archive(item.id),
      });
    }

    actions.push({
      text: 'Supprimer',
      style: 'destructive',
      onPress: () => handleDelete(item.id),
    });

    Alert.alert(
      `Actions - ${typeLabel}`,
      item.normalized || item.raw.slice(0, 100),
      actions
    );
  }, [converting, advancedMode, archive, handleConvertPmid, handleConvertDoi, handleConvertUrl, handleLinkToEntity, handleRestore, handleArchive]);

  const renderItem = useCallback(({ item }: { item: InboxItem }) => {
    const isConverting = converting === item.id;
    
    return (
      <Pressable
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
        onPress={() => handleItemPress(item)}
        disabled={isConverting}
      >
        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.detected_type ?? 'text') }]}>
          <Text style={styles.typeBadgeText}>
            {(item.detected_type ?? 'text').toUpperCase()}
          </Text>
        </View>
        
        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardRaw, { color: colors.text }]} numberOfLines={2}>
            {item.normalized || item.raw}
          </Text>
          {item.note && (
            <Text style={[styles.cardNote, { color: colors.textMuted }]} numberOfLines={1}>
              {item.note}
            </Text>
          )}
          <Text style={[styles.cardDate, { color: colors.textMuted }]}>
            {formatRelativeTime(item.created_at)}
          </Text>
        </View>

        {/* Converting indicator */}
        {isConverting && (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: spacing.sm }} />
        )}

        {/* Status indicator */}
        {item.status === 'converted' && !isConverting && (
          <View style={[styles.statusIcon, { backgroundColor: colors.success }]}>
            <Icon name="check" size={10} color="#fff" />
          </View>
        )}
        
        {/* Delete button */}
        {!isConverting && (
          <Pressable
            style={[styles.deleteBtn, { backgroundColor: colors.bg }]}
            onPress={() => handleDelete(item.id)}
            hitSlop={8}
          >
            <Icon name="close" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </Pressable>
    );
  }, [colors, converting, handleItemPress, handleDelete]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Inbox</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.advancedToggle, { backgroundColor: advancedMode ? colors.accent : colors.surface, borderColor: colors.borderHairline }]}
            onPress={() => setAdvancedMode(prev => !prev)}
          >
            <Text style={[styles.advancedToggleText, { color: advancedMode ? '#000' : colors.textMuted }]}>Avancé</Text>
          </Pressable>
          <GlobalSearchButton />
          <SettingsButton />
        </View>
      </View>

      {/* Status filter tabs */}
      <View style={styles.filterTabs}>
        {STATUS_TABS.map(tab => {
          const count = tab.key === 'all' ? counts.inbox + counts.archived + counts.converted : counts[tab.key];
          const isActive = statusFilter === tab.key;
          
          return (
            <Pressable
              key={tab.key}
              style={[
                styles.filterTab,
                isActive && { backgroundColor: colors.accent },
                !isActive && { backgroundColor: colors.surface, borderColor: colors.borderHairline, borderWidth: 1 },
              ]}
              onPress={() => setStatusFilter(tab.key)}
            >
              <Text style={[
                styles.filterTabLabel,
                { color: isActive ? '#000' : colors.text },
              ]}>
                {tab.label}
              </Text>
              <View style={[
                styles.filterTabCount,
                { backgroundColor: isActive ? 'rgba(0,0,0,0.15)' : colors.bg },
              ]}>
                <Text style={[
                  styles.filterTabCountText,
                  { color: isActive ? '#000' : colors.textMuted },
                ]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Quick input - only show on inbox tab */}
      {statusFilter === 'inbox' && (
        <>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder={advancedMode ? 'PMID, DOI, URL, ou note...' : 'Note rapide...'}
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={handleInputChange}
              onSubmitEditing={handleAdd}
              returnKeyType="send"
              multiline={false}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            {/* Live detection indicator */}
            {advancedMode && detectedType && (
              <View style={[styles.detectedBadge, { backgroundColor: getTypeColor(detectedType) }]}>
                <Text style={styles.detectedBadgeText}>
                  {getTypeLabel(detectedType)}
                </Text>
              </View>
            )}
            
            {/* Add button */}
            <Pressable
              style={[
                styles.addBtn,
                { backgroundColor: input.trim() ? colors.accent : colors.surface }
              ]}
              onPress={handleAdd}
              disabled={!input.trim() || adding}
            >
              {adding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="add" size={20} color={input.trim() ? '#fff' : colors.textMuted} />
              )}
            </Pressable>
          </View>

          {/* Tag selector for auto-linking - only show for text input */}
          {input.trim().length > 0 && (
            <View style={{ paddingHorizontal: spacing.lg }}>
              <TagSelectorInline
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
              />
              {selectedTags.some(t => t.entity_type) && detectedType === 'text' && (
                <Text style={[styles.autoLinkInfo, { color: colors.textMuted }]}>
                  ✓ La note sera automatiquement ajoutée aux fiches sélectionnées
                </Text>
              )}
            </View>
          )}
        </>
      )}

      {/* Content */}
      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: colors.accent }]} onPress={refresh}>
            <Text style={styles.retryBtnText}>{t.common.retry}</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Icon name="doc" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {statusFilter === 'inbox' && 'Inbox vide'}
            {statusFilter === 'converted' && 'Aucun item converti'}
            {statusFilter === 'archived' && 'Aucun item archivé'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {statusFilter === 'inbox' && 'Ajoutez un PMID, DOI, URL ou une note'}
            {statusFilter === 'converted' && 'Les items convertis en articles ou notes apparaîtront ici'}
            {statusFilter === 'archived' && 'Archivez des items pour les retrouver ici'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={refresh}
        />
      )}

      {/* Entity picker modal */}
      <EntityPicker
        visible={showEntityPicker}
        onClose={() => {
          setShowEntityPicker(false);
          setItemToLink(null);
        }}
        onSelect={handleEntitySelect}
      />
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  advancedToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  advancedToggleText: {
    ...typography.caption,
    fontWeight: '600',
  },
  title: {
    ...typography.h1,
  },
  headerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  headerBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 4,
  },
  filterTabIcon: {
    fontSize: 12,
  },
  filterTabLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  filterTabCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  filterTabCountText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingLeft: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.md,
  },
  detectedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  detectedBadgeText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600',
    fontSize: 10,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  typeBadgeText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  cardContent: {
    flex: 1,
  },
  cardRaw: {
    ...typography.body,
    fontWeight: '500',
  },
  cardNote: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardDate: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  statusIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoLinkInfo: {
    ...typography.caption,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
