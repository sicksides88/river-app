import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../../../components/common';
import { TopBar } from '../../../components/riverservice';
import { COLORS, SIZES } from '../../../constants/theme';

const VerifyEmailScreen = ({ navigation, route }) => {
  const email = route.params?.email || '';
  const [code, setCode] = useState('');

  const verify = () => {
    if (code.length < 4) {
      Alert.alert('Error', 'Ingresá el código de verificación');
      return;
    }
    navigation.navigate('OnboardingEmbarcacion');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopBar title="Verificar email" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.hint}>Enviamos un código a {email || 'tu correo'}</Text>
        <Input label="Código OTP" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
        <Button title="Verificar" onPress={verify} style={styles.btn} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.screenPadding },
  hint: { color: COLORS.textSecondary, marginBottom: SIZES.lg },
  btn: { marginTop: SIZES.lg },
});

export default VerifyEmailScreen;
