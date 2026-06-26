import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../../constants/theme';
import mercadopagoOAuthService from '../../../services/mercadopagoOAuth.service';

const MercadoPagoConnectScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState({
    connected: false,
    status: 'not_connected',
    mpEmail: null,
    connectedAt: null,
  });

  const loadStatus = useCallback(async () => {
    try {
      const result = await mercadopagoOAuthService.getConnectionStatus();
      if (result.success !== false) {
        setStatus(result);
      }
    } catch (error) {
      console.error('Error cargando estado:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStatus();
  }, [loadStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await mercadopagoOAuthService.connectAccount();

      if (result.success) {
        Alert.alert(
          'Cuenta conectada',
          `Tu cuenta de MercadoPago (${result.mpEmail || 'conectada'}) ha sido vinculada correctamente.`,
          [{ text: 'Entendido' }]
        );
        loadStatus();
      } else if (result.cancelled) {
        // Usuario canceló, no hacer nada
      } else {
        Alert.alert('Error', result.message || 'No se pudo conectar la cuenta');
      }
    } catch (error) {
      console.error('Error conectando:', error);
      Alert.alert('Error', 'Ocurrió un error al conectar la cuenta');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Desconectar MercadoPago',
      '¿Estás seguro de que deseas desconectar tu cuenta de MercadoPago? Los pagos futuros se acreditarán en tu billetera VNR.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            setDisconnecting(true);
            try {
              const result = await mercadopagoOAuthService.disconnectAccount();
              if (result.success) {
                Alert.alert('Cuenta desconectada', 'Tu cuenta de MercadoPago ha sido desvinculada.');
                loadStatus();
              } else {
                Alert.alert('Error', result.message || 'No se pudo desconectar la cuenta');
              }
            } catch (error) {
              console.error('Error desconectando:', error);
              Alert.alert('Error', 'Ocurrió un error al desconectar la cuenta');
            } finally {
              setDisconnecting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => {
    switch (status.status) {
      case 'active':
        return { text: 'Conectado', color: COLORS.success };
      case 'expired':
        return { text: 'Expirado', color: COLORS.warning };
      case 'disconnected':
        return { text: 'Desconectado', color: COLORS.textMuted };
      case 'error':
        return { text: 'Error', color: COLORS.error };
      default:
        return { text: 'No conectado', color: COLORS.textMuted };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MercadoPago</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const statusBadge = getStatusBadge();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MercadoPago</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Logo y descripción */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="logo-usd" size={48} color="#009EE3" />
          </View>
          <Text style={styles.title}>Conecta tu cuenta de MercadoPago</Text>
          <Text style={styles.description}>
            Al vincular tu cuenta, recibirás los pagos de los viajes directamente en tu MercadoPago,
            sin necesidad de retiros manuales.
          </Text>
        </View>

        {/* Estado de conexión */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>Estado de conexión</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusBadge.color }]} />
              <Text style={[styles.statusText, { color: statusBadge.color }]}>
                {statusBadge.text}
              </Text>
            </View>
          </View>

          {status.connected && (
            <View style={styles.accountInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.infoText}>{status.mpEmail || 'Email no disponible'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.infoText}>
                  Conectado el {formatDate(status.connectedAt)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Beneficios */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Beneficios</Text>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="flash" size={20} color={COLORS.success} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Pagos instantáneos</Text>
              <Text style={styles.benefitDescription}>
                Recibe el pago en tu cuenta al finalizar cada viaje
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="wallet" size={20} color={COLORS.info} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Sin retiros manuales</Text>
              <Text style={styles.benefitDescription}>
                Olvídate de solicitar retiros, el dinero va directo a tu MP
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.warning} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Seguro y confiable</Text>
              <Text style={styles.benefitDescription}>
                Tus datos están protegidos por MercadoPago
              </Text>
            </View>
          </View>
        </View>

        {/* Botón de acción */}
        <View style={styles.actionSection}>
          {status.connected ? (
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <ActivityIndicator color={COLORS.error} />
              ) : (
                <>
                  <Ionicons name="unlink" size={20} color={COLORS.error} />
                  <Text style={styles.disconnectButtonText}>Desconectar cuenta</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="link" size={20} color={COLORS.white} />
                  <Text style={styles.connectButtonText}>Conectar MercadoPago</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Nota informativa */}
        <View style={styles.noteSection}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textMuted} />
          <Text style={styles.noteText}>
            La comisión de VNR se descuenta automáticamente de cada pago.
            Puedes desconectar tu cuenta en cualquier momento.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  backButton: {
    padding: SIZES.xs,
  },
  headerTitle: {
    fontSize: SIZES.title,
    fontWeight: '600',
    color: COLORS.white,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: SIZES.md,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#009EE3' + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  description: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: SIZES.small,
    fontWeight: '500',
  },
  accountInfo: {
    marginTop: SIZES.md,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  infoText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginLeft: SIZES.sm,
  },
  benefitsSection: {
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.72)',
  },
  actionSection: {
    marginBottom: SIZES.lg,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009EE3',
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusXl,
    ...SHADOWS.sm,
  },
  connectButtonText: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: SIZES.sm,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusXl,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
  },
  disconnectButtonText: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.error,
    marginLeft: SIZES.sm,
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.backgroundSecondary,
    padding: SIZES.md,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.xl,
  },
  noteText: {
    flex: 1,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginLeft: SIZES.sm,
    lineHeight: 18,
  },
});

export default MercadoPagoConnectScreen;
