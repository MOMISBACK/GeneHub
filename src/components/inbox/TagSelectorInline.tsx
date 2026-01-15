/**
 * TagSelectorInline - Inline tag selector for Inbox quick capture
 * Allows selecting entity-linked tags for auto-linking notes
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { useTheme, typography, spacing, radius } from '../../theme';
import { Icon } from '../Icons';
import { listTags } from '../../lib/knowledge';
import type { Tag } from '../../types/knowledge';

interface Props {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  maxTags?: number;
  refreshKey?: number;
}

export function TagSelectorInline({ selectedTags, onTagsChange, maxTags = 5, refreshKey }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Load tags on mount
  useEffect(() => {
    const loadTags = async () => {
      setLoading(true);
      try {
        const tags = await listTags();
        // Prioritize entity-linked tags
        const sorted = tags.sort((a, b) => {
          if (a.entity_type && !b.entity_type) return -1;
          if (!a.entity_type && b.entity_type) return 1;
          return a.name.localeCompare(b.name);
        });
        setAvailableTags(sorted);
      } catch (e) {
        console.error('Error loading tags:', e);
      } finally {
        setLoading(false);
      }
    };
    loadTags();
  }, [refreshKey]);

  const toggleTag = useCallback((tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else if (selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, tag]);
    }
  }, [selectedTags, onTagsChange, maxTags]);

  const getEntityIcon = (entityType?: string | null) => {
    switch (entityType) {
      case 'gene': return 'dna';
      case 'researcher': return 'people';
      case 'article': return 'doc';
      case 'conference': return 'calendar';
      default: return 'tag';
    }
  };

  // Show collapsed view with selected tags
  if (!expanded) {
    return (
      <View style={styles.container}>
        <Pressable
          style={[styles.expandBtn, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
          onPress={() => setExpanded(true)}
        >
          <Icon name="tag" size={14} color={colors.textMuted} />
          <Text style={[styles.expandBtnText, { color: colors.textMuted }]}>
            {selectedTags.length > 0 
              ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''}`
              : 'Ajouter tags (auto-link)'
            }
          </Text>
          <Icon name="chevronDown" size={12} color={colors.textMuted} />
        </Pressable>
        
        {/* Show selected tags */}
        {selectedTags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedRow}>
            {selectedTags.map(tag => (
              <Pressable
                key={tag.id}
                style={[
                  styles.selectedTag,
                  { backgroundColor: (tag.color || colors.accent) + '30', borderColor: tag.color || colors.accent }
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Icon name={getEntityIcon(tag.entity_type)} size={10} color={tag.color || colors.accent} />
                <Text style={[styles.selectedTagText, { color: tag.color || colors.accent }]}>
                  {tag.name}
                </Text>
                <Icon name="close" size={10} color={tag.color || colors.accent} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  // Expanded view with all tags
  return (
    <View style={[styles.expandedContainer, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.text }]}>
          Tags (auto-link vers fiches)
        </Text>
        <Pressable onPress={() => setExpanded(false)}>
          <Icon name="chevronUp" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Info */}
      <Text style={[styles.infoText, { color: colors.textMuted }]}>
        Les tags liés à des fiches créeront automatiquement une note dans cette fiche.
      </Text>

      {/* Tags list */}
      {loading ? (
        <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: spacing.md }} />
      ) : availableTags.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Aucun tag disponible. Créez des tags depuis les fiches.
        </Text>
      ) : (
        <ScrollView style={styles.tagsList} showsVerticalScrollIndicator={false}>
          {/* Entity-linked tags */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            Tags liés à des fiches
          </Text>
          <View style={styles.tagsRow}>
            {availableTags.filter(t => t.entity_type).map(tag => {
              const isSelected = selectedTags.some(t => t.id === tag.id);
              return (
                <Pressable
                  key={tag.id}
                  style={[
                    styles.tag,
                    { 
                      backgroundColor: isSelected ? (tag.color || colors.accent) + '30' : colors.bg,
                      borderColor: isSelected ? (tag.color || colors.accent) : colors.borderHairline,
                    }
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Icon 
                    name={getEntityIcon(tag.entity_type)} 
                    size={12} 
                    color={isSelected ? (tag.color || colors.accent) : colors.textMuted} 
                  />
                  <Text style={[
                    styles.tagText, 
                    { color: isSelected ? (tag.color || colors.accent) : colors.text }
                  ]}>
                    {tag.name}
                  </Text>
                  {isSelected && <Icon name="check" size={12} color={tag.color || colors.accent} />}
                </Pressable>
              );
            })}
          </View>

          {/* Simple tags */}
          {availableTags.filter(t => !t.entity_type).length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: spacing.md }]}>
                Tags simples
              </Text>
              <View style={styles.tagsRow}>
                {availableTags.filter(t => !t.entity_type).map(tag => {
                  const isSelected = selectedTags.some(t => t.id === tag.id);
                  return (
                    <Pressable
                      key={tag.id}
                      style={[
                        styles.tag,
                        { 
                          backgroundColor: isSelected ? (tag.color || colors.accent) + '30' : colors.bg,
                          borderColor: isSelected ? (tag.color || colors.accent) : colors.borderHairline,
                        }
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text style={[
                        styles.tagText, 
                        { color: isSelected ? (tag.color || colors.accent) : colors.text }
                      ]}>
                        #{tag.name}
                      </Text>
                      {isSelected && <Icon name="check" size={12} color={tag.color || colors.accent} />}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  expandBtnText: {
    ...typography.caption,
    flex: 1,
  },
  selectedRow: {
    marginTop: spacing.xs,
    flexGrow: 0,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginRight: spacing.xs,
    gap: 4,
  },
  selectedTagText: {
    ...typography.caption,
    fontWeight: '500',
  },
  expandedContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  infoText: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.caption,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  tagsList: {
    maxHeight: 180,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: 4,
  },
  tagText: {
    ...typography.caption,
    fontWeight: '500',
  },
});
