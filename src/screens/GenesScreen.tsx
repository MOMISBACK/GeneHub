/**
 * GenesScreen - Unified Search + Favorites
 * Card-based minimal design inspired by mockups
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icons';
import { TabIcon } from '../components/TabIcons';

import type { RootStackParamList, MainTabsParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { getSavedGenes, removeSavedGene, SavedGene } from '../lib/cache';
import { ORGANISMS } from '../data/organisms';
import { normalizeOrganism } from '../lib/utils';
import { useI18n } from '../i18n';
import { GlobalSearchButton } from '../components/header';

type Organism = { id: string; name: string; shortName: string };

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Genes'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function GenesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const [genes, setGenes] = useState<SavedGene[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // For now: single-organism mode (E. coli) to avoid implying strong species-specific coverage.
  const selectedOrganism: Organism = ORGANISMS[0] as unknown as Organism;
  const selectedOrganismName = selectedOrganism.name;

  const loadGenes = useCallback(async () => {
    try {
      const saved = await getSavedGenes();
      const ecoliOnly = saved.filter(
        g => normalizeOrganism(g.organism) === normalizeOrganism(selectedOrganismName),
      );
      setGenes(ecoliOnly);
    } catch (e) {
      console.error('Failed to load genes:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedOrganismName]);

  useEffect(() => {
    loadGenes();
    const unsubscribe = navigation.addListener('focus', loadGenes);
    return unsubscribe;
  }, [loadGenes, navigation]);

  const handleDelete = (gene: SavedGene) => {
    Alert.alert('Supprimer ce gène ?', '', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await removeSavedGene(gene.symbol, gene.organism);
          loadGenes();
        },
      },
    ]);
  };

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;
    navigation.navigate('GeneDetail', { 
      symbol: query, 
      organism: selectedOrganismName,
    });
  };

  const filteredGenes = searchQuery.trim()
    ? genes.filter(g => 
        g.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.data?.proteinName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.data?.synonyms ?? []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : genes;

  const hasFavorites = genes.length > 0;
  const hasSearch = !!searchQuery.trim();

  const getAliasesLine = (item: SavedGene) => {
    const raw = (item.data?.synonyms ?? []).map(s => String(s).trim()).filter(Boolean);
    const uniq = Array.from(new Set(raw));
    const cleaned = uniq.filter(s => s.toLowerCase() !== item.symbol.toLowerCase());
    if (cleaned.length === 0) return null;
    return cleaned.slice(0, 6).join(' · ');
  };

  const renderGeneCard = ({ item }: { item: SavedGene }) => (
    <Pressable
      style={[
        styles.geneRow,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderHairline,
        },
      ]}
      onPress={() => navigation.navigate('GeneDetail', { 
        symbol: item.symbol, 
        organism: item.organism 
      })}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.geneCardContent}>
        <Text style={[styles.geneSymbol, { color: colors.text }]}>{item.symbol}</Text>
        {item.data?.proteinName && (
          <Text style={[styles.geneDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.data.proteinName}
          </Text>
        )}
        {getAliasesLine(item) && (
          <Text style={[styles.geneAliases, { color: colors.textMuted }]} numberOfLines={1}>
            {getAliasesLine(item)}
          </Text>
        )}
      </View>
      <Pressable style={styles.favBtn} onPress={() => handleDelete(item)} hitSlop={8}>
        <Icon name="star" size={16} color={colors.textMuted} />
      </Pressable>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Gènes</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => navigation.navigate('Collections')}
              style={styles.iconButton}
              hitSlop={8}
            >
              <TabIcon name="Collections" size={20} color={colors.textMuted} />
            </Pressable>
            <GlobalSearchButton />
          </View>
        </View>
      </View>

      <FlatList
        data={filteredGenes}
        keyExtractor={(item) => `${item.symbol}_${item.organism}`}
        renderItem={renderGeneCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadGenes} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <>
            {/* Search Card */}
            <View style={[styles.searchCard, { backgroundColor: colors.card, shadowColor: colors.text }]}>
              <Text style={[styles.searchTitle, { color: colors.text }]}>{t.common.search}</Text>
              <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.searchIcon, { color: colors.textMuted }]}>⌕</Text>
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t.search.genePlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
              </View>
              <View style={styles.organismSelector}>
                <Text style={[styles.organismSelectorText, { color: colors.textMuted }]}>
                  <Text style={{ color: colors.text, fontStyle: 'italic' }}>{selectedOrganism.shortName}</Text>
                </Text>
              </View>
            </View>

            {/* Favorites Header */}
            {hasFavorites && (
              <View style={styles.sectionHeader}>
                <Icon name="star" size={14} color={colors.textMuted} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.savedGenes.title}</Text>
                <Text style={[styles.countText, { color: colors.textMuted }]}>{genes.length}</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Icon name="dna" size={28} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {hasSearch && hasFavorites ? t.errors.notFound : t.savedGenes.empty}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {hasSearch && hasFavorites ? t.search.genePlaceholder : t.savedGenes.emptyHint}
              </Text>
              {searchQuery.trim() && (
                <Pressable style={[styles.searchBtn, { backgroundColor: colors.buttonPrimary }]} onPress={handleSearch}>
                  <Text style={[styles.searchBtnText, { color: colors.buttonPrimaryText }]}>
                    {t.search.searchButton} "{searchQuery}"
                  </Text>
                </Pressable>
              )}
            </View>
          )
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconButton: { padding: spacing.xs },
  headerTitle: { ...typography.h1 },
  headerSubtitle: { ...typography.caption, marginTop: spacing.xs },
  
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  
  searchCard: {
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  organismSelector: { marginTop: spacing.md },
  organismSelectorText: { fontSize: 13 },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  countText: { fontSize: 12, fontWeight: '600' },

  favBtn: { padding: spacing.sm },
  
  geneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  geneCardContent: { flex: 1 },
  geneSymbol: { fontSize: 17, fontWeight: '700', fontStyle: 'italic', marginBottom: 2 },
  geneDescription: { fontSize: 13, lineHeight: 18 },
  geneAliases: { fontSize: 12, marginTop: spacing.xs, fontStyle: 'italic' },
  
  
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginBottom: spacing.xs },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: spacing.lg },
  searchBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  searchBtnText: { fontSize: 15, fontWeight: '600' },
});
