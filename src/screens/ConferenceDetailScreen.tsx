/**
 * ConferenceDetailScreen - Détail d'une conférence
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
import { getConference, linkConferenceToResearcher, linkGeneToConference, linkArticleToConference } from '../lib/knowledge';
import { useNotes } from '../lib/hooks';
import type { ConferenceWithRelations, Researcher, Article } from '../types/knowledge';

type Props = NativeStackScreenProps<RootStackParamList, 'ConferenceDetail'>;

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function ConferenceDetailScreen({ route, navigation }: Props) {
  const { conferenceId } = route.params;
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [conference, setConference] = useState<ConferenceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { notes, loading: notesLoading, refresh: refreshNotes } = useNotes('conference', conferenceId);

  // Relation pickers
  const [showParticipantPicker, setShowParticipantPicker] = useState(false);
  const [showArticlePicker, setShowArticlePicker] = useState(false);
  const [showGenePicker, setShowGenePicker] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConference(conferenceId);
      setConference(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    load();
  }, [load]);

  // Relation handlers
  const handleAddParticipant = async (researcher: Researcher) => {
    try {
      await linkConferenceToResearcher(conferenceId, researcher.id);
      load();
    } catch (e) {
      console.error('Error linking participant:', e);
    }
  };

  const handleAddArticle = async (article: Article) => {
    try {
      await linkArticleToConference(article.id, conferenceId);
      load();
    } catch (e) {
      console.error('Error linking article:', e);
    }
  };

  const handleAddGene = async (gene: { symbol: string; organism: string }) => {
    try {
      await linkGeneToConference(gene.symbol, gene.organism, conferenceId);
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

  if (error || !conference) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error || 'Conférence non trouvée'}</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Conférence</Text>
        <Pressable onPress={() => setShowEdit(true)} style={styles.editBtn}>
          <Icon name="pencil" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
          <Text style={[styles.name, { color: colors.text }]}>{conference.name}</Text>
          
          {conference.date && (
            <View style={styles.dateRow}>
              <Icon name="calendar" size={14} color={colors.textMuted} />
              <Text style={[styles.date, { color: colors.textMuted }]}>
                {formatDate(conference.date)}
                {conference.end_date && ` - ${formatDate(conference.end_date)}`}
              </Text>
            </View>
          )}

          {(conference.city || conference.location) && (
            <Text style={[styles.location, { color: colors.textMuted }]}>
              {[conference.city, conference.country].filter(Boolean).join(', ') || conference.location}
            </Text>
          )}

          {conference.website && (
            <Pressable 
              style={[styles.websiteBtn, { borderColor: colors.accent }]}
              onPress={() => Linking.openURL(conference.website!)}
            >
              <Icon name="link" size={14} color={colors.accent} />
              <Text style={[styles.websiteBtnText, { color: colors.accent }]}>Site web</Text>
            </Pressable>
          )}
        </View>

        {/* Description */}
        {conference.description && (
          <View style={[styles.section, { borderColor: colors.borderHairline }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{conference.description}</Text>
          </View>
        )}

        {/* Participants */}
        <View style={[styles.section, { borderColor: colors.borderHairline }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Participants ({conference.participants?.length || 0})
            </Text>
            <Pressable style={[styles.addBtn, { borderColor: colors.borderHairline }]} onPress={() => setShowParticipantPicker(true)}>
              <Text style={[styles.addBtnText, { color: colors.accent }]}>+</Text>
            </Pressable>
          </View>
          {conference.participants && conference.participants.length > 0 && conference.participants.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.participantRow, { borderColor: colors.borderHairline }]}
                onPress={() => navigation.push('ResearcherDetail', { researcherId: p.id })}
              >
                <View style={styles.participantInfo}>
                  <Text style={[styles.participantName, { color: colors.accent }]}>{p.name}</Text>
                  {p.institution && (
                    <Text style={[styles.participantInst, { color: colors.textMuted }]}>{p.institution}</Text>
                  )}
                </View>
                {p.role && (
                  <View style={[styles.roleBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.roleText, { color: colors.textSecondary }]}>{p.role}</Text>
                  </View>
                )}
              </Pressable>
            ))}
        </View>

        {/* Articles */}
        <View style={[styles.section, { borderColor: colors.borderHairline }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Articles présentés ({conference.articles?.length || 0})
            </Text>
            <Pressable style={[styles.addBtn, { borderColor: colors.borderHairline }]} onPress={() => setShowArticlePicker(true)}>
              <Text style={[styles.addBtnText, { color: colors.accent }]}>+</Text>
            </Pressable>
          </View>
          {conference.articles && conference.articles.length > 0 && conference.articles.map((article) => (
              <Pressable
                key={article.id}
                style={[styles.articleRow, { borderColor: colors.borderHairline }]}
                onPress={() => navigation.push('ArticleDetail', { articleId: article.id })}
              >
                <Text style={[styles.articleTitle, { color: colors.text }]} numberOfLines={2}>
                  {article.title}
                </Text>
              </Pressable>
            ))}
        </View>

        {/* Genes */}
        <View style={[styles.section, { borderColor: colors.borderHairline }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Protéines ({conference.genes?.length || 0})
            </Text>
            <Pressable style={[styles.addBtn, { borderColor: colors.borderHairline }]} onPress={() => setShowGenePicker(true)}>
              <Text style={[styles.addBtnText, { color: colors.accent }]}>+</Text>
            </Pressable>
          </View>
          {conference.genes && conference.genes.length > 0 && (
            <View style={styles.chipList}>
              {conference.genes.map((g, i) => (
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
          entityType="conference"
          entityId={conferenceId}
          notes={notes}
          onRefresh={refreshNotes}
          loading={notesLoading}
        />
      </ScrollView>

      {/* Relation Pickers */}
      <RelationPicker
        visible={showParticipantPicker}
        onClose={() => setShowParticipantPicker(false)}
        entityType="researcher"
        onSelect={(item) => handleAddParticipant(item as Researcher)}
        excludeIds={conference.participants?.map((p) => p.id) || []}
        title="Ajouter un participant"
      />
      <RelationPicker
        visible={showArticlePicker}
        onClose={() => setShowArticlePicker(false)}
        entityType="article"
        onSelect={(item) => handleAddArticle(item as Article)}
        excludeIds={conference.articles?.map((a) => a.id) || []}
        title="Ajouter un article"
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
        entityType="conference"
        entity={conference}
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
  name: { ...typography.h2, marginBottom: spacing.sm },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  date: { ...typography.body },
  location: { ...typography.body, marginBottom: spacing.md },
  
  websiteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  websiteBtnText: { ...typography.bodySmall, fontWeight: '500' },
  
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
  description: { ...typography.body, lineHeight: 22 },
  
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  participantInfo: { flex: 1 },
  participantName: { ...typography.body, fontWeight: '500' },
  participantInst: { ...typography.caption, marginTop: 2 },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  roleText: { ...typography.caption },
  
  articleRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  articleTitle: { ...typography.body },
  
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { ...typography.bodySmall, fontWeight: '500' },
});
