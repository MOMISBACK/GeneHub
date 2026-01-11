/**
 * MyQrScreen - Generate and display your researcher QR card
 * Privacy by design: user chooses which fields to share
 */

import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { useI18n } from '../i18n';
import { Icon } from '../components/Icons';
import { copyToClipboard, isWeb } from '../lib/platform';
import {
  buildResearcherCard,
  serializeCard,
  type ResearcherCardOptions,
} from '../lib/researcherCard';
import type { ProfileData } from '../types/researcherCard';

// QR Code component - dynamic import for web compatibility
let QRCode: any = null;
if (Platform.OS !== 'web') {
  QRCode = require('react-native-qrcode-svg').default;
}

type Props = NativeStackScreenProps<RootStackParamList, 'MyQr'>;

const STORAGE_KEY = 'user_profile_extended';

interface ExtendedProfile extends ProfileData {
  title?: string;
}

const DEFAULT_PROFILE: ExtendedProfile = {
  name: '',
  institution: '',
  email: '',
  orcid: '',
  url: '',
  keywords: [],
};

export function MyQrScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [profile, setProfile] = useState<ExtendedProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  // Field toggles (privacy controls)
  const [options, setOptions] = useState<ResearcherCardOptions>({
    includeInstitution: true,
    includeEmail: true,
    includeOrcid: true,
    includeUrl: true,
    includeKeywords: true,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Try extended profile first
      const extended = await AsyncStorage.getItem(STORAGE_KEY);
      if (extended) {
        setProfile(JSON.parse(extended));
        setLoading(false);
        return;
      }
      
      // Fallback to existing ProfileScreen storage
      const basic = await AsyncStorage.getItem('user_profile');
      const interests = await AsyncStorage.getItem('user_interests');
      
      if (basic) {
        const parsed = JSON.parse(basic);
        setProfile({
          name: parsed.name || '',
          institution: parsed.institution || '',
          email: parsed.email || '',
          orcid: '',
          url: '',
          keywords: interests ? JSON.parse(interests) : [],
        });
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (updated: ExtendedProfile) => {
    setProfile(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Build card and serialize
  const { card, cardJson, fieldCount } = useMemo(() => {
    const c = buildResearcherCard(profile, options);
    const json = serializeCard(c);
    
    // Count shared fields
    let count = 1; // name is always included
    if (options.includeInstitution && profile.institution) count++;
    if (options.includeEmail && profile.email) count++;
    if (options.includeOrcid && profile.orcid) count++;
    if (options.includeUrl && profile.url) count++;
    if (options.includeKeywords && profile.keywords && profile.keywords.length > 0) count++;
    
    return { card: c, cardJson: json, fieldCount: count };
  }, [profile, options]);

  const handleCopy = async () => {
    const success = await copyToClipboard(cardJson);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleOption = (key: keyof ResearcherCardOptions) => {
    setOptions((prev: ResearcherCardOptions) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasProfile = profile.name.trim().length > 0;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.center, { paddingTop: insets.top + 100 }]}>
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Chargement...</Text>
        </View>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mon QR Code</Text>
        <Pressable onPress={() => navigation.navigate('ScanQr')} style={styles.scanBtn}>
          <Icon name="camera" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        {!hasProfile ? (
          // No profile setup
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Configurez votre profil</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Pour générer un QR code, vous devez d'abord renseigner votre nom dans votre profil.
            </Text>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={() => navigation.navigate('Main', { screen: 'Profile' })}
            >
              <Text style={[styles.primaryBtnText, { color: colors.buttonPrimaryText ?? '#fff' }]}>
                Aller au profil
              </Text>
            </Pressable>
          </View>
        ) : showQr ? (
          // QR Code display
          <View style={styles.qrSection}>
            <View style={[styles.qrCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
              <Text style={[styles.qrLabel, { color: colors.textMuted }]}>
                Vous partagez {fieldCount} champ{fieldCount > 1 ? 's' : ''}
              </Text>
              
              {/* QR Code */}
              <View style={styles.qrWrapper}>
                {Platform.OS !== 'web' && QRCode ? (
                  <QRCode
                    value={cardJson}
                    size={220}
                    backgroundColor={colors.surface}
                    color={colors.text}
                  />
                ) : (
                  // Web fallback: show JSON
                  <View style={[styles.webQrFallback, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <Text style={[styles.webQrText, { color: colors.textMuted }]}>
                      QR Code (prévisualisation web non disponible)
                    </Text>
                    <Text style={[styles.webQrHint, { color: colors.textMuted }]}>
                      Utilisez "Copier le code" ci-dessous
                    </Text>
                  </View>
                )}
              </View>

              {/* Profile preview */}
              <View style={styles.previewSection}>
                <Text style={[styles.previewName, { color: colors.text }]}>{profile.name}</Text>
                {options.includeInstitution && profile.institution && (
                  <Text style={[styles.previewDetail, { color: colors.textSecondary }]}>
                    {profile.institution}
                  </Text>
                )}
                {options.includeEmail && profile.email && (
                  <Text style={[styles.previewDetail, { color: colors.textMuted }]}>
                    {profile.email}
                  </Text>
                )}
                {options.includeOrcid && profile.orcid && (
                  <Text style={[styles.previewOrcid, { color: colors.accent }]}>
                    ORCID: {profile.orcid}
                  </Text>
                )}
              </View>

              {/* Actions */}
              <View style={styles.qrActions}>
                <Pressable
                  style={[styles.copyBtn, { backgroundColor: copied ? colors.success : colors.accent }]}
                  onPress={handleCopy}
                >
                  <Text style={[styles.copyBtnText, { color: colors.buttonPrimaryText ?? '#fff' }]}>
                    {copied ? '✓ Copié' : 'Copier le code'}
                  </Text>
                </Pressable>
                
                <Pressable
                  style={[styles.secondaryBtn, { borderColor: colors.border }]}
                  onPress={() => setShowQr(false)}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Modifier</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          // Configuration view
          <>
            {/* Summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                Vous partagez : {fieldCount} champ{fieldCount > 1 ? 's' : ''}
              </Text>
              <Text style={[styles.summarySubtitle, { color: colors.textMuted }]}>
                Sélectionnez les informations à inclure dans votre QR code
              </Text>
            </View>

            {/* Field toggles */}
            <View style={[styles.optionsCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
              {/* Name - always enabled */}
              <View style={styles.optionRow}>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>Nom</Text>
                  <Text style={[styles.optionValue, { color: colors.textMuted }]}>
                    {profile.name || 'Non renseigné'}
                  </Text>
                </View>
                <Text style={[styles.required, { color: colors.accent }]}>Requis</Text>
              </View>

              {/* Institution */}
              <View style={[styles.optionRow, styles.optionBorder, { borderTopColor: colors.borderHairline }]}>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>Institution</Text>
                  <Text style={[styles.optionValue, { color: colors.textMuted }]}>
                    {profile.institution || 'Non renseigné'}
                  </Text>
                </View>
                <Switch
                  value={options.includeInstitution}
                  onValueChange={() => toggleOption('includeInstitution')}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  disabled={!profile.institution}
                />
              </View>

              {/* Email */}
              <View style={[styles.optionRow, styles.optionBorder, { borderTopColor: colors.borderHairline }]}>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>Email</Text>
                  <Text style={[styles.optionValue, { color: colors.textMuted }]}>
                    {profile.email || 'Non renseigné'}
                  </Text>
                </View>
                <Switch
                  value={options.includeEmail}
                  onValueChange={() => toggleOption('includeEmail')}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  disabled={!profile.email}
                />
              </View>

              {/* ORCID */}
              <View style={[styles.optionRow, styles.optionBorder, { borderTopColor: colors.borderHairline }]}>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>ORCID</Text>
                  <Text style={[styles.optionValue, { color: colors.textMuted }]}>
                    {profile.orcid || 'Non renseigné'}
                  </Text>
                </View>
                <Switch
                  value={options.includeOrcid}
                  onValueChange={() => toggleOption('includeOrcid')}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  disabled={!profile.orcid}
                />
              </View>

              {/* URL */}
              <View style={[styles.optionRow, styles.optionBorder, { borderTopColor: colors.borderHairline }]}>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>Site web</Text>
                  <Text style={[styles.optionValue, { color: colors.textMuted }]} numberOfLines={1}>
                    {profile.url || 'Non renseigné'}
                  </Text>
                </View>
                <Switch
                  value={options.includeUrl}
                  onValueChange={() => toggleOption('includeUrl')}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  disabled={!profile.url}
                />
              </View>

              {/* Keywords */}
              <View style={[styles.optionRow, styles.optionBorder, { borderTopColor: colors.borderHairline }]}>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>Mots-clés</Text>
                  <Text style={[styles.optionValue, { color: colors.textMuted }]} numberOfLines={1}>
                    {profile.keywords && profile.keywords.length > 0
                      ? profile.keywords.slice(0, 3).join(', ') + (profile.keywords.length > 3 ? '...' : '')
                      : 'Non renseigné'}
                  </Text>
                </View>
                <Switch
                  value={options.includeKeywords}
                  onValueChange={() => toggleOption('includeKeywords')}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  disabled={!profile.keywords || profile.keywords.length === 0}
                />
              </View>
            </View>

            {/* Generate button */}
            <Pressable
              style={[styles.generateBtn, { backgroundColor: colors.accent }]}
              onPress={() => setShowQr(true)}
            >
              <Text style={[styles.generateBtnText, { color: colors.buttonPrimaryText ?? '#fff' }]}>
                Afficher mon QR
              </Text>
            </Pressable>

            {/* Edit profile link */}
            <Pressable
              style={styles.editLink}
              onPress={() => navigation.navigate('Main', { screen: 'Profile' })}
            >
              <Text style={[styles.editLinkText, { color: colors.textMuted }]}>
                Modifier mon profil →
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...typography.body },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: { padding: spacing.sm },
  backIcon: { fontSize: 24, fontWeight: '300' },
  headerTitle: { flex: 1, ...typography.body, fontWeight: '600', textAlign: 'center' },
  scanBtn: { padding: spacing.sm },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg },

  // Empty state
  emptyCard: {
    padding: spacing.xl,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyTitle: { ...typography.h3, marginBottom: spacing.sm },
  emptyText: { ...typography.body, textAlign: 'center', marginBottom: spacing.lg },
  primaryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  primaryBtnText: { ...typography.body, fontWeight: '600' },

  // Summary
  summaryCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  summaryTitle: { ...typography.body, fontWeight: '600' },
  summarySubtitle: { ...typography.caption, marginTop: spacing.xs },

  // Options
  optionsCard: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  optionBorder: { borderTopWidth: StyleSheet.hairlineWidth },
  optionInfo: { flex: 1, marginRight: spacing.md },
  optionLabel: { ...typography.body, fontWeight: '500' },
  optionValue: { ...typography.caption, marginTop: 2 },
  required: { ...typography.caption, fontWeight: '600' },

  // Generate
  generateBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  generateBtnText: { ...typography.body, fontWeight: '600' },

  editLink: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  editLinkText: { ...typography.body },

  // QR display
  qrSection: { paddingTop: spacing.md },
  qrCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  qrLabel: { ...typography.caption, marginBottom: spacing.md },
  qrWrapper: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.sm,
  },
  webQrFallback: {
    width: 220,
    height: 220,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  webQrText: { ...typography.body, textAlign: 'center' },
  webQrHint: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },

  previewSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  previewName: { ...typography.h3, marginBottom: spacing.xs },
  previewDetail: { ...typography.body },
  previewOrcid: { ...typography.caption, marginTop: spacing.xs },

  qrActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    width: '100%',
  },
  copyBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  copyBtnText: { ...typography.body, fontWeight: '600' },
  secondaryBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryBtnText: { ...typography.body, fontWeight: '500' },
});
