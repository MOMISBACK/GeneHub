/**
 * TagCreateModal - Modal pour créer un tag (label simple ou lien vers entité)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { useTheme, typography, spacing, radius } from '../../theme';
import { Icon } from '../Icons';
import type { Tag, TagInsert, EntityType, Researcher, Article, Conference } from '../../types/knowledge';
import { createTag, listResearchers, listArticles, listConferences } from '../../lib/knowledge';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (tag: Tag) => void;
}

type TagType = 'label' | EntityType;

const TAG_TYPES: { value: TagType; label: string; icon: string }[] = [
  { value: 'label', label: 'Label', icon: 'tag' },
  { value: 'gene', label: 'Gène', icon: 'dna' },
  { value: 'researcher', label: 'Chercheur', icon: 'people' },
  { value: 'article', label: 'Article', icon: 'doc' },
  { value: 'conference', label: 'Conférence', icon: 'calendar' },
];

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
];

interface EntityItem {
  id: string;
  name: string;
  subtitle?: string;
}

export function TagCreateModal({ visible, onClose, onCreated }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const [name, setName] = useState('');
  const [tagType, setTagType] = useState<TagType>('label');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Entity selection
  const [entitySearch, setEntitySearch] = useState('');
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntityItem | null>(null);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setName('');
      setTagType('label');
      setSelectedColor(COLORS[0]);
      setSelectedEntity(null);
      setEntitySearch('');
      setEntities([]);
    }
  }, [visible]);

  // Load entities when type changes
  const loadEntities = useCallback(async () => {
    if (tagType === 'label' || tagType === 'gene') return;

    setLoadingEntities(true);
    try {
      let items: EntityItem[] = [];

      if (tagType === 'researcher') {
        const researchers = await listResearchers();
        items = researchers.map((r) => ({
          id: r.id,
          name: r.name,
          subtitle: r.institution,
        }));
      } else if (tagType === 'article') {
        const articles = await listArticles();
        items = articles.map((a) => ({
          id: a.id,
          name: a.title,
          subtitle: a.journal ? `${a.journal} (${a.year})` : undefined,
        }));
      } else if (tagType === 'conference') {
        const conferences = await listConferences();
        items = conferences.map((c) => ({
          id: c.id,
          name: c.name,
          subtitle: c.location,
        }));
      }

      setEntities(items);
    } catch (e) {
      console.error('Error loading entities:', e);
    } finally {
      setLoadingEntities(false);
    }
  }, [tagType]);

  useEffect(() => {
    if (tagType !== 'label' && tagType !== 'gene') {
      loadEntities();
    }
    setSelectedEntity(null);
  }, [tagType, loadEntities]);

  const filteredEntities = entities.filter((e) =>
    e.name.toLowerCase().includes(entitySearch.toLowerCase())
  );

  const handleCreate = async () => {
    if (!name.trim()) return;

    // For entity tags (except gene), need to select an entity
    if (tagType !== 'label' && tagType !== 'gene' && !selectedEntity) {
      return;
    }

    setSaving(true);
    try {
      const tagData: TagInsert = {
        name: name.trim().toLowerCase(),
        color: selectedColor,
      };

      // Add entity link if not a simple label
      if (tagType === 'gene') {
        tagData.entity_type = 'gene';
        tagData.entity_id = name.trim(); // Gene symbol as ID
      } else if (tagType !== 'label' && selectedEntity) {
        tagData.entity_type = tagType;
        tagData.entity_id = selectedEntity.id;
      }

      const tag = await createTag(tagData);
      onCreated(tag);
      onClose();
    } catch (e: any) {
      console.error('Error creating tag:', e);
    } finally {
      setSaving(false);
    }
  };

  const canCreate = name.trim() && (
    tagType === 'label' ||
    tagType === 'gene' ||
    selectedEntity
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Nouveau Tag</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Tag Name */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Nom du tag</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            placeholder={tagType === 'gene' ? 'ex: lacZ, recA...' : 'ex: important, à-revoir...'}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            autoFocus
          />

          {/* Tag Type */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
          <View style={styles.typeRow}>
            {TAG_TYPES.map((type) => (
              <Pressable
                key={type.value}
                style={[
                  styles.typeBtn,
                  { backgroundColor: tagType === type.value ? colors.accent : colors.bg },
                ]}
                onPress={() => setTagType(type.value)}
              >
                <Icon
                  name={type.icon as any}
                  size={14}
                  color={tagType === type.value ? colors.buttonPrimaryText : colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeText,
                    { color: tagType === type.value ? colors.buttonPrimaryText : colors.textSecondary },
                  ]}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Entity Selection (for non-label, non-gene types) */}
          {tagType !== 'label' && tagType !== 'gene' && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Sélectionner {tagType === 'researcher' ? 'le chercheur' : tagType === 'article' ? "l'article" : 'la conférence'}
              </Text>
              
              {selectedEntity ? (
                <View style={[styles.selectedEntity, { backgroundColor: colors.bg, borderColor: colors.accent }]}>
                  <Text style={[styles.selectedName, { color: colors.text }]}>{selectedEntity.name}</Text>
                  <Pressable onPress={() => setSelectedEntity(null)}>
                    <Icon name="close" size={16} color={colors.textMuted} />
                  </Pressable>
                </View>
              ) : (
                <>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                    placeholder="Rechercher..."
                    placeholderTextColor={colors.textMuted}
                    value={entitySearch}
                    onChangeText={setEntitySearch}
                  />
                  
                  {loadingEntities ? (
                    <ActivityIndicator style={styles.loader} color={colors.accent} />
                  ) : (
                    <FlatList
                      data={filteredEntities.slice(0, 5)}
                      keyExtractor={(item) => item.id}
                      style={styles.entityList}
                      renderItem={({ item }) => (
                        <Pressable
                          style={[styles.entityItem, { backgroundColor: colors.bg }]}
                          onPress={() => {
                            setSelectedEntity(item);
                            if (!name.trim()) {
                              // Auto-fill name from entity
                              setName(item.name.split(' ')[0].toLowerCase());
                            }
                          }}
                        >
                          <Text style={[styles.entityName, { color: colors.text }]}>{item.name}</Text>
                          {item.subtitle && (
                            <Text style={[styles.entitySubtitle, { color: colors.textMuted }]}>{item.subtitle}</Text>
                          )}
                        </Pressable>
                      )}
                      ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                          Aucun résultat
                        </Text>
                      }
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* Color */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Couleur</Text>
          <View style={styles.colorRow}>
            {COLORS.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorBtn,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorBtnSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Icon name="check" size={14} color="#fff" />
                )}
              </Pressable>
            ))}
          </View>

          {/* Preview */}
          <View style={styles.preview}>
            <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Aperçu:</Text>
            <View style={[styles.previewTag, { backgroundColor: selectedColor + '20', borderColor: selectedColor }]}>
              <Text style={[styles.previewTagText, { color: selectedColor }]}>
                #{name || 'tag'}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelBtn, { backgroundColor: colors.bg }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[
                styles.createBtn,
                { backgroundColor: canCreate ? colors.accent : colors.bg },
              ]}
              onPress={handleCreate}
              disabled={!canCreate || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.buttonPrimaryText} />
              ) : (
                <Text style={[styles.createText, { color: canCreate ? colors.buttonPrimaryText : colors.textMuted }]}>
                  Créer
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  typeText: {
    ...typography.caption,
    fontWeight: '500',
  },
  selectedEntity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  selectedName: {
    ...typography.body,
    fontWeight: '500',
    flex: 1,
  },
  entityList: {
    maxHeight: 150,
    marginTop: spacing.sm,
  },
  entityItem: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  entityName: {
    ...typography.body,
  },
  entitySubtitle: {
    ...typography.caption,
  },
  loader: {
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  colorBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBtnSelected: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  previewLabel: {
    ...typography.caption,
  },
  previewTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  previewTagText: {
    ...typography.caption,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.body,
    fontWeight: '600',
  },
  createBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  createText: {
    ...typography.body,
    fontWeight: '600',
  },
});
