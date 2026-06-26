import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Loading } from '../../components/common';
import { auxilioService } from '../../services';
import { navigateMainTab } from '../../navigation/rootNavigation';
import { COLORS, SIZES } from '../../constants/theme';
import {
  extractActivityLocation,
  formatActivityListDate,
  getActivityStatusBadge,
  getEmergencyShortLabel,
  getEmergencyTypeMeta,
  isHistorialAuxilio,
  ACTIVITY_ICON_COLORS,
} from '../../utils/activityAuxilio';

const TABS = [
  { id: 'historial', label: 'Historial' },
  { id: 'proximos', label: 'Próximos' },
];

const EmergencyIcon = ({ emergencyType }) => {
  const meta = getEmergencyTypeMeta(emergencyType);
  const danger = meta.danger || emergencyType === 'via_agua';
  const color = danger ? ACTIVITY_ICON_COLORS.danger : ACTIVITY_ICON_COLORS.default;
  const borderColor = danger ? ACTIVITY_ICON_COLORS.dangerBorder : ACTIVITY_ICON_COLORS.defaultBorder;

  return (
    <View style={[styles.iconBox, { borderColor }]}>
      <MaterialCommunityIcons name={meta.icon} size={22} color={color} />
    </View>
  );
};

const ActivityScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('historial');
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivities = useCallback(async () => {
    try {
      const res = await auxilioService.getUserAuxilios();
      const items = (res.auxilios || [])
        .filter(isHistorialAuxilio)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistorial(items);
    } catch (error) {
      console.error('Error loading auxilio history:', error);
      setHistorial([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const openDetail = (auxilio) => {
    navigation.navigate('AuxilioActivityDetail', { auxilioId: auxilio.id, auxilio });
  };

  const renderHistorialItem = ({ item }) => {
    const badge = getActivityStatusBadge(item.status);
    const location = extractActivityLocation(item);
    const dateLabel = formatActivityListDate(item.createdAt || item.completedAt);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openDetail(item)}
        activeOpacity={0.75}
      >
        <EmergencyIcon emergencyType={item.emergencyType} />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{getEmergencyShortLabel(item.emergencyType)}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {location} · {dateLabel}
          </Text>
          <View
            style={[
              styles.statusBadge,
              badge.tone === 'completed' ? styles.statusCompleted : styles.statusCancelled,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                badge.tone === 'completed' ? styles.statusCompletedText : styles.statusCancelledText,
              ]}
            >
              {badge.label}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading fullScreen text="Cargando historial..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else navigateMainTab(navigation, 'HomeTab');
        }}
      >
        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabBtn}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              {active ? <View style={styles.tabUnderline} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'historial' ? (
        <FlatList
          data={historial}
          renderItem={renderHistorialItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.info} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="history" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Sin auxilios en el historial</Text>
              <Text style={styles.emptySubtitle}>
                Cuando completes un auxilio, lo vas a ver acá.
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="calendar-clock-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Sin auxilios programados</Text>
          <Text style={styles.emptySubtitle}>
            Los auxilios no se programan con anticipación. Cuando haya turnos agendados, aparecerán
            en esta pestaña.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZES.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SIZES.md,
  },
  tabBtn: {
    marginRight: SIZES.xl,
    paddingBottom: SIZES.md,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabLabelActive: { color: COLORS.info },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '100%',
    backgroundColor: COLORS.info,
    borderRadius: 1,
  },
  listContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
    gap: SIZES.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  statusCompleted: { backgroundColor: 'rgba(56, 189, 248, 0.18)' },
  statusCancelled: { backgroundColor: COLORS.backgroundTertiary },
  statusBadgeText: { fontSize: SIZES.small, fontWeight: '600' },
  statusCompletedText: { color: COLORS.info },
  statusCancelledText: { color: COLORS.textSecondary },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.xl,
    paddingTop: SIZES.xxl * 2,
  },
  emptyTitle: {
    marginTop: SIZES.lg,
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: SIZES.sm,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ActivityScreen;
