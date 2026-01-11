/**
 * InboxScreen - Quick capture tab for links, PMIDs, DOIs, and notes
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
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MainTabsParamList, RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { useI18n } from '../i18n';
import { Icon } from '../components/Icons';
import { useInbox } from '../lib/hooks';
import { 
  getTypeLabel, 
  getTypeColor, 
  detectInboxType,
  convertPmidToArticle,
  convertDoiToArticle,
  convertUrlToArticle,
} from '../lib/inbox';
import type { InboxItem, InboxDetectedType } from '../types/inbox';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Inbox'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function InboxScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const { items, loading, error, counts, refresh, add, archive, remove } = useInbox();
  const [input, setInput] = useState('');
  const [detectedType, setDetectedType] = useState<InboxDetectedType | null>(null);
  const [adding, setAdding] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

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

  // Quick add
  const handleAdd = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setAdding(true);
    Keyboard.dismiss();
    
    try {
      const item = await add(trimmed);
      if (item) {
        setInput('');
        setDetectedType(null);
      }
    } finally {
      setAdding(false);
    }
  }, [input, add]);

  // Convert PMID to Article
  const handleConvertPmid = useCallback(async (item: InboxItem) => {
    setConverting(item.id);
    try {
      const result = await convertPmidToArticle(item.id);
      if (result.success) {
        Alert.alert(
          'Article importé ✓',
          result.title || 'Article créé avec succès',
          [
            { text: 'Voir', onPress: () => navigation.navigate('ArticleDetail', { articleId: result.entityId }) },
            { text: 'OK' },
          ]
        );
        refresh();
      } else {
        Alert.alert('Erreur', result.error || 'Import échoué');
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
        Alert.alert(
          'Article créé ✓',
          'Article créé avec DOI. Vous pouvez compléter les détails.',
          [
            { text: 'Voir', onPress: () => navigation.navigate('ArticleDetail', { articleId: result.entityId }) },
            { text: 'OK' },
          ]
        );
        refresh();
      } else {
        Alert.alert('Erreur', result.error || 'Création échouée');
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
        Alert.alert(
          'Article créé ✓',
          'Article créé avec URL. Vous pouvez compléter les détails.',
          [
            { text: 'Voir', onPress: () => navigation.navigate('ArticleDetail', { articleId: result.entityId }) },
            { text: 'OK' },
          ]
        );
        refresh();
      } else {
        Alert.alert('Erreur', result.error || 'Création échouée');
      }
    } finally {
      setConverting(null);
    }
  }, [navigation, refresh]);

  // Swipe to archive
  const handleArchive = useCallback(async (id: string) => {
    Alert.alert(
      'Archiver',
      'Archiver cet élément ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Archiver',
          onPress: () => archive(id),
        },
      ]
    );
  }, [archive]);

  // Long press to delete
  const handleDelete = useCallback(async (id: string) => {
    Alert.alert(
      'Supprimer',
      'Supprimer définitivement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => remove(id),
        },
      ]
    );
  }, [remove]);

  // Item press - show conversion options
  const handleItemPress = useCallback((item: InboxItem) => {
    if (converting) return; // Prevent double taps
    
    const typeLabel = item.detected_type ? getTypeLabel(item.detected_type) : 'Texte';
    
    // Build actions based on type
    const actions: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      { text: 'Annuler', style: 'cancel' },
    ];

    // Type-specific conversion actions
    if (item.detected_type === 'pmid') {
      actions.push({
        text: '📄 Importer depuis PubMed',
        onPress: () => handleConvertPmid(item),
      });
    }
    
    if (item.detected_type === 'doi') {
      actions.push({
        text: '📄 Créer Article (DOI)',
        onPress: () => handleConvertDoi(item),
      });
    }
    
    if (item.detected_type === 'url') {
      actions.push({
        text: '📄 Créer Article (URL)',
        onPress: () => handleConvertUrl(item),
      });
    }
    
    if (item.detected_type === 'text') {
      actions.push({
        text: '📝 Créer Note',
        onPress: () => navigation.navigate('CreateNote' as any, { inboxItemId: item.id }),
      });
    }

    // Common actions
    actions.push({
      text: 'Archiver',
      onPress: () => archive(item.id),
    });

    Alert.alert(
      `Actions - ${typeLabel}`,
      item.normalized || item.raw.slice(0, 100),
      actions
    );
  }, [converting, archive, handleConvertPmid, handleConvertDoi, handleConvertUrl, navigation]);

  const renderItem = useCallback(({ item }: { item: InboxItem }) => {
    const isConverting = converting === item.id;
    
    return (
      <Pressable
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleDelete(item.id)}
        delayLongPress={500}
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
        
        {/* Archive button */}
        {!isConverting && (
          <Pressable
            style={[styles.archiveBtn, { backgroundColor: colors.bg }]}
            onPress={() => handleArchive(item.id)}
            hitSlop={8}
          >
            <Icon name="save" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </Pressable>
    );
  }, [colors, converting, handleItemPress, handleArchive, handleDelete]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Inbox</Text>
        <View style={styles.headerBadge}>
          <Text style={[styles.headerBadgeText, { color: colors.accent }]}>
            {counts.inbox}
          </Text>
        </View>
      </View>

      {/* Quick input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.text }]}
          placeholder="PMID, DOI, URL, ou note..."
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
        {detectedType && (
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
            Inbox vide
          </Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Ajoutez un PMID, DOI, URL ou une note
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
    </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.h2,
  },
  headerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  headerBadgeText: {
    ...typography.caption,
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
  archiveBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
