/**
 * ResearcherDetailScreen - Détail d'un chercheur
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { useI18n } from '../i18n';
import { Icon } from '../components/Icons';
import { NotesSection } from '../components/notes';
import { RelationPicker } from '../components/relations';
import { EntityEditModal } from '../components/edit';
import { getResearcher, linkGeneToResearcher, linkArticleToResearcher, linkConferenceToResearcher } from '../lib/knowledge';
import { useNotes } from '../lib/hooks';
import type { ResearcherWithRelations, Article, Conference } from '../types/knowledge';

type Props = NativeStackScreenProps<RootStackParamList, 'ResearcherDetail'>;

export function ResearcherDetailScreen({ route, navigation }: Props) {
  const { researcherId } = route.params;
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [researcher, setResearcher] = useState<ResearcherWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { notes, loading: notesLoading, refresh: refreshNotes } = useNotes('researcher', researcherId);

  // Relation pickers
  const [showGenePicker, setShowGenePicker] = useState(false);
  const [showArticlePicker, setShowArticlePicker] = useState(false);
  const [showConferencePicker, setShowConferencePicker] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getResearcher(researcherId);
      setResearcher(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [researcherId]);

  useEffect(() => {
    load();
  }, [load]);

  // Relation handlers
  const handleAddGene = async (gene: { symbol: string; organism: string }) => {
    try {
      await linkGeneToResearcher(gene.symbol, gene.organism, researcherId);
      load();
    } catch (e) {
      console.error('Error linking gene:', e);
    }
  };

  const handleAddArticle = async (article: Article) => {
    try {
      await linkArticleToResearcher(article.id, researcherId);
      load();
    } catch (e) {
      console.error('Error linking article:', e);
    }
  };

  const handleAddConference = async (conference: Conference) => {
    try {
      await linkConferenceToResearcher(conference.id, researcherId);
      load();
    } catch (e) {
      console.error('Error linking conference:', e);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error || !researcher) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error || 'Chercheur non trouvé'}</Text>
        <Pressable style={[styles.retryBtn, { backgroundColor: colors.accent }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.retryBtnText, { color: colors.buttonPrimaryText }]}>{t.common.back}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {researcher.name}
        </Text>
        <Pressable onPress={() => setShowEdit(true)} style={styles.editBtn}>
          <Icon name="pencil" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
          <Text style={[styles.name, { color: colors.text }]}>{researcher.name}</Text>
          
          {researcher.institution && (
            <Text style={[styles.institution, { color: colors.textMuted }]}>
              {researcher.institution}
              {researcher.city && `, ${researcher.city}`}
            </Text>
          )}

          {researcher.email && (
            <Pressable 
              style={styles.emailRow}
              onPress={() => Linking.openURL(`mailto:${researcher.email}`)}
            >
              <Text style={[styles.email, { color: colors.accent }]}>{researcher.email}</Text>
            </Pressable>
          )}

          {researcher.specialization && (
            <View style={[styles.specBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.specText, { color: colors.text }]}>{researcher.specialization}</Text>
            </View>
          )}
        </View>

        {/* Genes */}
        <View style={[styles.section, { borderColor: colors.borderHairline }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Protéines étudiées ({researcher.genes?.length || 0})
            </Text>
            <Pressable style={[styles.addBtn, { borderColor: colors.borderHairline }]} onPress={() => setShowGenePicker(true)}>
              <Text style={[styles.addBtnText, { color: colors.accent }]}>+</Text>
            </Pressable>
          </View>
          {researcher.genes && researcher.genes.length > 0 && (
            <View style={styles.chipList}>
              {researcher.genes.map((g, i) => (
                <Pressable
                  key={`${g.gene_symbol}_${i}`}
                  style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
                  onPress={() => navigation.push('GeneDetail', { symbol: g.gene_symbol, organism: g.organism })}
                >
                  <Text style={[styles.chipText, { color: colors.accent }]}>{g.gene_symbol}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Articles */}
        <View style={[styles.section, { borderColor: colors.borderHairline }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Publications ({researcher.articles?.length || 0})
            </Text>
            <Pressable style={[styles.addBtn, { borderColor: colors.borderHairline }]} onPress={() => setShowArticlePicker(true)}>
              <Text style={[styles.addBtnText, { color: colors.accent }]}>+</Text>
            </Pressable>
          </View>
          {researcher.articles && researcher.articles.length > 0 && researcher.articles.map((article) => (
              <Pressable
                key={article.id}
                style={[styles.articleRow, { borderColor: colors.borderHairline }]}
                onPress={() => navigation.push('ArticleDetail', { articleId: article.id })}
              >
                <Text style={[styles.articleTitle, { color: colors.text }]} numberOfLines={2}>
                  {article.title}
                </Text>
                <View style={styles.articleMeta}>
                  {article.journal && (
                    <Text style={[styles.articleJournal, { color: colors.textMuted }]}>{article.journal}</Text>
                  )}
                  {article.year && (
                    <Text style={[styles.articleYear, { color: colors.textMuted }]}>{article.year}</Text>
                  )}
                </View>
              </Pressable>
            ))}
        </View>

        {/* Conferences */}
        <View style={[styles.section, { borderColor: colors.borderHairline }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Conférences ({researcher.conferences?.length || 0})
            </Text>
            <Pressable style={[styles.addBtn, { borderColor: colors.borderHairline }]} onPress={() => setShowConferencePicker(true)}>
              <Text style={[styles.addBtnText, { color: colors.accent }]}>+</Text>
            </Pressable>
          </View>
          {researcher.conferences && researcher.conferences.length > 0 && researcher.conferences.map((conf) => (
              <Pressable
                key={conf.id}
                style={[styles.confRow, { borderColor: colors.borderHairline }]}
                onPress={() => navigation.push('ConferenceDetail', { conferenceId: conf.id })}
              >
                <Text style={[styles.confName, { color: colors.text }]}>{conf.name}</Text>
                {conf.city && (
                  <Text style={[styles.confLocation, { color: colors.textMuted }]}>
                    {conf.city}{conf.country ? `, ${conf.country}` : ''}
                  </Text>
                )}
              </Pressable>
            ))}
        </View>

        {/* Notes */}
        <NotesSection
          entityType="researcher"
          entityId={researcherId}
          notes={notes}
          onRefresh={refreshNotes}
          loading={notesLoading}
        />
      </ScrollView>

      {/* Relation Pickers */}
      <RelationPicker
        visible={showGenePicker}
        onClose={() => setShowGenePicker(false)}
        entityType="gene"
        onSelect={(item) => handleAddGene(item as { symbol: string; organism: string })}
        title="Ajouter une protéine"
      />
      <RelationPicker
        visible={showArticlePicker}
        onClose={() => setShowArticlePicker(false)}
        entityType="article"
        onSelect={(item) => handleAddArticle(item as Article)}
        excludeIds={researcher.articles?.map((a) => a.id) || []}
        title="Ajouter un article"
      />
      <RelationPicker
        visible={showConferencePicker}
        onClose={() => setShowConferencePicker(false)}
        entityType="conference"
        onSelect={(item) => handleAddConference(item as Conference)}
        excludeIds={researcher.conferences?.map((c) => c.id) || []}
        title="Ajouter une conférence"
      />

      {/* Edit Modal */}
      <EntityEditModal
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        entityType="researcher"
        entity={researcher}
        onSaved={load}
        onDeleted={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorText: { ...typography.body, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  retryBtnText: { ...typography.body, fontWeight: '600' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: { padding: spacing.sm },
  backIcon: { fontSize: 24, fontWeight: '300' },
  headerTitle: { flex: 1, ...typography.body, fontWeight: '600', textAlign: 'center' },
  editBtn: { padding: spacing.sm },
  
  scroll: { flex: 1, paddingHorizontal: spacing.lg },
  
  card: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  name: { ...typography.h2, marginBottom: spacing.xs },
  institution: { ...typography.body, marginBottom: spacing.sm },
  emailRow: { marginBottom: spacing.sm },
  email: { ...typography.body },
  specBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  specText: { ...typography.bodySmall },
  
  section: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.body, fontWeight: '600' },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 18, fontWeight: '300' },
  
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { ...typography.bodySmall, fontWeight: '500' },
  
  articleRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  articleTitle: { ...typography.body },
  articleMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  articleJournal: { ...typography.caption, fontStyle: 'italic' },
  articleYear: { ...typography.caption },
  
  confRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  confName: { ...typography.body },
  confLocation: { ...typography.caption, marginTop: 2 },
});
