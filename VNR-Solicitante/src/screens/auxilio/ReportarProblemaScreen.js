import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common';
import { PhotoUploader } from '../../components/riverservice';
import { auxilioService } from '../../services';
import { COLORS, SIZES } from '../../constants/theme';
import { getAuxilioDisplayId, getStatusBadgeLabel, getStatusAccent } from '../../utils/auxilioLive';

const PROBLEM_TYPES = [
  { id: 'no_llego', label: 'Rider no llegó', icon: 'boat-outline' },
  { id: 'demora', label: 'Demora excesiva', icon: 'time-outline' },
  { id: 'trato', label: 'Trato inadecuado', icon: 'person-outline' },
  { id: 'mal_servicio', label: 'Mal servicio', icon: 'thumbs-down-outline' },
  { id: 'cobro', label: 'Cobro incorrecto', icon: 'cash-outline' },
  { id: 'otro', label: 'Otro', icon: 'ellipsis-horizontal' },
];

const ProblemTypeCard = ({ item, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.problemCard, selected && styles.problemCardSelected]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Ionicons
      name={item.icon}
      size={22}
      color={selected ? COLORS.info : COLORS.textSecondary}
    />
    <Text style={[styles.problemLabel, selected && styles.problemLabelSelected]} numberOfLines={2}>
      {item.label}
    </Text>
  </TouchableOpacity>
);

const ReportarProblemaScreen = ({ navigation, route }) => {
  const { auxilioId, auxilio } = route.params || {};
  const [problemType, setProblemType] = useState(null);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const accent = getStatusAccent(auxilio?.status || 'en_proceso');
  const badge = auxilio
    ? `${getAuxilioDisplayId(auxilio)} · ${getStatusBadgeLabel(auxilio.status)}`
    : `${getAuxilioDisplayId({ id: auxilioId })} · AUXILIO EN CURSO`;

  const submit = async () => {
    if (!problemType) {
      Alert.alert('Error', 'Seleccioná el tipo de problema');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Describí el problema');
      return;
    }

    const typeLabel = PROBLEM_TYPES.find((p) => p.id === problemType)?.label || problemType;
    const reason = `[${typeLabel}] ${description.trim()}${photo ? ' (con foto adjunta)' : ''}`;

    setLoading(true);
    try {
      await auxilioService.reportProblem(auxilioId, reason);
      Alert.alert('Enviado', 'Tu reporte fue registrado.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo enviar el reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportar un problema</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.badge, { borderColor: accent }]}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
        </View>

        <Text style={styles.intro}>
          Contanos qué ocurrió para que podamos revisar tu caso y ayudarte lo antes posible.
        </Text>

        <Text style={styles.sectionLabel}>TIPO DE PROBLEMA</Text>
        <View style={styles.grid}>
          {PROBLEM_TYPES.map((item) => (
            <View key={item.id} style={styles.gridCell}>
              <ProblemTypeCard
                item={item}
                selected={problemType === item.id}
                onPress={() => setProblemType(item.id)}
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>DESCRIPCIÓN</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={5}
          placeholder="Describí el inconveniente con el mayor detalle posible..."
          placeholderTextColor={COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        <PhotoUploader
          label="Adjuntar foto (opcional)"
          value={photo}
          onChange={(uri) => setPhoto(uri)}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Enviar reporte" onPress={submit} loading={loading} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: SIZES.subtitle,
    fontWeight: '700',
  },
  headerSpacer: { width: 40 },
  content: { padding: SIZES.screenPadding, paddingBottom: SIZES.xxl },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    marginBottom: SIZES.lg,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  intro: {
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SIZES.lg,
    textAlign: 'center',
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SIZES.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SIZES.xs,
    marginBottom: SIZES.lg,
  },
  gridCell: { width: '50%', padding: SIZES.xs },
  problemCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    minHeight: 88,
    backgroundColor: COLORS.backgroundTertiary,
    gap: SIZES.sm,
  },
  problemCardSelected: {
    borderColor: COLORS.info,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  problemLabel: { color: COLORS.textSecondary, fontSize: SIZES.caption, fontWeight: '600' },
  problemLabelSelected: { color: COLORS.text },
  input: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    color: COLORS.text,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.lg,
  },
  footer: { padding: SIZES.screenPadding, borderTopWidth: 1, borderTopColor: COLORS.border },
});

export default ReportarProblemaScreen;
