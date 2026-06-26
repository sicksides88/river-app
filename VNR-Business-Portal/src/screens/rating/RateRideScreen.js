import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { ratingService } from '../../services';

const RateRideScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { rideId, deliveryId, driver, ratedId, type = 'ride' } = route.params || {};
  const isDelivery = type === 'delivery' || !!deliveryId;

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTags, setLoadingTags] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // Cargar tags según las estrellas seleccionadas
  const loadTags = useCallback(async (starCount) => {
    if (starCount === 0) {
      setAvailableTags([]);
      return;
    }

    try {
      setLoadingTags(true);
      const result = await ratingService.getTags('user_to_driver', starCount);
      if (result.success) {
        setAvailableTags(result.tags || []);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoadingTags(false);
    }
  }, []);

  useEffect(() => {
    loadTags(stars);
    // Limpiar tags seleccionados cuando cambian las estrellas
    setSelectedTags([]);
  }, [stars, loadTags]);

  const handleStarPress = (rating) => {
    setStars(rating);
  };

  const handleTagPress = (tagName) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagName)) {
        return prev.filter((t) => t !== tagName);
      }
      if (prev.length >= 3) {
        // Máximo 3 tags
        return prev;
      }
      return [...prev, tagName];
    });
  };

  const handleSubmit = async () => {
    if (stars === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificacion');
      return;
    }

    try {
      setLoading(true);

      let result;
      if (isDelivery) {
        result = await ratingService.rateDelivery({
          deliveryId,
          ratedId,
          ratingType: 'user_to_driver',
          stars,
          comment: comment.trim() || null,
          tags: selectedTags,
        });
      } else {
        result = await ratingService.rateRide({
          rideId,
          ratedId,
          stars,
          comment: comment.trim() || null,
          tags: selectedTags,
        });
      }

      if (result.success) {
        setSubmitted(true);
      } else {
        Alert.alert('Error', result.message || 'No se pudo enviar la calificacion');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'No se pudo enviar la calificacion');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Navegar al inicio después de calificar
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleSkip = () => {
    Alert.alert(
      'Omitir calificacion',
      isDelivery
        ? 'Puedes calificar este envio mas tarde desde tu historial'
        : 'Puedes calificar este viaje mas tarde desde tu historial',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Omitir', onPress: handleClose },
      ]
    );
  };

  // Pantalla de agradecimiento después de enviar
  if (submitted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Gracias por tu calificacion</Text>
          <Text style={styles.successSubtitle}>
            Tu opinion nos ayuda a mejorar el servicio
          </Text>
          <TouchableOpacity
            style={styles.successButton}
            onPress={handleClose}
          >
            <Text style={styles.successButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Omitir</Text>
          </TouchableOpacity>
        </View>

        {/* Driver info */}
        <View style={styles.driverSection}>
          <View style={styles.driverAvatar}>
            {driver?.avatar ? (
              <Image source={{ uri: driver.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color={COLORS.textMuted} />
            )}
          </View>
          <Text style={styles.driverName}>
            {driver?.nombre || driver?.name || (isDelivery ? 'Cadete' : 'Conductor')} {driver?.apellido || ''}
          </Text>
          <Text style={styles.ratePrompt}>
            {isDelivery ? 'Como fue tu envio?' : 'Como fue tu viaje?'}
          </Text>
        </View>

        {/* Stars */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              onPress={() => handleStarPress(rating)}
              style={styles.starButton}
            >
              <Ionicons
                name={rating <= stars ? 'star' : 'star-outline'}
                size={44}
                color={rating <= stars ? '#FFD700' : COLORS.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>

        {stars > 0 && (
          <Text style={styles.ratingText}>{ratingService.getRatingText(stars)}</Text>
        )}

        {/* Tags */}
        {stars > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsSectionTitle}>
              {stars >= 4 ? 'Que te gusto?' : 'Que podria mejorar?'}
            </Text>
            <Text style={styles.tagsSectionSubtitle}>
              Selecciona hasta 3 opciones
            </Text>

            {loadingTags ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <View style={styles.tagsGrid}>
                {availableTags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id || tag.name}
                    style={[
                      styles.tagButton,
                      selectedTags.includes(tag.name) && styles.tagButtonSelected,
                    ]}
                    onPress={() => handleTagPress(tag.name)}
                  >
                    {tag.icon && (
                      <Ionicons
                        name={tag.icon}
                        size={18}
                        color={selectedTags.includes(tag.name) ? COLORS.white : COLORS.text}
                        style={styles.tagIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.tagText,
                        selectedTags.includes(tag.name) && styles.tagTextSelected,
                      ]}
                    >
                      {tag.name_es || tag.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Comment */}
        {stars > 0 && (
          <View style={styles.commentSection}>
            <Text style={styles.commentLabel}>Comentario (opcional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Cuentanos mas sobre tu experiencia..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              maxLength={500}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{comment.length}/500</Text>
          </View>
        )}
      </ScrollView>

      {/* Submit button */}
      {stars > 0 && (
        <View style={[styles.footer, { bottom: insets.bottom }]}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Enviar calificacion</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    padding: SIZES.sm,
  },
  skipText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  driverSection: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  driverAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  driverName: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  ratePrompt: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SIZES.md,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: SIZES.xl,
    gap: SIZES.md,
  },
  starButton: {
    padding: SIZES.xs,
  },
  ratingText: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  tagsSection: {
    marginTop: SIZES.lg,
    marginBottom: SIZES.xl,
  },
  tagsSectionTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  tagsSectionSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  tagButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagIcon: {
    marginRight: SIZES.xs,
  },
  tagText: {
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  tagTextSelected: {
    color: COLORS.white,
  },
  commentSection: {
    marginTop: SIZES.md,
  },
  commentLabel: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  commentInput: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  charCount: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SIZES.xs,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.screenPadding,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Success screen
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.screenPadding,
  },
  successIcon: {
    marginBottom: SIZES.xl,
  },
  successTitle: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  successSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.xxl,
  },
  successButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.xxl,
    borderRadius: SIZES.radiusMd,
  },
  successButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default RateRideScreen;
