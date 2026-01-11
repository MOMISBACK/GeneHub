/**
 * ArticlesScreen - Liste des articles avec ajout
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MainTabsParamList, RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { useI18n } from '../i18n';
import { Icon } from '../components/Icons';
import { GlobalSearchButton } from '../components/header';
import { listArticles, createArticle } from '../lib/knowledge';
import type { Article, ArticleInsert } from '../types/knowledge';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Articles'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ArticlesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listArticles();
      setArticles(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [load, navigation]);

  const filteredArticles = searchQuery.trim()
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.journal?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles;

  const handleAdd = async (data: ArticleInsert) => {
    try {
      await createArticle(data);
      setShowAddModal(false);
      load();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Articles</Text>
        <View style={styles.headerActions}>
          <GlobalSearchButton />
          <Pressable
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="add" size={18} color={colors.buttonPrimaryText ?? '#fff'} />
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
        <Icon name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Rechercher..."
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

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: colors.accent }]} onPress={load}>
            <Text style={[styles.retryBtnText, { color: colors.buttonPrimaryText }]}>{t.common.retry}</Text>
          </Pressable>
        </View>
      ) : filteredArticles.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {searchQuery ? 'Aucun résultat' : 'Aucun article'}
          </Text>
          {!searchQuery && (
            <Pressable
              style={[styles.addFirstBtn, { borderColor: colors.accent }]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={[styles.addFirstText, { color: colors.accent }]}>+ Ajouter un article</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
              onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.cardMeta}>
                  {item.journal && (
                    <Text style={[styles.cardJournal, { color: colors.textMuted }]} numberOfLines={1}>
                      {item.journal}
                    </Text>
                  )}
                  {item.year && (
                    <Text style={[styles.cardYear, { color: colors.textMuted }]}>{item.year}</Text>
                  )}
                </View>
                {(item.doi || item.pmid) && (
                  <View style={styles.cardIds}>
                    {item.doi && (
                      <Text style={[styles.cardId, { color: colors.accent }]}>DOI</Text>
                    )}
                    {item.pmid && (
                      <Text style={[styles.cardId, { color: colors.accent }]}>PMID: {item.pmid}</Text>
                    )}
                  </View>
                )}
              </View>
              <Icon name="chevronRight" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}

      {/* Add Modal */}
      <AddArticleModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAdd}
        colors={colors}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Modal Component
// ─────────────────────────────────────────────────────────────────────────────

function AddArticleModal({
  visible,
  onClose,
  onSubmit,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ArticleInsert) => void;
  colors: any;
}) {
  const [title, setTitle] = useState('');
  const [journal, setJournal] = useState('');
  const [year, setYear] = useState('');
  const [doi, setDoi] = useState('');
  const [pmid, setPmid] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle('');
    setJournal('');
    setYear('');
    setDoi('');
    setPmid('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        journal: journal.trim() || undefined,
        year: year ? parseInt(year, 10) : undefined,
        doi: doi.trim() || undefined,
        pmid: pmid.trim() || undefined,
      });
      reset();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.modalContainer, { backgroundColor: colors.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalHeader, { borderBottomColor: colors.borderHairline }]}>
          <Pressable onPress={onClose}>
            <Text style={[styles.modalCancel, { color: colors.textMuted }]}>Annuler</Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Nouvel article</Text>
          <Pressable onPress={handleSubmit} disabled={saving}>
            <Text style={[styles.modalSave, { color: colors.accent, opacity: saving ? 0.5 : 1 }]}>
              {saving ? '...' : 'Ajouter'}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.textMuted }]}>Titre *</Text>
          <TextInput
            style={[styles.inputMulti, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderHairline }]}
            placeholder="Structural insights into the lactose operon..."
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            multiline
            numberOfLines={3}
            autoFocus
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>Journal</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderHairline }]}
            placeholder="Nature Microbiology"
            placeholderTextColor={colors.textMuted}
            value={journal}
            onChangeText={setJournal}
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>Année</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderHairline }]}
            placeholder="2024"
            placeholderTextColor={colors.textMuted}
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>DOI</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderHairline }]}
            placeholder="10.1038/s41564-024-xxxxx"
            placeholderTextColor={colors.textMuted}
            value={doi}
            onChangeText={setDoi}
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>PMID</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderHairline }]}
            placeholder="12345678"
            placeholderTextColor={colors.textMuted}
            value={pmid}
            onChangeText={setPmid}
            keyboardType="number-pad"
          />

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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
    fontWeight: '600',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  addFirstBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  addFirstText: {
    ...typography.body,
    fontWeight: '500',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: '500',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  cardJournal: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    flex: 1,
  },
  cardYear: {
    ...typography.bodySmall,
  },
  cardIds: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  cardId: {
    ...typography.caption,
    fontWeight: '500',
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancel: {
    ...typography.body,
  },
  modalTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  modalSave: {
    ...typography.body,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    ...typography.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputMulti: {
    ...typography.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
