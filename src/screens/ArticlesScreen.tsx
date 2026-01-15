/**
 * ArticlesScreen - Liste des articles avec ajout
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useState, useRef } from 'react';
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
import { listArticles, createArticle } from '../lib/knowledge';
import { fetchPubMedArticle } from '../lib/pubmed';
import { fetchArticleFromDoi, searchCrossrefByTitle, type CrossrefSearchResult } from '../lib/crossref';
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
  const [advancedMode, setAdvancedMode] = useState(false);

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
          <Pressable
            style={[styles.advancedToggle, { backgroundColor: advancedMode ? colors.accent : colors.surface, borderColor: colors.borderHairline }]}
            onPress={() => setAdvancedMode(prev => !prev)}
          >
            <Text style={[styles.advancedToggleText, { color: advancedMode ? '#000' : colors.textMuted }]}>Avancé</Text>
          </Pressable>
          {advancedMode && (
            <Pressable
              style={[styles.addBtn, { backgroundColor: colors.accent }]}
              onPress={() => setShowAddModal(true)}
            >
              <Icon name="add" size={18} color={colors.buttonPrimaryText ?? '#fff'} />
            </Pressable>
          )}
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
          {!searchQuery && advancedMode && (
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
// Add Modal Component with DOI/PMID auto-fetch and title autocomplete
// ─────────────────────────────────────────────────────────────────────────────

type ImportMode = 'quick' | 'manual';

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
  const [mode, setMode] = useState<ImportMode>('quick');
  
  // Quick import fields
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<'none' | 'doi' | 'pmid'>('none');
  const [fetching, setFetching] = useState(false);
  const [fetchedData, setFetchedData] = useState<ArticleInsert | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Manual fields
  const [title, setTitle] = useState('');
  const [journal, setJournal] = useState('');
  const [year, setYear] = useState('');
  const [doi, setDoi] = useState('');
  const [pmid, setPmid] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Autocomplete
  const [suggestions, setSuggestions] = useState<CrossrefSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = () => {
    setMode('quick');
    setIdentifier('');
    setIdentifierType('none');
    setFetching(false);
    setFetchedData(null);
    setFetchError(null);
    setTitle('');
    setJournal('');
    setYear('');
    setDoi('');
    setPmid('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Detect identifier type (DOI or PMID)
  const detectIdentifierType = (value: string): 'doi' | 'pmid' | 'none' => {
    const trimmed = value.trim();
    if (!trimmed) return 'none';
    
    // DOI patterns
    if (/^10\.\d{4,}\//.test(trimmed) || 
        /doi[:\s]*(10\.\d{4,}\/)/i.test(trimmed) ||
        /doi\.org\/(10\.\d{4,}\/)/i.test(trimmed)) {
      return 'doi';
    }
    
    // PMID patterns
    if (/^PMID[:\s]*\d{7,8}$/i.test(trimmed) ||
        /^\d{7,8}$/.test(trimmed) ||
        /pubmed\.ncbi\.nlm\.nih\.gov\/(\d{7,8})/i.test(trimmed)) {
      return 'pmid';
    }
    
    return 'none';
  };

  // Extract clean identifier
  const extractIdentifier = (value: string, type: 'doi' | 'pmid'): string => {
    const trimmed = value.trim();
    
    if (type === 'doi') {
      const match = trimmed.match(/(10\.\d{4,}\/[^\s]+)/);
      return match ? match[1].replace(/[.,;:)\]]+$/, '') : trimmed;
    }
    
    if (type === 'pmid') {
      const match = trimmed.match(/(\d{7,8})/);
      return match ? match[1] : trimmed;
    }
    
    return trimmed;
  };

  // Handle identifier change
  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    setFetchError(null);
    setFetchedData(null);
    const type = detectIdentifierType(value);
    setIdentifierType(type);
  };

  // Fetch article data from DOI or PMID
  const handleFetch = async () => {
    if (identifierType === 'none') {
      setFetchError('Entrez un DOI (ex: 10.1038/...) ou PMID (ex: 12345678)');
      return;
    }

    setFetching(true);
    setFetchError(null);
    setFetchedData(null);

    try {
      const cleanId = extractIdentifier(identifier, identifierType);
      
      if (identifierType === 'doi') {
        const article = await fetchArticleFromDoi(cleanId);
        if (article) {
          setFetchedData(article);
        } else {
          setFetchError('DOI non trouvé dans Crossref');
        }
      } else if (identifierType === 'pmid') {
        const result = await fetchPubMedArticle(cleanId);
        if (result.success && result.article) {
          setFetchedData({
            title: result.article.title,
            journal: result.article.journal || undefined,
            year: result.article.year || undefined,
            doi: result.article.doi || undefined,
            pmid: result.article.pmid,
            abstract: result.article.abstract || undefined,
            external_source: 'pubmed',
            external_id: result.article.pmid,
          });
        } else {
          setFetchError(result.error || 'Article non trouvé sur PubMed');
        }
      }
    } catch (e: any) {
      setFetchError(e.message || 'Erreur lors de la récupération');
    } finally {
      setFetching(false);
    }
  };

  // Handle title change with autocomplete
  const handleTitleChange = (value: string) => {
    setTitle(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search
    if (value.length >= 3) {
      setLoadingSuggestions(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchCrossrefByTitle(value, 5);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch {
          setSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 400);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
    }
  };

  // Select suggestion
  const handleSelectSuggestion = (suggestion: CrossrefSearchResult) => {
    setTitle(suggestion.title);
    setJournal(suggestion.journal || '');
    setYear(suggestion.year ? String(suggestion.year) : '');
    setDoi(suggestion.doi);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Submit quick import
  const handleQuickSubmit = async () => {
    if (!fetchedData) {
      setFetchError('Récupérez d\'abord les informations');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(fetchedData);
      reset();
    } finally {
      setSaving(false);
    }
  };

  // Submit manual
  const handleManualSubmit = async () => {
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
          <Pressable onPress={() => { reset(); onClose(); }}>
            <Text style={[styles.modalCancel, { color: colors.textMuted }]}>Annuler</Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Nouvel article</Text>
          <Pressable 
            onPress={mode === 'quick' ? handleQuickSubmit : handleManualSubmit} 
            disabled={saving || (mode === 'quick' && !fetchedData)}
          >
            <Text style={[styles.modalSave, { 
              color: colors.accent, 
              opacity: (saving || (mode === 'quick' && !fetchedData)) ? 0.5 : 1 
            }]}>
              {saving ? '...' : 'Ajouter'}
            </Text>
          </Pressable>
        </View>

        {/* Mode Tabs */}
        <View style={[styles.modeTabs, { borderBottomColor: colors.borderHairline }]}>
          <Pressable 
            style={[styles.modeTab, mode === 'quick' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
            onPress={() => setMode('quick')}
          >
            <Text style={[styles.modeTabText, { color: mode === 'quick' ? colors.accent : colors.textMuted }]}>
              Import rapide
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.modeTab, mode === 'manual' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
            onPress={() => setMode('manual')}
          >
            <Text style={[styles.modeTabText, { color: mode === 'manual' ? colors.accent : colors.textMuted }]}>
              Saisie manuelle
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          {mode === 'quick' ? (
            <>
              {/* Quick Import Mode */}
              <Text style={[styles.helpText, { color: colors.textMuted }]}>
                Entrez un DOI ou PMID pour récupérer automatiquement les informations
              </Text>

              <View style={styles.quickInputRow}>
                <TextInput
                  style={[styles.quickInput, { 
                    backgroundColor: colors.surface, 
                    color: colors.text, 
                    borderColor: identifierType !== 'none' ? colors.accent : colors.borderHairline 
                  }]}
                  placeholder="10.1038/... ou 12345678"
                  placeholderTextColor={colors.textMuted}
                  value={identifier}
                  onChangeText={handleIdentifierChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                <Pressable 
                  style={[styles.fetchBtn, { 
                    backgroundColor: identifierType !== 'none' ? colors.accent : colors.surface,
                    borderColor: colors.borderHairline,
                  }]}
                  onPress={handleFetch}
                  disabled={fetching || identifierType === 'none'}
                >
                  {fetching ? (
                    <ActivityIndicator size="small" color={identifierType !== 'none' ? colors.buttonPrimaryText : colors.textMuted} />
                  ) : (
                    <Icon name="search" size={18} color={identifierType !== 'none' ? colors.buttonPrimaryText : colors.textMuted} />
                  )}
                </Pressable>
              </View>

              {identifierType !== 'none' && (
                <Text style={[styles.detectedType, { color: colors.accent }]}>
                  {identifierType === 'doi' ? '🔗 DOI détecté' : '📄 PMID détecté'}
                </Text>
              )}

              {fetchError && (
                <Text style={[styles.errorText, { color: colors.error }]}>{fetchError}</Text>
              )}

              {fetchedData && (
                <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
                  <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Aperçu</Text>
                  <Text style={[styles.previewTitle, { color: colors.text }]}>{fetchedData.title}</Text>
                  {fetchedData.journal && (
                    <Text style={[styles.previewMeta, { color: colors.textMuted }]}>{fetchedData.journal}</Text>
                  )}
                  <View style={styles.previewRow}>
                    {fetchedData.year && (
                      <Text style={[styles.previewMeta, { color: colors.textMuted }]}>{fetchedData.year}</Text>
                    )}
                    {fetchedData.doi && (
                      <Text style={[styles.previewDoi, { color: colors.accent }]}>DOI: {fetchedData.doi}</Text>
                    )}
                    {fetchedData.pmid && (
                      <Text style={[styles.previewDoi, { color: colors.accent }]}>PMID: {fetchedData.pmid}</Text>
                    )}
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Manual Mode with Autocomplete */}
              <Text style={[styles.label, { color: colors.textMuted }]}>Titre *</Text>
              <View style={styles.autocompleteContainer}>
                <TextInput
                  style={[styles.inputMulti, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderHairline }]}
                  placeholder="Commencez à taper pour des suggestions..."
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={handleTitleChange}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  multiline
                  numberOfLines={3}
                  autoFocus
                />
                {loadingSuggestions && (
                  <ActivityIndicator size="small" color={colors.accent} style={styles.autocompleteLoader} />
                )}
              </View>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
                  {suggestions.map((s, i) => (
                    <Pressable 
                      key={s.doi + i}
                      style={[styles.suggestionItem, { borderBottomColor: colors.borderHairline }]}
                      onPress={() => handleSelectSuggestion(s)}
                    >
                      <Text style={[styles.suggestionTitle, { color: colors.text }]} numberOfLines={2}>
                        {s.title}
                      </Text>
                      <Text style={[styles.suggestionMeta, { color: colors.textMuted }]} numberOfLines={1}>
                        {s.journal ? `${s.journal} ` : ''}{s.year ? `(${s.year})` : ''}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable 
                    style={styles.dismissSuggestions}
                    onPress={() => setShowSuggestions(false)}
                  >
                    <Text style={[styles.dismissText, { color: colors.textMuted }]}>Fermer les suggestions</Text>
                  </Pressable>
                </View>
              )}

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
            </>
          )}

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
    marginTop: spacing.sm,
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
  // Mode tabs
  modeTabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modeTabText: {
    ...typography.body,
    fontWeight: '500',
  },
  // Quick import
  helpText: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  quickInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickInput: {
    flex: 1,
    ...typography.body,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  fetchBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  detectedType: {
    ...typography.caption,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  previewCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  previewTitle: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  previewMeta: {
    ...typography.bodySmall,
    fontStyle: 'italic',
  },
  previewRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  previewDoi: {
    ...typography.caption,
  },
  // Manual form
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
  // Autocomplete
  autocompleteContainer: {
    position: 'relative',
  },
  autocompleteLoader: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
  },
  suggestionsContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    maxHeight: 250,
  },
  suggestionItem: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionTitle: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  suggestionMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  dismissSuggestions: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  dismissText: {
    ...typography.caption,
  },
});
