/**
 * FunctionText Component
 * 
 * Displays protein function text with:
 * - PubMed references converted to superscript numbers
 * - Clickable reference list with author info (fetched from PubMed)
 * - Gene names rendered in italic and clickable
 */

import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Pressable, Linking, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Reference = {
  index: number;
  pubmedId: string;
  citation?: string; // "Author et al., Year"
  loading?: boolean;
};

type TextSegment = {
  type: 'text' | 'ref' | 'gene';
  content: string;
  refIndex?: number;
  geneName?: string;
};

interface FunctionTextProps {
  text: string;
  organism?: string;
  colors: {
    text: string;
    textMuted: string;
    textSecondary: string;
    accent: string;
    bgSecondary: string;
  };
}

// Superscript characters for reference numbers
const SUPERSCRIPTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

function toSuperscript(num: number): string {
  return num.toString().split('').map(d => SUPERSCRIPTS[parseInt(d)]).join('');
}

// Common bacterial gene name patterns (2-4 lowercase letters + uppercase letter + optional number)
// Examples: dnaA, recA, ftsZ, rpoB, gyrA, lacZ, etc.
const GENE_PATTERN = /\b([a-z]{2,4}[A-Z][0-9]?)\b/g;

// Known gene prefixes in bacteria (used for more accurate detection)
const KNOWN_GENE_PREFIXES = [
  'dn', 're', 'ft', 'rp', 'gy', 'la', 'ma', 'tr', 'hi', 'le',
  'ar', 'th', 'me', 'cy', 'pr', 'ph', 'ty', 'va', 'il', 'al',
  'gl', 'as', 'ly', 'se', 'uv', 'le', 'da', 'mu', 'na', 'ni',
  'fn', 'cr', 'fu', 'zu', 'so', 'ka', 'ah', 'om', 'fi', 'fl',
  'ch', 'mo', 'pt', 'pg', 'pf', 'fb', 'ga', 'en', 'py', 'ac',
  'ci', 'ic', 'su', 'md', 'pp', 'pc', 'at', 'nu', 'sd', 'nd',
  'pu', 'ca', 'ri', 'bi', 'pa', 'fo', 'he', 'to', 'sm', 'zi',
  'ss', 'li', 'rn', 'in', 'tu', 'er', 'ob', 'yp', 'ye', 'si',
  'cs', 'hn', 'ih', 'dp', 'ro', 'dx', 'qo', 'qe', 'na', 'or',
];

