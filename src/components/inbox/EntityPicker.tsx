/**
 * EntityPicker - Select an existing entity to link a note to
 * Used in Inbox to convert text items to notes attached to entities
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, typography, spacing, radius } from '../../theme';
import { Icon } from '../Icons';
import { listResearchers } from '../../lib/knowledge/researchers.service';
import { listArticles } from '../../lib/knowledge/articles.service';
import { listConferences } from '../../lib/knowledge/conferences.service';
import { getSavedGenes } from '../../lib/cache';
import type { Researcher, Article, Conference } from '../../types/knowledge';
import type { SavedGene } from '../../lib/cache';

export type EntityType = 'gene' | 'researcher' | 'article' | 'conference';

export interface SelectedEntity {
  type: EntityType;
  id: string;
  displayName: string;
}

interface EntityPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (entity: SelectedEntity) => void;
}

type EntityTab = EntityType;

const TAB_CONFIG: Record<EntityTab, { label: string; icon: string }> = {
  gene: { label: 'Gènes', icon: '⧬' },
  researcher: { label: 'Chercheurs', icon: '◉' },
  article: { label: 'Articles', icon: '▤' },
  conference: { label: 'Conférences', icon: '▦' },
};

export function EntityPicker({ visible, onClose, onSelect }: EntityPickerProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<EntityTab>('gene');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Data
  const [genes, setGenes] = useState<SavedGene[]>([]);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [conferences, setConferences] = useState<Conference[]>([]);

  // Load data
  useEffect(() => {
    if (!visible) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [g, r, a, c] = await Promise.all([
          getSavedGenes(),
          listResearchers().catch(() => []),
          listArticles().catch(() => []),
          listConferences().catch(() => []),
        ]);
        setGenes(g);
        setResearchers(r);
        setArticles(a);
        setConferences(c);
      } catch (e) {
        console.error('Error loading entities:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [visible]);

  // Filter items by search
  const filteredItems = useCallback(() => {
    const query = search.toLowerCase().trim();

    switch (activeTab) {
      case 'gene':
        return genes.filter(g =>
          g.symbol.toLowerCase().includes(query) ||
          g.data?.proteinName?.toLowerCase().includes(query)
        );
      case 'researcher':
        return researchers.filter(r =>
          r.name.toLowerCase().includes(query) ||
          r.institution?.toLowerCase().includes(query)
        );
      case 'article':
        return articles.filter(a =>
          a.title.toLowerCase().includes(query) ||
          a.journal?.toLowerCase().includes(query)
        );
      case 'conference':
        return conferences.filter(c =>
          c.name.toLowerCase().includes(query) ||
          c.location?.toLowerCase().includes(query)
        );
      default:
        return [];
    }
  }, [activeTab, search, genes, researchers, articles, conferences]);

  const handleSelect = (item: any) => {
    let entity: SelectedEntity;

    switch (activeTab) {
      case 'gene':
        entity = {
          type: 'gene',
          id: `${item.symbol.toLowerCase()}_${item.organism.toLowerCase()}`,
          displayName: item.symbol,
        };
        break;
      case 'researcher':
        entity = {
          type: 'researcher',
          id: item.id,
          displayName: item.name,
        };
        break;
      case 'article':
        entity = {
          type: 'article',
          id: item.id,
          displayName: item.title.slice(0, 50) + (item.title.length > 50 ? '...' : ''),
        };
        break;
      case 'conference':
        entity = {
          type: 'conference',
          id: item.id,
          displayName: item.name,
        };
        break;
      default:
        return;
    }

    onSelect(entity);
    onClose();
  };

  const renderItem = ({ item }: { item: any }) => {
    let title = '';
    let subtitle = '';

    switch (activeTab) {
      case 'gene':
        title = item.symbol;
        subtitle = item.data?.proteinName || item.organism;
        break;
      case 'researcher':
        title = item.name;
        subtitle = item.institution || '';
        break;
      case 'article':
        title = item.title;
        subtitle = item.journal ? `${item.journal} (${item.year || '?'})` : '';
        break;
      case 'conference':
        title = item.name;
        subtitle = item.location ? `${item.location} - ${item.start_date?.slice(0, 10) || ''}` : '';
        break;
    }

    return (
      <Pressable
        style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.itemSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <Icon name="chevronRight" size={16} color={colors.textMuted} />
      </Pressable>
    );
  };

  const items = filteredItems();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Lier à une fiche</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Icon name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
          <Icon name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Icon name="close" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(Object.keys(TAB_CONFIG) as EntityTab[]).map(tab => (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { backgroundColor: colors.accent },
                activeTab !== tab && { backgroundColor: colors.surface, borderColor: colors.borderHairline, borderWidth: 1 },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabIcon]}>{TAB_CONFIG[tab].icon}</Text>
              <Text style={[
                styles.tabLabel,
                { color: activeTab === tab ? '#fff' : colors.text },
              ]}>
                {TAB_CONFIG[tab].label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Icon name="search" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {search ? 'Aucun résultat' : 'Aucune fiche'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {search 
                ? 'Essayez un autre terme de recherche'
                : `Créez d'abord des fiches ${TAB_CONFIG[activeTab].label.toLowerCase()}`
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item, index) => item.id || `${activeTab}_${index}`}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

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
  },
  title: {
    ...typography.h2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...typography.body,
    fontWeight: '500',
  },
  itemSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
});
