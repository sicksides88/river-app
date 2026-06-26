import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Button } from '../../common';
import { COLORS, SIZES } from '../../../constants/theme';
import AuxilioPatronCard from './AuxilioPatronCard';
import AuxilioMetricBox from './AuxilioMetricBox';
import AuxilioContactActions from './AuxilioContactActions';
import AuxilioTimeline from './AuxilioTimeline';
import AuxilioLiveFooter from './AuxilioLiveFooter';
import AuxilioCompletedPanel from './AuxilioCompletedPanel';

const AuxilioLiveSheet = ({
  auxilio,
  onCancel,
  onReport,
  onMessage,
  onRate,
  onDetail,
  onGoHome,
  cancelLoading,
  simulating,
}) => {
  const status = auxilio?.status;
  const showPatron = ['asignado', 'zarpado', 'arribado', 'en_proceso'].includes(status);
  const showContact = showPatron && status !== 'en_proceso';
  const isSearching = ['solicitado', 'buscando'].includes(status);
  const isFinalizado = status === 'finalizado';
  const isTerminal = ['cancelado', 'rechazado'].includes(status);

  if (isFinalizado) {
    return (
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AuxilioCompletedPanel
          auxilio={auxilio}
          onRate={onRate}
          onDetail={onDetail}
          onReport={onReport}
        />
      </ScrollView>
    );
  }

  if (isTerminal) {
    return (
      <View style={[styles.sheet, styles.center, styles.terminalWrap]}>
        <Text style={styles.terminalTitle}>
          {status === 'rechazado' ? 'Auxilio rechazado' : 'Solicitud cancelada'}
        </Text>
        <Text style={styles.terminalHint}>
          {status === 'rechazado'
            ? 'No hay patrón disponible en este momento.'
            : 'Tu solicitud fue cancelada.'}
        </Text>
        <Button title="Volver al inicio" onPress={onGoHome} style={styles.homeBtn} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.sheet}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {showPatron ? (
        <>
          <AuxilioPatronCard driver={auxilio.driver} status={status} />
          <AuxilioMetricBox status={status} etaMinutes={auxilio.etaMinutes} />
          {showContact ? (
            <AuxilioContactActions driver={auxilio.driver} onMessage={onMessage} />
          ) : null}
        </>
      ) : !isSearching ? (
        <AuxilioMetricBox status={status} etaMinutes={auxilio?.etaMinutes} />
      ) : null}

      <AuxilioTimeline auxilio={auxilio} />

      <AuxilioLiveFooter
        status={status}
        onCancel={onCancel}
        onReport={onReport}
        loading={cancelLoading}
        simulating={simulating}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  scrollContent: {
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.xxl,
  },
  center: { alignItems: 'center', justifyContent: 'center', padding: SIZES.xl },
  terminalWrap: { padding: SIZES.xl },
  terminalTitle: { color: COLORS.text, fontSize: SIZES.h3, fontWeight: '700', textAlign: 'center' },
  terminalHint: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.sm, marginBottom: SIZES.xl },
  homeBtn: { width: '100%' },
});

export default AuxilioLiveSheet;
