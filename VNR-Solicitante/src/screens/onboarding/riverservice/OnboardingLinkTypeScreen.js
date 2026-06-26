import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinkTypeOptionCard } from '../../../components/riverservice';
import { useAuth } from '../../../context/AuthContext';
import { membershipService } from '../../../services';
import { COLORS, SIZES } from '../../../constants/theme';
import {
  LINK_TYPE_OPTIONS,
  LINK_TYPE_ONBOARDING_INTRO,
  LINK_TYPE_ONBOARDING_FOOTER,
  LINK_TYPE_PROFILE_FOOTER,
  getProfileLinkTypeIntro,
  normalizeLinkType,
} from '../../../utils/linkTypeOptions';

const OnboardingLinkTypeScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isProfileMode = route.name === 'TipoVinculo';

  const [currentLinkType, setCurrentLinkType] = useState(
    normalizeLinkType(user?.link_type)
  );
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(isProfileMode);
  const [saving, setSaving] = useState(false);

  const loadCurrentLinkType = useCallback(async () => {
    if (!isProfileMode) return;
    setLoading(true);
    try {
      const res = await membershipService.getMembership();
      const linkType = normalizeLinkType(
        res?.membership?.link_type || user?.link_type
      );
      setCurrentLinkType(linkType);
      setSelectedId(linkType);
    } catch (error) {
      console.error('Error loading link type:', error);
      const fallback = normalizeLinkType(user?.link_type);
      setCurrentLinkType(fallback);
      setSelectedId(fallback);
    } finally {
      setLoading(false);
    }
  }, [isProfileMode, user?.link_type]);

  useFocusEffect(
    useCallback(() => {
      loadCurrentLinkType();
    }, [loadCurrentLinkType])
  );

  const effectiveSelection = selectedId ?? currentLinkType;
  const hasChanges = isProfileMode && effectiveSelection !== currentLinkType;

  const selectOnboarding = async (opt) => {
    try {
      await membershipService.setLinkType(opt.id);
      navigation.navigate(opt.next);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo guardar el tipo de vínculo');
    }
  };

  const handleCardPress = (opt) => {
    if (isProfileMode) {
      setSelectedId(opt.id);
      return;
    }
    selectOnboarding(opt);
  };

  const handleSaveProfile = async () => {
    if (!hasChanges) {
      navigation.goBack();
      return;
    }

    const target = LINK_TYPE_OPTIONS.find((opt) => opt.id === effectiveSelection);
    if (!target) return;

    setSaving(true);
    try {
      await membershipService.setLinkType(target.id);
      navigation.navigate(target.next, { fromProfile: true });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo guardar el tipo de vínculo');
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = isProfileMode ? 'Tipo de vínculo' : '¿Cómo te asociás?';
  const pageIntro = isProfileMode
    ? getProfileLinkTypeIntro(currentLinkType)
    : LINK_TYPE_ONBOARDING_INTRO;
  const footerText = isProfileMode ? LINK_TYPE_PROFILE_FOOTER : LINK_TYPE_ONBOARDING_FOOTER;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={[styles.topRow, { paddingTop: insets.top + SIZES.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          isProfileMode && styles.scrollWithFooter,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{pageTitle}</Text>
          <Text style={styles.pageIntro}>{pageIntro}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.info} />
          </View>
        ) : (
          LINK_TYPE_OPTIONS.map((opt) => (
            <LinkTypeOptionCard
              key={opt.id}
              option={opt}
              isCurrent={isProfileMode && opt.id === currentLinkType}
              isSelected={isProfileMode && opt.id === effectiveSelection && opt.id !== currentLinkType}
              onPress={() => handleCardPress(opt)}
            />
          ))
        )}

        {!isProfileMode ? (
          <>
            <View style={styles.footerSpacer} />
            <Text style={styles.footer}>{footerText}</Text>
          </>
        ) : (
          <Text style={[styles.footer, styles.footerProfile]}>{footerText}</Text>
        )}
      </ScrollView>

      {isProfileMode ? (
        <View style={[styles.actions, { paddingBottom: insets.bottom + SIZES.md }]}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.text} />
            ) : (
              <Text style={styles.saveBtnText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topRow: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xl,
  },
  scrollWithFooter: {
    paddingBottom: SIZES.md,
  },
  pageHeader: {
    marginBottom: SIZES.lg,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: SIZES.h2,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: SIZES.sm,
  },
  pageIntro: {
    color: COLORS.textSecondary,
    fontSize: SIZES.bodyLarge,
    lineHeight: 22,
  },
  loadingBox: {
    paddingVertical: SIZES.xxl,
    alignItems: 'center',
  },
  footerSpacer: { flexGrow: 1, minHeight: SIZES.xl },
  footer: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: SIZES.caption,
    lineHeight: 18,
    paddingHorizontal: SIZES.sm,
  },
  footerProfile: {
    marginTop: SIZES.sm,
    marginBottom: SIZES.md,
  },
  actions: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.sm,
    gap: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
    backgroundColor: COLORS.background,
  },
  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SIZES.buttonHeight,
    borderRadius: SIZES.radiusLg,
    backgroundColor: '#152238',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: COLORS.text,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  cancelBtnText: {
    color: COLORS.info,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
});

export default OnboardingLinkTypeScreen;
