/**
 * PrivacyScreen - Data & Privacy settings
 * Shows privacy info and allows data export/deletion
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { 
  exportArticlesToBibtex, 
  exportNotesToMarkdown, 
  exportToJson,
} from '../lib/export';
import { supabaseWithAuth } from '../lib/supabase';
import { showConfirm, showAlert, showError } from '../lib/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

type ExportType = 'articles-bibtex' | 'notes-md' | 'all-json';

export function PrivacyScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async (type: ExportType) => {
    setExporting(type);

    try {
      const { data: { user } } = await supabaseWithAuth.auth.getUser();
      if (!user) throw new Error('Non connecté');

      let result: string;
      let filename: string;
      
      switch (type) {
        case 'articles-bibtex': {
          const { data: articles } = await supabaseWithAuth
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false });
          result = exportArticlesToBibtex(articles || []);
          filename = 'genehub-articles.bib';
          break;
        }
        case 'notes-md': {
          const { data: notes } = await supabaseWithAuth
            .from('notes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          result = exportNotesToMarkdown(notes || []);
          filename = 'genehub-notes.md';
          break;
        }
        case 'all-json': {
          const [notesRes, tagsRes, collectionsRes, inboxRes] = await Promise.all([
            supabaseWithAuth.from('notes').select('*').eq('user_id', user.id),
            supabaseWithAuth.from('tags').select('*').eq('user_id', user.id),
            supabaseWithAuth.from('collections').select('*').eq('user_id', user.id),
            supabaseWithAuth.from('inbox_items').select('*').eq('user_id', user.id),
          ]);
          result = exportToJson({
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
            notes: notesRes.data || [],
            tags: tagsRes.data || [],
            articles: [],
            researchers: [],
            conferences: [],
          });
          filename = 'genehub-export.json';
          break;
        }
      }

      await Share.share({
        message: result,
        title: filename,
      });
    } catch (error: any) {
      showError('Erreur export', error.message);
    } finally {
      setExporting(null);
    }
  };

  const handleDeleteAllData = async () => {
    const confirmed = await showConfirm(
      '⚠️ Supprimer toutes mes données',
      'Cette action supprimera définitivement :\n\n• Toutes vos notes\n• Tous vos tags\n• Tout votre inbox\n• Toutes vos collections\n\nCette action est IRRÉVERSIBLE.',
      'Supprimer tout',
      'Annuler',
      true
    );
    
    if (confirmed) {
      const finalConfirm = await showConfirm(
        'Confirmation finale',
        'Êtes-vous vraiment sûr ? Cette action est définitive.',
        'Oui, tout supprimer',
        'Non, annuler',
        true
      );
      
      if (finalConfirm) {
        await executeDelete();
      }
    }
  };

  const executeDelete = async () => {
    setDeleting(true);

    try {
      const { data: { user } } = await supabaseWithAuth.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // Delete all user data in order (respecting foreign keys)
      const tables = [
        'collection_items',
        'collections',
        'note_tags',
        'entity_tags',
        'tags',
        'notes',
        'inbox_items',
      ];

      for (const table of tables) {
        const { error } = await supabaseWithAuth
          .from(table)
          .delete()
          .eq('user_id', user.id);
        
        if (error) {
          console.error(`Error deleting ${table}:`, error);
        }
      }

      showAlert('Données supprimées', 'Toutes vos données personnelles ont été supprimées.');
      navigation.goBack();
    } catch (error: any) {
      showError('Erreur', error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    showAlert(
      '⚠️ Supprimer mon compte',
      'Pour supprimer votre compte, veuillez nous contacter à support@genehub.app avec votre email de connexion.'
    );
  };

  const ExportButton = ({ 
    exportType, 
    label 
  }: { 
    exportType: ExportType; 
    label: string;
  }) => {
    const isLoading = exporting === exportType;

    return (
      <Pressable
        style={[styles.exportButton, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
        onPress={() => handleExport(exportType)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text style={[styles.exportButtonText, { color: colors.text }]}>{label}</Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.accent }]}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Data & Privacy</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy Info */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔒</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Vos données sont privées</Text>
          </View>

          <View style={styles.privacyList}>
            <PrivacyItem 
              icon="✓" 
              text="Vos notes sont privées et visibles uniquement par vous"
              colors={colors}
            />
            <PrivacyItem 
              icon="✓" 
              text="Vos tags personnels sont privés"
              colors={colors}
            />
            <PrivacyItem 
              icon="✓" 
              text="Votre inbox est privé"
              colors={colors}
            />
            <PrivacyItem 
              icon="✓" 
              text="Vos collections sont privées"
              colors={colors}
            />
            <PrivacyItem 
              icon="📚" 
              text="Articles, chercheurs et conférences sont des données de référence partagées (publiques)"
              colors={colors}
              muted
            />
          </View>
        </View>

        {/* Export Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📤</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Exporter mes données</Text>
          </View>

          <Text style={[styles.exportHint, { color: colors.textMuted }]}>
            Exportez vos données dans le format de votre choix
          </Text>

          <View style={styles.exportCategory}>
            <Text style={[styles.exportCategoryTitle, { color: colors.textMuted }]}>Articles</Text>
            <View style={styles.exportRow}>
              <ExportButton exportType="articles-bibtex" label="BibTeX" />
            </View>
          </View>

          <View style={styles.exportCategory}>
            <Text style={[styles.exportCategoryTitle, { color: colors.textMuted }]}>Notes</Text>
            <View style={styles.exportRow}>
              <ExportButton exportType="notes-md" label="Markdown" />
            </View>
          </View>

          <View style={styles.exportCategory}>
            <Text style={[styles.exportCategoryTitle, { color: colors.textMuted }]}>Tout</Text>
            <View style={styles.exportRow}>
              <ExportButton exportType="all-json" label="JSON complet" />
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection, { borderColor: '#ff4444' }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚠️</Text>
            <Text style={[styles.sectionTitle, { color: '#ff4444' }]}>Zone de danger</Text>
          </View>

          <Pressable
            style={[styles.dangerButton, { backgroundColor: 'rgba(255,68,68,0.1)' }]}
            onPress={handleDeleteAllData}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#ff4444" />
            ) : (
              <>
                <Text style={styles.dangerButtonIcon}>🗑️</Text>
                <View style={styles.dangerButtonInfo}>
                  <Text style={styles.dangerButtonTitle}>Supprimer toutes mes données</Text>
                  <Text style={styles.dangerButtonHint}>Notes, tags, inbox, collections</Text>
                </View>
              </>
            )}
          </Pressable>

          <Pressable
            style={[styles.dangerButton, { backgroundColor: 'rgba(255,68,68,0.05)' }]}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.dangerButtonIcon}>👤</Text>
            <View style={styles.dangerButtonInfo}>
              <Text style={styles.dangerButtonTitle}>Supprimer mon compte</Text>
              <Text style={styles.dangerButtonHint}>Contactez le support</Text>
            </View>
          </Pressable>
        </View>

        <View style={{ height: insets.bottom + spacing.xl }} />
      </ScrollView>
    </View>
  );
}

function PrivacyItem({ 
  icon, 
  text, 
  colors, 
  muted 
}: { 
  icon: string; 
  text: string; 
  colors: any; 
  muted?: boolean;
}) {
  return (
    <View style={styles.privacyItem}>
      <Text style={[styles.privacyIcon, { color: muted ? colors.textMuted : '#22c55e' }]}>
        {icon}
      </Text>
      <Text style={[styles.privacyText, { color: muted ? colors.textMuted : colors.text }]}>
        {text}
      </Text>
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

  content: {
    padding: spacing.lg,
  },

  section: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  privacyList: {
    gap: spacing.sm,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyIcon: {
    width: 24,
    fontSize: 14,
  },
  privacyText: {
    ...typography.bodySmall,
    flex: 1,
    lineHeight: 20,
  },

  exportHint: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  exportCategory: {
    marginBottom: spacing.md,
  },
  exportCategoryTitle: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  exportRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  exportButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 80,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },

  dangerSection: {
    backgroundColor: 'transparent',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  dangerButtonIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  dangerButtonInfo: {
    flex: 1,
  },
  dangerButtonTitle: {
    color: '#ff4444',
    fontWeight: '600',
    fontSize: 15,
  },
  dangerButtonHint: {
    color: '#ff4444',
    opacity: 0.7,
    fontSize: 12,
    marginTop: 2,
  },
});
