/**
 * TagCreateModal - Modal pour créer un tag (label simple ou lien vers entité)
 * 
 * Tag Naming Convention:
 * - Labels: user-defined name (lowercase)
 * - Genes: "symbol-orgcode" (e.g., "cnox-eco" for CnoX in E. coli)
 * - Others: entity name prefix (auto-generated)
 * 
 * Entity ID Format (all lowercase for consistency):
 * - Genes: "symbol_organism" (e.g., "cnox_escherichia coli")
 * - Others: UUID of the entity
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { useTheme, typography, spacing, radius } from '../../theme';
import { Icon } from '../Icons';
import type { Tag, TagInsert, EntityType } from '../../types/knowledge';
import { getOrCreateTagWithData, listResearchers, listArticles, listConferences } from '../../lib/knowledge';
import { ORGANISMS, getOrganismCode } from '../../data/organisms';

// Auto-assigned colors by entity type
const TYPE_COLORS: Record<TagType, string> = {
  label: '#6366f1',      // indigo (default for labels)
  gene: '#3b82f6',       // blue
  researcher: '#22c55e', // green
  article: '#ec4899',    // pink
  conference: '#f59e0b', // amber
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (tag: Tag) => void;
}

type TagType = 'label' | EntityType;

const TAG_TYPES: { value: TagType; label: string; icon: string }[] = [
  { value: 'gene', label: 'Gène', icon: 'dna' },
  { value: 'researcher', label: 'Chercheur', icon: 'people' },
  { value: 'article', label: 'Article', icon: 'doc' },
  { value: 'conference', label: 'Conférence', icon: 'calendar' },
  { value: 'label', label: '#Label', icon: 'tag' },
];

interface EntityItem {
  id: string;
  name: string;
  subtitle?: string;
  year?: number; // For articles
}

// Local copy of organisms to avoid readonly type issues
const ORGANISM_OPTIONS = ORGANISMS.map(o => ({ id: o.id, name: o.name, shortName: o.shortName }));

export function TagCreateModal({ visible, onClose, onCreated }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const [name, setName] = useState('');
  const [tagType, setTagType] = useState<TagType>('gene');
  const [selectedColor, setSelectedColor] = useState(TYPE_COLORS.gene);
  const [saving, setSaving] = useState(false);

  // Entity selection
  const [entitySearch, setEntitySearch] = useState('');
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntityItem | null>(null);

  // Organism selection for gene tags
  const [selectedOrganism, setSelectedOrganism] = useState(ORGANISM_OPTIONS[0].name);
  const [showOrganismPicker, setShowOrganismPicker] = useState(false);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setName('');
      setTagType('gene');
      setSelectedColor(TYPE_COLORS.gene);
      setSelectedEntity(null);
      setEntitySearch('');
      setEntities([]);
      setSelectedOrganism(ORGANISM_OPTIONS[0].name);
      setShowOrganismPicker(false);
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
          year: a.year,
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
    // Auto-assign color based on type
    setSelectedColor(TYPE_COLORS[tagType]);
  }, [tagType, loadEntities]);

  const filteredEntities = entities.filter((e) =>
    e.name.toLowerCase().includes(entitySearch.toLowerCase())
  );

  // Generate unique tag name for genes: "symbol-orgcode"
  const getGeneTagName = (symbol: string, organism: string): string => {
    const orgCode = getOrganismCode(organism);
    return `${symbol.trim().toLowerCase()}-${orgCode}`;
  };

  // Extract last name from full name ("Dr Emile Dupuy" -> "dupuy")
  const getLastName = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1].toLowerCase();
  };

  // Generate tag name for article: "author2023"
  const getArticleTagName = (title: string, year?: number): string => {
    // Extract first word from title as author name approximation
    const firstWord = title.trim().split(/\s+/)[0].toLowerCase();
    // Remove special characters
    const cleanWord = firstWord.replace(/[^a-z]/gi, '');
    return year ? `${cleanWord}${year}` : cleanWord;
  };

  // Get selected organism short name
  const getSelectedOrganismShort = (): string => {
    const org = ORGANISM_OPTIONS.find(o => o.name === selectedOrganism);
    return org?.shortName || selectedOrganism;
  };

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
        // Tag name includes organism code for uniqueness: "cnox-eco"
        tagData.name = getGeneTagName(name, selectedOrganism);
        // Entity ID uses lowercase format: "cnox_escherichia coli"
        tagData.entity_id = `${name.trim().toLowerCase()}_${selectedOrganism.toLowerCase()}`;
      } else if (tagType === 'researcher' && selectedEntity) {
        tagData.entity_type = 'researcher';
        tagData.entity_id = selectedEntity.id;
        // Tag name is last name: "Dr Emile Dupuy" -> "dupuy"
        tagData.name = getLastName(selectedEntity.name);
      } else if (tagType === 'article' && selectedEntity) {
        tagData.entity_type = 'article';
        tagData.entity_id = selectedEntity.id;
        // Tag name is "author2023" format
        tagData.name = getArticleTagName(selectedEntity.name, selectedEntity.year);
      } else if (tagType === 'conference' && selectedEntity) {
        tagData.entity_type = 'conference';
        tagData.entity_id = selectedEntity.id;
        // Keep user-provided name for conferences
        tagData.name = name.trim().toLowerCase();
      }

      // Use getOrCreateTagWithData to avoid duplicate errors
      const tag = await getOrCreateTagWithData(tagData);
      onCreated(tag);
      onClose();
    } catch (e: any) {
      console.error('Error creating tag:', e);
    } finally {
      setSaving(false);
    }
  };

  // Preview the tag name that will be created
  const getPreviewTagName = (): string => {
    if (tagType === 'gene' && name.trim()) {
      return getGeneTagName(name, selectedOrganism);
    }
    if (tagType === 'researcher' && selectedEntity) {
      return getLastName(selectedEntity.name);
    }
    if (tagType === 'article' && selectedEntity) {
      return getArticleTagName(selectedEntity.name, selectedEntity.year);
    }
    return name.trim().toLowerCase();
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

          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
                    { backgroundColor: tagType === type.value ? TYPE_COLORS[type.value] : colors.bg },
                  ]}
                  onPress={() => setTagType(type.value)}
                >
                  <Icon
                    name={type.icon as any}
                    size={14}
                    color={tagType === type.value ? '#fff' : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      { color: tagType === type.value ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Organism Selection for gene tags - Simple dropdown */}
            {tagType === 'gene' && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Organisme
                </Text>
                <Pressable 
                  style={[styles.dropdown, { backgroundColor: colors.bg, borderColor: colors.border }]}
                  onPress={() => setShowOrganismPicker(!showOrganismPicker)}
                >
                  <Text style={[styles.dropdownText, { color: colors.text }]}>
                    {getSelectedOrganismShort()}
                  </Text>
                  <Icon 
                    name={showOrganismPicker ? 'chevronUp' : 'chevronDown'} 
                    size={16} 
                    color={colors.textMuted} 
                  />
                </Pressable>
                
                {showOrganismPicker && (
                  <View style={[styles.dropdownList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {ORGANISM_OPTIONS.map((org) => (
                        <Pressable
                          key={org.id}
                          style={[
                            styles.dropdownItem,
                            selectedOrganism === org.name && { backgroundColor: colors.accent + '20' },
                          ]}
                          onPress={() => {
                            setSelectedOrganism(org.name);
                            setShowOrganismPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              { color: selectedOrganism === org.name ? colors.accent : colors.text },
                            ]}
                          >
                            {org.shortName}
                          </Text>
                          <Text style={[styles.dropdownItemSubtext, { color: colors.textMuted }]}>
                            {org.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}

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
                      <View style={styles.entityListContainer}>
                        {filteredEntities.slice(0, 5).map((item) => (
                          <Pressable
                            key={item.id}
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
                        ))}
                        {filteredEntities.length === 0 && (
                          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            Aucun résultat
                          </Text>
                        )}
                      </View>
                    )}
                  </>
                )}
              </>
            )}

            {/* Preview */}
            <View style={styles.preview}>
              <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Aperçu:</Text>
              <View style={[styles.previewTag, { backgroundColor: selectedColor + '20', borderColor: selectedColor }]}>
                <Text style={[styles.previewTagText, { color: selectedColor }]}>
                  #{getPreviewTagName() || 'tag'}
                </Text>
              </View>
            </View>

            {/* Actions - Inside scroll for accessibility */}
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
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={[styles.createText, { color: canCreate ? '#000' : colors.textMuted }]}>
                    Créer
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
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
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'android' ? spacing.xxl : 0,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  scrollContent: {
    flexGrow: 0,
  },
  scrollContentContainer: {
    paddingBottom: spacing.xl,
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
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropdownText: {
    ...typography.body,
  },
  dropdownList: {
    marginTop: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropdownItemText: {
    ...typography.body,
    fontWeight: '500',
  },
  dropdownItemSubtext: {
    ...typography.caption,
    marginTop: 2,
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
  entityListContainer: {
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
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
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
    paddingBottom: spacing.md,
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