export function FunctionText({ text, organism = 'Escherichia coli', colors }: FunctionTextProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [refCitations, setRefCitations] = useState<Record<string, string>>({});
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [refsExpanded, setRefsExpanded] = useState(false);

  const { segments, references } = useMemo(() => {
    const refs: Reference[] = [];
    let processedText = text;
    
    // First, extract and replace PubMed references
    const pubmedRegex = /\(?PubMed[:\s]*(\d+)(?:[,\s]+PubMed[:\s]*(\d+))*\)?/gi;
    const pubmedMap = new Map<string, number>();
    
    // Find all PubMed matches
    let match;
    const pubmedMatches: Array<{ fullMatch: string; ids: string[] }> = [];
    
    while ((match = pubmedRegex.exec(text)) !== null) {
      const ids: string[] = [];
      const fullMatch = match[0];
      const idMatches = fullMatch.matchAll(/(\d{5,})/g);
      for (const idMatch of idMatches) {
        ids.push(idMatch[1]);
      }
      pubmedMatches.push({ fullMatch, ids });
    }
    
    // Assign indices to unique PubMed IDs and build replacement text
    for (const m of pubmedMatches) {
      let replacement = '';
      for (const id of m.ids) {
        if (!pubmedMap.has(id)) {
          const idx = refs.length + 1;
          pubmedMap.set(id, idx);
          refs.push({ index: idx, pubmedId: id });
        }
        replacement += `<<REF:${pubmedMap.get(id)}>>`;
      }
      processedText = processedText.replace(m.fullMatch, replacement);
    }
    
    // Now parse the text into segments (text, refs, and genes)
    const segs: TextSegment[] = [];
    
    // Split by ref markers first
    const refParts = processedText.split(/(<<REF:\d+>>)/);
    
    for (const part of refParts) {
      const refMatch = part.match(/<<REF:(\d+)>>/);
      if (refMatch) {
        segs.push({ type: 'ref', content: toSuperscript(parseInt(refMatch[1])), refIndex: parseInt(refMatch[1]) });
      } else if (part.trim()) {
        // Now look for gene names in this text part
        const geneMatches: Array<{ gene: string; start: number; end: number }> = [];
        let geneMatch;
        
        // Reset regex
        GENE_PATTERN.lastIndex = 0;
        
        while ((geneMatch = GENE_PATTERN.exec(part)) !== null) {
          const gene = geneMatch[1];
          const prefix = gene.slice(0, 2).toLowerCase();
          
          // Only include if it looks like a known gene pattern
          if (KNOWN_GENE_PREFIXES.includes(prefix)) {
            geneMatches.push({
              gene,
              start: geneMatch.index,
              end: geneMatch.index + gene.length,
            });
          }
        }
        
        // Build segments from this part
        if (geneMatches.length === 0) {
          segs.push({ type: 'text', content: part });
        } else {
          let lastIdx = 0;
          for (const gm of geneMatches) {
            if (gm.start > lastIdx) {
              segs.push({ type: 'text', content: part.slice(lastIdx, gm.start) });
            }
            segs.push({ type: 'gene', content: gm.gene, geneName: gm.gene });
            lastIdx = gm.end;
          }
          if (lastIdx < part.length) {
            segs.push({ type: 'text', content: part.slice(lastIdx) });
          }
        }
      }
    }
    
    // If no segments, just return the whole text
    if (segs.length === 0) {
      segs.push({ type: 'text', content: text });
    }
    
    return { segments: segs, references: refs };
  }, [text]);

  // Fetch author info from PubMed for all references
  useEffect(() => {
    if (references.length === 0) return;
    
    const fetchCitations = async () => {
      setLoadingRefs(true);
      const ids = references.map(r => r.pubmedId).join(',');
      
      try {
        // Use NCBI E-utilities ESummary to get citation info
        const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids}&retmode=json`;
        const res = await fetch(url);
        
        if (res.ok) {
          const data = await res.json();
          const citations: Record<string, string> = {};
          
          for (const ref of references) {
            const article = data.result?.[ref.pubmedId];
            if (article) {
              const authors = article.authors;
              const year = article.pubdate?.split(' ')?.[0] || article.epubdate?.split(' ')?.[0];
              
              if (authors && authors.length > 0) {
                const firstAuthor = authors[0]?.name?.split(' ')?.[0] || authors[0]?.name;
                if (authors.length > 1) {
                  citations[ref.pubmedId] = `${firstAuthor} et al., ${year || '?'}`;
                } else {
                  citations[ref.pubmedId] = `${firstAuthor}, ${year || '?'}`;
                }
              } else {
                citations[ref.pubmedId] = `PMID:${ref.pubmedId}`;
              }
            }
          }
          
          setRefCitations(citations);
        }
      } catch (e) {
        // Ignore citation fetch failures; fall back to PMID display.
      } finally {
        setLoadingRefs(false);
      }
    };
    
    fetchCitations();
  }, [references]);

  const openPubMed = (pubmedId: string) => {
    Linking.openURL(`https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/`);
  };

  const navigateToGene = (geneName: string) => {
    navigation.push('GeneDetail', { symbol: geneName, organism });
  };

  return (
    <View style={styles.container}>
      {/* Main text with superscript references and clickable genes */}
      <Text style={[styles.functionText, { color: colors.text }]}>
        {segments.map((seg, i) => {
          if (seg.type === 'ref') {
            return (
              <Text
                key={i}
                style={[styles.refSuperscript, { color: colors.accent }]}
                onPress={() => {
                  const ref = references.find(r => r.index === seg.refIndex);
                  if (ref) openPubMed(ref.pubmedId);
                }}
              >
                {seg.content}
              </Text>
            );
          }
          if (seg.type === 'gene') {
            return (
              <Text
                key={i}
                style={[styles.geneName, { color: colors.accent }]}
                onPress={() => navigateToGene(seg.geneName!)}
              >
                {seg.content}
              </Text>
            );
          }
          return <Text key={i}>{seg.content}</Text>;
        })}
      </Text>
      
      {/* Reference list - Collapsible */}
      {references.length > 0 && (
        <View style={[styles.refList, { borderTopColor: colors.bgSecondary }]}>
          <Pressable 
            style={styles.refHeader}
            onPress={() => setRefsExpanded(!refsExpanded)}
          >
            <View style={styles.refHeaderLeft}>
              <Text style={[styles.refTitle, { color: colors.textMuted }]}>
                Références ({references.length})
              </Text>
              {loadingRefs && <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: 8 }} />}
            </View>
            <Text style={[styles.refExpandChevron, { color: colors.textMuted }]}>
              {refsExpanded ? '‹' : '›'}
            </Text>
          </Pressable>
          {refsExpanded && references.map((ref) => (
            <Pressable
              key={ref.pubmedId}
              style={[styles.refItem, { backgroundColor: colors.bgSecondary }]}
              onPress={() => openPubMed(ref.pubmedId)}
            >
              <Text style={[styles.refIndex, { color: colors.textSecondary }]}>
                {toSuperscript(ref.index)}
              </Text>
              <Text style={[styles.refCitation, { color: colors.text }]} numberOfLines={1}>
                {refCitations[ref.pubmedId] || `PMID:${ref.pubmedId}`}
              </Text>
              <Text style={[styles.refChevron, { color: colors.textMuted }]}>→</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  functionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  refSuperscript: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  geneName: {
    fontStyle: 'italic',
    fontWeight: '500',
  },
  refList: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  refHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  refHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refExpandChevron: {
    fontSize: 18,
    fontWeight: '300',
  },
  refItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  refIndex: {
    fontSize: 11,
    width: 18,
  },
  refCitation: {
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  refChevron: {
    fontSize: 14,
  },
});
