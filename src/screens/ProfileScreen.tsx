/**
 * ProfileScreen - User Profile
 * Monochrome, minimal layout
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { useTheme, typography, spacing, radius } from '../theme';
import { useI18n } from '../i18n';
import { Icon } from '../components/Icons';

const STORAGE_KEYS = {
  interests: 'user_interests',
  publications: 'user_publications',
  profile: 'user_profile',
};

interface Publication {
  id: string;
  title: string;
  authors?: string;
  journal?: string;
  year?: string;
  citations?: number;
  doi?: string;
}

interface UserProfile {
  name: string;
  title: string;
  email: string;
  institution: string;
  memberSince: string;
  publications: number;
  hIndex: number;
  citations: number;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  title: '',
  email: '',
  institution: '',
  memberSince: '',
  publications: 0,
  hIndex: 0,
  citations: 0,
};


export function ProfileScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [interests, setInterests] = useState<string[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prof, int, pubs] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.profile),
        AsyncStorage.getItem(STORAGE_KEYS.interests),
        AsyncStorage.getItem(STORAGE_KEYS.publications),
      ]);
      if (prof) setProfile(JSON.parse(prof));
      if (int) setInterests(JSON.parse(int));
      if (pubs) setPublications(JSON.parse(pubs));
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
  };

  const saveInterests = async (newList: string[]) => {
    setInterests(newList);
    await AsyncStorage.setItem(STORAGE_KEYS.interests, JSON.stringify(newList));
  };

  const addInterest = () => {
    const value = newInterest.trim();
    if (!value || interests.includes(value)) return;
    saveInterests([...interests, value]);
    setNewInterest('');
  };

  const removeInterest = (value: string) => {
    saveInterests(interests.filter(i => i !== value));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageTitle, { color: colors.text }]}>{t.profile?.title ?? 'Profile'}</Text>
              <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
                {profile.name || t.profile?.defaults?.name || 'User'}
              </Text>
            </View>
            <Pressable
              style={[styles.qrBtn, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}
              onPress={() => navigation.navigate('MyQr')}
            >
              <Icon name="qr" size={20} color={colors.accent} />
              <Text style={[styles.qrBtnText, { color: colors.text }]}>Mon QR</Text>
            </Pressable>
          </View>
          {(profile.title || profile.institution) && (
            <Text style={[styles.pageMeta, { color: colors.textMuted }]}> 
              {[profile.title, profile.institution].filter(Boolean).join(' • ')}
            </Text>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {t.profile?.stats?.publications ?? 'Publications'}
            </Text>
            <View style={styles.statValueRow}>
              <Text style={[styles.statValue, { color: colors.text }]}>{profile.publications}</Text>
            </View>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {t.profile?.stats?.hIndex ?? 'H-index'}
            </Text>
            <View style={styles.statValueRow}>
              <Text style={[styles.statValue, { color: colors.text }]}>{profile.hIndex}</Text>
            </View>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {t.profile?.stats?.citations ?? 'Citations'}
            </Text>
            <View style={styles.statValueRow}>
              <Text style={[styles.statValue, { color: colors.text }]}>{profile.citations}</Text>
            </View>
          </View>
        </View>

        {/* Interests Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.profile?.sections?.interests ?? 'Research interests'}
            </Text>
          </View>
          
          <View style={styles.tagsContainer}>
            {interests.map((interest, index) => (
              <Pressable
                key={interest}
                style={[styles.tag, { borderColor: colors.borderHairline }]}
                onLongPress={() => removeInterest(interest)}
              >
                <Text style={[styles.tagText, { color: colors.text }]}>{interest}</Text>
              </Pressable>
            ))}
          </View>
          
          <View style={[styles.addInputRow, { borderColor: colors.border }]}>
            <TextInput
              style={[styles.addInput, { color: colors.text }]}
              value={newInterest}
              onChangeText={setNewInterest}
              placeholder={t.profile?.interests?.addPlaceholder ?? "Add an interest…"}
              placeholderTextColor={colors.inputPlaceholder}
              returnKeyType="done"
              onSubmitEditing={addInterest}
            />
            <Pressable onPress={addInterest} style={[styles.addBtn, { backgroundColor: colors.buttonPrimary }]}>
              <Text style={[styles.addBtnText, { color: colors.buttonPrimaryText }]}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Publications Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.profile?.sections?.recentPublications ?? 'Recent publications'}
            </Text>
            <Text style={[styles.pubCount, { color: colors.textMuted }]}>{publications.length}</Text>
          </View>
          
          {publications.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {t.profile?.publications?.empty ?? 'No publications yet'}
            </Text>
          ) : (
            publications.slice(0, 5).map((pub) => (
              <Pressable 
                key={pub.id} 
                style={[styles.pubCard, { borderBottomColor: colors.borderHairline }]}
                onPress={() => pub.doi && Linking.openURL(`https://doi.org/${pub.doi}`)}
              >
                <Text style={[styles.pubTitle, { color: colors.text }]}>{pub.title}</Text>
                <Text style={[styles.pubMeta, { color: colors.textMuted }]}>
                  {pub.journal} • {pub.year}{' '}
                  {pub.citations ? `• ${pub.citations} ${(t.profile?.publications?.citationsLabel ?? 'citations')}` : ''}
                </Text>
                {pub.doi && (
                  <Text style={[styles.pubDoi, { color: colors.accent }]}>
                    {(t.profile?.publications?.doiPrefix ?? 'DOI:') + ' ' + pub.doi}
                  </Text>
                )}
              </Pressable>
            ))
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  pageTitle: {
    ...typography.h2,
  },
  pageSubtitle: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  pageMeta: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  qrBtnText: {
    ...typography.caption,
    fontWeight: '600',
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  
  // Sections
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  pubCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Add Input
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    overflow: 'hidden',
  },
  addInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: spacing.md,
  },
  addBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addBtnText: {
    fontSize: 20,
    fontWeight: '300',
  },
  
  // Publications
  pubCard: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pubTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  pubMeta: {
    fontSize: 12,
    marginBottom: 4,
  },
  pubDoi: {
    fontSize: 12,
  },
  
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
