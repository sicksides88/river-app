import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

const OnboardingPageShell = ({
  navigation,
  title,
  intro,
  children,
  footer,
  scrollContentStyle,
}) => {
  const insets = useSafeAreaInsets();

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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, scrollContentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>{title}</Text>
          {intro ? <Text style={styles.pageIntro}>{intro}</Text> : null}
          {children}
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
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
    paddingBottom: SIZES.xxl,
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
    marginBottom: SIZES.lg,
  },
});

export default OnboardingPageShell;
