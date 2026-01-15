/**
 * CollectionDetailScreen - View and manage items in a collection
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { TabIcon } from '../components/TabIcons';
import { showConfirm, showError } from '../lib/alert';
import {
  getCollection,
  getCollectionItems,
  removeFromCollection,
} from '../lib/knowledge/collections.service';
import type { Collection, CollectionItem } from '../types/collections';

type Props = NativeStackScreenProps<RootStackParamList, 'CollectionDetail'>;

interface SectionData {
  title: string;
  iconName: 'Genes' | 'Articles' | 'Researchers' | 'Conferences';
  data: CollectionItem[];
}

export function CollectionDetailScreen({ navigation, route }: Props) {
  const { collectionId } = route.params;
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [collectionData, itemsData] = await Promise.all([
        getCollection(collectionId),
        getCollectionItems(collectionId),
      ]);
      setCollection(collectionData);
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group items by entity type
  const sections: SectionData[] = React.useMemo(() => {
    const grouped: Record<string, CollectionItem[]> = {};
    
    for (const item of items) {
      if (!grouped[item.entity_type]) {
        grouped[item.entity_type] = [];
      }
      grouped[item.entity_type].push(item);
    }

    const typeConfig: Record<string, { title: string; iconName: 'Genes' | 'Articles' | 'Researchers' | 'Conferences' }> = {
      gene: { title: 'Gènes', iconName: 'Genes' },
      article: { title: 'Articles', iconName: 'Articles' },
      researcher: { title: 'Chercheurs', iconName: 'Researchers' },
      conference: { title: 'Conférences', iconName: 'Conferences' },
    };

    return Object.entries(grouped).map(([type, data]) => ({
      title: typeConfig[type]?.title || type,
      iconName: typeConfig[type]?.iconName || 'Genes',
      data,
    }));
  }, [items]);

  const handleRemove = async (item: CollectionItem) => {
    const confirmed = await showConfirm(
      'Retirer de la collection',
      `Retirer cet élément de "${collection?.name}" ?`,
      'Retirer',
      'Annuler',
      true
    );
    
    if (confirmed) {
      try {
        await removeFromCollection(
          item.collection_id,
          item.entity_type,
          item.entity_id
        );
        loadData();
      } catch (error: any) {
        showError('Erreur', error.message);
      }
    }
  };

  const navigateToEntity = (item: CollectionItem) => {
    switch (item.entity_type) {
      case 'gene':
        // entity_id format: "symbol:organism" or just "symbol"
        const [symbol, organism = 'E. coli'] = item.entity_id.split(':');
        navigation.navigate('GeneDetail', { symbol, organism });
        break;
      case 'article':
        navigation.navigate('ArticleDetail', { articleId: item.entity_id });
        break;
      case 'researcher':
        navigation.navigate('ResearcherDetail', { researcherId: item.entity_id });
        break;
      case 'conference':
        navigation.navigate('ConferenceDetail', { conferenceId: item.entity_id });
        break;
    }
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.bg }]}>
      <View style={styles.sectionLeft}>
        <TabIcon name={section.iconName} size={18} color={colors.accent} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {section.title}
        </Text>
      </View>
      <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
        {section.data.length}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: CollectionItem }) => (
    <Pressable
      style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
      onPress={() => navigateToEntity(item)}
      onLongPress={() => handleRemove(item)}
    >
      <View style={styles.itemInfo}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
          {item.display_name || item.entity_id}
        </Text>
        <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
          Ajouté le {new Date(item.created_at).toLocaleDateString('fr-FR')}
        </Text>
      </View>

      <Pressable
        style={[styles.removeButton, { backgroundColor: colors.bg }]}
        onPress={() => handleRemove(item)}
        hitSlop={8}
      >
        <Text style={{ color: colors.textMuted }}>✕</Text>
      </Pressable>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!collection) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textMuted }}>Collection introuvable</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <View style={[styles.colorDot, { backgroundColor: collection.color || colors.accent }]} />
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {collection.name}
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {items.length} élément{items.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Content */}
      {items.length === 0 ? (
        <View style={[styles.center, { flex: 1 }]}>
          <Text style={[styles.emptyIcon, { color: colors.textMuted }]}>📭</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Collection vide
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
            Ajoutez des gènes, articles ou chercheurs depuis leurs pages de détail
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: { paddingRight: spacing.md, paddingTop: 2 },
  backText: { fontSize: 24, fontWeight: '300' },
  headerInfo: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  title: { fontSize: 20, fontWeight: '600', flex: 1 },
  subtitle: { ...typography.bodySmall, marginTop: 2 },

  list: {
    padding: spacing.lg,
    paddingTop: 0,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionCount: {
    ...typography.caption,
  },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.xs,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  removeButton: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: 16, fontWeight: '500', marginBottom: spacing.xs },
  emptyHint: { ...typography.bodySmall, textAlign: 'center' },
});
