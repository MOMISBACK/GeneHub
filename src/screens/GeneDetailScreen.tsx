/**
 * GeneDetailScreen - Premium Card-based Design
 * 
 * Refactored to use hooks for clean separation of concerns:
 * - useGeneData: gene data loading, caching, save/unsave
 * - useFunctionReferences: PubMed citation fetching
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/types';
import { parseText, toSuperscript } from '../lib/utils';
import { useGeneData, useFunctionReferences, useNotes } from '../lib/hooks';
import { Card, CollapsibleCard, SourceItem, StructureItem } from '../components/gene-detail';
import { NotesSection } from '../components/notes';
import { AddToCollectionButton } from '../components/collections';
import { useTheme, typography, spacing, radius } from '../theme';
import { useI18n } from '../i18n';
import { Icon } from '../components/Icons';

type Props = NativeStackScreenProps<RootStackParamList, 'GeneDetail'>;

export function GeneDetailScreen({ route }: Props) {
  const { symbol, organism } = route.params;
  const { theme } = useTheme();
  const { t } = useI18n();
  const colors = theme.colors;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  // Use hooks for data management
  const { loading, data, biocycData, error, isSaved, refresh, toggleSave } = useGeneData(symbol, organism, t);

  // Gene entity ID for notes (symbol_organism)
  const geneEntityId = `${symbol}_${organism}`;
  const { notes, loading: notesLoading, refresh: refreshNotes } = useNotes('gene', geneEntityId);

  // UI state
  const [showMenu, setShowMenu] = useState(false);
  const [showAllInteractors, setShowAllInteractors] = useState(false);
  const [expandedFunction, setExpandedFunction] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [refsExpanded, setRefsExpanded] = useState(false);

  // Parse function text for references
  const functionText = data?.function ?? '';
  const { segments: functionSegments, references: functionReferences } = useMemo(() => {
    if (!functionText) return { segments: [], references: [] };
    return parseText(functionText);
  }, [functionText]);

  // Fetch citations for references
  const { refCitations, loadingRefs } = useFunctionReferences(functionReferences);

  // Build PDB items list
  const pdbItems = useMemo(() => {
    const map = new Map<string, { id: string; method?: string; resolution?: number }>();

    for (const pdb of data?.pdbStructures ?? []) {
      const id = String(pdb.id ?? '').trim();
      if (!id) continue;
      const key = id.toUpperCase();
      map.set(key, { id: key, method: pdb.method, resolution: pdb.resolution });
    }

    for (const pdbId of data?.pdbIds ?? []) {
      const id = String(pdbId ?? '').trim();
      if (!id) continue;
      const key = id.toUpperCase();
      if (!map.has(key)) map.set(key, { id: key });
    }

    return Array.from(map.values());
  }, [data?.pdbStructures, data?.pdbIds]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render states
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <Pressable
          style={[styles.retryBtn, { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderHairline }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.retryBtnText, { color: colors.text }]}>{t.common.back}</Text>
        </Pressable>
        <Pressable style={[styles.retryBtn, { backgroundColor: colors.accent }]} onPress={refresh}>
          <Text style={[styles.retryBtnText, { color: colors.buttonPrimaryText ?? '#fff' }]}>{t.common.retry}</Text>
        </Pressable>
      </View>
    );
  }

  if (!data) return null;

  const hasStructures = pdbItems.length > 0 || !!data.alphafoldUrl;

  // ─────────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
          </Pressable>
          <View style={styles.titleContent}>
            <Text style={[styles.geneSymbol, { color: colors.text }]}>{data.symbol}</Text>
            <Text style={[styles.geneOrganism, { color: colors.textMuted }]}>{data.organism}</Text>
          </View>
          <AddToCollectionButton entityType="gene" entityId={geneEntityId} displayName={data.symbol} />
          <Pressable onPress={toggleSave} style={styles.starBtn} hitSlop={8}>
            <Icon name={isSaved ? 'star' : 'starOutline'} size={18} color={isSaved ? colors.text : colors.textMuted} />
          </Pressable>
          <Pressable onPress={() => setShowMenu(true)} style={styles.menuBtn}>
            <Text style={[styles.menuIcon, { color: colors.textMuted }]}>⋯</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Sources Card - collapsible */}
        <CollapsibleCard 
          title={t.geneDetail.sources} 
          expanded={sourcesExpanded}
          onToggle={() => setSourcesExpanded(!sourcesExpanded)}
          colors={colors}
        >
          <SourceItem name={t.geneDetail.sourceNames.ncbiGene} available={!!data.ncbiGeneId} url={data.links?.ncbi} colors={colors} />
          <SourceItem name={t.geneDetail.sourceNames.uniprot} available={!!data.uniprotId} url={data.links?.uniprot} colors={colors} />
          <SourceItem name={t.geneDetail.sourceNames.ecocyc} available={!!biocycData} url={biocycData?.links?.biocyc} colors={colors} />
        </CollapsibleCard>

        {/* Description Card */}
        <Card title={t.geneDetail.sections.protein} colors={colors}>
          {data.proteinName && (
            <Text style={[styles.proteinName, { color: colors.text }]}>{data.proteinName}</Text>
          )}
          
          {data.function && (
            <View style={[styles.functionBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.functionLabel, { color: colors.text }]}>{t.geneDetail.fields.function}</Text>
              <Text style={[styles.functionText, { color: colors.textSecondary }]} numberOfLines={expandedFunction ? undefined : 4}>
                {functionSegments.map((seg: any, i: number) => {
                  if (seg.type === 'ref') {
                    return (
                      <Text key={`ref_${i}`} style={{ color: colors.accent, fontSize: 11, fontWeight: '600' }}>
                        {seg.content}
                      </Text>
                    );
                  }
                  if (seg.type === 'gene') {
                    return (
                      <Text key={`gene_${i}`} style={{ fontStyle: 'italic' }}>
                        {seg.content}
                      </Text>
                    );
                  }
                  return <Text key={`txt_${i}`}>{seg.content}</Text>;
                })}
              </Text>
              {data.function.length > 200 && (
                <Pressable onPress={() => setExpandedFunction(!expandedFunction)}>
                  <Text style={[styles.readMore, { color: colors.accent }]}>
                    {expandedFunction ? t.geneDetail.readLess : t.geneDetail.readMore}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </Card>

        {/* References Card - collapsible */}
        {functionReferences.length > 0 && (
          <CollapsibleCard 
            title={`${t.geneDetail.sections2.references} (${functionReferences.length})`}
            expanded={refsExpanded}
            onToggle={() => setRefsExpanded(!refsExpanded)}
            colors={colors}
          >
            <View style={[styles.refHeaderRow, { borderBottomColor: colors.borderHairline }]}> 
              <Text style={[styles.refHeaderText, { color: colors.textMuted }]}>{t.geneDetail.fields.pubmed}</Text>
              {loadingRefs && <ActivityIndicator size="small" color={colors.accent} />}
            </View>
            {functionReferences.map((ref) => (
              <Pressable
                key={ref.pubmedId}
                style={[styles.refRow, { borderBottomColor: colors.borderHairline }]}
                onPress={() => Linking.openURL(`https://pubmed.ncbi.nlm.nih.gov/${ref.pubmedId}/`)}
              >
                <Text style={[styles.refIndex, { color: colors.textSecondary }]}>{toSuperscript(ref.index)}</Text>
                <Text style={[styles.refCitation, { color: colors.text }]} numberOfLines={1}>
                  {refCitations[ref.pubmedId] || `PMID:${ref.pubmedId}`}
                </Text>
              </Pressable>
            ))}
          </CollapsibleCard>
        )}

        {/* Interactions Card */}
        {data.interactors && data.interactors.length > 0 && (
          <Card title={t.geneDetail.sections.interactions} colors={colors}>
            <View style={styles.interactionsList}>
              {data.interactors.slice(0, 6).map((int, i) => (
                <Pressable
                  key={i}
                  style={[styles.interactionChip, { borderColor: colors.borderHairline }]}
                  onPress={() => navigation.push('GeneDetail', { symbol: int.gene, organism: data.organism })}
                >
                  <Text style={[styles.interactionText, { color: colors.accent }]}>{int.gene}</Text>
                </Pressable>
              ))}
              {data.interactors.length > 6 && (
                <Pressable
                  style={[styles.interactionChip, { borderColor: colors.borderHairline }]}
                  onPress={() => setShowAllInteractors(true)}
                >
                  <Text style={[styles.interactionText, { color: colors.textMuted }]}>
                    +{data.interactors.length - 6}
                  </Text>
                </Pressable>
              )}
            </View>
          </Card>
        )}

        {/* Structures Card */}
        {hasStructures && (
          <Card title={t.geneDetail.sections.structure} colors={colors}>
            {pdbItems.slice(0, 3).map((pdb) => (
              <StructureItem
                key={pdb.id}
                id={pdb.id}
                method={pdb.method || t.geneDetail.fields.experimentalStructure}
                resolution={pdb.resolution}
                onPress={() => Linking.openURL(`https://www.rcsb.org/structure/${pdb.id}`)}
                colors={colors}
              />
            ))}
            {data.alphafoldUrl && (
              <StructureItem
                id="AlphaFold"
                method="Prédit (IA)"
                onPress={() => Linking.openURL(data.alphafoldUrl!)}
                colors={colors}
              />
            )}
          </Card>
        )}

        {/* Pathways Card */}
        {biocycData?.pathways && biocycData.pathways.length > 0 && (
          <Card title={t.geneDetail.sections2.metabolicPathways} colors={colors}>
            <View style={styles.pathwaysList}>
              {biocycData.pathways.slice(0, 4).map((pw, i) => (
                <View key={i} style={[styles.pathwayChip, { borderColor: colors.borderHairline }]}>
                  <Text style={[styles.pathwayText, { color: colors.text }]}>{pw.name}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Quick Info */}
        <Card title={t.geneDetail.sections2.information} colors={colors}>
          {data.sequenceLength && (
            <View style={[styles.infoRow, { borderBottomColor: colors.borderHairline }]}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t.geneDetail.fields.sequenceLength}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{data.sequenceLength} aa</Text>
            </View>
          )}
          {data.mass && (
            <View style={[styles.infoRow, { borderBottomColor: colors.borderHairline }]}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t.geneDetail.fields.sequenceMass}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{Math.round(data.mass)} kDa</Text>
            </View>
          )}
          {data.chromosome && (
            <View style={[styles.infoRow, { borderBottomColor: colors.borderHairline }]}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t.geneDetail.fields.chromosome}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{data.chromosome}</Text>
            </View>
          )}
          {data.start && data.stop && (
            <View style={[styles.infoRow, { borderBottomColor: colors.borderHairline }]}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t.geneDetail.fields.position}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {data.start.toLocaleString()} – {data.stop.toLocaleString()}
              </Text>
            </View>
          )}
        </Card>

        {/* External Links */}
        <Card title={t.geneDetail.links.externalLinks} colors={colors}>
          <View style={styles.linksRow}>
            {data.links?.ncbi && (
              <Pressable style={[styles.linkBtn, { borderColor: colors.border }]} onPress={() => Linking.openURL(data.links.ncbi!)}>
                <Text style={[styles.linkBtnText, { color: colors.accent }]}>{t.geneDetail.sourceNames.ncbiGene}</Text>
              </Pressable>
            )}
            {data.links?.uniprot && (
              <Pressable style={[styles.linkBtn, { borderColor: colors.border }]} onPress={() => Linking.openURL(data.links.uniprot!)}>
                <Text style={[styles.linkBtnText, { color: colors.accent }]}>{t.geneDetail.sourceNames.uniprot}</Text>
              </Pressable>
            )}
            {data.links?.string && (
              <Pressable style={[styles.linkBtn, { borderColor: colors.border }]} onPress={() => Linking.openURL(data.links.string!)}>
                <Text style={[styles.linkBtnText, { color: colors.accent }]}>{t.geneDetail.sourceNames.string}</Text>
              </Pressable>
            )}
            {biocycData?.links?.biocyc && (
              <Pressable style={[styles.linkBtn, { borderColor: colors.border }]} onPress={() => Linking.openURL(biocycData.links.biocyc!)}>
                <Text style={[styles.linkBtnText, { color: colors.accent }]}>{t.geneDetail.sourceNames.biocyc}</Text>
              </Pressable>
            )}
          </View>
        </Card>

        {/* Notes */}
        <NotesSection
          entityType="gene"
          entityId={geneEntityId}
          notes={notes}
          onRefresh={refreshNotes}
          loading={notesLoading}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Overflow Menu */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
          <View style={[styles.menu, { backgroundColor: colors.card }]}>
            <Pressable style={[styles.menuItem, { borderBottomColor: colors.borderHairline }]} onPress={() => { setShowMenu(false); toggleSave(); }}>
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                {isSaved ? `☆ ${t.geneDetail.menu.removeFromFavorites}` : `★ ${t.geneDetail.menu.addToFavorites}`}
              </Text>
            </Pressable>
            <Pressable style={[styles.menuItem, { borderBottomColor: colors.borderHairline }]} onPress={() => { setShowMenu(false); refresh(); }}>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t.geneDetail.menu.refresh}</Text>
            </Pressable>
            {data.links?.ncbi && (
              <Pressable style={styles.menuItem} onPress={() => { setShowMenu(false); Linking.openURL(data.links.ncbi!); }}>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{t.geneDetail.menu.openOnNcbi}</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Full Interactors Modal */}
      <Modal
        visible={showAllInteractors}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAllInteractors(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setShowAllInteractors(false)}>
          <View style={[styles.menu, { backgroundColor: colors.card, minWidth: 260 }]}>
            <View style={[styles.menuItem, { borderBottomColor: colors.borderHairline }]} pointerEvents="none">
              <Text style={[styles.menuItemText, { color: colors.textMuted }]}>
                Interactions ({data.interactors?.length ?? 0})
              </Text>
            </View>
            {(data.interactors ?? []).map((int, i) => (
              <Pressable
                key={`${int.gene}_${i}`}
                style={[styles.menuItem, { borderBottomColor: colors.borderHairline }]}
                onPress={() => {
                  setShowAllInteractors(false);
                  navigation.push('GeneDetail', { symbol: int.gene, organism: data.organism });
                }}
              >
                <Text style={[styles.menuItemText, { color: colors.text }]}>{int.gene}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorText: { ...typography.body, textAlign: 'center', marginBottom: spacing.xl },
  retryBtn: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: 12, marginTop: spacing.sm },
  retryBtnText: { fontSize: 15, fontWeight: '600' },
  
  // Header
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: spacing.sm },
  backIcon: { fontSize: 24, fontWeight: '300' },
  titleContent: { flex: 1, marginLeft: spacing.sm },
  geneSymbol: { fontSize: 20, fontWeight: '700', fontStyle: 'italic' },
  geneOrganism: { fontSize: 13, fontStyle: 'italic' },
  starBtn: { padding: spacing.sm },
  menuBtn: { padding: spacing.sm },
  menuIcon: { fontSize: 20, fontWeight: '600' },
  
  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg },
  
  // Notes Mini Card
  notesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  notesCardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  notesCardIcon: { fontSize: 16 },
  notesCardTitle: { fontSize: 15, fontWeight: '500' },
  notesCardArrow: { fontSize: 18, fontWeight: '300' },
  
  // Description
  proteinName: { fontSize: 14, marginBottom: spacing.md },
  functionBox: { borderRadius: 12, padding: spacing.md },
  functionLabel: { fontSize: 13, fontWeight: '600', marginBottom: spacing.xs },
  functionText: { fontSize: 13, lineHeight: 20 },
  readMore: { fontSize: 13, marginTop: spacing.sm },
  
  // Interactions
  interactionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  interactionChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: StyleSheet.hairlineWidth, backgroundColor: 'transparent' },
  interactionText: { fontSize: 13, fontWeight: '500', fontStyle: 'italic' },
  
  // Pathways
  pathwaysList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pathwayChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: StyleSheet.hairlineWidth, backgroundColor: 'transparent' },
  pathwayText: { fontSize: 12 },
  
  // Info
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '500' },
  
  // Links
  linksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  linkBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 20, borderWidth: 1 },
  linkBtnText: { fontSize: 13, fontWeight: '500' },

  // References
  refHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: spacing.sm },
  refHeaderText: { fontSize: 12, fontWeight: '600' },
  refRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  refIndex: { width: 18, fontSize: 11 },
  refCitation: { flex: 1, fontSize: 13, fontStyle: 'italic' },
  
  // Menu
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 100, paddingRight: spacing.xl },
  menu: { borderRadius: 12, minWidth: 200, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  menuItem: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth },
  menuItemText: { fontSize: 14 },
});
