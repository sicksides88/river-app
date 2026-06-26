import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const RiderBottomSheet = ({ visible, onClose, stepLabel, title, subtitle, children, footer }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        {stepLabel ? <Text style={styles.stepLabel}>{stepLabel}</Text> : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlay },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.riderNavy,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xl,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lightGray,
    marginTop: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  stepLabel: {
    color: COLORS.riderLabel,
    fontSize: SIZES.caption,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: SIZES.sm,
  },
  title: { color: COLORS.text, fontSize: SIZES.h2, fontWeight: '700', marginBottom: SIZES.sm },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.body, lineHeight: 22, marginBottom: SIZES.lg },
  footer: { marginTop: SIZES.lg },
});

export default RiderBottomSheet;
