/**
 * ScanQrScreen - Scan and import researcher cards
 * Android: camera scanner
 * Web: paste JSON fallback
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { useI18n } from '../i18n';
import { Icon } from '../components/Icons';
import { isWeb, isNative } from '../lib/platform';
import { tryParseCard } from '../lib/researcherCard';
import { importResearcherFromCard } from '../lib/knowledge/researchers.service';
import type { ResearcherCardV1, MergeResult } from '../types/researcherCard';

// Dynamic import for barcode scanner
let BarCodeScanner: any = null;
let Camera: any = null;

if (Platform.OS !== 'web') {
  try {
    const ExpoBarCodeScanner = require('expo-barcode-scanner');
    BarCodeScanner = ExpoBarCodeScanner.BarCodeScanner;
  } catch (e) {
    console.warn('expo-barcode-scanner not available');
  }
}

type Props = NativeStackScreenProps<RootStackParamList, 'ScanQr'>;

type ScanState = 'idle' | 'scanning' | 'preview' | 'importing' | 'result';

export function ScanQrScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [state, setState] = useState<ScanState>('idle');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pastedCode, setPastedCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [parsedCard, setParsedCard] = useState<ResearcherCardV1 | null>(null);
  const [result, setResult] = useState<MergeResult | null>(null);

  // Request camera permission on mount (native only)
  useEffect(() => {
    if (isNative && BarCodeScanner) {
      (async () => {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
    }
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (state !== 'scanning') return;
    processCode(data);
  };

  const processCode = (code: string) => {
    setError(null);
    setErrorDetails(null);
    setParsedCard(null);

    const result = tryParseCard(code);

    if (!result.ok) {
      setError(result.error);
      setErrorDetails(result.details || null);
      setState('idle');
      return;
    }

    setParsedCard(result.card);
    setState('preview');
  };

  const handlePaste = () => {
    const code = pastedCode.trim();
    if (!code) {
      setError('Veuillez coller un code');
      return;
    }
    processCode(code);
  };

  const handleImport = async () => {
    if (!parsedCard) return;

    setState('importing');
    try {
      const mergeResult = await importResearcherFromCard(parsedCard);
      setResult(mergeResult);
      setState('result');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'import');
      setState('preview');
    }
  };

  const handleCancel = () => {
    setParsedCard(null);
    setState('idle');
    setPastedCode('');
  };

  const handleDone = () => {
    if (result?.action === 'created' || result?.action === 'updated') {
      // Navigate to the researcher detail
      navigation.replace('ResearcherDetail', { researcherId: result.researcher.id });
    } else {
      navigation.goBack();
    }
  };

  const startScanning = () => {
    setError(null);
    setState('scanning');
  };

  // Render based on state
  const renderContent = () => {
    // Result state
    if (state === 'result' && result) {
      return (
        <View style={styles.resultSection}>
          <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
            {result.action === 'error' ? (
              <>
                <View style={[styles.resultIcon, { backgroundColor: colors.error + '20' }]}>
                  <Text style={styles.resultIconText}>✕</Text>
                </View>
                <Text style={[styles.resultTitle, { color: colors.error }]}>Erreur</Text>
                <Text style={[styles.resultMessage, { color: colors.textMuted }]}>{result.error}</Text>
              </>
            ) : (
              <>
                <View style={[styles.resultIcon, { backgroundColor: colors.success + '20' }]}>
                  <Text style={styles.resultIconText}>✓</Text>
                </View>
                <Text style={[styles.resultTitle, { color: colors.text }]}>
                  {result.action === 'created' ? 'Chercheur ajouté' : 'Profil mis à jour'}
                </Text>
                <Text style={[styles.resultName, { color: colors.text }]}>{result.researcher.name}</Text>
                {result.action === 'updated' && result.conflicts && result.conflicts.length > 0 && (
                  <Text style={[styles.conflictNote, { color: colors.textMuted }]}>
                    Certains champs existants n'ont pas été modifiés
                  </Text>
                )}
              </>
            )}
            
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={handleDone}
            >
              <Text style={[styles.primaryBtnText, { color: colors.buttonPrimaryText ?? '#fff' }]}>
                {result.action === 'error' ? 'Réessayer' : 'Voir le profil'}
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    // Preview state
    if (state === 'preview' && parsedCard) {
      return (
        <View style={styles.previewSection}>
          <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Aperçu du profil</Text>
          
          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
            <Text style={[styles.previewName, { color: colors.text }]}>{parsedCard.profile.name}</Text>
            
            {parsedCard.profile.institution && (
              <View style={styles.previewRow}>
                <Text style={[styles.previewField, { color: colors.textMuted }]}>Institution</Text>
                <Text style={[styles.previewValue, { color: colors.textSecondary }]}>
                  {parsedCard.profile.institution}
                </Text>
              </View>
            )}
            
            {parsedCard.profile.email && (
              <View style={styles.previewRow}>
                <Text style={[styles.previewField, { color: colors.textMuted }]}>Email</Text>
                <Text style={[styles.previewValue, { color: colors.textSecondary }]}>
                  {parsedCard.profile.email}
                </Text>
              </View>
            )}
            
            {parsedCard.profile.orcid && (
              <View style={styles.previewRow}>
                <Text style={[styles.previewField, { color: colors.textMuted }]}>ORCID</Text>
                <Text style={[styles.previewValue, { color: colors.accent }]}>
                  {parsedCard.profile.orcid}
                </Text>
              </View>
            )}
            
            {parsedCard.profile.url && (
              <View style={styles.previewRow}>
                <Text style={[styles.previewField, { color: colors.textMuted }]}>Site web</Text>
                <Text style={[styles.previewValue, { color: colors.accent }]} numberOfLines={1}>
                  {parsedCard.profile.url}
                </Text>
              </View>
            )}
            
            {parsedCard.profile.keywords && parsedCard.profile.keywords.length > 0 && (
              <View style={styles.keywordsSection}>
                <Text style={[styles.previewField, { color: colors.textMuted }]}>Mots-clés</Text>
                <View style={styles.keywordsList}>
                  {parsedCard.profile.keywords.map((kw, i) => (
                    <View key={i} style={[styles.keywordChip, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.keywordText, { color: colors.textSecondary }]}>{kw}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.previewActions}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={handleImport}
            >
              {state === 'importing' as ScanState ? (
                <ActivityIndicator color={colors.buttonPrimaryText ?? '#fff'} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.buttonPrimaryText ?? '#fff' }]}>
                  Ajouter à ma base
                </Text>
              )}
            </Pressable>
            
            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={handleCancel}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    // Native scanning state
    if (state === 'scanning' && isNative && BarCodeScanner) {
      return (
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
            barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
          />
          <View style={styles.scannerOverlay}>
            <View style={[styles.scanFrame, { borderColor: colors.accent }]} />
            <Text style={[styles.scanHint, { color: '#fff' }]}>
              Placez le QR code dans le cadre
            </Text>
          </View>
          <Pressable
            style={[styles.cancelScanBtn, { backgroundColor: colors.bg }]}
            onPress={handleCancel}
          >
            <Text style={[styles.cancelScanBtnText, { color: colors.text }]}>Annuler</Text>
          </Pressable>
        </View>
      );
    }

    // Idle state - different UI for web vs native
    return (
      <View style={styles.idleSection}>
        {/* Error display */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.error + '10', borderColor: colors.error }]}>
            <Text style={[styles.errorTitle, { color: colors.error }]}>QR invalide</Text>
            <Text style={[styles.errorMessage, { color: colors.textMuted }]}>{error}</Text>
            {errorDetails && (
              <Pressable onPress={() => setShowDetails(!showDetails)}>
                <Text style={[styles.showDetailsBtn, { color: colors.textMuted }]}>
                  {showDetails ? 'Masquer les détails' : 'Voir les détails'}
                </Text>
              </Pressable>
            )}
            {showDetails && errorDetails && (
              <Text style={[styles.errorDetails, { color: colors.textMuted }]}>{errorDetails}</Text>
            )}
          </View>
        )}

        {/* Native: Camera scan option */}
        {isNative && BarCodeScanner && (
          <View style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
            <View style={styles.optionHeader}>
              <Icon name="camera" size={24} color={colors.accent} />
              <Text style={[styles.optionTitle, { color: colors.text }]}>Scanner avec la caméra</Text>
            </View>
            <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
              Pointez la caméra vers le QR code d'un autre utilisateur
            </Text>
            {hasPermission === false ? (
              <Text style={[styles.permissionError, { color: colors.error }]}>
                Permission caméra refusée. Activez-la dans les paramètres.
              </Text>
            ) : (
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
                onPress={startScanning}
              >
                <Text style={[styles.primaryBtnText, { color: colors.buttonPrimaryText ?? '#fff' }]}>
                  Scanner
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Paste option (works on both web and native) */}
        <View style={[styles.optionCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
          <View style={styles.optionHeader}>
            <Icon name="document" size={24} color={colors.accent} />
            <Text style={[styles.optionTitle, { color: colors.text }]}>Coller le code</Text>
          </View>
          <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
            {isWeb
              ? 'Demandez à l\'autre utilisateur de copier son code et collez-le ici'
              : 'Alternative si le scan ne fonctionne pas'}
          </Text>
          
          <TextInput
            style={[
              styles.pasteInput,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder='{"v":1,"type":"researcher_card",...}'
            placeholderTextColor={colors.textMuted}
            value={pastedCode}
            onChangeText={setPastedCode}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <Pressable
            style={[
              styles.secondaryBtn,
              { borderColor: colors.accent, backgroundColor: pastedCode.trim() ? colors.accent : 'transparent' },
            ]}
            onPress={handlePaste}
            disabled={!pastedCode.trim()}
          >
            <Text
              style={[
                styles.secondaryBtnText,
                { color: pastedCode.trim() ? (colors.buttonPrimaryText ?? '#fff') : colors.textMuted },
              ]}
            >
              Valider
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header - only show when not scanning */}
      {state !== 'scanning' && (
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Ajouter via QR</Text>
          <Pressable onPress={() => navigation.navigate('MyQr')} style={styles.myQrBtn}>
            <Icon name="qr" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      )}

      {state === 'scanning' ? (
        renderContent()
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {renderContent()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: { padding: spacing.sm },
  backIcon: { fontSize: 24, fontWeight: '300' },
  headerTitle: { flex: 1, ...typography.body, fontWeight: '600', textAlign: 'center' },
  myQrBtn: { padding: spacing.sm },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg },

  // Idle state
  idleSection: { paddingTop: spacing.md },
  
  optionCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  optionTitle: { ...typography.body, fontWeight: '600' },
  optionDesc: { ...typography.body, marginBottom: spacing.md },
  permissionError: { ...typography.caption, marginBottom: spacing.md },

  pasteInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: 100,
    marginBottom: spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },

  // Buttons
  primaryBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnText: { ...typography.body, fontWeight: '600' },
  secondaryBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryBtnText: { ...typography.body, fontWeight: '500' },

  // Error
  errorCard: {
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorTitle: { ...typography.body, fontWeight: '600', marginBottom: spacing.xs },
  errorMessage: { ...typography.body },
  showDetailsBtn: { ...typography.caption, marginTop: spacing.sm, textDecorationLine: 'underline' },
  errorDetails: { ...typography.caption, marginTop: spacing.sm, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // Scanner
  scannerContainer: { flex: 1 },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderRadius: radius.md,
  },
  scanHint: {
    ...typography.body,
    marginTop: spacing.lg,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cancelScanBtn: {
    position: 'absolute',
    bottom: 50,
    left: spacing.xl,
    right: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  cancelScanBtnText: { ...typography.body, fontWeight: '600' },

  // Preview
  previewSection: { paddingTop: spacing.md },
  previewLabel: { ...typography.caption, marginBottom: spacing.sm },
  previewCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  previewName: { ...typography.h2, marginBottom: spacing.md },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  previewField: { ...typography.caption },
  previewValue: { ...typography.body, flex: 1, textAlign: 'right', marginLeft: spacing.md },
  keywordsSection: { marginTop: spacing.md },
  keywordsList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  keywordChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  keywordText: { ...typography.caption },

  previewActions: {
    gap: spacing.md,
  },

  // Result
  resultSection: { paddingTop: spacing.xl },
  resultCard: {
    padding: spacing.xl,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  resultIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  resultIconText: { fontSize: 28 },
  resultTitle: { ...typography.h3, marginBottom: spacing.sm },
  resultName: { ...typography.body, fontWeight: '600', marginBottom: spacing.md },
  resultMessage: { ...typography.body, textAlign: 'center', marginBottom: spacing.lg },
  conflictNote: { ...typography.caption, textAlign: 'center', marginBottom: spacing.md },
});
