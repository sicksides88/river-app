import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { auxilioService } from '../../services';
import { navigateRoot } from '../../navigation/rootNavigation';
import { COLORS, SIZES } from '../../constants/theme';
import AuxilioTimeline from '../../components/riverservice/auxilio-live/AuxilioTimeline';
import {
  buildServiceReason,
  extractActivityLocation,
  formatActivityDetailDate,
  getActivityStatusBadge,
  getEmergencyShortLabel,
  getEmergencyTypeMeta,
  PHOTO_PHASES,
  resolveAuxilioPhoto,
} from '../../utils/activityAuxilio';
import {
  getPatronInitials,
  getPatronVesselLine,
  isDangerEmergency,
} from '../../utils/auxilioLive';

const SectionLabel = ({ children }) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);

const AuxilioActivityDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { auxilioId, auxilio: initial } = route.params || {};
  const [auxilio, setAuxilio] = useState(initial || null);
  const [loading, setLoading] = useState(!initial);

  const fetchDetail = useCallback(async () => {
    if (!auxilioId) return;
    try {
      const res = await auxilioService.getAuxilioById(auxilioId);
      if (res.auxilio) setAuxilio(res.auxilio);
    } catch (error) {
      console.error('Error loading auxilio detail:', error);
    } finally {
      setLoading(false);
    }
  }, [auxilioId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const emergencyMeta = getEmergencyTypeMeta(auxilio?.emergencyType);
  const danger = isDangerEmergency(auxilio?.emergencyType);
  const badge = getActivityStatusBadge(auxilio?.status);
  const location = extractActivityLocation(auxilio);
  const dateLabel = formatActivityDetailDate(auxilio?.createdAt || auxilio?.completedAt);
  const serviceReason = buildServiceReason(auxilio);
  const patronName = auxilio?.driver?.name || '—';
  const vesselLine = getPatronVesselLine(auxilio?.driver);
  const initials = getPatronInitials(auxilio?.driver);

  const lat = auxilio?.pickup?.coordinates?.lat;
  const lng = auxilio?.pickup?.coordinates?.lng;
  const hasCoords =
    lat != null &&
    lng != null &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng));

  const mapRegion = useMemo(
    () => ({
      latitude: Number(lat),
      longitude: Number(lng),
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    }),
    [lat, lng]
  );

  const signatureUri =
    typeof auxilio?.signature === 'string'
      ? auxilio.signature
      : auxilio?.signature?.dataUri || auxilio?.signature?.uri;

  const signedAtLabel = formatActivityDetailDate(
    auxilio?.completedAt || auxilio?.updatedAt || auxilio?.createdAt
  );

  const handleRate = () => {
    navigateRoot(navigation, 'RateAuxilio', {
      auxilioId: auxilio?.id,
      rideId: auxilio?.id,
      ratedId: auxilio?.driver?.id,
      driver: auxilio?.driver,
    });
  };

  const handleDownloadPdf = async () => {
    const url = auxilio?.pdfUrl || auxilio?.ride?.pdfUrl;
    if (url) {
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert('Error', 'No se pudo abrir el PDF.');
      }
      return;
    }
    Alert.alert(
      'PDF del servicio',
      'El comprobante se envía por email al finalizar el auxilio. Si no lo recibiste, contactá al operador.'
    );
  };

  if (loading && !auxilio) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.info} />
      </View>
    );
  }

  if (!auxilio) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>No se encontró el auxilio.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkBtn}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, SIZES.lg) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.summaryCard,
            danger && styles.summaryCardDanger,
          ]}
        >
          <View style={styles.summaryTop}>
            <View style={[styles.summaryIcon, danger && styles.summaryIconDanger]}>
              <MaterialCommunityIcons
                name={emergencyMeta.icon}
                size={24}
                color={danger ? COLORS.error : COLORS.text}
              />
            </View>
            <View style={styles.summaryHeadings}>
              <View style={styles.summaryTitleRow}>
                <Text style={[styles.summaryTitle, danger && styles.summaryTitleDanger]}>
                  {getEmergencyShortLabel(auxilio.emergencyType)}
                </Text>
                <View
                  style={[
                    styles.summaryBadge,
                    badge.tone === 'completed' ? styles.badgeCompleted : styles.badgeCancelled,
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryBadgeText,
                      badge.tone === 'completed'
                        ? styles.badgeCompletedText
                        : styles.badgeCancelledText,
                    ]}
                  >
                    {badge.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.summarySubtitle}>
                {location} · {dateLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.mapCard}>
          {hasCoords ? (
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={{ latitude: Number(lat), longitude: Number(lng) }}
                pinColor={COLORS.sos}
              />
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={28} color={COLORS.textMuted} />
              <Text style={styles.mapPlaceholderText}>Ubicación del auxilio</Text>
            </View>
          )}
        </View>

        {auxilio.driver ? (
          <View style={styles.patronCard}>
            <View style={styles.patronAvatar}>
              {auxilio.driver.avatar ? (
                <Image source={{ uri: auxilio.driver.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
            <View style={styles.patronInfo}>
              <Text style={styles.patronName}>{patronName}</Text>
              <Text style={styles.patronVessel}>{vesselLine}</Text>
            </View>
          </View>
        ) : null}

        <SectionLabel>FOTOS DEL AUXILIO</SectionLabel>
        <View style={styles.photosRow}>
          {PHOTO_PHASES.map((phase) => {
            const uri = resolveAuxilioPhoto(auxilio.photos, phase);
            return (
              <View key={phase.key} style={styles.photoItem}>
                <View style={styles.photoBox}>
                  {uri ? (
                    <Image source={{ uri }} style={styles.photoImage} resizeMode="cover" />
                  ) : (
                    <Ionicons name="image-outline" size={28} color={COLORS.textMuted} />
                  )}
                </View>
                <Text style={styles.photoCaption}>{phase.label}</Text>
              </View>
            );
          })}
        </View>

        <SectionLabel>MOTIVO DEL SERVICIO</SectionLabel>
        <View style={styles.reasonCard}>
          <Text style={styles.reasonTitle}>{serviceReason.title}</Text>
          <Text style={styles.reasonDescription}>{serviceReason.description}</Text>
        </View>

        <SectionLabel>FIRMA DEL NAVEGANTE</SectionLabel>
        <View style={styles.signatureCard}>
          {signatureUri ? (
            <Image source={{ uri: signatureUri }} style={styles.signatureImage} resizeMode="contain" />
          ) : (
            <View style={styles.signaturePlaceholder}>
              <MaterialCommunityIcons name="signature-freehand" size={36} color={COLORS.textMuted} />
            </View>
          )}
          <Text style={styles.signatureFooter}>Firmado por el navegante · {signedAtLabel}</Text>
        </View>

        <SectionLabel>TIMELINE DEL SERVICIO</SectionLabel>
        <View style={styles.timelineCard}>
          <AuxilioTimeline auxilio={auxilio} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SIZES.md) }]}>
        {auxilio.status === 'finalizado' && auxilio.driver?.id ? (
          <TouchableOpacity style={styles.rateBtn} onPress={handleRate}>
            <Text style={styles.rateBtnText}>Volver a calificar</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.pdfBtn} onPress={handleDownloadPdf}>
          <Text style={styles.pdfBtnText}>Descargar PDF del servicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZES.sm,
  },
  scroll: { paddingHorizontal: SIZES.screenPadding, paddingTop: SIZES.xs },
  summaryCard: {
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundInput,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  summaryCardDanger: {
    borderColor: 'rgba(248, 113, 113, 0.45)',
  },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-start' },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  summaryIconDanger: {
    borderColor: 'rgba(248, 113, 113, 0.55)',
    backgroundColor: 'rgba(127, 29, 29, 0.25)',
  },
  summaryHeadings: { flex: 1 },
  summaryTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SIZES.sm,
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  summaryTitleDanger: { color: COLORS.error },
  summaryBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  badgeCompleted: { backgroundColor: 'rgba(56, 189, 248, 0.18)' },
  badgeCancelled: { backgroundColor: COLORS.backgroundTertiary },
  summaryBadgeText: { fontSize: SIZES.small, fontWeight: '600' },
  badgeCompletedText: { color: COLORS.info },
  badgeCancelledText: { color: COLORS.textSecondary },
  summarySubtitle: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  mapCard: {
    height: 160,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    marginBottom: SIZES.lg,
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
  },
  mapPlaceholderText: { color: COLORS.textMuted, fontSize: SIZES.caption },
  patronCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
  },
  patronAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 2,
    borderColor: COLORS.info,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { color: COLORS.text, fontWeight: '700', fontSize: SIZES.body },
  patronInfo: { flex: 1 },
  patronName: { color: COLORS.text, fontSize: SIZES.body, fontWeight: '700' },
  patronVessel: { color: COLORS.textSecondary, fontSize: SIZES.caption, marginTop: 2 },
  sectionLabel: {
    color: COLORS.info,
    fontSize: SIZES.small,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: SIZES.sm,
  },
  photosRow: {
    flexDirection: 'row',
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  photoItem: { flex: 1 },
  photoBox: {
    aspectRatio: 1,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.backgroundInput,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  photoCaption: {
    marginTop: 6,
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  reasonCard: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
  },
  reasonTitle: {
    color: COLORS.text,
    fontSize: SIZES.body,
    fontWeight: '700',
    marginBottom: SIZES.sm,
  },
  reasonDescription: {
    color: COLORS.textSecondary,
    fontSize: SIZES.caption,
    lineHeight: 20,
  },
  signatureCard: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    minHeight: 120,
  },
  signatureImage: { width: '100%', height: 80 },
  signaturePlaceholder: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureFooter: {
    marginTop: SIZES.sm,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },
  timelineCard: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.md,
    backgroundColor: 'rgba(11, 18, 32, 0.96)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SIZES.sm,
  },
  rateBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.info,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.md,
    alignItems: 'center',
  },
  rateBtnText: { color: COLORS.info, fontSize: SIZES.body, fontWeight: '700' },
  pdfBtn: { alignItems: 'center', paddingVertical: SIZES.sm },
  pdfBtnText: { color: COLORS.info, fontSize: SIZES.body, fontWeight: '600' },
  errorText: { color: COLORS.textSecondary, marginBottom: SIZES.md },
  linkBtn: { color: COLORS.info, fontWeight: '600' },
});

export default AuxilioActivityDetailScreen;
