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

/**
 * Pantalla para que el conductor califique al pasajero
 */
const RateUserScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { rideId, user, ratedId } = route.params || {};

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
      const result = await ratingService.getTags('driver_to_user', starCount);
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

      const result = await ratingService.rateRide({
        rideId,
        ratedId,
        stars,
        comment: comment.trim() || null,
        tags: selectedTags,
      });

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
    navigation.goBack();
  };

  const handleSkip = () => {
    Alert.alert(
      'Omitir calificacion',
      'Puedes calificar este viaje mas tarde',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Omitir', onPress: handleClose },
      ]
    );
  };

  // Pantalla de éxito
  if (submitted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Calificacion enviada</Text>
          <Text style={styles.successSubtitle}>
            Gracias por tu feedback
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
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Omitir</Text>
          </TouchableOpacity>
        </View>

        {/* User info */}
        <View style={styles.userSection}>
          <View style={styles.userAvatar}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color={COLORS.textMuted} />
            )}
          </View>
          <Text style={styles.userName}>
            {user?.nombre || 'Pasajero'} {user?.apellido || ''}
          </Text>
          <Text style={styles.ratePrompt}>Como fue el pasajero?</Text>
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
              {stars >= 4 ? 'Que te gusto del pasajero?' : 'Que podria mejorar?'}
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
              placeholder="Agrega un comentario..."
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
    justifyContent: 'flex-end',
    paddingVertical: SIZES.md,
  },
  skipButton: {
    padding: SIZES.sm,
  },
  skipText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  userAvatar: {
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
  userName: {
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

export default RateUserScreen;
