/**
 * ResearchersScreen - Liste des chercheurs (mode avancé)
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MainTabsParamList, RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { useI18n } from '../i18n';
import { Icon } from '../components/Icons';
import { listResearchers, createResearcher } from '../lib/knowledge';
import type { Researcher, ResearcherInsert } from '../types/knowledge';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Researchers'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ResearchersScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listResearchers();
      setResearchers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [load, navigation]);

  const filteredResearchers = searchQuery.trim()
    ? researchers.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.institution?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : researchers;

  const handleAdd = async (data: ResearcherInsert) => {
    try {
      await createResearcher(data);
      setShowAddModal(false);
      load();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Chercheurs</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.advancedToggle, { backgroundColor: advancedMode ? colors.accent : colors.surface, borderColor: colors.borderHairline }]}
            onPress={() => setAdvancedMode((prev) => !prev)}
          >
            <Text style={[styles.advancedToggleText, { color: advancedMode ? '#000' : colors.textMuted }]}>Avancé</Text>
          </Pressable>
          {advancedMode && (
            <Pressable
              style={[styles.addBtn, { backgroundColor: colors.accent }]}
              onPress={() => setShowAddModal(true)}
            >
              <Icon name="add" size={18} color={colors.buttonPrimaryText ?? '#fff'} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
        <Icon name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Rechercher..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Icon name="close" size={14} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: colors.accent }]} onPress={load}>
            <Text style={[styles.retryBtnText, { color: colors.buttonPrimaryText }]}>{t.common.retry}</Text>
          </Pressable>
        </View>
      ) : filteredResearchers.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {searchQuery ? 'Aucun résultat' : 'Aucun chercheur'}
          </Text>
          {!searchQuery && (
            <Pressable
              style={[styles.addFirstBtn, { borderColor: colors.accent }]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={[styles.addFirstText, { color: colors.accent }]}>+ Ajouter un chercheur</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredResearchers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
              onPress={() => navigation.navigate('ResearcherDetail', { researcherId: item.id })}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
                {item.institution && (
                  <Text style={[styles.cardInstitution, { color: colors.textMuted }]}>
                    {item.institution}{item.city ? `, ${item.city}` : ''}
                  </Text>
                )}
                {item.specialization && (
                  <View style={[styles.specBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.specText, { color: colors.textSecondary }]}>{item.specialization}</Text>
                  </View>
                )}
              </View>
              <Icon name="chevronRight" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}

      {/* Add Modal */}
      <AddResearcherModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAdd}
        colors={colors}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Modal Component
// ─────────────────────────────────────────────────────────────────────────────

function AddResearcherModal({
  visible,
  onClose,
  onSubmit,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ResearcherInsert) => void;
  colors: any;
}) {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setInstitution('');
    setCity('');
    setEmail('');
    setSpecialization('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        institution: institution.trim() || undefined,
        city: city.trim() || undefined,
        email: email.trim() || undefined,
        specialization: specialization.trim() || undefined,
      });
      reset();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.modalContainer, { backgroundColor: colors.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalHeader, { borderBottomColor: colors.borderHairline }]}>
          <Pressable onPress={onClose}>
            <Text style={[styles.modalCancel, { color: colors.textMuted }]}>Annuler</Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Nouveau chercheur</Text>
          <Pressable onPress={handleSubmit} disabled={saving}>
            <Text style={[styles.modalSave, { color: colors.accent, opacity: saving ? 0.5 : 1 }]}>
              {saving ? '...' : 'Ajouter'}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.textMuted }]}>Nom *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderHairline }]}
            placeholder="Dr. Marie Dubois"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>Institution</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderHairline }]}
            placeholder="Institut Pasteur"
            placeholderTextColor={colors.textMuted}
            value={institution}
            onChangeText={setInstitution}
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>Ville</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderHairline }]}
            placeholder="Paris"
            placeholderTextColor={colors.textMuted}
            value={city}
            onChangeText={setCity}
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderHairline }]}
            placeholder="marie.dubois@pasteur.fr"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>Spécialisation</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderHairline }]}
            placeholder="Membrane externe et porines"
            placeholderTextColor={colors.textMuted}
            value={specialization}
            onChangeText={setSpecialization}
          />

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  advancedToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  advancedToggleText: {
    ...typography.caption,
    fontWeight: '600',
  },
  title: {
    ...typography.h1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  retryBtnText: {
    ...typography.body,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  addFirstBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  addFirstText: {
    ...typography.body,
    fontWeight: '500',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    ...typography.body,
    fontWeight: '600',
  },
  cardInstitution: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  specBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  specText: {
    ...typography.caption,
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancel: {
    ...typography.body,
  },
  modalTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  modalSave: {
    ...typography.body,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    ...typography.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
