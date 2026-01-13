/**
 * SearchScreen - Global search across all entities
 * Genes, Researchers, Articles, Conferences
 * Sectioned results for better UX
 */

import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { Icon } from '../components/Icons';
import { TabIcon } from '../components/TabIcons';
import { globalSearch, type GlobalSearchResult } from '../lib/globalSearch';
import type { Researcher, Article, Conference } from '../types/knowledge';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

type ResultType = 'gene' | 'researcher' | 'article' | 'conference';

interface SectionData {
  title: string;
  type: ResultType;
  icon: 'Genes' | 'Researchers' | 'Articles' | 'Conferences';
  data: GlobalSearchResult[];
}

export function SearchScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await globalSearch(query.trim());
      setResults(data);
    } catch (e) {
      console.error('Search error:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Group results into sections
  const sections: SectionData[] = useMemo(() => {
    const grouped: Record<ResultType, GlobalSearchResult[]> = {
      gene: [],
      researcher: [],
      article: [],
      conference: [],
    };

    results.forEach(result => {
      if (grouped[result.type as ResultType]) {
        grouped[result.type as ResultType].push(result);
      }
    });

    const sectionConfig: { type: ResultType; title: string; icon: SectionData['icon'] }[] = [
      { type: 'gene', title: 'Gènes', icon: 'Genes' },
      { type: 'researcher', title: 'Chercheurs', icon: 'Researchers' },
      { type: 'article', title: 'Articles', icon: 'Articles' },
      { type: 'conference', title: 'Conférences', icon: 'Conferences' },
    ];

    return sectionConfig
      .filter(cfg => grouped[cfg.type].length > 0)
      .map(cfg => ({
        title: cfg.title,
        type: cfg.type,
        icon: cfg.icon,
        data: grouped[cfg.type],
      }));
  }, [results]);

  const navigateToResult = (result: GlobalSearchResult) => {
    switch (result.type) {
      case 'gene':
        navigation.push('GeneDetail', { 
          symbol: result.data.symbol, 
          organism: result.data.organism 
        });
        break;
      case 'researcher':
        navigation.push('ResearcherDetail', { researcherId: result.data.id });
        break;
      case 'article':
        navigation.push('ArticleDetail', { articleId: result.data.id });
        break;
      case 'conference':
        navigation.push('ConferenceDetail', { conferenceId: result.data.id });
        break;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'gene': return 'Gène';
      case 'researcher': return 'Chercheur';
      case 'article': return 'Article';
      case 'conference': return 'Conférence';
      default: return type;
    }
  };

  const getTypeIcon = (type: string): keyof typeof import('../components/Icons').Icons => {
    switch (type) {
      case 'gene': return 'dna';
      case 'researcher': return 'people';
      case 'article': return 'doc';
      case 'conference': return 'calendar';
      default: return 'dot';
    }
  };

  const renderResult = ({ item }: { item: GlobalSearchResult }) => {
    let title = '';
    let subtitle = '';

    switch (item.type) {
      case 'gene':
        title = item.data.symbol;
        subtitle = item.data.name || item.data.organism || '';
        break;
      case 'researcher':
        title = item.data.name;
        subtitle = item.data.institution || '';
        break;
      case 'article':
        title = item.data.title;
        subtitle = [item.data.journal, item.data.year].filter(Boolean).join(' • ');
        break;
      case 'conference':
        title = item.data.name;
        subtitle = [item.data.city, item.data.country].filter(Boolean).join(', ');
        break;
    }

    return (
      <Pressable
        style={[styles.resultItem, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
        onPress={() => navigateToResult(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
          <Icon name={getTypeIcon(item.type)} size={16} color={colors.accent} />
        </View>
        <View style={styles.resultContent}>
          <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.resultSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
      </Pressable>
    );
  };

  // Render section header with icon
  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.bg }]}>
      <TabIcon name={section.icon} size={18} color={colors.accent} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
      <View style={[styles.sectionBadge, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
          {section.data.length}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Recherche</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Input */}
      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
        <Icon name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Gènes, chercheurs, articles..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
            <Icon name="close" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : hasSearched ? (
        sections.length > 0 ? (
          <SectionList
            sections={sections}
            keyExtractor={(item, index) => {
              if (item.type === 'gene') {
                return `gene_${item.data.symbol}_${index}`;
              }
              return `${item.type}_${item.data.id}_${index}`;
            }}
            renderItem={renderResult}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled
            contentContainerStyle={[styles.resultsList, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
                {results.length} résultat{results.length !== 1 ? 's' : ''}
              </Text>
            }
            ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
            SectionSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          />
        ) : (
          <View style={styles.centerContent}>
            <Icon name="search" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Aucun résultat pour "{query}"
            </Text>
          </View>
        )
      ) : (
        <View style={styles.centerContent}>
          <Icon name="search" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Recherchez dans votre base de connaissances
          </Text>
          <Text style={[styles.hintText, { color: colors.textMuted }]}>
            Gènes, chercheurs, articles, conférences
          </Text>
        </View>
      )}
    </View>
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
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.md,
  },
  
  resultsList: {
    paddingHorizontal: spacing.lg,
  },
  resultsCount: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    ...typography.body,
    fontWeight: '500',
  },
  resultSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    marginLeft: spacing.sm,
  },
  
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginHorizontal: -spacing.lg,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  sectionCount: {
    ...typography.caption,
  },
  
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
  hintText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});
