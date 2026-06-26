import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { COLORS, SIZES } from '../../constants/theme';
import { ratingService } from '../../services';
import { getPatronInitials, getPatronVesselLine } from '../../utils/auxilioLive';

const STAR_COLOR = COLORS.accentOrange;
const STAR_SIZE = 40;

const AUXILIO_RATING_LABELS = {
  1: 'Muy malo',
  2: 'Malo',
  3: 'Regular',
  4: 'Muy bien',
  5: 'Excelente',
};

const RateAuxilioScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { rideId, auxilioId, ratedId, driver } = route.params || {};
  const serviceId = rideId || auxilioId;

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const patronName = driver?.name || 'Patrón';
  const vesselLine = getPatronVesselLine(driver);
  const initials = getPatronInitials(driver);
  const ratingLabel = AUXILIO_RATING_LABELS[stars] || '';

  const handleSubmit = async () => {
    if (stars === 0) {
      Alert.alert('Error', 'Por favor seleccioná una calificación');
      return;
    }
    try {
      setLoading(true);
      const result = await ratingService.rateRide({
        rideId: serviceId,
        ratedId,
        stars,
        comment: comment.trim() || null,
        tags: [],
      });
      if (result.success) {
        setSubmitted(true);
      } else {
        Alert.alert('Error', result.message || 'No se pudo enviar la calificación');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'No se pudo enviar la calificación');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
    );
  };

  const handleBack = () => {
    if (stars > 0 || comment.trim()) {
      Alert.alert(
        'Salir sin calificar',
        '¿Querés salir sin enviar tu calificación?',
        [
          { text: 'Quedarme', style: 'cancel' },
          { text: 'Salir', onPress: () => navigation.goBack() },
        ]
      );
      return;
    }
    navigation.goBack();
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Gracias por tu calificación</Text>
          <Text style={styles.successSubtitle}>
            Tu opinión nos ayuda a mejorar el servicio de auxilio náutico.
          </Text>
          <TouchableOpacity style={styles.successButton} onPress={handleClose}>
            <Text style={styles.successButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={26} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.profileSection}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                {driver?.avatar ? (
                  <Image source={{ uri: driver.avatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.initials}>{initials}</Text>
                )}
              </View>
            </View>
            <Text style={styles.patronName}>{patronName}</Text>
            <Text style={styles.vesselLine}>{vesselLine}</Text>
          </View>

          <Text style={styles.experienceQuestion}>¿Cómo fue tu experiencia?</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                onPress={() => setStars(rating)}
                style={styles.starButton}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Ionicons
                  name={rating <= stars ? 'star' : 'star-outline'}
                  size={STAR_SIZE}
                  color={rating <= stars ? STAR_COLOR : COLORS.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>

          {stars > 0 ? (
            <Text style={styles.ratingLabel}>{ratingLabel}</Text>
          ) : (
            <View style={styles.ratingLabelSpacer} />
          )}

          <View style={styles.commentBox}>
            <Text style={styles.commentBoxLabel}>Comentarios (opcional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Contanos más sobre tu experiencia..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={500}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.privacyRow}>
            <Ionicons name="lock-closed-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.privacyText}>
              Calificación interna · no se publica en Google
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SIZES.md) }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading || stars === 0) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || stars === 0}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Enviar calificación</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: SIZES.xs,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: SIZES.sm,
    paddingBottom: SIZES.xl,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.info,
    marginBottom: SIZES.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  initials: { color: COLORS.text, fontSize: 28, fontWeight: '700', letterSpacing: 1 },
  patronName: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  vesselLine: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  experienceQuestion: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SIZES.sm,
    marginBottom: SIZES.md,
  },
  starButton: { padding: 2 },
  ratingLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: STAR_COLOR,
    textAlign: 'center',
    marginBottom: SIZES.xl,
  },
  ratingLabelSpacer: { height: 36, marginBottom: SIZES.xl },
  commentBox: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.sm,
    minHeight: 140,
  },
  commentBoxLabel: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginBottom: SIZES.sm,
  },
  commentInput: {
    fontSize: SIZES.body,
    color: COLORS.text,
    minHeight: 96,
    lineHeight: 22,
    padding: 0,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SIZES.lg,
  },
  privacyText: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },
  footer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    backgroundColor: COLORS.background,
  },
  submitButton: {
    backgroundColor: COLORS.info,
    paddingVertical: SIZES.md + 2,
    borderRadius: SIZES.radiusLg,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.45 },
  submitButtonText: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.white },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.screenPadding,
  },
  successIcon: { marginBottom: SIZES.xl },
  successTitle: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.xxl,
  },
  successButton: {
    backgroundColor: COLORS.info,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.xxl,
    borderRadius: SIZES.radiusLg,
  },
  successButtonText: { fontSize: SIZES.body, fontWeight: '600', color: COLORS.white },
});

export default RateAuxilioScreen;
