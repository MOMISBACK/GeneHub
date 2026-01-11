/**
 * RelationPicker - Modal pour ajouter des relations entre entités
 * Permet de lier chercheurs, articles, conférences, gènes
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { useTheme, typography, spacing, radius } from '../../theme';
import { Icon } from '../Icons';
import {
  listResearchers,
  listArticles,
  listConferences,
} from '../../lib/knowledge';
import type { Researcher, Article, Conference } from '../../types/knowledge';

type EntityType = 'researcher' | 'article' | 'conference' | 'gene';

interface Props {
  visible: boolean;
  onClose: () => void;
  entityType: EntityType;
  onSelect: (item: Researcher | Article | Conference | { symbol: string; organism: string }) => void;
  excludeIds?: string[];
  title?: string;
}

export function RelationPicker({ visible, onClose, entityType, onSelect, excludeIds = [], title }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const [search, setSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // For gene input (manual)
  const [geneSymbol, setGeneSymbol] = useState('');
  const [geneOrganism, setGeneOrganism] = useState('Escherichia coli');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      switch (entityType) {
        case 'researcher':
          data = await listResearchers();
          break;
        case 'article':
          data = await listArticles();
          break;
        case 'conference':
          data = await listConferences();
          break;
        case 'gene':
          // Gene is manual input, no list
          break;
      }
      setItems(data.filter((d) => !excludeIds.includes(d.id)));
    } catch (e) {
      console.error('Error loading items:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, excludeIds]);

  useEffect(() => {
    if (visible) {
      load();
      setSearch('');
      setGeneSymbol('');
    }
  }, [visible, load]);

  const filteredItems = items.filter((item) => {
    const searchLower = search.toLowerCase();
    if (entityType === 'researcher') {
      return item.name?.toLowerCase().includes(searchLower) ||
             item.institution?.toLowerCase().includes(searchLower);
    }
    if (entityType === 'article') {
      return item.title?.toLowerCase().includes(searchLower) ||
             item.journal?.toLowerCase().includes(searchLower);
    }
    if (entityType === 'conference') {
      return item.name?.toLowerCase().includes(searchLower) ||
             item.city?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const handleSelectGene = () => {
    if (!geneSymbol.trim()) return;
    onSelect({ symbol: geneSymbol.trim().toUpperCase(), organism: geneOrganism });
    onClose();
  };

  const getDisplayTitle = () => {
    if (title) return title;
    switch (entityType) {
      case 'researcher': return 'Ajouter un chercheur';
      case 'article': return 'Ajouter un article';
      case 'conference': return 'Ajouter une conférence';
      case 'gene': return 'Ajouter une protéine';
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    let primary = '';
    let secondary = '';

    if (entityType === 'researcher') {
      primary = item.name;
      secondary = item.institution || '';
    } else if (entityType === 'article') {
      primary = item.title;
      secondary = [item.journal, item.year].filter(Boolean).join(' • ');
    } else if (entityType === 'conference') {
      primary = item.name;
      secondary = [item.city, item.country].filter(Boolean).join(', ');
    }

    return (
      <Pressable
        style={[styles.item, { borderColor: colors.borderHairline }]}
        onPress={() => {
          onSelect(item);
          onClose();
        }}
      >
        <Text style={[styles.itemPrimary, { color: colors.text }]} numberOfLines={2}>
          {primary}
        </Text>
        {secondary ? (
          <Text style={[styles.itemSecondary, { color: colors.textMuted }]} numberOfLines={1}>
            {secondary}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderColor: colors.borderHairline }]}>
            <Text style={[styles.title, { color: colors.text }]}>{getDisplayTitle()}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {entityType === 'gene' ? (
            // Gene manual input
            <View style={styles.geneForm}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Symbole du gène</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.borderHairline, backgroundColor: colors.bg }]}
                placeholder="ex: dnaA, recA..."
                placeholderTextColor={colors.textMuted}
                value={geneSymbol}
                onChangeText={setGeneSymbol}
                autoCapitalize="characters"
                autoFocus
              />

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.md }]}>Organisme</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.borderHairline, backgroundColor: colors.bg }]}
                placeholder="Escherichia coli"
                placeholderTextColor={colors.textMuted}
                value={geneOrganism}
                onChangeText={setGeneOrganism}
              />

              <Pressable
                style={[
                  styles.addGeneBtn,
                  { backgroundColor: geneSymbol.trim() ? colors.accent : colors.bg },
                ]}
                onPress={handleSelectGene}
                disabled={!geneSymbol.trim()}
              >
                <Text style={[styles.addGeneBtnText, { color: geneSymbol.trim() ? colors.buttonPrimaryText : colors.textMuted }]}>
                  Ajouter
                </Text>
              </Pressable>
            </View>
          ) : (
            // List picker
            <>
              <View style={[styles.searchRow, { backgroundColor: colors.bg }]}>
                <Icon name="search" size={16} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Rechercher..."
                  placeholderTextColor={colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              ) : filteredItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    {search ? 'Aucun résultat' : 'Aucun élément disponible'}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredItems}
                  keyExtractor={(item) => item.id}
                  renderItem={renderItem}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '80%',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.sm,
  },
  list: {
    flex: 1,
  },
  item: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemPrimary: {
    ...typography.body,
    fontWeight: '500',
  },
  itemSecondary: {
    ...typography.caption,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
  },

  // Gene form
  geneForm: {
    padding: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  addGeneBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  addGeneBtnText: {
    ...typography.body,
    fontWeight: '600',
  },
});
