import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/common';
import { RiderPrimaryButton } from '../../../components/rider';
import { COLORS, SIZES } from '../../../constants/theme';

const RiderLoginScreen = ({ navigation }) => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Datos incompletos', 'Ingresá email y contraseña.');
      return;
    }
    const result = await login(email.trim(), password);
    if (!result.success) {
      Alert.alert('Error', result.error || 'No se pudo iniciar sesión');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <Image
              source={require('../../../../assets/logo-river.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Patrón de auxilio náutico</Text>
          </View>

          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>Accedé a tu guardia y servicios activos</Text>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="patron@demo.com"
            containerStyle={styles.input}
          />
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            containerStyle={styles.input}
          />

          <RiderPrimaryButton title="Entrar" onPress={handleSubmit} loading={loading} style={styles.btn} />

          <Text style={styles.footer} onPress={() => navigation.navigate('ForgotPassword')}>
            ¿Olvidaste tu contraseña?
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.riderNavy },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: SIZES.screenPadding, paddingTop: SIZES.xxl },
  logoWrap: { alignItems: 'center', marginBottom: SIZES.xxl },
  logo: { width: 260, height: 260, marginBottom: SIZES.xs },
  tagline: { color: COLORS.textSecondary, marginTop: -SIZES.md },
  title: { color: COLORS.text, fontSize: SIZES.h1, fontWeight: '700', marginBottom: SIZES.sm },
  subtitle: { color: COLORS.textSecondary, marginBottom: SIZES.xl, lineHeight: 22 },
  input: { marginBottom: SIZES.md },
  btn: { marginTop: SIZES.md },
  footer: { color: COLORS.riderBlue, textAlign: 'center', marginTop: SIZES.lg, fontSize: SIZES.body },
});

export default RiderLoginScreen;
