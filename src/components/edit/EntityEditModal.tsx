/**
 * EntityEditModal - Modal d'édition générique pour les entités
 * Chercheurs, Articles, Conférences
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { useTheme, typography, spacing, radius } from '../../theme';
import { Icon } from '../Icons';
import {
  updateResearcher,
  deleteResearcher,
  updateArticle,
  deleteArticle,
  updateConference,
  deleteConference,
} from '../../lib/knowledge';
import type { Researcher, Article, Conference } from '../../types/knowledge';

type EntityType = 'researcher' | 'article' | 'conference';
type Entity = Researcher | Article | Conference;

interface Props {
  visible: boolean;
  onClose: () => void;
  entityType: EntityType;
  entity: Entity | null;
  onSaved: () => void;
  onDeleted?: () => void;
}

export function EntityEditModal({ visible, onClose, entityType, entity, onSaved, onDeleted }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entity && visible) {
      // Initialize form with entity data
      const data: Record<string, string> = {};
      Object.entries(entity).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          data[key] = String(value ?? '');
        }
      });
      setFormData(data);
    }
  }, [entity, visible]);

  const handleSave = async () => {
    if (!entity) return;
    setSaving(true);
    try {
      switch (entityType) {
        case 'researcher':
          await updateResearcher(entity.id, {
            name: formData.name,
            institution: formData.institution || undefined,
            city: formData.city || undefined,
            country: formData.country || undefined,
            email: formData.email || undefined,
            specialization: formData.specialization || undefined,
            orcid: formData.orcid || undefined,
          });
          break;
        case 'article':
          await updateArticle(entity.id, {
            title: formData.title,
            journal: formData.journal || undefined,
            year: formData.year ? parseInt(formData.year, 10) : undefined,
            doi: formData.doi || undefined,
            pmid: formData.pmid || undefined,
            abstract: formData.abstract || undefined,
          });
          break;
        case 'conference':
          await updateConference(entity.id, {
            name: formData.name,
            date: formData.date || undefined,
            end_date: formData.end_date || undefined,
            city: formData.city || undefined,
            country: formData.country || undefined,
            website: formData.website || undefined,
            description: formData.description || undefined,
          });
          break;
      }
      onSaved();
      onClose();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmer la suppression',
      'Cette action est irréversible. Voulez-vous vraiment supprimer cet élément?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (!entity) return;
            setSaving(true);
            try {
              switch (entityType) {
                case 'researcher':
                  await deleteResearcher(entity.id);
                  break;
                case 'article':
                  await deleteArticle(entity.id);
                  break;
                case 'conference':
                  await deleteConference(entity.id);
                  break;
              }
              onDeleted?.();
              onClose();
            } catch (e: any) {
              Alert.alert('Erreur', e.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const getTitle = () => {
    switch (entityType) {
      case 'researcher': return 'Modifier le chercheur';
      case 'article': return 'Modifier l\'article';
      case 'conference': return 'Modifier la conférence';
    }
  };

  const renderField = (key: string, label: string, multiline = false) => (
    <View style={styles.field} key={key}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          { color: colors.text, borderColor: colors.borderHairline, backgroundColor: colors.bg },
        ]}
        value={formData[key] || ''}
        onChangeText={(text) => setFormData((prev) => ({ ...prev, [key]: text }))}
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );

  const renderFields = () => {
    switch (entityType) {
      case 'researcher':
        return (
          <>
            {renderField('name', 'Nom *')}
            {renderField('institution', 'Institution')}
            {renderField('city', 'Ville')}
            {renderField('country', 'Pays')}
            {renderField('email', 'Email')}
            {renderField('specialization', 'Spécialisation')}
            {renderField('orcid', 'ORCID')}
          </>
        );
      case 'article':
        return (
          <>
            {renderField('title', 'Titre *')}
            {renderField('journal', 'Journal')}
            {renderField('year', 'Année')}
            {renderField('doi', 'DOI')}
            {renderField('pmid', 'PubMed ID')}
            {renderField('abstract', 'Résumé', true)}
          </>
        );
      case 'conference':
        return (
          <>
            {renderField('name', 'Nom *')}
            {renderField('date', 'Date début (YYYY-MM-DD)')}
            {renderField('end_date', 'Date fin (YYYY-MM-DD)')}
            {renderField('city', 'Ville')}
            {renderField('country', 'Pays')}
            {renderField('website', 'Site web')}
            {renderField('description', 'Description', true)}
          </>
        );
    }
  };

  if (!entity) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderColor: colors.borderHairline }]}>
            <Pressable onPress={onClose} style={styles.headerBtn}>
              <Text style={[styles.headerBtnText, { color: colors.textMuted }]}>Annuler</Text>
            </Pressable>
            <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
            <Pressable onPress={handleSave} style={styles.headerBtn} disabled={saving}>
              <Text style={[styles.headerBtnText, { color: colors.accent }]}>
                {saving ? '...' : 'Sauver'}
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            {renderFields()}

            {/* Delete button */}
            <Pressable
              style={[styles.deleteBtn, { borderColor: colors.error }]}
              onPress={handleDelete}
              disabled={saving}
            >
              <Icon name="trash" size={16} color={colors.error} />
              <Text style={[styles.deleteBtnText, { color: colors.error }]}>Supprimer</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    minWidth: 60,
  },
  headerBtnText: {
    ...typography.body,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
  },
  form: {
    padding: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
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
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  deleteBtnText: {
    ...typography.body,
    fontWeight: '500',
  },
});
