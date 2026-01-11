/**
 * CollectionsScreen - Manage and browse collections
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import {
  listCollections,
  createCollection,
  deleteCollection,
  toggleCollectionPin,
} from '../lib/knowledge/collections.service';
import type { Collection } from '../types/collections';
import { COLLECTION_COLORS } from '../types/collections';

type Props = NativeStackScreenProps<RootStackParamList, 'Collections'>;

export function CollectionsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(COLLECTION_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const loadCollections = useCallback(async () => {
    try {
      const data = await listCollections();
      setCollections(data);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    setCreating(true);
    try {
      await createCollection({
        name: newName.trim(),
        color: selectedColor,
        position: 0,
        is_pinned: false,
      });
      setNewName('');
      setShowCreateModal(false);
      loadCollections();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (collection: Collection) => {
    Alert.alert(
      'Supprimer la collection',
      `Supprimer "${collection.name}" ? Les éléments ne seront pas supprimés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCollection(collection.id);
              loadCollections();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const handleTogglePin = async (collection: Collection) => {
    try {
      await toggleCollectionPin(collection.id);
      loadCollections();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const renderCollection = ({ item }: { item: Collection }) => (
    <Pressable
      style={[styles.collectionCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
      onPress={() => navigation.navigate('CollectionDetail', { collectionId: item.id })}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.colorDot, { backgroundColor: item.color || colors.accent }]} />
      
      <View style={styles.collectionInfo}>
        <View style={styles.nameRow}>
          {item.is_pinned && <Text style={styles.pinIcon}>📌</Text>}
          <Text style={[styles.collectionName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        
        <Text style={[styles.itemCount, { color: colors.textMuted }]}>
          {item.item_count || 0} élément{(item.item_count || 0) !== 1 ? 's' : ''}
        </Text>
      </View>

      <Pressable
        style={styles.pinButton}
        onPress={() => handleTogglePin(item)}
        hitSlop={8}
      >
        <Text style={{ color: item.is_pinned ? colors.accent : colors.textMuted }}>
          {item.is_pinned ? '★' : '☆'}
        </Text>
      </Pressable>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.accent }]}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Collections</Text>
        <Pressable onPress={() => setShowCreateModal(true)} style={styles.addButton}>
          <Text style={[styles.addText, { color: colors.accent }]}>+</Text>
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : collections.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyIcon, { color: colors.textMuted }]}>📁</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Aucune collection
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
            Créez une collection pour organiser vos gènes, articles et chercheurs
          </Text>
          <Pressable
            style={[styles.createButton, { backgroundColor: colors.accent }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>Créer une collection</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={renderCollection}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCreateModal(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Nouvelle collection
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.borderHairline }]}
              placeholder="Nom de la collection"
              placeholderTextColor={colors.textMuted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <Text style={[styles.colorLabel, { color: colors.textMuted }]}>Couleur</Text>
            <View style={styles.colorRow}>
              {COLLECTION_COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.bg }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Annuler</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={handleCreate}
                disabled={creating || !newName.trim()}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Créer</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: { paddingRight: spacing.md },
  backText: { fontSize: 24, fontWeight: '300' },
  title: { flex: 1, fontSize: 20, fontWeight: '600' },
  addButton: { paddingLeft: spacing.md },
  addText: { fontSize: 28, fontWeight: '300' },

  list: {
    padding: spacing.lg,
  },

  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  collectionInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pinIcon: { fontSize: 12 },
  collectionName: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemCount: {
    ...typography.caption,
    marginTop: 2,
  },
  pinButton: {
    padding: spacing.sm,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: 16, fontWeight: '500', marginBottom: spacing.xs },
  emptyHint: { ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.lg },
  createButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  createButtonText: { color: '#fff', fontWeight: '600' },

  // Modal
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
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  input: {
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  colorLabel: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
  },
  modalButtonText: {
    fontWeight: '600',
  },
});
