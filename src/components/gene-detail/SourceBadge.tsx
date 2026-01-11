import { Pressable, StyleSheet, Text, View, Linking } from 'react-native';
import type { ThemeColors } from '../../theme/themes';

export type SourceType = 'ncbi' | 'uniprot' | 'pdb' | 'alphafold' | 'string' | 'biocyc' | 'kegg' | 'pubmed';
export type CurationStatus = 'curated' | 'verified' | 'imported';

interface SourceBadgeProps {
  source: SourceType;
  url?: string;
  colors: ThemeColors;
  verified?: boolean;
  small?: boolean;
  curation?: CurationStatus;
}

const SOURCE_INFO: Record<SourceType, { label: string; defaultColor: string }> = {
  ncbi: { label: 'NCBI', defaultColor: '#205493' },
  uniprot: { label: 'UniProt', defaultColor: '#F5A623' },
  pdb: { label: 'PDB', defaultColor: '#3AA745' },
  alphafold: { label: 'AlphaFold', defaultColor: '#4C8B98' },
  string: { label: 'STRING', defaultColor: '#8bc34a' },
  biocyc: { label: 'BioCyc', defaultColor: '#7B68EE' },
  kegg: { label: 'KEGG', defaultColor: '#00897b' },
  pubmed: { label: 'PubMed', defaultColor: '#d32f2f' },
};

// Get source color from theme or fallback
function getSourceColor(source: SourceType, colors: ThemeColors): string {
  const themeColors: Record<string, string | undefined> = {
    ncbi: colors.sourceNcbi,
    uniprot: colors.sourceUniprot,
    pdb: colors.sourcePdb,
    biocyc: colors.sourceBiocyc,
  };
  return themeColors[source] || SOURCE_INFO[source].defaultColor;
}

export function SourceBadge({ source, url, colors, verified = true, small = false, curation }: SourceBadgeProps) {
  const info = SOURCE_INFO[source];
  const sourceColor = getSourceColor(source, colors);
  
  const handlePress = () => {
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  const content = (
    <View 
      style={[
        styles.badge,
        { backgroundColor: `${sourceColor}20`, borderColor: sourceColor },
        small && styles.badgeSmall,
      ]}
    >
      <Text style={[styles.label, { color: sourceColor }, small && styles.labelSmall]}>
        {info.label}
      </Text>
      {verified && (
        <Text style={[styles.verified, { color: sourceColor }]}>✓</Text>
      )}
      {url && (
        <Text style={[styles.arrow, { color: sourceColor }]}>→</Text>
      )}
    </View>
  );

  if (url) {
    return (
      <Pressable onPress={handlePress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

interface SourceRowProps {
  sources: SourceType[];
  links?: Partial<Record<SourceType, string>>;
  colors: ThemeColors;
}

/**
 * Display a row of source badges
 */
export function SourceRow({ sources, links = {}, colors }: SourceRowProps) {
  return (
    <View style={styles.row}>
      {sources.map((source) => (
        <SourceBadge
          key={source}
          source={source}
          url={links[source]}
          colors={colors}
          small
        />
      ))}
    </View>
  );
}

/**
 * Inline source indicator (smaller, for within text)
 */
export function SourceIndicator({ source, colors }: { source: SourceType; colors: ThemeColors }) {
  const info = SOURCE_INFO[source];
  const sourceColor = getSourceColor(source, colors);
  
  return (
    <Text style={[styles.indicator, { color: sourceColor }]}>
      [{info.label}]
    </Text>
  );
}

/**
 * Curation Badge (Atlas v3.1)
 * Shows the curation status of a data entry
 */
interface CurationBadgeProps {
  status: CurationStatus;
  colors: ThemeColors;
}

const CURATION_INFO: Record<CurationStatus, { label: string; icon: string }> = {
  curated: { label: 'Curated', icon: '★' },
  verified: { label: 'Verified', icon: '✓' },
  imported: { label: 'Imported', icon: '↓' },
};

export function CurationBadge({ status, colors }: CurationBadgeProps) {
  const info = CURATION_INFO[status];
  const statusColors: Record<CurationStatus, string> = {
    curated: colors.evidenceCurated || colors.success,
    verified: colors.evidenceVerified || colors.info,
    imported: colors.evidenceImported || colors.textMuted,
  };
  const color = statusColors[status];
  
  return (
    <View style={[styles.curationBadge, { backgroundColor: `${color}15` }]}>
      <Text style={[styles.curationIcon, { color }]}>{info.icon}</Text>
      <Text style={[styles.curationLabel, { color }]}>{info.label}</Text>
    </View>
  );
}

/**
 * Conflict Badge (Atlas v3.1)
 * Indicates data discrepancy between sources
 */
interface ConflictBadgeProps {
  count?: number;
  colors: ThemeColors;
  onPress?: () => void;
}

export function ConflictBadge({ count = 1, colors, onPress }: ConflictBadgeProps) {
  const content = (
    <View style={[styles.conflictBadge, { 
      backgroundColor: colors.conflictBadgeBg || colors.warning + '20',
      borderColor: colors.conflictBadgeText || colors.warning,
    }]}>
      <Text style={[styles.conflictIcon, { color: colors.conflictBadgeText || colors.warning }]}>⚠</Text>
      <Text style={[styles.conflictLabel, { color: colors.conflictBadgeText || colors.warning }]}>
        {count} conflict{count > 1 ? 's' : ''}
      </Text>
    </View>
  );
  
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }
  
  return content;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 4,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelSmall: {
    fontSize: 10,
  },
  verified: {
    fontSize: 10,
    marginLeft: 3,
  },
  arrow: {
    fontSize: 10,
    marginLeft: 3,
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  indicator: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Curation Badge styles
  curationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  curationIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  curationLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Conflict Badge styles
  conflictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 4,
  },
  conflictIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  conflictLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
