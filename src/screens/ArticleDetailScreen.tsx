/**
 * ArticleDetailScreen - Détail d'un article
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
import { AddToCollectionButton } from '../components/collections';
import { RelationPicker } from '../components/relations';
import { EntityEditModal } from '../components/edit';
import { getArticle, linkArticleToResearcher, linkGeneToArticle } from '../lib/knowledge';
import { useNotes } from '../lib/hooks';
import type { ArticleWithRelations, Researcher } from '../types/knowledge';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleDetail'>;

export function ArticleDetailScreen({ route, navigation }: Props) {
  const { articleId } = route.params;
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [article, setArticle] = useState<ArticleWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { notes, loading: notesLoading, refresh: refreshNotes } = useNotes('article', articleId);

  // Relation pickers
  const [showAuthorPicker, setShowAuthorPicker] = useState(false);
  const [showGenePicker, setShowGenePicker] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getArticle(articleId);
      setArticle(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    load();
  }, [load]);

  // Relation handlers
  const handleAddAuthor = async (researcher: Researcher) => {
    try {
      const position = (article?.authors?.length ?? 0) + 1;
      await linkArticleToResearcher(articleId, researcher.id, position);
      load();
    } catch (e) {
      console.error('Error linking author:', e);
    }
  };

  const handleAddGene = async (gene: { symbol: string; organism: string }) => {
    try {
      await linkGeneToArticle(gene.symbol, gene.organism, articleId);
      load();
    } catch (e) {
      console.error('Error linking gene:', e);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error || 'Article non trouvé'}</Text>
        <Pressable style={[styles.retryBtn, { backgroundColor: colors.accent }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.retryBtnText, { color: colors.buttonPrimaryText }]}>{t.common.back}</Text>
        </Pressable>
      </View>
    );
  }

  const openDoi = () => {
    if (article.doi) {
      Linking.openURL(`https://doi.org/${article.doi}`);
    }
  };

  const openPubmed = () => {
    if (article.pmid) {
      Linking.openURL(`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Article</Text>
        <View style={styles.headerActions}>
          <AddToCollectionButton entityType="article" entityId={articleId} displayName={article?.title} />
          <Pressable onPress={() => setShowEdit(true)} style={styles.editBtn}>
            <Icon name="pencil" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Title Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
          <Text style={[styles.title, { color: colors.text }]}>{article.title}</Text>
          
          {/* Authors */}
          {article.authors && article.authors.length > 0 && (
            <Text style={[styles.authors, { color: colors.textMuted }]}>
              {article.authors.map((a, i) => (
                <Text key={a.id}>
                  {i > 0 && ', '}
                  <Text 
                    style={[styles.authorName, { color: colors.accent }]}
                    onPress={() => navigation.push('ResearcherDetail', { researcherId: a.id })}
                  >
                    {a.name}
                  </Text>
                  {a.is_corresponding && '*'}
                </Text>
              ))}
            </Text>
          )}

          {/* Journal & Year */}
          <View style={styles.metaRow}>
            {article.journal && (
              <Text style={[styles.journal, { color: colors.textSecondary }]}>{article.journal}</Text>
            )}
            {article.year && (
              <Text style={[styles.year, { color: colors.textMuted }]}>{article.year}</Text>
            )}
          </View>

          {/* External Links */}
          <View style={styles.linksRow}>
            {article.doi && (
              <Pressable style={[styles.linkBtn, { borderColor: colors.accent }]} onPress={openDoi}>
                <Text style={[styles.linkBtnText, { color: colors.accent }]}>DOI</Text>
              </Pressable>
            )}
            {article.pmid && (
              <Pressable style={[styles.linkBtn, { borderColor: colors.accent }]} onPress={openPubmed}>
                <Text style={[styles.linkBtnText, { color: colors.accent }]}>PubMed</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Abstract */}
        {article.abstract && (
          <View style={[styles.section, { borderColor: colors.borderHairline }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Résumé</Text>
            <Text style={[styles.abstract, { color: colors.textSecondary }]}>{article.abstract}</Text>
          </View>
        )}

        {/* Genes */}
        <View style={[styles.section, { borderColor: colors.borderHairline }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Protéines ({article.genes?.length || 0})
            </Text>
            <Pressable style={[styles.addBtn, { borderColor: colors.borderHairline }]} onPress={() => setShowGenePicker(true)}>
              <Text style={[styles.addBtnText, { color: colors.accent }]}>+</Text>
            </Pressable>
          </View>
          {article.genes && article.genes.length > 0 && (
            <View style={styles.chipList}>
              {article.genes.map((g, i) => (
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

        {/* Notes */}
        <NotesSection
          entityType="article"
          entityId={articleId}
          notes={notes}
          onRefresh={refreshNotes}
          loading={notesLoading}
        />
      </ScrollView>

      {/* Relation Pickers */}
      <RelationPicker
        visible={showAuthorPicker}
        onClose={() => setShowAuthorPicker(false)}
        entityType="researcher"
        onSelect={(item) => handleAddAuthor(item as Researcher)}
        excludeIds={article.authors?.map((a) => a.id) || []}
        title="Ajouter un auteur"
      />
      <RelationPicker
        visible={showGenePicker}
        onClose={() => setShowGenePicker(false)}
        entityType="gene"
        onSelect={(item) => handleAddGene(item as { symbol: string; organism: string })}
        title="Ajouter une protéine"
      />

      {/* Edit Modal */}
      <EntityEditModal
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        entityType="article"
        entity={article}
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  editBtn: { padding: spacing.sm },
  
  scroll: { flex: 1, paddingHorizontal: spacing.lg },
  
  card: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  title: { ...typography.h2, marginBottom: spacing.sm },
  authors: { ...typography.body, marginBottom: spacing.sm, lineHeight: 22 },
  authorName: { fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  journal: { ...typography.body, fontStyle: 'italic', flex: 1 },
  year: { ...typography.body },
  
  linksRow: { flexDirection: 'row', gap: spacing.sm },
  linkBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  linkBtnText: { ...typography.bodySmall, fontWeight: '600' },
  
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
  abstract: { ...typography.body, lineHeight: 22 },
  
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { ...typography.bodySmall, fontWeight: '500' },
});
