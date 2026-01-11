/**
 * AddToCollectionButton - Quick action to add entity to collection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import { useTheme, typography, spacing, radius } from '../../theme';
import {
  listCollections,
  createCollection,
  addToCollection,
  removeFromCollection,
  getCollectionsForEntity,
} from '../../lib/knowledge/collections.service';
import type { Collection, CollectionEntityType } from '../../types/collections';

interface Props {
  entityType: CollectionEntityType;
  entityId: string;
  displayName?: string;
}

export function AddToCollectionButton({ entityType, entityId, displayName }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const [showModal, setShowModal] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCollections, entityCollections] = await Promise.all([
        listCollections(),
        getCollectionsForEntity(entityType, entityId),
      ]);
      setCollections(allCollections);
      setSelectedIds(new Set(entityCollections.map(c => c.id)));
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      loadData();
    }
  }, [showModal]);

  const handleToggle = async (collection: Collection) => {
    const wasSelected = selectedIds.has(collection.id);

    // Optimistic update
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (wasSelected) {
        next.delete(collection.id);
      } else {
        next.add(collection.id);
      }
      return next;
    });

    try {
      if (wasSelected) {
        await removeFromCollection(collection.id, entityType, entityId);
      } else {
        await addToCollection({
          collection_id: collection.id,
          entity_type: entityType,
          entity_id: entityId,
          display_name: displayName,
        });
      }
    } catch (error: any) {
      // Revert on error
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (wasSelected) {
          next.add(collection.id);
        } else {
          next.delete(collection.id);
        }
        return next;
      });
      console.error('Error toggling collection:', error);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    setCreating(true);
    try {
      const collection = await createCollection({
        name: newName.trim(),
        position: 0,
        is_pinned: false,
      });
      
      // Add to this entity
      await addToCollection({
        collection_id: collection.id,
        entity_type: entityType,
        entity_id: entityId,
        display_name: displayName,
      });

      setNewName('');
      setCollections(prev => [...prev, { ...collection, item_count: 1 }]);
      setSelectedIds(prev => new Set([...prev, collection.id]));
    } catch (error: any) {
      console.error('Error creating collection:', error);
    } finally {
      setCreating(false);
    }
  };

  const renderCollection = ({ item }: { item: Collection }) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <Pressable
        style={[styles.collectionRow, { borderColor: colors.borderHairline }]}
        onPress={() => handleToggle(item)}
      >
        <View style={[styles.colorDot, { backgroundColor: item.color || colors.accent }]} />
        <Text style={[styles.collectionName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={[
          styles.checkbox,
          { borderColor: colors.borderHairline },
          isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
        ]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </Pressable>
    );
  };

  const hasSelection = selectedIds.size > 0;

  return (
    <>
      <Pressable
        style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.buttonIcon}>{hasSelection ? '📁' : '➕'}</Text>
        <Text style={[styles.buttonText, { color: colors.text }]}>
          {hasSelection ? `${selectedIds.size} collection${selectedIds.size > 1 ? 's' : ''}` : 'Collection'}
        </Text>
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Ajouter à une collection
            </Text>

            {loading ? (
              <ActivityIndicator style={styles.loader} color={colors.accent} />
            ) : (
              <>
                {collections.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    Aucune collection. Créez-en une !
                  </Text>
                ) : (
                  <FlatList
                    data={collections}
                    keyExtractor={item => item.id}
                    renderItem={renderCollection}
                    style={styles.list}
                    showsVerticalScrollIndicator={false}
                  />
                )}

                {/* Create new */}
                <View style={[styles.createRow, { borderColor: colors.borderHairline }]}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.borderHairline }]}
                    placeholder="Nouvelle collection..."
                    placeholderTextColor={colors.textMuted}
                    value={newName}
                    onChangeText={setNewName}
                    onSubmitEditing={handleCreate}
                    returnKeyType="done"
                  />
                  <Pressable
                    style={[styles.createButton, { backgroundColor: colors.accent }]}
                    onPress={handleCreate}
                    disabled={creating || !newName.trim()}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.createButtonText}>+</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}

            <Pressable
              style={[styles.doneButton, { backgroundColor: colors.bg }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={[styles.doneText, { color: colors.text }]}>Terminé</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  buttonIcon: { fontSize: 14 },
  buttonText: { fontSize: 13, fontWeight: '500' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    maxHeight: 450,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  loader: {
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.bodySmall,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  list: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  collectionName: {
    flex: 1,
    fontSize: 15,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  createRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },

  doneButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    marginTop: spacing.md,
  },
  doneText: {
    fontWeight: '600',
  },
});
