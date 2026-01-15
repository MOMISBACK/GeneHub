/**
 * ResearcherDetailScreen - Détail d'un chercheur
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState, useMemo } from 'react';
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
import { ViewModeToggle, NotesFullView, type ViewMode } from '../components/detail';
import { showConfirm } from '../lib/alert';
import { 
  getResearcher, 
  linkGeneToResearcher, 
  linkArticleToResearcher, 
  linkConferenceToResearcher,
  unlinkGeneFromResearcher,
  unlinkArticleFromResearcher,
  unlinkConferenceFromResearcher,
  linkResearcherCollaborator,
  unlinkResearcherCollaborator,
  getArticle, 
  getConference 
} from '../lib/knowledge';
import { useNotes } from '../lib/hooks';
import type { ResearcherWithRelations, Article, Conference, Tag } from '../types/knowledge';

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
  const [showCollaboratorPicker, setShowCollaboratorPicker] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('recap');

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

  // Extract entities linked via tags in notes
  const entitiesFromTags = useMemo(() => {
    const genes: { gene_symbol: string; organism: string; fromTag: boolean }[] = [];
    const articleIds: Set<string> = new Set();
    const conferenceIds: Set<string> = new Set();

    notes.forEach(note => {
      note.tags?.forEach(tag => {
        if (tag.entity_type && tag.entity_id) {
          switch (tag.entity_type) {
            case 'gene':
              // entity_id format: "symbol_organism" or just "symbol"
              const [symbol, organism = 'Escherichia coli'] = tag.entity_id.includes('_')
                ? tag.entity_id.split('_')
                : [tag.entity_id, 'Escherichia coli'];
              if (!genes.some(g => g.gene_symbol === symbol && g.organism === organism)) {
                genes.push({ gene_symbol: symbol, organism, fromTag: true });
              }
              break;
            case 'article':
              articleIds.add(tag.entity_id);
              break;
            case 'conference':
              conferenceIds.add(tag.entity_id);
              break;
          }
        }
      });
    });

    return { genes, articleIds: Array.from(articleIds), conferenceIds: Array.from(conferenceIds) };
  }, [notes]);

  // Merge existing relations with tag-based relations
  const allGenes = useMemo(() => {
    const existing = researcher?.genes || [];
    const fromTags = entitiesFromTags.genes.filter(
      tg => !existing.some(eg => eg.gene_symbol === tg.gene_symbol && eg.organism === tg.organism)
    );
    return [...existing.map(g => ({ ...g, fromTag: false })), ...fromTags];
  }, [researcher?.genes, entitiesFromTags.genes]);

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

  const handleAddCollaborator = async (collaborator: Researcher) => {
    try {
      await linkResearcherCollaborator(researcherId, collaborator.id);
      load();
    } catch (e) {
      console.error('Error linking collaborator:', e);
    }
  };

  // Delete handlers
  const handleDeleteGene = async (geneSymbol: string, organism: string, fromTag: boolean) => {
    if (fromTag) {
      // Can't delete tag-based relations from here
      return;
    }
    
    const confirmed = await showConfirm(
      'Supprimer',
      `Supprimer la liaison avec ${geneSymbol} ?`,
      'Supprimer',
      'Annuler',
      true
    );
    
    if (confirmed) {
      try {
        await unlinkGeneFromResearcher(geneSymbol, organism, researcherId);
        load();
      } catch (e) {
        console.error('Error unlinking gene:', e);
      }
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    const confirmed = await showConfirm(
      'Supprimer',
      'Supprimer la liaison avec cet article ?',
      'Supprimer',
      'Annuler',
      true
    );
    
    if (confirmed) {
      try {
        await unlinkArticleFromResearcher(articleId, researcherId);
        load();
      } catch (e) {
        console.error('Error unlinking article:', e);
      }
    }
  };

  const handleDeleteConference = async (conferenceId: string) => {
    const confirmed = await showConfirm(
      'Supprimer',
      'Supprimer la liaison avec cette conférence ?',
      'Supprimer',
      'Annuler',
      true
    );
    
    if (confirmed) {
      try {
        await unlinkConferenceFromResearcher(conferenceId, researcherId);
        load();
      } catch (e) {
        console.error('Error unlinking conference:', e);
      }
    }
  };

  const handleDeleteCollaborator = async (collaboratorId: string) => {
    const confirmed = await showConfirm(
      'Supprimer',
      'Supprimer la liaison avec ce chercheur ?',
      'Supprimer',
      'Annuler',
      true
    );
    
    if (confirmed) {
      try {
        await unlinkResearcherCollaborator(researcherId, collaboratorId);
        load();
      } catch (e) {
        console.error('Error unlinking collaborator:', e);
      }
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
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {researcher.name}
        </Text>
        <Pressable onPress={() => setShowEdit(true)} style={styles.editBtn}>
          <Icon name="pencil" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* View Mode Toggle */}
      <ViewModeToggle mode={viewMode} onChange={setViewMode} notesCount={notes.length} />

      {/* Notes Mode */}
      {viewMode === 'notes' ? (
        <NotesFullView
          entityType="researcher"
          entityId={researcherId}
          entityName={researcher.name}
          notes={notes}
          onRefresh={refreshNotes}
          loading={notesLoading}
        />
      ) : (
        /* Recap Mode */
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
              Gènes étudiés ({allGenes.length})
            </Text>
            <Pressable style={[styles.addBtn, { borderColor: colors.borderHairline }]} onPress={() => setShowGenePicker(true)}>
              <Text style={[styles.addBtnText, { color: colors.accent }]}>+</Text>
            </Pressable>
          </View>
          {allGenes.length > 0 && (
            <View style={styles.chipList}>
              {allGenes.map((g, i) => (
                <Pressable
                  key={`${g.gene_symbol}_${i}`}
                  style={[
                    styles.chip, 
                    { 
                      backgroundColor: colors.surface, 
                      borderColor: g.fromTag ? colors.accent : colors.borderHairline,
                      borderStyle: g.fromTag ? 'dashed' : 'solid',
                    }
                  ]}
                  onPress={() => navigation.push('GeneDetail', { symbol: g.gene_symbol, organism: g.organism })}
                  onLongPress={() => handleDeleteGene(g.gene_symbol, g.organism, g.fromTag)}
                >
                  <Text style={[styles.chipText, { color: colors.accent }]}>
                    {g.fromTag ? '🏷️ ' : ''}{g.gene_symbol}
                  </Text>
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
                onLongPress={() => handleDeleteArticle(article.id)}
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
                onLongPress={() => handleDeleteConference(conf.id)}
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

        {/* Collaborators */}
        <View style={[styles.section, { borderColor: colors.borderHairline }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Chercheurs associés ({researcher.collaborators?.length || 0})
            </Text>
            <Pressable style={[styles.addBtn, { borderColor: colors.borderHairline }]} onPress={() => setShowCollaboratorPicker(true)}>
              <Text style={[styles.addBtnText, { color: colors.accent }]}>+</Text>
            </Pressable>
          </View>
          {researcher.collaborators && researcher.collaborators.length > 0 && (
            <View style={styles.chipList}>
              {researcher.collaborators.map((collab, i) => (
                <Pressable
                  key={`${collab.id}_${i}`}
                  style={[
                    styles.chip, 
                    { 
                      backgroundColor: 'transparent', 
                      borderColor: colors.borderHairline,
                    }
                  ]}
                  onPress={() => navigation.push('ResearcherDetail', { researcherId: collab.id })}
                  onLongPress={() => handleDeleteCollaborator(collab.id)}
                >
                  <Text style={[styles.chipText, { color: colors.accent }]}>
                    {collab.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      )}

      {/* Relation Pickers */}
      <RelationPicker
        visible={showGenePicker}
        onClose={() => setShowGenePicker(false)}
        entityType="gene"
        onSelect={(item) => handleAddGene(item as { symbol: string; organism: string })}
        title="Ajouter un gène"
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
      <RelationPicker
        visible={showCollaboratorPicker}
        onClose={() => setShowCollaboratorPicker(false)}
        entityType="researcher"
        onSelect={(item) => handleAddCollaborator(item as Researcher)}
        excludeIds={[researcherId, ...(researcher.collaborators?.map((c) => c.id) || [])]}
        title="Ajouter un chercheur associé"
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
    backgroundColor: 'transparent',
  },
  chipText: { ...typography.bodySmall, fontWeight: '500', fontStyle: 'italic' },
  
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
