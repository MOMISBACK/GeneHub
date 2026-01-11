import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { signInWithGoogle } from '../lib/auth';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';

export function LoginScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert(t.common.error, e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const colors = theme.colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        {/* Logo / Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t.login.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.login.subtitle}</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={[styles.feature, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}> 
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {t.login.features.ncbi} • {t.login.features.uniprot}
              </Text>
              <Text style={[styles.featureText, { color: colors.textMuted }]}>
                {t.login.tagline}
              </Text>
            </View>
          </View>
          <View style={[styles.feature, { backgroundColor: colors.surface, borderColor: colors.borderHairline }]}> 
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {t.login.features.alphafold} • PDB
              </Text>
              <Text style={[styles.featureText, { color: colors.textMuted }]}>
                {t.geneDetail.sections.structure}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.loginBtn,
            { backgroundColor: colors.buttonPrimary },
            loading && styles.loginBtnDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.buttonPrimaryText} size="small" />
          ) : (
            <Text style={[styles.loginBtnText, { color: colors.buttonPrimaryText }]}>
              {t.login.signInGoogle}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  features: {
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureText: {
    fontSize: 13,
  },
  footer: {
    paddingBottom: 24,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
