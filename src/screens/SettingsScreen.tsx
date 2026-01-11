/**
 * SettingsScreen - Card-based Minimal Design
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MainTabsParamList, RootStackParamList } from '../navigation/types';
import { useTheme, ThemeMode, typography, spacing, radius } from '../theme';
import { useI18n, LANGUAGES, LanguageCode } from '../i18n';
import { signOut } from '../lib/auth';
import { Icon } from '../components/Icons';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function SettingsScreen({ navigation }: Props) {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const insets = useSafeAreaInsets();
  
  const colors = theme.colors;

  const handleLogout = async () => {
    Alert.alert(
      t.common.logout,
      '',
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.logout,
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (e: any) {
              Alert.alert(t.common.error, e?.message ?? String(e));
            }
          },
        },
      ]
    );
  };

  const themeModes: { key: ThemeMode; label: string }[] = [
    { key: 'light', label: t.settings.themeLight },
    { key: 'dark', label: t.settings.themeDark },
    { key: 'system', label: t.settings.themeSystem },
  ];

  const languages = Object.entries(LANGUAGES).map(([code, lang]) => ({
    code: code as LanguageCode,
    ...lang,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t.settings.title}</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>{t.settings.theme} • {t.settings.language} • {t.settings.about}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Theme Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
          <View style={styles.cardHeader}>
            <Icon name="circle" size={14} color={colors.textMuted} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t.settings.theme}</Text>
          </View>
          {themeModes.map((mode, i) => (
            <Pressable
              key={mode.key}
              style={[styles.optionRow, i < themeModes.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderHairline }]}
              onPress={() => setThemeMode(mode.key)}
            >
              <View style={styles.optionLeft}>
                <Text style={[styles.optionText, { color: colors.text }]}>{mode.label}</Text>
              </View>
              {themeMode === mode.key && (
                <Text style={[styles.checkmark, { color: colors.accent }]}>✓</Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Language Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
          <View style={styles.cardHeader}>
            <Icon name="dot" size={14} color={colors.textMuted} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t.settings.language}</Text>
          </View>
          {languages.map((lang, i) => (
            <Pressable
              key={lang.code}
              style={[styles.optionRow, i < languages.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderHairline }]}
              onPress={() => setLocale(lang.code)}
            >
              <View style={styles.optionLeft}>
                <Text style={[styles.optionText, { color: colors.text }]}>{lang.nativeName}</Text>
              </View>
              {locale === lang.code && (
                <Text style={[styles.checkmark, { color: colors.accent }]}>✓</Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* About Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
          <View style={styles.cardHeader}>
            <Icon name="info" size={14} color={colors.textMuted} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t.settings.about}</Text>
          </View>
          <View style={[styles.optionRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderHairline }]}>
            <Text style={[styles.optionText, { color: colors.text }]}>{t.settings.version}</Text>
            <Text style={[styles.optionValue, { color: colors.textMuted }]}>1.0.0</Text>
          </View>
          <View style={styles.optionRow}>
            <Text style={[styles.optionText, { color: colors.text }]}>GeneHub Bacteria</Text>
          </View>
        </View>

        {/* Collections Card */}
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
          onPress={() => navigation.navigate('Collections')}
        >
          <View style={styles.navRow}>
            <View style={styles.navLeft}>
              <Text style={styles.navIcon}>📁</Text>
              <Text style={[styles.optionText, { color: colors.text }]}>Collections</Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
          </View>
        </Pressable>

        {/* Privacy Card */}
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
          onPress={() => navigation.navigate('Privacy')}
        >
          <View style={styles.navRow}>
            <View style={styles.navLeft}>
              <Text style={styles.navIcon}>🔒</Text>
              <Text style={[styles.optionText, { color: colors.text }]}>Data & Privacy</Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
          </View>
        </Pressable>

        {/* Logout Card */}
        <Pressable
          style={[styles.logoutCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>{t.common.logout}</Text>
        </Pressable>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  pageTitle: { fontSize: 24, fontWeight: '700' },
  pageSubtitle: { ...typography.caption, marginTop: spacing.xs },
  
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg },
  
  card: {
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optionText: { fontSize: 15 },
  optionValue: { fontSize: 15 },
  checkmark: { fontSize: 16, fontWeight: '600' },
  
  logoutCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  logoutText: { fontSize: 15, fontWeight: '600' },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  navIcon: { fontSize: 20 },
  chevron: { fontSize: 24, fontWeight: '300' },
});
