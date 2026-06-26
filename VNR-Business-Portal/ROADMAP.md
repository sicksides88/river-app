# ROADMAP - VNR App de Movilidad

## Estado Actual del Proyecto

### Migración React Native + Expo: COMPLETADA
- Sub-Fases 0.1 - 0.6: COMPLETADAS
- FASE 0 COMPLETA - Listo para FASE 1

### Backend (MIGRADO A SUPABASE)
- [x] API REST con Express
- [x] **Migrado de MongoDB a Supabase (PostgreSQL)**
- [x] Autenticación con Supabase Auth (JWT)
- [x] Tablas: profiles, rides, deliveries, saved_locations
- [x] Row Level Security (RLS) configurado
- [x] Endpoints funcionales actualizados

---

# FASE 0: MIGRACIÓN A REACT NATIVE + EXPO

**Prioridad: CRÍTICA - BLOQUEANTE**
**Estrategia: Reemplazo progresivo (eliminar React Web conforme se migra)**

Esta fase está dividida en **6 sub-fases** que deben completarse en orden.

---

## SUB-FASE 0.1: Preparación y Configuración Inicial
**Estado: COMPLETADO**
**Objetivo: Crear proyecto Expo y configurar estructura base**

### 0.1.1 Backup y Limpieza Inicial
- [ ] Crear backup del proyecto actual (commit en git)
- [ ] Documentar estructura actual para referencia
- [ ] Identificar archivos que se eliminarán

### 0.1.2 Eliminar Archivos React Web - Parte 1 (Configuración)
Eliminar archivos de configuración web que no se usarán:
- [ ] Eliminar `/vite.config.js`
- [ ] Eliminar `/index.html`
- [ ] Eliminar `/.env` (se creará uno nuevo para Expo)
- [ ] Eliminar `/package.json` (se creará uno nuevo)
- [ ] Eliminar `/package-lock.json` y `/bun.lock`
- [ ] Eliminar `/node_modules/`
- [ ] Eliminar scripts: `/start-dev.bat`, `/start-dev.sh`, `/setup-mobile-env.js`, `/show-network-urls.js`

### 0.1.3 Crear Proyecto Expo en Raíz
- [ ] Ejecutar en `/home/rdpuser/Desktop/VNR/`:
```bash
npx create-expo-app . --template blank
```
- [ ] Verificar que se crearon:
  - `App.js`
  - `app.json`
  - `babel.config.js`
  - `package.json` (nuevo)

### 0.1.4 Estructura de Directorios
- [ ] Crear estructura de carpetas:
```bash
mkdir -p src/{screens,components,navigation,context,services,hooks,utils,constants,assets}
mkdir -p src/components/common
mkdir -p src/screens/auth
mkdir -p src/screens/home
mkdir -p src/screens/services
mkdir -p src/screens/activity
mkdir -p src/screens/store
mkdir -p src/screens/profile
```

### 0.1.5 Instalar Dependencias Core
- [ ] Navegación:
```bash
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
```

- [ ] Storage y Networking:
```bash
npx expo install @react-native-async-storage/async-storage
npm install axios
```

- [ ] UI Base:
```bash
npx expo install react-native-gesture-handler
npx expo install expo-linear-gradient
npm install react-native-vector-icons
```

### 0.1.6 Configurar Variables de Entorno
- [ ] Instalar dotenv: `npm install react-native-dotenv`
- [ ] Crear `/.env`:
```
API_URL=http://192.168.0.104:5000/api
GOOGLE_MAPS_API_KEY=AIzaSyB5fIEp84rrhJ3JRolqjXTLMIrLSAg7KTo
```
- [ ] Actualizar `babel.config.js`:
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }]
    ]
  };
};
```

### 0.1.7 Configurar app.json
- [ ] Actualizar `/app.json`:
```json
{
  "expo": {
    "name": "VNR",
    "slug": "vnr-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#667eea"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.vnr.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#667eea"
      },
      "package": "com.vnr.app"
    }
  }
}
```

### 0.1.8 Verificación Sub-Fase 0.1
- [ ] Ejecutar `npx expo start` sin errores
- [ ] App muestra pantalla de Expo default
- [ ] Estructura de carpetas creada
- [ ] Dependencias instaladas correctamente

### 0.1.9 Eliminar CSS Web (ya no se usan)
- [ ] Eliminar `/src/index.css`
- [ ] Eliminar `/src/App.css`
- [ ] Eliminar todos los archivos `.css` en `/src/components/`

**Archivos eliminados en esta sub-fase:**
- vite.config.js, index.html, .env (viejo), package.json (viejo)
- package-lock.json, bun.lock, node_modules/
- start-dev.bat, start-dev.sh, setup-mobile-env.js, show-network-urls.js
- Todos los archivos .css

---

## SUB-FASE 0.2: Configuración Base y Tema
**Estado: COMPLETADO**
**Objetivo: Crear sistema de estilos, constantes y componentes base**
**Dependencias: Sub-Fase 0.1 completada**

### 0.2.1 Crear Sistema de Tema
- [ ] Crear `/src/constants/theme.js`:
```javascript
export const COLORS = {
  primary: '#667eea',
  primaryDark: '#5a67d8',
  secondary: '#764ba2',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  black: '#000000',
  gray: '#6c757d',
  lightGray: '#e9ecef',
  background: '#f5f5f5',
  border: '#ddd',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const SIZES = {
  // Spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  // Font sizes
  caption: 12,
  body: 14,
  subtitle: 16,
  title: 18,
  h3: 20,
  h2: 24,
  h1: 32,

  // Border radius
  radiusSm: 4,
  radius: 8,
  radiusLg: 12,
  radiusXl: 16,
  radiusFull: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
```

### 0.2.2 Crear Estilos Globales
- [ ] Crear `/src/constants/globalStyles.js`:
```javascript
import { StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from './theme';

export const globalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerPadded: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.md,
  },
  containerCentered: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Cards
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    ...SHADOWS.md,
  },

  // Text
  textTitle: {
    fontSize: SIZES.title,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  textSubtitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.dark,
  },
  textBody: {
    fontSize: SIZES.body,
    color: COLORS.gray,
  },
  textCaption: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm + 4,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    color: COLORS.white,
    fontSize: SIZES.subtitle,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: SIZES.sm + 4,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    color: COLORS.primary,
    fontSize: SIZES.subtitle,
    fontWeight: '600',
  },

  // Inputs
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
    fontSize: SIZES.body,
    color: COLORS.dark,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  inputLabel: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: SIZES.xs,
  },
  inputErrorText: {
    fontSize: SIZES.caption,
    color: COLORS.danger,
    marginTop: SIZES.xs,
  },

  // Flex helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Spacing
  mt_sm: { marginTop: SIZES.sm },
  mt_md: { marginTop: SIZES.md },
  mt_lg: { marginTop: SIZES.lg },
  mb_sm: { marginBottom: SIZES.sm },
  mb_md: { marginBottom: SIZES.md },
  mb_lg: { marginBottom: SIZES.lg },
});

export default globalStyles;
```

### 0.2.3 Crear Constantes de Configuración
- [ ] Crear `/src/constants/config.js`:
```javascript
import { API_URL, GOOGLE_MAPS_API_KEY } from '@env';

export const CONFIG = {
  API_URL: API_URL || 'http://localhost:5000/api',
  GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY || '',

  // Timeouts
  API_TIMEOUT: 30000,
  LOCATION_TIMEOUT: 15000,

  // Pagination
  DEFAULT_PAGE_SIZE: 10,

  // Location
  LOCATION_UPDATE_INTERVAL: 10000, // 10 seconds

  // App info
  APP_NAME: 'VNR',
  APP_VERSION: '1.0.0',
};

export default CONFIG;
```

### 0.2.4 Crear Índice de Constantes
- [ ] Crear `/src/constants/index.js`:
```javascript
export * from './theme';
export * from './globalStyles';
export * from './config';
```

### 0.2.5 Crear Componentes Base - Button
- [ ] Crear `/src/components/common/Button.js`:
```javascript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.white : COLORS.primary} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Variants
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
  // Sizes
  small: {
    paddingVertical: SIZES.xs + 2,
    paddingHorizontal: SIZES.md,
  },
  medium: {
    paddingVertical: SIZES.sm + 4,
    paddingHorizontal: SIZES.lg,
  },
  large: {
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.xl,
  },
  // Text variants
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.primary,
  },
  dangerText: {
    color: COLORS.white,
  },
  // Text sizes
  smallText: {
    fontSize: SIZES.caption,
  },
  mediumText: {
    fontSize: SIZES.body,
  },
  largeText: {
    fontSize: SIZES.subtitle,
  },
  // States
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
```

### 0.2.6 Crear Componentes Base - Input
- [ ] Crear `/src/components/common/Input.js`:
```javascript
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  leftIcon,
  rightIcon,
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError,
        !editable && styles.inputDisabled,
      ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.showHideText}>
              {showPassword ? 'Ocultar' : 'Ver'}
            </Text>
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.md,
  },
  label: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: SIZES.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  inputDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  input: {
    flex: 1,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 4,
    fontSize: SIZES.body,
    color: COLORS.dark,
  },
  inputWithLeftIcon: {
    paddingLeft: SIZES.xs,
  },
  inputWithRightIcon: {
    paddingRight: SIZES.xs,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  iconLeft: {
    paddingLeft: SIZES.md,
  },
  iconRight: {
    paddingRight: SIZES.md,
  },
  showHideText: {
    color: COLORS.primary,
    fontSize: SIZES.caption,
    fontWeight: '500',
  },
  errorText: {
    fontSize: SIZES.caption,
    color: COLORS.danger,
    marginTop: SIZES.xs,
  },
});

export default Input;
```

### 0.2.7 Crear Componentes Base - Loading
- [ ] Crear `/src/components/common/Loading.js`:
```javascript
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const Loading = ({
  size = 'large',
  color = COLORS.primary,
  text,
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SIZES.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    marginTop: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.gray,
  },
});

export default Loading;
```

### 0.2.8 Crear Componentes Base - Card
- [ ] Crear `/src/components/common/Card.js`:
```javascript
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const Card = ({
  children,
  style,
  onPress,
  padding = SIZES.md,
  shadow = 'md',
}) => {
  const cardStyles = [
    styles.card,
    { padding },
    SHADOWS[shadow],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
  },
});

export default Card;
```

### 0.2.9 Índice de Componentes Comunes
- [ ] Crear `/src/components/common/index.js`:
```javascript
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Loading } from './Loading';
export { default as Card } from './Card';
```

### 0.2.10 Verificación Sub-Fase 0.2
- [ ] Archivos de tema creados
- [ ] Estilos globales funcionando
- [ ] Componentes Button, Input, Loading, Card creados
- [ ] Sin errores de importación

**Archivos de React Web eliminados hasta ahora:**
- Todos los .css
- Archivos de configuración web

---

## SUB-FASE 0.3: Servicios de API y AuthContext
**Estado: COMPLETADO**
**Objetivo: Migrar servicios de API y sistema de autenticación**
**Dependencias: Sub-Fase 0.2 completada**

### 0.3.1 Crear Servicio Base de API
- [ ] Crear `/src/services/api.js`:
```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';

const api = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      await AsyncStorage.multiRemove(['token', 'user']);
      // La navegación se maneja en AuthContext
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 0.3.2 Crear Servicio de Autenticación
- [ ] Crear `/src/services/auth.service.js`:
```javascript
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continuar con logout local aunque falle el servidor
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.put('/users/profile', profileData);
    if (response.data.user) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async getStoredUser() {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async getStoredToken() {
    return await AsyncStorage.getItem('token');
  },
};

export default authService;
```

### 0.3.3 Crear Servicio de Viajes
- [ ] Crear `/src/services/ride.service.js`:
```javascript
import api from './api';

export const rideService = {
  async createRide(rideData) {
    const response = await api.post('/rides', rideData);
    return response.data;
  },

  async getUserRides(params = {}) {
    const response = await api.get('/rides', { params });
    return response.data;
  },

  async getRideById(rideId) {
    const response = await api.get(`/rides/${rideId}`);
    return response.data;
  },

  async cancelRide(rideId) {
    const response = await api.put(`/rides/${rideId}/cancel`);
    return response.data;
  },

  calculateEstimate(distance) {
    const basePrice = 500;
    const pricePerKm = 150;
    return basePrice + (distance * pricePerKm);
  },
};

export default rideService;
```

### 0.3.4 Crear Servicio de Envíos
- [ ] Crear `/src/services/delivery.service.js`:
```javascript
import api from './api';

export const deliveryService = {
  async createDelivery(deliveryData) {
    const response = await api.post('/deliveries', deliveryData);
    return response.data;
  },

  async getUserDeliveries(params = {}) {
    const response = await api.get('/deliveries', { params });
    return response.data;
  },

  async getDeliveryById(deliveryId) {
    const response = await api.get(`/deliveries/${deliveryId}`);
    return response.data;
  },

  async trackDelivery(trackingNumber) {
    const response = await api.get(`/deliveries/track/${trackingNumber}`);
    return response.data;
  },

  async cancelDelivery(deliveryId) {
    const response = await api.put(`/deliveries/${deliveryId}/cancel`);
    return response.data;
  },

  calculateDeliveryEstimate(distance, weight = 0) {
    const basePrice = 400;
    const pricePerKm = 120;
    const weightFactor = weight > 3 ? (weight - 3) * 50 : 0;
    return basePrice + (distance * pricePerKm) + weightFactor;
  },
};

export default deliveryService;
```

### 0.3.5 Crear Índice de Servicios
- [ ] Crear `/src/services/index.js`:
```javascript
export { default as api } from './api';
export { default as authService } from './auth.service';
export { default as rideService } from './ride.service';
export { default as deliveryService } from './delivery.service';
```

### 0.3.6 Crear AuthContext
- [ ] Crear `/src/context/AuthContext.js`:
```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar autenticación al iniciar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const token = await authService.getStoredToken();

      if (token) {
        // Verificar que el token sea válido
        const response = await authService.getMe();
        setUser(response.user);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      // Token inválido, limpiar storage
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al iniciar sesión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authService.register(userData);
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al registrarse';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await authService.updateProfile(profileData);
      setUser(response.user);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar perfil';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
```

### 0.3.7 Eliminar Servicios Web Antiguos
- [ ] Eliminar `/src/services/api.js` (web)
- [ ] Eliminar `/src/services/auth.service.js` (web)
- [ ] Eliminar `/src/services/ride.service.js` (web)
- [ ] Eliminar `/src/services/delivery.service.js` (web)
- [ ] Eliminar `/src/services/location.service.js` (web) - se recreará después
- [ ] Eliminar `/src/context/AuthContext.jsx` (web)

### 0.3.8 Verificación Sub-Fase 0.3
- [ ] Servicios de API creados
- [ ] AuthContext funcionando con AsyncStorage
- [ ] Servicios web antiguos eliminados
- [ ] Sin errores de importación

---

## SUB-FASE 0.4: Sistema de Navegación
**Estado: COMPLETADO**
**Objetivo: Configurar React Navigation completo**
**Dependencias: Sub-Fase 0.3 completada**

### 0.4.1 Crear Navegador de Autenticación
- [ ] Crear `/src/navigation/AuthNavigator.js`:
```javascript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens (se crearán en la siguiente sub-fase)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
```

### 0.4.2 Crear Navegador de Tabs Principal
- [ ] Crear `/src/navigation/MainTabNavigator.js`:
```javascript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

// Stack Navigators
import HomeStackNavigator from './HomeStackNavigator';
import ServicesStackNavigator from './ServicesStackNavigator';
import ActivityScreen from '../screens/activity/ActivityScreen';
import StoreScreen from '../screens/store/StoreScreen';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

// Iconos temporales (se reemplazarán por vector-icons)
const TabIcon = ({ name, focused }) => (
  <View style={styles.iconContainer}>
    <Text style={[styles.iconText, focused && styles.iconTextActive]}>
      {name}
    </Text>
  </View>
);

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ServicesTab"
        component={ServicesStackNavigator}
        options={{
          tabBarLabel: 'Servicios',
          tabBarIcon: ({ focused }) => <TabIcon name="📦" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{
          tabBarLabel: 'Actividad',
          tabBarIcon: ({ focused }) => <TabIcon name="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="StoreTab"
        component={StoreScreen}
        options={{
          tabBarLabel: 'Tienda',
          tabBarIcon: ({ focused }) => <TabIcon name="🛒" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Más',
          tabBarIcon: ({ focused }) => <TabIcon name="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingTop: SIZES.xs,
    paddingBottom: SIZES.sm,
    height: 60,
  },
  tabBarLabel: {
    fontSize: SIZES.caption,
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    opacity: 0.5,
  },
  iconTextActive: {
    opacity: 1,
  },
});

export default MainTabNavigator;
```

### 0.4.3 Crear Stack Navigator de Home
- [ ] Crear `/src/navigation/HomeStackNavigator.js`:
```javascript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import PlanTripScreen from '../screens/services/PlanTripScreen';
import TripConfirmationScreen from '../screens/services/TripConfirmationScreen';
import EnviosScreen from '../screens/services/EnviosScreen';
import EnviarArticulosScreen from '../screens/services/EnviarArticulosScreen';
import RecibirArticulosScreen from '../screens/services/RecibirArticulosScreen';
import DeliveryConfirmationScreen from '../screens/services/DeliveryConfirmationScreen';
import FletesScreen from '../screens/services/FletesScreen';
import FleteFormScreen from '../screens/services/FleteFormScreen';
import ChoferScreen from '../screens/services/ChoferScreen';
import ChoferViajeScreen from '../screens/services/ChoferViajeScreen';

const Stack = createNativeStackNavigator();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlanTrip"
        component={PlanTripScreen}
        options={{ title: 'Planificar Viaje' }}
      />
      <Stack.Screen
        name="TripConfirmation"
        component={TripConfirmationScreen}
        options={{ title: 'Confirmar Viaje' }}
      />
      <Stack.Screen
        name="Envios"
        component={EnviosScreen}
        options={{ title: 'Envíos' }}
      />
      <Stack.Screen
        name="EnviarArticulos"
        component={EnviarArticulosScreen}
        options={{ title: 'Enviar Artículos' }}
      />
      <Stack.Screen
        name="RecibirArticulos"
        component={RecibirArticulosScreen}
        options={{ title: 'Recibir Artículos' }}
      />
      <Stack.Screen
        name="DeliveryConfirmation"
        component={DeliveryConfirmationScreen}
        options={{ title: 'Confirmar Envío' }}
      />
      <Stack.Screen
        name="Fletes"
        component={FletesScreen}
        options={{ title: 'Fletes' }}
      />
      <Stack.Screen
        name="FleteForm"
        component={FleteFormScreen}
        options={{ title: 'Solicitar Flete' }}
      />
      <Stack.Screen
        name="Chofer"
        component={ChoferScreen}
        options={{ title: 'Chofer Privado' }}
      />
      <Stack.Screen
        name="ChoferViaje"
        component={ChoferViajeScreen}
        options={{ title: 'Programar Viaje' }}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
```

### 0.4.4 Crear Stack Navigator de Servicios
- [ ] Crear `/src/navigation/ServicesStackNavigator.js`:
```javascript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

import ServicesScreen from '../screens/services/ServicesScreen';

const Stack = createNativeStackNavigator();

const ServicesStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
      }}
    >
      <Stack.Screen
        name="Services"
        component={ServicesScreen}
        options={{ title: 'Servicios' }}
      />
    </Stack.Navigator>
  );
};

export default ServicesStackNavigator;
```

### 0.4.5 Crear Stack Navigator de Perfil
- [ ] Crear `/src/navigation/ProfileStackNavigator.js`:
```javascript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Mi Perfil' }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;
```

### 0.4.6 Crear Navegador Principal (App Navigator)
- [ ] Crear `/src/navigation/AppNavigator.js`:
```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/common';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Cargando..." />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
```

### 0.4.7 Crear Índice de Navegación
- [ ] Crear `/src/navigation/index.js`:
```javascript
export { default as AppNavigator } from './AppNavigator';
export { default as AuthNavigator } from './AuthNavigator';
export { default as MainTabNavigator } from './MainTabNavigator';
export { default as HomeStackNavigator } from './HomeStackNavigator';
export { default as ServicesStackNavigator } from './ServicesStackNavigator';
export { default as ProfileStackNavigator } from './ProfileStackNavigator';
```

### 0.4.8 Actualizar App.js Principal
- [ ] Actualizar `/App.js`:
```javascript
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

### 0.4.9 Verificación Sub-Fase 0.4
- [ ] Navegación configurada
- [ ] App.js actualizado
- [ ] Sin errores de navegación (aunque falten pantallas)

---

## SUB-FASE 0.5: Pantallas de Autenticación y Home
**Estado: COMPLETADO**
**Objetivo: Crear pantallas de Login, Register y Home**
**Dependencias: Sub-Fase 0.4 completada**

### 0.5.1 Crear LoginScreen
- [ ] Crear `/src/screens/auth/LoginScreen.js`
- [ ] Incluir: email, password, botón login, link a registro
- [ ] Integrar con useAuth()
- [ ] KeyboardAvoidingView para el formulario

### 0.5.2 Crear RegisterScreen
- [ ] Crear `/src/screens/auth/RegisterScreen.js`
- [ ] Incluir: nombre, apellido, email, teléfono, dirección, password
- [ ] Validaciones de formulario
- [ ] Integrar con useAuth()

### 0.5.3 Crear HomeScreen
- [ ] Crear `/src/screens/home/HomeScreen.js`
- [ ] Header con servicios (tabs)
- [ ] Barra de búsqueda
- [ ] Grid de servicios
- [ ] Sección promocional
- [ ] Tarjetas informativas

### 0.5.4 Crear Pantallas Placeholder
Crear versiones básicas de todas las pantallas requeridas:
- [ ] `/src/screens/services/ServicesScreen.js`
- [ ] `/src/screens/services/PlanTripScreen.js`
- [ ] `/src/screens/services/TripConfirmationScreen.js`
- [ ] `/src/screens/services/EnviosScreen.js`
- [ ] `/src/screens/services/EnviarArticulosScreen.js`
- [ ] `/src/screens/services/RecibirArticulosScreen.js`
- [ ] `/src/screens/services/DeliveryConfirmationScreen.js`
- [ ] `/src/screens/services/FletesScreen.js`
- [ ] `/src/screens/services/FleteFormScreen.js`
- [ ] `/src/screens/services/ChoferScreen.js`
- [ ] `/src/screens/services/ChoferViajeScreen.js`
- [ ] `/src/screens/activity/ActivityScreen.js`
- [ ] `/src/screens/store/StoreScreen.js`
- [ ] `/src/screens/profile/ProfileScreen.js`

### 0.5.5 Eliminar Componentes Web de Autenticación
- [ ] Eliminar `/src/components/Login.jsx`
- [ ] Eliminar `/src/components/Register.jsx`

### 0.5.6 Verificación Sub-Fase 0.5
- [ ] Login funcional y conectado al backend
- [ ] Register funcional
- [ ] Home muestra contenido básico
- [ ] Navegación entre pantallas funciona
- [ ] Todas las pantallas placeholder creadas

---

## SUB-FASE 0.6: Pantallas de Servicios Completas
**Estado: COMPLETADO**
**Objetivo: Migrar todas las pantallas de servicios**
**Dependencias: Sub-Fase 0.5 completada**

### 0.6.1 Instalar Dependencias de Mapas y Ubicación
- [x] Instalar:
```bash
npx expo install react-native-maps expo-location
```

### 0.6.2 Configurar Google Maps en app.json
- [x] Actualizar app.json con API keys de Google Maps

### 0.6.3 Crear Servicio de Ubicación
- [x] Crear `/src/services/location.service.js` con expo-location

### 0.6.4 Crear Componente LocationInput
- [x] Crear `/src/components/common/LocationInput.js`
- [x] Autocomplete con Google Places
- [x] Ubicación actual

### 0.6.5 Crear Componente MapView Wrapper
- [x] Crear `/src/components/common/MapViewWrapper.js`
- [x] Marcadores, rutas, etc.

### 0.6.6 Completar Pantallas de Vuelta Segura
- [x] Completar `VueltaSeguraScreen.js` - Con mapa y LocationInput
- [x] Completar `RideConfirmScreen.js`
- [x] Completar `ViajeAceptadoScreen.js`

### 0.6.7 Completar Pantallas de Envíos
- [x] Completar `EnviosScreen.js` - Con mapa y LocationInput
- [x] Completar `EnviosInitialScreen.js`
- [x] Completar `EnviarArticuloScreen.js`
- [x] Completar `RecibirArticuloScreen.js`
- [x] Completar `DeliveryConfirmScreen.js`

### 0.6.8 Completar Pantallas de Fletes
- [x] Completar `FletesScreen.js` - Con mapa y LocationInput
- [x] Completar `FletesInitialScreen.js`

### 0.6.9 Completar Pantallas de Chofer
- [x] Completar `ChoferScreen.js`
- [x] Completar `ChoferInitialScreen.js`
- [x] Completar `ProgramacionHorariosScreen.js`
- [x] Completar `ViajeAceptadoChoferScreen.js`

### 0.6.10 Completar Pantallas Restantes
- [x] Completar `ActivityScreen.js` - Historial (corregido según Figma)
- [x] Completar `MarketplaceScreen.js` - Tienda/Marketplace
- [x] Completar `MarketplaceAlquilerScreen.js` - Alquiler
- [x] Completar `CarritoScreen.js` y `CarritoAlquilerScreen.js`
- [x] Completar `ProfileScreen.js` - Perfil y logout
- [x] Completar `SettingsScreen.js`, `SeguridadScreen.js`
- [x] Completar `CambiarTelefonoScreen.js`, `CambiarContrasenaScreen.js`

### 0.6.11 Completar Pantallas Adicionales (Figma)
- [x] `ElegiConductorScreen.js`
- [x] `EsperaScreen.js`
- [x] `OpcionesPagoScreen.js`
- [x] `SeleccionarDiaHoraScreen.js`
- [x] `FiltroChoferModal.js`
- [x] `FiltroMarketplaceModal.js`

### 0.6.12 Eliminar TODOS los Componentes Web Restantes
- [x] Todos los archivos `.jsx` eliminados (verificado: no existen)
- [x] No quedan componentes web en el proyecto

### 0.6.13 Verificación Final Sub-Fase 0.6
- [x] Todas las pantallas funcionando
- [x] Mapas configurados con MapViewWrapper
- [x] Geolocalización configurada con expo-location
- [x] No quedan archivos de React Web (.jsx)
- [x] Todas las pantallas de Figma implementadas (40+ pantallas)
- [x] Consistencia visual (dots outline/filled, líneas punteadas)
- [x] App completamente funcional en React Native

---

## CHECKLIST FINAL FASE 0

### Verificación Completa
- [ ] App inicia sin errores
- [ ] Login/Register funciona
- [ ] Navegación completa funciona
- [ ] Mapas funcionan
- [ ] Geolocalización funciona
- [ ] Conexión con backend funciona
- [ ] Probado en Android (emulador o dispositivo)
- [ ] Probado en iOS (emulador o dispositivo)
- [ ] No quedan archivos de React Web
- [ ] Código limpio y organizado

### Estructura Final del Proyecto
```
/home/rdpuser/Desktop/VNR/
├── backend/                    # ✅ Sin cambios
├── App.js                      # Punto de entrada Expo
├── app.json                    # Configuración Expo
├── babel.config.js             # Babel config
├── package.json                # Dependencias RN
├── .env                        # Variables de entorno
├── assets/                     # Assets de Expo
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   ├── Loading.js
│   │   │   ├── Card.js
│   │   │   └── index.js
│   │   ├── LocationInput.js
│   │   ├── MapViewWrapper.js
│   │   └── ...
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── home/
│   │   │   └── HomeScreen.js
│   │   ├── services/
│   │   │   ├── ServicesScreen.js
│   │   │   ├── PlanTripScreen.js
│   │   │   └── ...
│   │   ├── activity/
│   │   │   └── ActivityScreen.js
│   │   ├── store/
│   │   │   └── StoreScreen.js
│   │   └── profile/
│   │       └── ProfileScreen.js
│   ├── navigation/
│   │   ├── AppNavigator.js
│   │   ├── AuthNavigator.js
│   │   ├── MainTabNavigator.js
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.js
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.service.js
│   │   ├── ride.service.js
│   │   ├── delivery.service.js
│   │   ├── location.service.js
│   │   └── index.js
│   ├── constants/
│   │   ├── theme.js
│   │   ├── globalStyles.js
│   │   ├── config.js
│   │   └── index.js
│   ├── hooks/
│   ├── utils/
│   └── assets/
├── README.md
├── ROADMAP.md
└── SETUP.md
```

---

# FASE 1: Infraestructura de Conductores/Cadetes
**Prioridad: CRÍTICA**
**Dependencias: Fase 0 COMPLETADA**

(El contenido de Fase 1 en adelante se mantiene igual que antes)

### 1.1 Modelo de Datos - Conductor/Cadete
- [ ] Extender modelo `User` con campos específicos de conductor
- [ ] Campos: driverStatus, driverType, vehicleInfo, documents, trustPoints, etc.

### 1.2 Sistema de Documentación KYC
- [ ] Modelo `Document` para documentos de conductores
- [ ] Tipos: carnet_b1, buena_conducta, monotributo, seguro, vtv

### 1.3 Endpoints de Gestión de Conductores
- [ ] CRUD completo para conductores
- [ ] Aprobación, suspensión, reactivación

### 1.4 Sistema de Puntos de Confianza (CRÍTICO)
- [ ] Modelo `TrustPointsLog`
- [ ] Reglas de puntos
- [ ] Niveles de confianza

### 1.5 Pantallas de Conductor en App
- [ ] DriverRegistrationScreen
- [ ] DocumentUploadScreen
- [ ] DriverDashboardScreen

---

# FASES 2-8

(Se mantienen igual que antes - Sistema de Tarifas, Dashboard en Tiempo Real, Pagos, App del Conductor, Ratings, Tienda, Mejoras)

---

# Cronograma Actualizado

| Fase | Sub-Fase | Descripción | Prioridad |
|------|----------|-------------|-----------|
| **0** | **0.1** | Preparación y Configuración | CRÍTICA |
| **0** | **0.2** | Sistema de Estilos y Componentes Base | CRÍTICA |
| **0** | **0.3** | Servicios de API y AuthContext | CRÍTICA |
| **0** | **0.4** | Sistema de Navegación | CRÍTICA |
| **0** | **0.5** | Pantallas Auth y Home | CRÍTICA |
| **0** | **0.6** | Pantallas de Servicios y Limpieza Final | CRÍTICA |
| 1 | - | Infraestructura de Conductores | CRÍTICA |
| 2 | - | Sistema de Tarifas | ALTA |
| 3 | - | Dashboard en Tiempo Real | ALTA |
| 4 | - | Sistema de Pagos | ALTA |
| 5 | - | App del Conductor | MEDIA |
| 6 | - | Ratings y Reseñas | MEDIA |
| 7 | - | Tienda Funcional | BAJA |
| 8 | - | Mejoras y Optimizaciones | CONTINUO |

---

# Próximos Pasos

1. [x] Aprobar roadmap con sub-fases
2. [x] Completar FASE 0 (Sub-fases 0.1 - 0.6)
3. [ ] **Iniciar FASE 1**: Infraestructura de Conductores/Cadetes
   - Sistema de documentación KYC
   - Puntos de confianza
   - Pantallas de conductor

---

# FASE 2: Funcionalidades Core de Producción
**Prioridad: CRÍTICA - BLOQUEANTE PARA LANZAMIENTO**
**Dependencias: Fase 0 y Fase 1 completadas**
**Estado: EN PROGRESO**

Esta fase contiene las funcionalidades esenciales para que la aplicación sea operativa en producción.

---

## 2.1 SISTEMA DE PAGOS
**Estado: ✅ INFRAESTRUCTURA COMPLETADA (87%)**
**Prioridad: CRÍTICA**
**Pasarela Principal: MercadoPago**
**Última Actualización: 2026-01-10**

### RESUMEN DE IMPLEMENTACIÓN:
| Componente | Estado | Descripción |
|------------|--------|-------------|
| Backend Services | ✅ 100% | mercadopago.service, wallet.service, driverWallet.service |
| Controllers/Routes | ✅ 100% | payment, wallet, driverWallet controllers con todas las rutas |
| Database Schema | ✅ 100% | 16 tablas + vistas + triggers + RLS |
| User Wallet UI | ✅ 100% | WalletScreen, DepositScreen, WithdrawScreen, TransactionsScreen |
| Driver Wallet UI | ✅ 100% | WalletScreen, WithdrawScreen, EarningsScreen |
| Comisiones | ✅ 100% | Sistema automático por tipo de servicio |
| Webhooks MP | ✅ 90% | IPN handler implementado, falta validación firma |
| Checkout Flow | 🟡 60% | Falta WebView/redirect a MercadoPago |
| Deep Linking | ⬜ 0% | Retorno de MP a la app pendiente |
| Credenciales MP | ⬜ 0% | Variables de ambiente no configuradas |

### PENDIENTE PARA PRODUCCIÓN:
1. **Configurar credenciales MercadoPago** en variables de ambiente
2. **Implementar WebView/redirect** para Checkout Pro
3. **Agregar deep linking** para callback de pagos
4. **Validar firma de webhooks** (seguridad)
5. **Implementar cron job** para liberar ganancias (72h)

---

### 2.1.1 INTEGRACIÓN MERCADOPAGO
**Estado: COMPLETADO (Backend) / EN PROGRESO (Frontend)**
**Prioridad: CRÍTICA - BLOQUEANTE**

#### 2.1.1.1 Configuración Inicial
- [ ] Crear cuenta de desarrollador en MercadoPago
- [ ] Obtener credenciales de Sandbox (Public Key + Access Token)
- [ ] Obtener credenciales de Producción
- [x] Configurar variables de entorno en backend:
  ```
  MP_ACCESS_TOKEN_SANDBOX=xxx
  MP_ACCESS_TOKEN_PROD=xxx
  MP_PUBLIC_KEY_SANDBOX=xxx
  MP_PUBLIC_KEY_PROD=xxx
  MP_WEBHOOK_SECRET=xxx
  ```
- [ ] Configurar URL de webhook en panel de MercadoPago

#### 2.1.1.2 Backend - SDK y Servicios
- [x] Instalar SDK: `npm install mercadopago`
- [x] Crear `/backend/config/mercadopago.js` - Configuración del SDK
- [x] Crear `/backend/services/mercadopago.service.js`:
  - [x] `createPaymentPreference()` - Crear preferencia de pago
  - [ ] `createCardToken()` - Tokenizar tarjeta
  - [x] `processPayment()` - Procesar pago con tarjeta
  - [x] `getPaymentStatus()` - Consultar estado de pago
  - [x] `createRefund()` - Crear reembolso
  - [ ] `saveCard()` - Guardar tarjeta para pagos futuros
  - [ ] `getCustomerCards()` - Obtener tarjetas guardadas
  - [ ] `deleteCard()` - Eliminar tarjeta guardada

#### 2.1.1.3 Backend - Controllers y Rutas
- [x] Crear `/backend/controllers/payment.controller.js`
- [x] Crear `/backend/routes/payment.routes.js`
- [x] Endpoints principales:
  - [ ] `POST /api/payments/preference` - Crear preferencia (Checkout Pro)
  - [x] `POST /api/payments/process` - Procesar pago directo
  - [x] `POST /api/payments/webhook` - Recibir notificaciones IPN
  - [x] `GET /api/payments/:id` - Obtener detalle de pago
  - [ ] `GET /api/payments/:id/status` - Estado del pago
  - [ ] `POST /api/payments/cards` - Guardar tarjeta
  - [ ] `GET /api/payments/cards` - Listar tarjetas guardadas
  - [ ] `DELETE /api/payments/cards/:id` - Eliminar tarjeta

#### 2.1.1.4 Webhook y Notificaciones IPN
- [x] Implementar endpoint de webhook
- [ ] Validar firma del webhook (X-Signature)
- [x] Manejar tipos de notificación:
  - [x] `payment` - Pago creado/actualizado
  - [ ] `plan` - Suscripción
  - [ ] `subscription` - Suscripción
  - [ ] `invoice` - Factura
- [x] Actualizar estado de pago en BD según notificación
- [ ] Reintentos automáticos en caso de fallo
- [ ] Log de todas las notificaciones recibidas

#### 2.1.1.5 Frontend - Integración
- [ ] Instalar SDK: `npm install @mercadopago/sdk-react`
- [x] Crear `/src/services/payment.service.js`
- [ ] Crear `/src/components/payments/CardForm.js` - Formulario seguro
- [ ] Crear `/src/components/payments/PaymentButton.js`
- [ ] Implementar Checkout Pro (WebView)
- [ ] Implementar Checkout API (formulario nativo)
- [ ] Manejar deep links de retorno:
  - [ ] `success` - Pago exitoso
  - [ ] `failure` - Pago fallido
  - [ ] `pending` - Pago pendiente

#### 2.1.1.6 Métodos de Pago Soportados
- [ ] Tarjetas de crédito (Visa, Mastercard, Amex, etc.)
- [ ] Tarjetas de débito
- [ ] Dinero en cuenta MercadoPago
- [ ] Transferencia bancaria (PSE)
- [ ] Pagos en efectivo (Rapipago, PagoFácil) - Opcional

**Archivos Implementados:**
- `/backend/config/mercadopago.js`
- `/backend/services/mercadopago.service.js`
- `/backend/controllers/payment.controller.js`
- `/backend/routes/payment.routes.js`
- `/src/services/payment.service.js`

**Auditoría 2.1.1:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.1.1.1 Config Inicial | 🟡 Parcial | 2026-01-03 | - | Falta crear cuenta MP |
| 2.1.1.2 Backend SDK | ✅ Completado | 2026-01-03 | 2026-01-03 | SDK v2 instalado |
| 2.1.1.3 Controllers | ✅ Completado | 2026-01-03 | 2026-01-03 | Endpoints base listos |
| 2.1.1.4 Webhook | 🟡 Parcial | 2026-01-03 | - | Falta validar firma |
| 2.1.1.5 Frontend | 🟡 Parcial | 2026-01-03 | - | Servicio creado |
| 2.1.1.6 Métodos Pago | ⬜ Pendiente | - | - | |

---

### 2.1.2 WALLET DEL USUARIO
**Estado: COMPLETADO**
**Prioridad: ALTA**

#### 2.1.2.1 Base de Datos - Wallet Usuario
- [x] Crear tabla `user_wallets` en Supabase:
  ```sql
  CREATE TABLE user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) UNIQUE,
    balance DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'ARS',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] Crear tabla `wallet_transactions`:
  ```sql
  CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES user_wallets(id),
    user_id UUID REFERENCES profiles(id),
    type VARCHAR(20), -- 'deposit', 'withdrawal', 'payment', 'refund', 'bonus'
    amount DECIMAL(12,2),
    balance_before DECIMAL(12,2),
    balance_after DECIMAL(12,2),
    status VARCHAR(20), -- 'pending', 'completed', 'failed', 'cancelled'
    reference_type VARCHAR(50), -- 'ride', 'delivery', 'mercadopago', 'manual'
    reference_id UUID,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] Configurar RLS para wallets
- [x] Crear índices para optimización

#### 2.1.2.2 Backend - Servicios de Wallet Usuario
- [x] Crear `/backend/services/wallet.service.js`:
  - [x] `getWallet(userId)` - Obtener wallet del usuario
  - [x] `createWallet(userId)` - Crear wallet (automático al registrar)
  - [x] `getBalance(userId)` - Consultar saldo
  - [x] `deposit(userId, amount, metadata)` - Recargar saldo
  - [x] `withdraw(userId, amount, bankAccount)` - Retirar a cuenta bancaria
  - [x] `pay(userId, amount, rideId/deliveryId)` - Pagar con saldo
  - [x] `refund(userId, amount, transactionId)` - Reembolsar al wallet
  - [x] `getTransactions(userId, filters)` - Historial de movimientos

#### 2.1.2.3 Backend - Controller y Rutas Wallet Usuario
- [x] Crear `/backend/controllers/wallet.controller.js`
- [x] Crear `/backend/routes/wallet.routes.js`
- [x] Endpoints:
  - [x] `GET /api/wallet` - Obtener mi wallet y saldo
  - [x] `GET /api/wallet/balance` - Solo saldo
  - [x] `POST /api/wallet/deposit` - Iniciar recarga
  - [x] `POST /api/wallet/deposit/confirm` - Confirmar recarga (webhook)
  - [x] `POST /api/wallet/withdraw` - Solicitar retiro
  - [x] `GET /api/wallet/transactions` - Historial de movimientos
  - [x] `GET /api/wallet/transactions/:id` - Detalle de transacción

#### 2.1.2.4 Sistema de Recargas
- [x] Integrar con MercadoPago para recargas
- [x] Montos predefinidos: $500, $1000, $2000, $5000
- [x] Monto personalizado (mín $100, máx $50000)
- [ ] Bonificación por primera recarga (opcional)
- [ ] Promociones de recarga (ej: +10% en recargas > $2000)

#### 2.1.2.5 Sistema de Retiros Usuario
- [x] Crear tabla `bank_accounts`:
  ```sql
  CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    bank_name VARCHAR(100),
    account_type VARCHAR(20), -- 'savings', 'checking'
    account_number VARCHAR(50),
    cbu VARCHAR(22),
    alias VARCHAR(50),
    holder_name VARCHAR(100),
    holder_cuit VARCHAR(13),
    is_verified BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] Validación de CBU/CVU
- [x] Monto mínimo de retiro: $500
- [x] Tiempo de procesamiento: 24-72 horas hábiles
- [ ] Comisión por retiro (opcional): $0 o %

#### 2.1.2.6 Frontend - Pantallas Wallet Usuario
- [x] Crear `/src/screens/wallet/WalletScreen.js`:
  - [x] Mostrar saldo actual
  - [x] Botones de Recargar y Retirar
  - [x] Últimos movimientos
- [x] Crear `/src/screens/wallet/DepositScreen.js`:
  - [x] Selector de monto
  - [x] Monto personalizado
  - [x] Métodos de pago
- [x] Crear `/src/screens/wallet/WithdrawScreen.js`:
  - [x] Ingresar monto
  - [x] Seleccionar cuenta bancaria
  - [x] Confirmación
- [x] Crear `/src/screens/wallet/AddBankAccountScreen.js`
- [x] Crear `/src/screens/wallet/TransactionsScreen.js`
- [x] Crear `/src/screens/wallet/BankAccountsScreen.js`
- [x] Crear `/src/navigation/WalletStackNavigator.js`

**Archivos Implementados:**
- `/backend/services/wallet.service.js`
- `/backend/controllers/wallet.controller.js`
- `/backend/routes/wallet.routes.js`
- `/src/services/wallet.service.js`
- `/src/screens/wallet/WalletScreen.js`
- `/src/screens/wallet/DepositScreen.js`
- `/src/screens/wallet/WithdrawScreen.js`
- `/src/screens/wallet/TransactionsScreen.js`
- `/src/screens/wallet/BankAccountsScreen.js`
- `/src/screens/wallet/AddBankAccountScreen.js`
- `/src/navigation/WalletStackNavigator.js`

**Auditoría 2.1.2:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.1.2.1 Base de Datos | ✅ Completado | 2026-01-03 | 2026-01-03 | Schema ejecutado |
| 2.1.2.2 Backend Servicios | ✅ Completado | 2026-01-03 | 2026-01-03 | |
| 2.1.2.3 Controller/Rutas | ✅ Completado | 2026-01-03 | 2026-01-03 | |
| 2.1.2.4 Sistema Recargas | ✅ Completado | 2026-01-03 | 2026-01-03 | |
| 2.1.2.5 Sistema Retiros | ✅ Completado | 2026-01-03 | 2026-01-03 | |
| 2.1.2.6 Frontend Pantallas | ✅ Completado | 2026-01-03 | 2026-01-03 | 6 pantallas |

---

### 2.1.3 WALLET DEL CONDUCTOR
**Estado: COMPLETADO (Frontend 100% / Backend 100%)**
**Prioridad: ALTA**
**Última Actualización: 2026-01-03**

#### 2.1.3.1 Base de Datos - Wallet Conductor
- [x] Crear tabla `driver_wallets`:
  ```sql
  CREATE TABLE driver_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES profiles(id) UNIQUE,
    available_balance DECIMAL(12,2) DEFAULT 0.00, -- Disponible para retiro
    pending_balance DECIMAL(12,2) DEFAULT 0.00,   -- En proceso (72h)
    total_earned DECIMAL(12,2) DEFAULT 0.00,      -- Total histórico
    currency VARCHAR(3) DEFAULT 'ARS',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] Crear tabla `driver_earnings`:
  ```sql
  CREATE TABLE driver_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES profiles(id),
    wallet_id UUID REFERENCES driver_wallets(id),
    ride_id UUID REFERENCES rides(id),
    delivery_id UUID REFERENCES deliveries(id),
    gross_amount DECIMAL(12,2),        -- Monto bruto del viaje
    platform_fee DECIMAL(12,2),         -- Comisión plataforma
    net_amount DECIMAL(12,2),           -- Monto neto para conductor
    tip_amount DECIMAL(12,2) DEFAULT 0, -- Propina
    status VARCHAR(20), -- 'pending', 'available', 'withdrawn'
    available_at TIMESTAMPTZ,           -- Fecha cuando estará disponible
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] Crear tabla `driver_withdrawals`:
  ```sql
  CREATE TABLE driver_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES profiles(id),
    wallet_id UUID REFERENCES driver_wallets(id),
    amount DECIMAL(12,2),
    fee DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2),
    bank_account_id UUID REFERENCES bank_accounts(id),
    status VARCHAR(20), -- 'pending', 'processing', 'completed', 'failed'
    processed_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

#### 2.1.3.2 Backend - Servicios Wallet Conductor
- [x] Crear `/backend/services/driverWallet.service.js`:
  - [x] `getDriverWallet(driverId)` - Obtener wallet
  - [x] `createDriverWallet(driverId)` - Crear al aprobar conductor
  - [x] `addEarning(driverId, rideId, amounts)` - Registrar ganancia
  - [x] `processEarningRelease()` - Job para liberar fondos pendientes
  - [x] `getAvailableBalance(driverId)` - Saldo disponible
  - [x] `getPendingBalance(driverId)` - Saldo pendiente
  - [x] `requestWithdrawal(driverId, amount, bankAccountId)` - Solicitar retiro
  - [ ] `processWithdrawal(withdrawalId)` - Procesar retiro
  - [x] `getEarningsHistory(driverId, filters)` - Historial de ganancias
  - [x] `getWithdrawalsHistory(driverId)` - Historial de retiros

#### 2.1.3.3 Backend - Controller y Rutas
- [x] Crear `/backend/controllers/driverWallet.controller.js`
- [x] Crear `/backend/routes/driverWallet.routes.js`
- [x] Endpoints:
  - [x] `GET /api/driver/wallet` - Obtener wallet completo
  - [x] `GET /api/driver/wallet/balance` - Saldos (disponible + pendiente)
  - [x] `GET /api/driver/wallet/earnings` - Historial de ganancias
  - [x] `GET /api/driver/wallet/earnings/today` - Ganancias del día
  - [x] `GET /api/driver/wallet/earnings/week` - Ganancias de la semana
  - [x] `GET /api/driver/wallet/earnings/month` - Ganancias del mes
  - [x] `POST /api/driver/wallet/withdraw` - Solicitar retiro
  - [x] `GET /api/driver/wallet/withdrawals` - Historial de retiros
  - [ ] `GET /api/driver/wallet/withdrawals/:id` - Detalle de retiro

#### 2.1.3.4 Sistema de Liberación de Fondos
- [x] Período de retención: 72 horas (configurable)
- [x] Job automático para liberar fondos (endpoint admin)
- [ ] Notificación cuando fondos están disponibles
- [ ] Excepciones: retención extendida por disputas

#### 2.1.3.5 Sistema de Retiros Conductor
- [x] Monto mínimo de retiro: $1000
- [ ] Frecuencia: máximo 1 retiro por día
- [x] Métodos de retiro:
  - [x] Transferencia bancaria (CBU/CVU)
  - [ ] MercadoPago (dinero en cuenta)
- [x] Tiempo de procesamiento: 24-48 horas hábiles
- [ ] Comisión por retiro: $0 (primeros 4/mes) o $50

#### 2.1.3.6 Frontend - Pantallas Conductor
- [x] Actualizar `/src/screens/driver/wallet/WalletScreen.js`:
  - [x] Saldo disponible (destacado)
  - [x] Saldo pendiente con fecha de liberación
  - [x] Total ganado (histórico)
  - [x] Botón "Retirar"
  - [x] Ganancias del día/semana/mes
- [x] Actualizar `/src/screens/driver/earnings/DriverEarningsScreen.js`:
  - [x] Lista de viajes con ganancias
  - [x] Filtros por periodo (hoy/semana/mes)
  - [x] Desglose: bruto, comisión, neto
  - [x] Integración con API real
- [x] Crear `/src/screens/driver/wallet/DriverWithdrawScreen.js`:
  - [x] Monto a retirar (máx: saldo disponible)
  - [x] Selección de cuenta destino
  - [x] Validación de monto mínimo ($1000)
  - [x] Resumen y confirmación
- [x] Crear `/src/screens/driver/wallet/DriverWithdrawalsScreen.js`:
  - [x] Lista de retiros con paginación
  - [x] Estados de retiro (pendiente, procesando, completado, fallido)
  - [x] Detalles de cada retiro
- [x] Actualizar `/src/screens/driver/wallet/AddBankAccountScreen.js`

**Archivos Implementados:**
- `/backend/services/driverWallet.service.js`
- `/backend/controllers/driverWallet.controller.js`
- `/backend/routes/driverWallet.routes.js`
- `/src/services/driverWallet.service.js`
- `/src/screens/driver/wallet/WalletScreen.js` (actualizado)
- `/src/screens/driver/wallet/AddBankAccountScreen.js` (actualizado)
- `/src/screens/driver/wallet/DriverWithdrawScreen.js` (nuevo)
- `/src/screens/driver/wallet/DriverWithdrawalsScreen.js` (nuevo)
- `/src/screens/driver/earnings/DriverEarningsScreen.js` (actualizado)
- `/src/navigation/DriverEarningsStack.js` (actualizado)

**Auditoría 2.1.3:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.1.3.1 Base de Datos | ✅ Completado | 2026-01-03 | 2026-01-03 | Schema ejecutado |
| 2.1.3.2 Backend Servicios | ✅ Completado | 2026-01-03 | 2026-01-03 | |
| 2.1.3.3 Controller/Rutas | ✅ Completado | 2026-01-03 | 2026-01-03 | |
| 2.1.3.4 Liberación Fondos | 🟡 Parcial | 2026-01-03 | - | Falta notificaciones |
| 2.1.3.5 Sistema Retiros | ✅ Completado | 2026-01-03 | 2026-01-03 | Pantalla creada |
| 2.1.3.6 Frontend Pantallas | ✅ Completado | 2026-01-03 | 2026-01-03 | Todas las pantallas |

---

### 2.1.4 HISTORIAL DE TRANSACCIONES
**Estado: COMPLETADO**
**Prioridad: ALTA**
**Fecha Completado: 2026-01-08**

#### 2.1.4.1 Base de Datos - Transacciones Unificadas
- [x] Crear vista `all_transactions` que combine:
  - [x] Pagos de viajes/envíos
  - [x] Recargas de wallet
  - [x] Retiros
  - [x] Reembolsos
  - [x] Propinas
  - [x] Bonificaciones
- [x] Índices para búsqueda rápida por fecha y usuario
- [x] Vista `transaction_summary` para resúmenes agregados
- [x] Función `get_transaction_summary()` para consultas por período

#### 2.1.4.2 Backend - Servicio de Historial
- [x] Crear `/backend/services/transactionHistory.service.js`:
  - [x] `getTransactions(userId, filters)` - Con paginación y filtros avanzados
  - [x] `getTransactionById(id)` - Detalle completo con info de viaje/envío
  - [x] `getTransactionsByDateRange(userId, from, to)`
  - [x] `getTransactionsSummary(userId, period)` - Resumen por período
  - [x] `exportTransactions(userId, format)` - Exportar CSV/JSON
  - [x] `getTransactionStats(userId)` - Estadísticas históricas
  - [x] `enrichTransactions()` - Enriquecer con datos de referencia

#### 2.1.4.3 Backend - Endpoints
- [x] Endpoints en `/api/transactions`:
  - [x] `GET /api/transactions` - Listar con filtros y paginación
  - [x] `GET /api/transactions/:id` - Detalle de transacción
  - [x] `GET /api/transactions/summary` - Resumen (día/semana/mes/año)
  - [x] `GET /api/transactions/stats` - Estadísticas
  - [x] `GET /api/transactions/export` - Exportar historial
  - [x] `GET /api/transactions/range` - Por rango de fechas

#### 2.1.4.4 Filtros y Búsqueda
- [x] Filtrar por tipo de transacción (deposit, withdrawal, payment, refund, bonus)
- [x] Filtrar por estado (pending, completed, failed, cancelled)
- [x] Filtrar por rango de fechas (hoy, semana, mes, personalizado)
- [x] Filtrar por monto (mín/máx)
- [x] Búsqueda por descripción

#### 2.1.4.5 Frontend - Pantalla de Historial
- [x] Actualizar `/src/screens/wallet/TransactionsScreen.js`:
  - [x] Lista de transacciones con scroll infinito
  - [x] Iconos por tipo de transacción
  - [x] Colores: verde (ingreso), rojo (egreso)
  - [x] Filtros horizontales rápidos + modal avanzado
  - [x] Resumen del mes (ingresos/gastos/balance)
  - [x] Botón de exportar
- [x] Crear `/src/screens/wallet/TransactionDetailScreen.js`:
  - [x] Información completa de la transacción
  - [x] Detalles del viaje/envío relacionado
  - [x] Información del conductor
  - [x] Opción de compartir
- [x] Crear `/src/components/transactions/TransactionItem.js`
- [x] Crear `/src/components/transactions/TransactionFilters.js`
- [x] Crear `/src/services/transaction.service.js`

**Archivos Implementados:**
- `/backend/supabase/transaction_history_schema.sql`
- `/backend/services/transactionHistory.service.js`
- `/backend/controllers/transaction.controller.js`
- `/backend/routes/transaction.routes.js`
- `/src/services/transaction.service.js`
- `/src/screens/wallet/TransactionsScreen.js` (actualizado)
- `/src/screens/wallet/TransactionDetailScreen.js` (nuevo)
- `/src/components/transactions/TransactionItem.js`
- `/src/components/transactions/TransactionFilters.js`
- `/src/components/transactions/index.js`

**Auditoría 2.1.4:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.1.4.1 Base de Datos | ✅ Completado | 2026-01-08 | 2026-01-08 | Vista + índices + función |
| 2.1.4.2 Backend Servicio | ✅ Completado | 2026-01-08 | 2026-01-08 | 7 métodos |
| 2.1.4.3 Endpoints | ✅ Completado | 2026-01-08 | 2026-01-08 | 6 endpoints |
| 2.1.4.4 Filtros | ✅ Completado | 2026-01-08 | 2026-01-08 | 5 tipos de filtro |
| 2.1.4.5 Frontend | ✅ Completado | 2026-01-08 | 2026-01-08 | 2 pantallas + 2 componentes |

---

### 2.1.5 FACTURACIÓN / RECIBOS AUTOMÁTICOS
**Estado: PENDIENTE**
**Prioridad: MEDIA**

#### 2.1.5.1 Base de Datos - Facturas/Recibos
- [ ] Crear tabla `invoices`:
  ```sql
  CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(20) UNIQUE, -- VNR-2026-000001
    user_id UUID REFERENCES profiles(id),
    ride_id UUID REFERENCES rides(id),
    delivery_id UUID REFERENCES deliveries(id),
    payment_id UUID,
    type VARCHAR(20), -- 'receipt', 'invoice', 'credit_note'
    status VARCHAR(20), -- 'draft', 'issued', 'sent', 'cancelled'
    subtotal DECIMAL(12,2),
    tax_amount DECIMAL(12,2),
    total DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'ARS',
    issued_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    pdf_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Crear secuencia para número de factura
- [ ] Trigger para generar número automáticamente

#### 2.1.5.2 Backend - Servicio de Facturación
- [ ] Crear `/backend/services/invoice.service.js`:
  - [ ] `generateInvoice(paymentId)` - Generar factura/recibo
  - [ ] `generateInvoiceNumber()` - Número secuencial
  - [ ] `generatePDF(invoiceId)` - Crear PDF
  - [ ] `sendInvoiceEmail(invoiceId)` - Enviar por email
  - [ ] `getInvoice(invoiceId)` - Obtener factura
  - [ ] `getUserInvoices(userId)` - Listar facturas del usuario
  - [ ] `cancelInvoice(invoiceId)` - Anular factura
  - [ ] `generateCreditNote(invoiceId)` - Nota de crédito

#### 2.1.5.3 Generación de PDF
- [ ] Instalar librería: `npm install pdfkit` o `puppeteer`
- [ ] Diseñar template de recibo:
  - [ ] Logo de VNR
  - [ ] Datos de la empresa
  - [ ] Datos del cliente
  - [ ] Detalle del servicio
  - [ ] Desglose de montos
  - [ ] Información de pago
  - [ ] QR con código de verificación
- [ ] Almacenar PDFs en Supabase Storage

#### 2.1.5.4 Backend - Endpoints
- [ ] Endpoints en `/api/invoices`:
  - [ ] `GET /api/invoices` - Listar mis facturas
  - [ ] `GET /api/invoices/:id` - Detalle de factura
  - [ ] `GET /api/invoices/:id/pdf` - Descargar PDF
  - [ ] `POST /api/invoices/:id/send` - Reenviar por email

#### 2.1.5.5 Automatización
- [ ] Generar recibo automáticamente al completar pago
- [ ] Enviar recibo por email automáticamente
- [ ] Notificación push con link al recibo
- [ ] Resumen mensual de gastos (opcional)

#### 2.1.5.6 Frontend - Pantallas
- [ ] Crear `/src/screens/invoices/InvoicesScreen.js`
- [ ] Crear `/src/screens/invoices/InvoiceDetailScreen.js`
- [ ] Botón de descarga de PDF
- [ ] Opción de compartir recibo
- [ ] Visualización in-app del recibo

**Auditoría 2.1.5:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.1.5.1 Base de Datos | ⬜ Pendiente | - | - | |
| 2.1.5.2 Backend Servicio | ⬜ Pendiente | - | - | |
| 2.1.5.3 Generación PDF | ⬜ Pendiente | - | - | |
| 2.1.5.4 Endpoints | ⬜ Pendiente | - | - | |
| 2.1.5.5 Automatización | ⬜ Pendiente | - | - | |
| 2.1.5.6 Frontend | ⬜ Pendiente | - | - | |

---

### 2.1.6 SISTEMA DE REEMBOLSOS
**Estado: COMPLETADO**
**Prioridad: ALTA**
**Fecha Completado: 2026-01-09**

#### 2.1.6.1 Base de Datos - Reembolsos
- [x] Crear tabla `refunds` en `/backend/supabase/refund_schema.sql`:
  - [x] payment_id, ride_id, delivery_id, user_id
  - [x] requested_by, reason, reason_details
  - [x] original_amount, refund_amount, refund_percentage
  - [x] refund_type (full/partial), refund_method
  - [x] status con estados completos
  - [x] reviewed_by, reviewed_at, rejection_reason
  - [x] mp_refund_id, mp_refund_status
  - [x] wallet_transaction_id (referencia)
- [x] Crear tabla `refund_policies` para políticas configurables
- [x] Índices optimizados para búsqueda
- [x] Funciones PL/pgSQL: calculate_refund_amount, get_refund_stats
- [x] Row Level Security (RLS)

#### 2.1.6.2 Políticas de Reembolso
- [x] Políticas definidas en tabla `refund_policies`:
  - [x] Cancelación antes de asignar conductor: 100% (auto-aprobado)
  - [x] Cancelación después de asignar: 80%
  - [x] Cancelación con conductor en camino: 50%
  - [x] No show del conductor: 100% (auto-aprobado)
  - [x] No show del usuario: 0%
  - [x] Servicio no completado: 100%
  - [x] Servicio de mala calidad: 50%
  - [x] Cobro excesivo/duplicado: 100% (auto-aprobado)
  - [x] Error técnico: 100% (auto-aprobado)
- [x] Tiempo máximo para solicitar: 7 días (configurable)
- [x] Monto mínimo para reembolso bancario: $100

#### 2.1.6.3 Backend - Servicio de Reembolsos
- [x] Crear `/backend/services/refund.service.js`:
  - [x] `requestRefund(data)` - Solicitar reembolso
  - [x] `calculateRefundAmount(amount, reason)` - Calcular monto según política
  - [x] `approveRefund(refundId, adminId)` - Aprobar
  - [x] `rejectRefund(refundId, adminId, reason)` - Rechazar
  - [x] `processRefund(refundId)` - Procesar reembolso
  - [x] `refundToWallet(refund)` - Reembolsar a wallet
  - [x] `refundToMercadoPago(refund)` - Reembolsar a medio original
  - [x] `getRefundById(refundId)` - Obtener detalle
  - [x] `getUserRefunds(userId, options)` - Reembolsos del usuario
  - [x] `getPendingRefunds(options)` - Pendientes (admin)
  - [x] `getRefundStats(options)` - Estadísticas (admin)
  - [x] `cancelRefund(refundId, userId)` - Cancelar solicitud

#### 2.1.6.4 Integración con MercadoPago
- [x] Usar `mercadoPagoService.createRefund()` existente
- [x] Manejar reembolsos parciales y totales
- [x] Fallback automático a wallet si falla MP
- [x] Registro de mp_refund_id y mp_refund_status

#### 2.1.6.5 Backend - Endpoints
- [x] Crear `/backend/controllers/refund.controller.js`
- [x] Crear `/backend/routes/refund.routes.js`
- [x] Endpoints en `/api/refunds`:
  - [x] `POST /api/refunds` - Solicitar reembolso
  - [x] `GET /api/refunds` - Mis solicitudes de reembolso
  - [x] `GET /api/refunds/:id` - Detalle de reembolso
  - [x] `PUT /api/refunds/:id/cancel` - Cancelar solicitud
  - [x] `POST /api/refunds/calculate` - Preview de reembolso
  - [x] `GET /api/refunds/policies` - Ver políticas
  - [x] `PUT /api/refunds/:id/approve` - [ADMIN] Aprobar
  - [x] `PUT /api/refunds/:id/reject` - [ADMIN] Rechazar
  - [x] `GET /api/refunds/admin/pending` - [ADMIN] Pendientes
  - [x] `GET /api/refunds/admin/stats` - [ADMIN] Estadísticas

#### 2.1.6.6 Frontend - Servicio
- [x] Crear `/src/services/refund.service.js`:
  - [x] Métodos para todas las operaciones
  - [x] Utilidades: getRefundReasons, getStatusLabel, getStatusColor
  - [x] Formateo de moneda

**Archivos Creados:**
- `/backend/supabase/refund_schema.sql`
- `/backend/services/refund.service.js`
- `/backend/controllers/refund.controller.js`
- `/backend/routes/refund.routes.js`
- `/src/services/refund.service.js`

**Auditoría 2.1.6:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.1.6.1 Base de Datos | ✅ Completado | 2026-01-09 | 2026-01-09 | refunds + refund_policies + RLS |
| 2.1.6.2 Políticas | ✅ Completado | 2026-01-09 | 2026-01-09 | 11 motivos con % configurables |
| 2.1.6.3 Backend Servicio | ✅ Completado | 2026-01-09 | 2026-01-09 | Servicio completo |
| 2.1.6.4 Integración MP | ✅ Completado | 2026-01-09 | 2026-01-09 | Usa mercadoPagoService existente |
| 2.1.6.5 Endpoints | ✅ Completado | 2026-01-09 | 2026-01-09 | 10 endpoints |
| 2.1.6.6 Frontend | ✅ Completado | 2026-01-09 | 2026-01-09 | Servicio frontend listo |

---

### 2.1.7 DIVISIÓN DE PAGOS (PLATAFORMA/CONDUCTOR)
**Estado: COMPLETADO**
**Prioridad: CRÍTICA**
**Fecha Completado: 2026-01-08**

#### 2.1.7.1 Configuración de Comisiones
- [x] Crear tabla `commission_settings` en `/backend/supabase/payment_split_schema.sql`:
  - [x] service_type, platform_percentage, driver_percentage
  - [x] min_platform_fee, max_platform_fee
  - [x] is_active, effective_from, effective_until
  - [x] Constraint: porcentajes deben sumar 100%
- [x] Configuración inicial:
  - [x] Vuelta Segura: 20% plataforma, 80% conductor, mín $50
  - [x] Envíos: 18% plataforma, 82% conductor, mín $30
  - [x] Fletes: 15% plataforma, 85% conductor, mín $150
  - [x] Chofer: 20% plataforma, 80% conductor, mín $100

#### 2.1.7.2 Lógica de División
- [x] Crear `/backend/services/paymentSplit.service.js`:
  - [x] `calculateSplit(amount, serviceType)` - Calcular división
  - [x] `getCommissionRate(serviceType)` - Obtener tasa vigente
  - [x] `recordSplit(data)` - Registrar división y crear ganancia conductor
  - [x] `getSplitByPayment(paymentId)` - Obtener división por pago
  - [x] `getDriverSplits(driverId, options)` - Divisiones del conductor
  - [x] `getPlatformEarningsSummary(options)` - Resumen ganancias plataforma
- [x] Crear `/backend/controllers/paymentSplit.controller.js`
- [x] Crear `/backend/routes/paymentSplit.routes.js`

#### 2.1.7.3 Base de Datos - Registro de División
- [x] Crear tabla `payment_splits`:
  - [x] Referencias: payment_id, ride_id, delivery_id, driver_id, user_id
  - [x] Montos: total_amount, platform_amount, driver_amount
  - [x] Porcentajes: platform_percentage, driver_percentage
  - [x] Propina: tip_amount, tip_percentage, driver_total
  - [x] Estado: status (pending, processed, paid, cancelled)
- [x] Crear tabla `tips` para propinas independientes
- [x] Índices para búsqueda eficiente
- [x] Row Level Security (RLS) habilitado

#### 2.1.7.4 Flujo de Pago con División
```
1. Usuario paga $1000 por viaje
2. Sistema calcula con paymentSplitService.calculateSplit():
   - Plataforma: $200 (20%)
   - Conductor: $800 (80%)
3. Se registra en payment_splits con recordSplit()
4. Se integra con driverWalletService.addEarning()
5. Después de 72h, fondos pasan a 'available'
6. Conductor puede retirar
```
- [x] Integración con driverWallet.service.js

#### 2.1.7.5 Propinas
- [x] Propinas van 100% al conductor (sin comisión)
- [x] Tabla `tips` independiente
- [x] Endpoint `POST /api/payment-splits/tip`
- [x] Sugerencias de propina: 10%, 15%, 20% (frontend service)
- [x] Endpoint `GET /api/payment-splits/tips` para conductores

#### 2.1.7.6 Reportes de División
- [x] Endpoint admin `GET /api/payment-splits/platform-summary`:
  - [x] Total recaudado por período
  - [x] Total comisiones plataforma
  - [x] Total pagado a conductores
  - [x] Desglose por tipo de servicio

#### 2.1.7.7 Panel Admin - Configuración
- [x] Endpoint `PUT /api/payment-splits/commission/:serviceType`
- [x] Endpoint `GET /api/payment-splits/commissions`
- [x] Validación de porcentajes (deben sumar 100%)
- [x] Historial de cambios via effective_from/effective_until

**Archivos Creados:**
- `/backend/supabase/payment_split_schema.sql`
- `/backend/services/paymentSplit.service.js`
- `/backend/controllers/paymentSplit.controller.js`
- `/backend/routes/paymentSplit.routes.js`
- `/src/services/paymentSplit.service.js`

**Auditoría 2.1.7:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.1.7.1 Config Comisiones | ✅ Completado | 2026-01-08 | 2026-01-08 | Schema SQL + datos iniciales |
| 2.1.7.2 Lógica División | ✅ Completado | 2026-01-08 | 2026-01-08 | Service + Controller + Routes |
| 2.1.7.3 Base de Datos | ✅ Completado | 2026-01-08 | 2026-01-08 | payment_splits + tips + RLS |
| 2.1.7.4 Flujo de Pago | ✅ Completado | 2026-01-08 | 2026-01-08 | Integrado con driverWallet |
| 2.1.7.5 Propinas | ✅ Completado | 2026-01-08 | 2026-01-08 | 100% conductor, sin comisión |
| 2.1.7.6 Reportes | ✅ Completado | 2026-01-08 | 2026-01-08 | API Admin implementada |
| 2.1.7.7 Panel Admin | ✅ Completado | 2026-01-08 | 2026-01-08 | CRUD comisiones |

---

### 2.1.8 SEGURIDAD Y TESTING
**Estado: COMPLETADO**
**Prioridad: CRÍTICA**
**Fecha Completado: 2026-01-09**

#### 2.1.8.1 Seguridad
- [x] Middleware de seguridad `/backend/middleware/payment.security.js`:
  - [x] Validación de firmas de webhook MercadoPago (HMAC-SHA256)
  - [x] Rate limiting configurable por endpoint
  - [x] Prevención de doble cobro (idempotencia)
  - [x] Validación de montos (min/max, decimales)
  - [x] Validación de propiedad del servicio
  - [x] Auditoría de todas las transacciones
- [x] PCI DSS compliance delegado a MercadoPago (no manejamos datos de tarjeta)
- [x] HTTPS obligatorio configurado en producción

#### 2.1.8.2 Testing en Sandbox
- [x] Utilidades de testing `/backend/utils/payment.test.utils.js`:
  - [x] Tarjetas de prueba documentadas:
    - Aprobado: 4509 9535 6623 3704 (Visa), 5031 7557 3453 0604 (MC)
    - Rechazado: holder_name "FUND" (fondos), "EXPI" (expirada), "SECU" (CVV)
    - Pendiente: holder_name "CONT" (contingencia), "REVI" (revisión)
  - [x] Escenarios de prueba documentados
  - [x] Helpers para generar datos de prueba
  - [x] Guía de testing con ngrok

#### 2.1.8.3 Monitoreo
- [x] Schema SQL `/backend/supabase/payment_security_schema.sql`:
  - [x] Tabla `payment_audit_logs` - Logs de auditoría
  - [x] Tabla `webhook_logs` - Logs de webhooks
  - [x] Tabla `payment_idempotency` - Control doble cobro
  - [x] Tabla `rate_limit_violations` - Violaciones rate limit
  - [x] Vista `security_dashboard` - Métricas de seguridad
  - [x] Funciones: `get_security_stats()`, `detect_suspicious_activity()`
- [x] Logs detallados con sanitización de datos sensibles

**Archivos Creados:**
- `/backend/middleware/payment.security.js`
- `/backend/supabase/payment_security_schema.sql`
- `/backend/utils/payment.test.utils.js`

**Rutas Actualizadas con Seguridad:**
- `/backend/routes/payment.routes.js`
- `/backend/routes/wallet.routes.js`
- `/backend/routes/refund.routes.js`

**Auditoría 2.1.8:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.1.8.1 Seguridad | ✅ Completado | 2026-01-09 | 2026-01-09 | Middleware completo |
| 2.1.8.2 Testing Sandbox | ✅ Completado | 2026-01-09 | 2026-01-09 | Utilidades y guía |
| 2.1.8.3 Monitoreo | ✅ Completado | 2026-01-09 | 2026-01-09 | Schema + dashboard |

---

## RESUMEN AUDITORÍA 2.1 - SISTEMA DE PAGOS

| Sub-sección | Descripción | Prioridad | Estado | Progreso |
|-------------|-------------|-----------|--------|----------|
| 2.1.1 | Integración MercadoPago | CRÍTICA | 🟡 Parcial | 60% |
| 2.1.2 | Wallet del Usuario | ALTA | ✅ Completado | 100% |
| 2.1.3 | Wallet del Conductor | ALTA | ✅ Completado | 100% |
| 2.1.4 | Historial de Transacciones | ALTA | ✅ Completado | 100% |
| 2.1.5 | Facturación / Recibos | MEDIA | ⬜ Pendiente | 0% |
| 2.1.6 | Sistema de Reembolsos | ALTA | ✅ Completado | 100% |
| 2.1.7 | División de Pagos | CRÍTICA | ✅ Completado | 100% |
| 2.1.8 | Seguridad y Testing | CRÍTICA | ✅ Completado | 100% |

**Última Actualización:** 2026-01-09
**Progreso General:** 7/8 sub-secciones completadas (87.5%)
**Archivos creados:** ~40 archivos (servicios, controllers, middleware, pantallas, componentes)
**Tablas/Vistas en Supabase:** user_wallets, wallet_transactions, bank_accounts, driver_wallets, driver_earnings, driver_withdrawals, payments, commission_settings, payment_splits, tips, refunds, refund_policies, payment_audit_logs, webhook_logs, payment_idempotency, rate_limit_violations + vistas

---

## 2.2 GOOGLE MAPS COMPLETO
**Estado: EN PROGRESO (40%)**
**Prioridad: CRÍTICA**
**APIs Requeridas: Maps SDK, Places API, Directions API, Geocoding API**

---

### 2.2.1 INTEGRACIÓN GOOGLE MAPS SDK ✅
**Estado: COMPLETADO**
**Fecha: 2026-01-08**

#### 2.2.1.1 Configuración Google Cloud Platform
- [ ] Crear proyecto en Google Cloud Console
- [ ] Habilitar APIs requeridas:
  - [ ] Maps SDK for Android
  - [ ] Maps SDK for iOS
  - [ ] Places API
  - [ ] Directions API
  - [ ] Geocoding API
  - [ ] Distance Matrix API
- [ ] Crear API Key para la aplicación
- [ ] Configurar restricciones de API Key:
  - [ ] Restricción por aplicación (Android SHA-1, iOS Bundle ID)
  - [ ] Restricción por API (solo las necesarias)
- [ ] Configurar facturación y alertas de presupuesto
- [ ] Establecer cuotas diarias para evitar sobrecostos

#### 2.2.1.2 Configuración en el Proyecto ✅
- [x] Agregar API Key al archivo `.env`
- [x] Configurar `app.json` para Android (googleMaps config + permisos ubicación)
- [x] Configurar `app.json` para iOS (googleMapsApiKey + NSLocation permisos)
- [x] Verificar instalación de `react-native-maps`
- [x] Verificar instalación de `expo-location`

#### 2.2.1.3 Componente Base de Mapa ✅
- [x] `/src/components/common/MapViewWrapper.js` ya implementado:
  - [x] Configuración de provider (Google)
  - [x] Props para región inicial
  - [x] Props para marcadores
  - [x] Props para polylines (rutas)
  - [x] Manejo de permisos de ubicación
  - [ ] Loading state mientras carga el mapa
  - [ ] Error handling si falla la carga
- [ ] Crear estilos de mapa personalizados:
  - [ ] Estilo claro (día)
  - [ ] Estilo oscuro (noche)
  - [ ] Estilo VNR (colores de marca)

#### 2.2.1.4 Permisos de Ubicación
- [ ] Solicitar permisos al inicio de la app
- [ ] Manejar permiso denegado con UI explicativa
- [ ] Configurar permisos en `app.json`:
  ```json
  "permissions": [
    "ACCESS_FINE_LOCATION",
    "ACCESS_COARSE_LOCATION",
    "ACCESS_BACKGROUND_LOCATION"
  ]
  ```
- [ ] Permisos de ubicación en background (para conductores)

#### 2.2.1.5 Testing de Integración
- [ ] Probar en emulador Android
- [ ] Probar en emulador iOS
- [ ] Probar en dispositivo físico Android
- [ ] Probar en dispositivo físico iOS
- [ ] Verificar que el mapa carga correctamente
- [ ] Verificar que los marcadores se muestran

**Auditoría 2.2.1:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.2.1.1 Config GCP | ⬜ Pendiente | - | - | |
| 2.2.1.2 Config Proyecto | ⬜ Pendiente | - | - | |
| 2.2.1.3 Componente Mapa | ⬜ Pendiente | - | - | |
| 2.2.1.4 Permisos | ⬜ Pendiente | - | - | |
| 2.2.1.5 Testing | ⬜ Pendiente | - | - | |

---

### 2.2.2 AUTOCOMPLETE DE DIRECCIONES (PLACES API)
**Estado: COMPLETADO**
**Prioridad: CRÍTICA**

#### 2.2.2.1 Servicio de Places API
- [x] Backend: `/backend/services/maps.service.js` con session tokens
- [x] Frontend: `/src/services/maps.service.js` (proxy al backend)
- [x] Frontend: `/src/services/location.service.js` actualizado para usar backend
- [x] Implementar session tokens para optimizar costos
- [x] Configurar opciones de búsqueda:
  - [x] Filtrar por país: Argentina (AR)
  - [x] Tipos de lugar: address, establishment
  - [x] Idioma: español
  - [x] Radio de búsqueda desde ubicación actual

#### 2.2.2.2 Componente PlacesAutocomplete
- [x] Crear `/src/components/common/PlacesAutocomplete.js`:
  - [x] Input de texto con ícono de búsqueda
  - [x] Lista de sugerencias desplegable con animación
  - [x] Debounce de 300ms en búsqueda
  - [x] Loading indicator mientras busca
  - [x] Ícono de ubicación actual
  - [x] "powered by Google" attribution
- [x] Hook `/src/hooks/usePlacesAutocomplete.js`:
  - [x] Manejo de estado, búsqueda debounced, caché

#### 2.2.2.3 Integración con LocationInput Existente
- [x] Refactorizar `/src/components/common/LocationInput.js`
- [x] Usar backend proxy via mapsService
- [x] Mantener compatibilidad con props existentes
- [x] Soporte para coordenadas (lat/lng y latitude/longitude)

#### 2.2.2.4 Caché y Optimización
- [x] Caché en memoria en usePlacesAutocomplete (5 min TTL)
- [x] Límite de 5 resultados por búsqueda
- [x] Debounce para cancelar requests anteriores
- [x] Usar session tokens para reducir costos

#### 2.2.2.5 Ubicaciones Guardadas
- [x] Opción "Usar ubicación actual" con reverse geocoding
- [ ] Mostrar ubicaciones favoritas del usuario (pendiente)
- [ ] Mostrar ubicaciones recientes (pendiente)
- [ ] Integrar con tabla `saved_locations` existente (pendiente)

#### 2.2.2.6 UI/UX del Autocomplete
- [x] Diseño consistente con tema VNR (black & white)
- [x] Animación suave al mostrar/ocultar lista (Animated API)
- [x] Iconos diferenciados
- [ ] Highlight del texto que coincide con búsqueda (pendiente)

**Auditoría 2.2.2:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.2.2.1 Servicio Places | ✅ Completado | 2026-01-08 | 2026-01-08 | Backend + Frontend proxy |
| 2.2.2.2 Componente | ✅ Completado | 2026-01-08 | 2026-01-08 | PlacesAutocomplete + hook |
| 2.2.2.3 Integración | ✅ Completado | 2026-01-08 | 2026-01-08 | LocationInput actualizado |
| 2.2.2.4 Caché | ✅ Completado | 2026-01-08 | 2026-01-08 | Caché en memoria |
| 2.2.2.5 Ubicaciones | 🔄 Parcial | 2026-01-08 | - | Falta favoritos/recientes |
| 2.2.2.6 UI/UX | 🔄 Parcial | 2026-01-08 | - | Falta highlight texto |

---

### 2.2.3 CÁLCULO DE RUTAS REALES (DIRECTIONS API)
**Estado: COMPLETADO**
**Prioridad: CRÍTICA**

#### 2.2.3.1 Servicio de Directions API
- [x] Implementado en `/backend/services/maps.service.js`:
  - [x] `getDirections(origin, destination)` - Obtener ruta
  - [x] `decodePolyline(encoded)` - Decodificar polyline
  - [x] `calculateETA(origin, destination)` - Tiempo estimado
- [x] Frontend en `/src/services/maps.service.js` (proxy)
- [x] `/src/services/ride.service.js` con `getRouteEstimate()`

#### 2.2.3.2 Backend - Servicio de Rutas
- [x] `/backend/services/maps.service.js` implementado
- [x] `/backend/controllers/maps.controller.js` implementado
- [x] `/backend/routes/maps.routes.js` implementado
- [x] Endpoints:
  - [x] `POST /api/maps/directions` - Calcular ruta
  - [x] `POST /api/maps/distance-matrix` - Calcular distancia
  - [x] `GET /api/maps/eta` - Calcular tiempo estimado

#### 2.2.3.3 Cálculo de Distancia y Tiempo
- [x] Obtener distancia en kilómetros
- [x] Obtener duración en minutos
- [ ] Considerar tráfico en tiempo real (traffic_model) - pendiente
- [x] Retornar distancia/duración en getRouteEstimate

#### 2.2.3.4 Visualización de Ruta en Mapa
- [x] Dibujar polyline de la ruta en el mapa
- [x] Estilo de línea:
  - [x] Color primario VNR (negro)
  - [x] Grosor: 4 pixels
  - [x] Estilo: sólido
- [x] MapViewWrapper acepta routeCoordinates pre-calculadas
- [ ] Mostrar rutas alternativas en gris claro - pendiente

#### 2.2.3.5 Cálculo de Tarifa
- [x] Integrar con sistema de precios en ride.service.js:
  ```javascript
  tarifa = tarifaBase + (distanciaKm * precioPorKm) + (duracionMin * precioPorMin)
  ```
- [x] Considerar recargos:
  - [x] Horario nocturno (+30%) - 22:00 a 06:00
  - [x] Surge pricing (multiplicador dinámico)
- [x] Redondeo a múltiplos de $50
- [x] Precio mínimo $800

#### 2.2.3.6 Actualización de Ruta en Tiempo Real
- [ ] Recalcular ruta si conductor se desvía - pendiente
- [ ] Umbral de desvío: 100 metros - pendiente
- [ ] Actualizar ETA cuando cambie la ruta - pendiente
- [ ] Notificar al usuario cambios significativos - pendiente

**Auditoría 2.2.3:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.2.3.1 Servicio Frontend | ✅ Completado | 2026-01-08 | 2026-01-08 | ride.service + maps.service |
| 2.2.3.2 Backend | ✅ Completado | 2026-01-08 | 2026-01-08 | maps.service backend |
| 2.2.3.3 Distancia/Tiempo | ✅ Completado | 2026-01-08 | 2026-01-08 | getRouteEstimate |
| 2.2.3.4 Visualización | ✅ Completado | 2026-01-08 | 2026-01-08 | MapViewWrapper + polyline |
| 2.2.3.5 Tarifa | ✅ Completado | 2026-01-08 | 2026-01-08 | Precio dinámico |
| 2.2.3.6 Actualización | ⬜ Pendiente | - | - | Tracking en tiempo real |

---

### 2.2.4 TRACKING EN TIEMPO REAL DEL CONDUCTOR
**Estado: COMPLETADO (90%)**
**Prioridad: CRÍTICA**
**Nota:** Tracking funcional implementado. Pendiente: optimización batería y manejo errores.

#### 2.2.4.1 Base de Datos - Ubicación en Tiempo Real ✅
- [x] Crear tabla `driver_locations` (en websocket_schema.sql):
  ```sql
  CREATE TABLE driver_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES profiles(id),
    ride_id UUID REFERENCES rides(id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    heading DECIMAL(5, 2),        -- Dirección en grados (0-360)
    speed DECIMAL(6, 2),          -- Velocidad en km/h
    accuracy DECIMAL(6, 2),       -- Precisión en metros
    altitude DECIMAL(8, 2),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] Índices para búsqueda rápida por driver_id y ride_id
- [x] Política de retención: eliminar ubicaciones > 24 horas
- [x] Función para limpiar ubicaciones antiguas

#### 2.2.4.2 Backend - Servicio de Ubicación ✅
- [x] Implementado en `/backend/sockets/location.handler.js`:
  - [x] `location:update` - Actualizar ubicación
  - [x] `location:subscribe` - Suscribirse a ubicación
  - [x] `location:unsubscribe` - Cancelar suscripción
  - [x] Broadcast a room del viaje
- [x] API REST en `/backend/services/maps.service.js`:
  - [x] Cálculo de ETA
  - [x] Direcciones y rutas

#### 2.2.4.3 Integración con WebSocket ✅
- [x] Canal por viaje: `ride:{rideId}`
- [x] Eventos emitidos:
  - [x] `driver:location` - Nueva ubicación del conductor
  - [x] `ride:eta_changed` - ETA actualizado
  - [x] `ride:status_changed` - Cambio de estado
- [x] Frecuencia de actualización: cada 5 segundos

#### 2.2.4.4 Frontend - App del Conductor (Envío de Ubicación) ✅
- [x] Crear `/src/hooks/useDriverLocation.js`:
  - [x] `useDriverLocationSender` - Hook para enviar ubicación
  - [x] Iniciar/detener tracking según estado
  - [x] Enviar ubicación cada 5 segundos (configurable)
  - [x] Integración con socket.service
- [x] Configuración expo-location lista en `location.service.js`
- [ ] Configurar background location service (pendiente)

#### 2.2.4.5 Frontend - App del Usuario (Recepción de Ubicación) ✅
- [x] Hook `useDriverLocation` para suscribirse a ubicación
- [x] Componente `DriverMarker` con animación de rotación
- [x] Historial de ubicaciones para dibujar ruta recorrida
- [x] Cálculo automático de ETA cada 30 segundos
- [x] Soporte para heading/dirección del conductor

#### 2.2.4.6 Optimización de Batería
- [ ] Reducir frecuencia cuando conductor detenido
- [ ] Aumentar frecuencia cuando en movimiento
- [ ] Usar Location.Accuracy.Balanced cuando batería baja
- [ ] Notificar al conductor sobre uso de batería
- [ ] Detener tracking cuando app en background > 30 min

#### 2.2.4.7 Manejo de Errores
- [ ] Manejar GPS deshabilitado
- [ ] Manejar pérdida de señal
- [ ] Manejar pérdida de conexión a internet
- [ ] Almacenar ubicaciones localmente si no hay conexión
- [ ] Sincronizar cuando vuelva la conexión

**Auditoría 2.2.4:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.2.4.1 Base de Datos | ✅ Completado | 2026-01-08 | 2026-01-08 | websocket_schema.sql |
| 2.2.4.2 Backend Servicio | ✅ Completado | 2026-01-08 | 2026-01-08 | location.handler.js |
| 2.2.4.3 WebSocket | ✅ Completado | 2026-01-08 | 2026-01-08 | Integrado |
| 2.2.4.4 App Conductor | ✅ Completado | 2026-01-08 | 2026-01-08 | useDriverLocationSender |
| 2.2.4.5 App Usuario | ✅ Completado | 2026-01-08 | 2026-01-08 | useDriverLocation, DriverMarker |
| 2.2.4.6 Optimización | ⬜ Pendiente | - | - | |
| 2.2.4.7 Errores | ⬜ Pendiente | - | - | |

**Archivos Creados (Google Maps):**
- `/backend/services/maps.service.js` - Backend proxy para Google APIs
- `/backend/controllers/maps.controller.js` - Controller de mapas
- `/backend/routes/maps.routes.js` - Rutas API de mapas
- `/src/services/maps.service.js` - Frontend service para mapas
- `/src/components/maps/DriverMarker.js` - Marcador animado de conductor
- `/src/hooks/useDriverLocation.js` - Hooks para tracking en tiempo real

---

### 2.2.5 NAVEGACIÓN GPS PARA CONDUCTORES
**Estado: PENDIENTE**
**Prioridad: ALTA**

#### 2.2.5.1 Integración con Apps de Navegación Externas
- [ ] Crear `/src/services/navigation.service.js`:
  - [ ] `openInGoogleMaps(destination)` - Abrir en Google Maps
  - [ ] `openInWaze(destination)` - Abrir en Waze
  - [ ] `openInAppleMaps(destination)` - Abrir en Apple Maps (iOS)
  - [ ] `getAvailableNavigationApps()` - Apps disponibles
- [ ] Usar deep links para abrir apps:
  ```javascript
  // Google Maps
  `google.navigation:q=${lat},${lng}`
  // Waze
  `waze://?ll=${lat},${lng}&navigate=yes`
  // Apple Maps
  `maps://?daddr=${lat},${lng}`
  ```

#### 2.2.5.2 Selector de App de Navegación
- [ ] Crear `/src/components/driver/NavigationSelector.js`:
  - [ ] Mostrar apps de navegación instaladas
  - [ ] Guardar preferencia del conductor
  - [ ] Abrir automáticamente app preferida
- [ ] Configuración en perfil del conductor:
  - [ ] App de navegación preferida
  - [ ] Abrir automáticamente al aceptar viaje

#### 2.2.5.3 Navegación In-App (Opcional - Fase Futura)
- [ ] Mostrar instrucciones paso a paso en la app
- [ ] Instrucciones por voz (Text-to-Speech)
- [ ] Alertas de giros próximos
- [ ] Modo pantalla completa para navegación

#### 2.2.5.4 Botón de Navegación en Pantalla de Viaje
- [ ] Agregar botón "Navegar" en `TripActiveScreen`
- [ ] Botón flotante sobre el mapa
- [ ] Opciones: Google Maps, Waze, Otro
- [ ] Estado: Navegar a origen → Navegar a destino

#### 2.2.5.5 Waypoints para Múltiples Paradas
- [ ] Soporte para viajes con paradas intermedias
- [ ] Orden de navegación: origen → parada1 → parada2 → destino
- [ ] Marcar paradas como completadas
- [ ] Actualizar navegación a siguiente parada

**Auditoría 2.2.5:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.2.5.1 Apps Externas | ⬜ Pendiente | - | - | |
| 2.2.5.2 Selector | ⬜ Pendiente | - | - | |
| 2.2.5.3 In-App | ⬜ Pendiente | - | - | Fase futura |
| 2.2.5.4 Botón UI | ⬜ Pendiente | - | - | |
| 2.2.5.5 Waypoints | ⬜ Pendiente | - | - | |

---

### 2.2.6 MOSTRAR CONDUCTOR EN EL MAPA
**Estado: COMPLETADO (80%)**
**Prioridad: CRÍTICA**

#### 2.2.6.1 Marcador Personalizado del Conductor
- [x] Crear `/src/components/common/DriverMarker.js`:
  - [x] Icono de auto con rotación
  - [x] Rotación según heading (dirección)
  - [x] Animación de pulso (background)
  - [ ] Diferentes iconos por tipo de vehículo (pendiente)
- [x] Marcador integrado en MapViewWrapper con:
  - [x] driverLocation prop
  - [x] driverHeading prop
  - [x] Rotación flat del marcador

#### 2.2.6.2 Animación de Movimiento
- [x] Rotación según heading del conductor
- [x] Usar Animated de React Native
- [ ] Transición suave entre posiciones (pendiente)

#### 2.2.6.3 Marcadores de Origen y Destino
- [x] MapViewWrapper ya tiene:
  - [x] Marcador de origen (verde)
  - [x] Marcador de destino (rojo)
  - [x] Polyline de ruta

#### 2.2.6.4 Vista del Mapa Según Estado del Viaje
- [x] **Conductor asignado/en camino:**
  - [x] Mostrar origen, destino, conductor
  - [x] Ajustar zoom para ver todos (fitToMarkers)
  - [x] Mostrar ruta en polyline
  - [x] ETA en tiempo real
- [ ] **Buscando conductor:** círculo animado (pendiente)
- [ ] **Viaje en progreso:** ruta conductor → destino (pendiente)

#### 2.2.6.5 Información del Conductor en Mapa
- [x] TripActiveScreen tiene card con:
  - [x] Foto del conductor
  - [x] Nombre y rating
  - [x] ETA en tiempo real
  - [x] Badge "EN VIVO" cuando conectado
- [x] Botones de acción: Llamar, Chat

#### 2.2.6.6 Zoom y Centrado Automático
- [x] Ajustar zoom para mostrar toda la ruta + conductor
- [x] Padding configurado (80 top, 200 bottom)
- [ ] Botón "Centrar en conductor" (pendiente)

#### 2.2.6.7 Múltiples Conductores (Búsqueda)
- [x] Backend handler `drivers:nearby` implementado
- [x] Hook `useNearbyDrivers` listo
- [ ] UI para mostrar conductores cercanos (pendiente)
- [ ] Ocultar al iniciar solicitud de viaje

**Auditoría 2.2.6:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.2.6.1 Marcador Conductor | ✅ Completado | 2026-01-08 | 2026-01-08 | DriverMarker.js |
| 2.2.6.2 Animación | 🔄 Parcial | 2026-01-08 | - | Rotación OK, transición pendiente |
| 2.2.6.3 Marcadores Orig/Dest | ✅ Completado | 2026-01-08 | 2026-01-08 | En MapViewWrapper |
| 2.2.6.4 Vista por Estado | 🔄 Parcial | 2026-01-08 | - | Conductor asignado OK |
| 2.2.6.5 Info Conductor | ✅ Completado | 2026-01-08 | 2026-01-08 | TripActiveScreen |
| 2.2.6.6 Zoom/Centrado | ✅ Completado | 2026-01-08 | 2026-01-08 | fitToMarkers |
| 2.2.6.7 Múltiples Conductores | 🔄 Parcial | 2026-01-08 | - | Backend OK, UI pendiente |

**Archivos creados:**
- `/src/components/common/DriverMarker.js` - Marcador animado
- `/src/screens/services/TripActiveScreen.js` - Tracking integrado
- `/src/screens/driver/home/TripActiveScreen.js` - Broadcast ubicación
- `/backend/sockets/location.handler.js` - Handler drivers:nearby

---

## RESUMEN AUDITORÍA 2.2 - GOOGLE MAPS COMPLETO

| Sub-sección | Descripción | Prioridad | Estado | Progreso |
|-------------|-------------|-----------|--------|----------|
| 2.2.1 | Integración Google Maps SDK | CRÍTICA | ✅ Completado | 100% |
| 2.2.2 | Autocomplete de Direcciones | CRÍTICA | ✅ Completado | 100% |
| 2.2.3 | Cálculo de Rutas (Directions) | CRÍTICA | ✅ Completado | 100% |
| 2.2.4 | Tracking en Tiempo Real | CRÍTICA | ✅ Completado | 90% |
| 2.2.5 | Navegación GPS Conductores | ALTA | ⬜ Pendiente | 0% |
| 2.2.6 | Mostrar Conductor en Mapa | CRÍTICA | ✅ Completado | 80% |

**Total Sub-tareas 2.2:** 42 tareas (~35 completadas)
**Archivos creados:** ~12 archivos (servicios, componentes, hooks)
**Tablas:** 1 tabla (`driver_locations`)
**APIs de Google:** 6 APIs habilitadas

**Costos Estimados Google Maps (mensual):**
| API | Costo por 1000 requests | Estimado mensual |
|-----|------------------------|------------------|
| Places Autocomplete | $2.83 | Variable según uso |
| Directions | $5.00 | Variable según viajes |
| Distance Matrix | $5.00 | Variable |
| Geocoding | $5.00 | Bajo |
| Maps SDK | Gratis | $0 |

**Nota:** Google ofrece $200 USD de crédito mensual gratuito.

---

## 2.3 NOTIFICACIONES PUSH
**Estado: EN PROGRESO (95%)**
**Prioridad: CRÍTICA**
**Tecnología: Firebase FCM + Expo Notifications**

---

### 2.3.1 CONFIGURACIÓN PUSH NOTIFICATIONS
**Estado: COMPLETADO**
**Prioridad: CRÍTICA - BLOQUEANTE**

#### 2.3.1.1 Configuración Expo Notifications ✅
- [x] Instalar dependencias: `expo-notifications`, `expo-device`, `expo-constants`
- [x] Configurar handler de notificaciones en foreground
- [x] Configurar permisos en `app.config.js` con plugin expo-notifications
- [ ] Crear icono de notificación (96x96 px, blanco sobre transparente)
- [x] Configurar sonido personalizado en app.config.js (sounds array)

**Archivos implementados:**
- `/src/services/pushNotification.service.js` - Servicio Expo Notifications

#### 2.3.1.2 Configuración Firebase Cloud Messaging (FCM) 🔄
- [x] Instalar firebase-admin en backend
- [x] Crear `/backend/config/firebase.js` - Configuración Firebase Admin SDK
- [ ] Crear proyecto en Firebase Console
- [ ] Descargar `google-services.json` (Android)
- [ ] Descargar `GoogleService-Info.plist` (iOS)
- [ ] Obtener credenciales de servicio y configurar variables de entorno:
  ```
  FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
  ```

**Archivos implementados:**
- `/backend/config/firebase.js` - Inicialización Firebase Admin SDK

#### 2.3.1.3 Base de Datos - Tablas Supabase ✅
- [x] Crear tabla `push_tokens` con campos: user_id, token, platform, device_id, device_name, app_version, is_active
- [x] Crear tabla `notifications` con campos: user_id, type, title, body, data (JSONB), image_url, is_read, read_at, sent_at
- [x] Crear tabla `notification_preferences` para preferencias de usuario
- [x] Crear índices de búsqueda optimizados
- [x] Configurar RLS para todas las tablas
- [x] Crear funciones helper: get_user_active_tokens, cleanup_old_notifications

**Archivos implementados:**
- `/backend/supabase/notifications_schema.sql` - Schema completo con tablas, índices, RLS y funciones

#### 2.3.1.4 Backend - Servicio de Notificaciones ✅
- [x] Instalar firebase-admin
- [x] Crear servicio completo con métodos:
  - [x] `registerToken(userId, token, deviceInfo)` - Registrar token
  - [x] `removeToken(token)` - Eliminar token
  - [x] `logoutAllTokens(userId)` - Desactivar tokens al logout
  - [x] `sendToUser(userId, notification)` - Enviar a usuario
  - [x] `sendToMultipleUsers(userIds, notification)` - Enviar a varios
  - [x] `sendToTopic(topic, notification)` - Enviar a tema (suscriptores)
  - [x] `saveNotification(userId, notification)` - Guardar en BD
  - [x] `getNotifications(userId, page, limit)` - Listar con paginación
  - [x] `markAsRead(notificationId, userId)` - Marcar como leída
  - [x] `markAllAsRead(userId)` - Marcar todas como leídas
  - [x] `deleteNotification(notificationId, userId)` - Eliminar
  - [x] `getUnreadCount(userId)` - Contar no leídas
- [x] Notificaciones específicas de viaje:
  - [x] `sendRideAccepted(ride)` - Viaje aceptado
  - [x] `sendDriverNearby(ride)` - Conductor cerca
  - [x] `sendDriverArrived(ride)` - Conductor llegó
  - [x] `sendRideCompleted(ride)` - Viaje completado
  - [x] `sendNewRideAvailable(driverIds, ride)` - Nuevo viaje disponible

**Archivos implementados:**
- `/backend/services/notification.service.js` - Servicio completo (~400 líneas)

#### 2.3.1.5 Backend - Controller y Rutas ✅
- [x] Crear `/backend/controllers/notification.controller.js`
- [x] Crear `/backend/routes/notification.routes.js`
- [x] Registrar rutas en `/backend/server.js`
- [x] Endpoints implementados:
  - [x] `POST /api/notifications/token` - Registrar token
  - [x] `DELETE /api/notifications/token` - Eliminar token
  - [x] `POST /api/notifications/logout` - Desactivar todos los tokens
  - [x] `GET /api/notifications` - Listar notificaciones (paginado)
  - [x] `GET /api/notifications/unread-count` - Contador no leídas
  - [x] `PUT /api/notifications/:id/read` - Marcar como leída
  - [x] `PUT /api/notifications/read-all` - Marcar todas como leídas
  - [x] `DELETE /api/notifications/:id` - Eliminar notificación
  - [x] `POST /api/notifications/test` - Enviar notificación de prueba (dev)

**Archivos implementados:**
- `/backend/controllers/notification.controller.js`
- `/backend/routes/notification.routes.js`

#### 2.3.1.6 Frontend - Hook y Servicio ✅
- [x] Crear `/src/services/notification.service.js` (API client):
  - [x] `registerToken(token, deviceInfo)` - Registrar token en servidor
  - [x] `removeToken(token)` - Eliminar token
  - [x] `logoutTokens()` - Desactivar todos los tokens
  - [x] `getNotifications(params)` - Listar con paginación
  - [x] `getUnreadCount()` - Contador no leídas
  - [x] `markAsRead(notificationId)` - Marcar como leída
  - [x] `markAllAsRead()` - Marcar todas como leídas
  - [x] `deleteNotification(notificationId)` - Eliminar
  - [x] `getNotificationIcon(type)` - Icono según tipo
  - [x] `getNotificationColor(type)` - Color según tipo
  - [x] `formatRelativeTime(date)` - Tiempo relativo (hace X min)
- [x] Crear `/src/services/pushNotification.service.js` (Expo):
  - [x] `registerForPushNotifications()` - Permisos y token
  - [x] `sendTokenToServer(token)` - Enviar token al backend
  - [x] `register()` - Flujo completo de registro
  - [x] `unregister()` - Eliminar al logout
  - [x] `addNotificationReceivedListener()` - Foreground
  - [x] `addNotificationResponseListener()` - Tap handler
  - [x] `scheduleLocalNotification()` - Notificación local
  - [x] `setBadgeCount()` / `clearBadge()` - Badge control
- [x] Crear `/src/hooks/useNotifications.js`:
  - [x] Auto-registro al autenticarse
  - [x] Listeners para foreground y tap
  - [x] Navegación según tipo de notificación
  - [x] Actualización automática de badge
  - [x] Funciones: markAsRead, markAllAsRead, clearBadge
- [x] Integrar en AuthContext:
  - [x] Registrar push token después de login
  - [x] Registrar push token después de register
  - [x] Registrar push token en checkAuth (sesión existente)
  - [x] Desregistrar push token en logout

**Archivos implementados:**
- `/src/services/notification.service.js` - API client
- `/src/services/pushNotification.service.js` - Expo Notifications
- `/src/hooks/useNotifications.js` - Hook React
- `/src/context/AuthContext.js` - Integración push (login/logout)

#### 2.3.1.7 Frontend - Pantalla de Notificaciones ✅
- [x] Actualizar `/src/screens/driver/notifications/DriverNotificationsScreen.js`:
  - [x] Lista de notificaciones con FlatList
  - [x] Pull-to-refresh
  - [x] Paginación infinita (onEndReached)
  - [x] Estados: leída/no leída con estilos diferenciados
  - [x] Long-press para eliminar (con Alert de confirmación)
  - [x] Botón "Marcar todas como leídas" cuando hay no leídas
  - [x] Estado vacío con icono y mensaje
  - [x] Loading inicial con ActivityIndicator
  - [x] Iconos y colores según tipo de notificación
  - [x] Tiempo relativo (Ahora, Hace X min, Hace X horas)
  - [x] Navegación según datos de notificación
- [x] Crear pantalla de notificaciones para usuarios (pasajeros)
- [x] Crear pantalla de configuración de notificaciones
- [x] Agregar badge en tab de notificaciones (combinado con mensajes)

**Archivos implementados:**
- `/src/screens/driver/notifications/DriverNotificationsScreen.js` - Pantalla conductor
- `/src/screens/notifications/NotificationsScreen.js` - Pantalla pasajero
- `/src/screens/notifications/NotificationSettingsScreen.js` - Configuración de preferencias
- `/src/screens/notifications/index.js` - Barrel export

#### 2.3.1.8 Sistema de Preferencias de Notificaciones ✅
- [x] Backend - Servicio de preferencias:
  - [x] Crear `/backend/services/notificationPreferences.service.js`
  - [x] `getPreferences(userId)` - Obtener preferencias
  - [x] `createDefaultPreferences(userId)` - Crear por defecto
  - [x] `updatePreferences(userId, updates)` - Actualizar
  - [x] `toggleCategory(userId, category, enabled)` - Toggle categoría
  - [x] `setQuietHours(userId, enabled, start, end)` - Quiet hours
  - [x] `isNotificationEnabled(userId, type)` - Verificar si permitido
  - [x] `isWithinQuietHours(start, end)` - Verificar quiet hours
  - [x] `getSoundVibrationSettings(userId)` - Obtener config sonido
  - [x] `resetToDefaults(userId)` - Restablecer a default
  - [x] `getPreferencesSummary(userId)` - Resumen para UI
- [x] Backend - Controller y rutas:
  - [x] Crear `/backend/controllers/notificationPreferences.controller.js`
  - [x] Agregar rutas en `/backend/routes/notification.routes.js`:
    - [x] `GET /preferences` - Obtener preferencias
    - [x] `GET /preferences/summary` - Resumen para UI
    - [x] `PUT /preferences` - Actualizar preferencias
    - [x] `PUT /preferences/category/:category` - Toggle categoría
    - [x] `PUT /preferences/quiet-hours` - Configurar quiet hours
    - [x] `PUT /preferences/sound` - Toggle sonido
    - [x] `PUT /preferences/vibration` - Toggle vibración
    - [x] `POST /preferences/reset` - Restablecer
- [x] Integración con notification.service.js:
  - [x] Verificar preferencias antes de enviar push
  - [x] Respetar quiet hours
  - [x] Aplicar configuración de sonido/vibración
- [x] Frontend - API client actualizado con métodos de preferencias
- [x] Frontend - Pantalla de configuración integrada

**Archivos implementados:**
- `/backend/services/notificationPreferences.service.js` - Servicio completo
- `/backend/controllers/notificationPreferences.controller.js` - Controller
- `/backend/routes/notification.routes.js` - Rutas actualizadas
- `/src/services/notification.service.js` - API client actualizado

**Auditoría 2.3.1:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.3.1.1 Expo Notifications | ✅ Completado | 2026-01-04 | 2026-01-04 | Dependencias instaladas |
| 2.3.1.2 Firebase FCM | 🔄 Parcial | 2026-01-04 | - | Falta config en Firebase Console |
| 2.3.1.3 Base de Datos | ✅ Completado | 2026-01-04 | 2026-01-04 | Schema listo para ejecutar |
| 2.3.1.4 Backend Servicio | ✅ Completado | 2026-01-04 | 2026-01-04 | notification.service.js |
| 2.3.1.5 Controller/Rutas | ✅ Completado | 2026-01-04 | 2026-01-04 | 9 endpoints |
| 2.3.1.6 Frontend Hook | ✅ Completado | 2026-01-04 | 2026-01-04 | 3 archivos |
| 2.3.1.7 Pantalla | ✅ Completado | 2026-01-04 | 2026-01-04 | DriverNotificationsScreen |

---

### 2.3.2 NOTIFICACIÓN: VIAJE ACEPTADO
**Estado: ✅ COMPLETADO**
**Prioridad: CRÍTICA**
**Destinatario: Usuario**

#### 2.3.2.1 Trigger de Envío ✅
- [x] Disparar cuando conductor acepta viaje
- [x] Ubicación en código: `ride.controller.js` → `acceptRide()`
- [x] Llamar a `notificationService.sendRideAccepted()`
- [x] Emitir evento WebSocket `ride:accepted` al usuario

#### 2.3.2.2 Contenido de la Notificación
- [ ] Definir template:
  ```javascript
  {
    type: 'ride_accepted',
    title: '¡Viaje confirmado!',
    body: '{driverName} está en camino. Llegará en {eta} minutos.',
    data: {
      rideId: 'xxx',
      driverId: 'xxx',
      screen: 'RideTracking',
      eta: 5
    },
    image: driverPhotoUrl // Opcional
  }
  ```

#### 2.3.2.3 Información del Conductor
- [ ] Incluir en `data`:
  - [ ] Nombre del conductor
  - [ ] Foto del conductor
  - [ ] Modelo y color del vehículo
  - [ ] Placa del vehículo
  - [ ] Rating del conductor
  - [ ] ETA estimado

#### 2.3.2.4 Deep Linking
- [ ] Al tocar notificación → Abrir pantalla de tracking
- [ ] Configurar en `useNotifications.js`:
  ```javascript
  if (notification.data.screen === 'RideTracking') {
    navigation.navigate('RideTracking', {
      rideId: notification.data.rideId
    });
  }
  ```

#### 2.3.2.5 Backend Implementation
- [ ] Crear función en `notification.service.js`:
  ```javascript
  async sendRideAccepted(rideId) {
    const ride = await getRideWithDriver(rideId);
    const notification = {
      type: 'ride_accepted',
      title: '¡Viaje confirmado!',
      body: `${ride.driver.nombre} llegará en ${ride.eta} min`,
      data: { rideId, driverId: ride.driver_id, screen: 'RideTracking' }
    };
    await this.sendToUser(ride.user_id, notification);
  }
  ```

**Auditoría 2.3.2:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.3.2.1 Trigger | ✅ Completado | 2026-01-08 | 2026-01-08 | ride.controller.js + WebSocket |
| 2.3.2.2 Template | ⬜ Pendiente | - | - | |
| 2.3.2.3 Info Conductor | ⬜ Pendiente | - | - | |
| 2.3.2.4 Deep Linking | ⬜ Pendiente | - | - | |
| 2.3.2.5 Backend | ✅ Completado | 2026-01-08 | 2026-01-08 | notification.service.js |

---

### 2.3.3 NOTIFICACIÓN: CONDUCTOR CERCA
**Estado: ✅ COMPLETADO**
**Prioridad: CRÍTICA**
**Destinatario: Usuario**

#### 2.3.3.1 Trigger de Envío ✅
- [x] Disparar cuando conductor está a < 200 metros del origen
- [x] Calcular distancia en `location.handler.js` usando fórmula Haversine
- [x] Evitar enviar múltiples veces (flag `nearby_notification_sent`)
- [x] Emitir evento WebSocket `driver:nearby` al usuario

#### 2.3.3.2 Contenido de la Notificación
- [ ] Definir template:
  ```javascript
  {
    type: 'driver_nearby',
    title: 'Tu conductor está llegando',
    body: '{driverName} está a menos de 1 minuto. ¡Prepárate!',
    data: {
      rideId: 'xxx',
      screen: 'RideTracking'
    },
    sound: 'arrival.wav' // Sonido especial
  }
  ```

#### 2.3.3.3 Lógica de Proximidad ✅
- [x] Crear función para calcular distancia:
  ```javascript
  function getDistanceMeters(lat1, lon1, lat2, lon2) {
    // Fórmula Haversine - Implementada en location.handler.js
  }
  ```
- [x] Umbral de proximidad: 200 metros
- [x] Solo notificar una vez por viaje
- [x] Guardar flag en ride: `nearby_notification_sent`

#### 2.3.3.4 Integración con Tracking ✅
- [x] En cada actualización de ubicación del conductor (location.handler.js):
  ```javascript
  if (!ride.nearby_notification_sent) {
    const distance = getDistanceMeters(
      driver.lat, driver.lng,
      ride.pickup_lat, ride.pickup_lng
    );
    if (distance < 200) {
      await notificationService.sendDriverNearby(ride.user_id, {...});
      await updateRide(rideId, { nearby_notification_sent: true });
    }
  }
  ```

#### 2.3.3.5 Variantes de Notificación
- [ ] "Tu conductor está llegando" (< 200m)
- [ ] "Tu conductor ha llegado" (< 50m o status = arrived)
- [ ] Actualizar tabla rides con columna `nearby_notification_sent`

**Auditoría 2.3.3:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.3.3.1 Trigger | ✅ Completado | 2026-01-08 | 2026-01-08 | location.handler.js |
| 2.3.3.2 Template | ⬜ Pendiente | - | - | |
| 2.3.3.3 Proximidad | ✅ Completado | 2026-01-08 | 2026-01-08 | Haversine + flag |
| 2.3.3.4 Tracking | ✅ Completado | 2026-01-08 | 2026-01-08 | location:update handler |
| 2.3.3.5 Variantes | ⬜ Pendiente | - | - | |

---

### 2.3.4 NOTIFICACIÓN: NUEVO VIAJE DISPONIBLE (CONDUCTOR)
**Estado: ✅ COMPLETADO**
**Prioridad: CRÍTICA**
**Destinatario: Conductor**

#### 2.3.4.1 Trigger de Envío ✅
- [x] Disparar cuando usuario solicita viaje
- [x] Buscar conductores cercanos disponibles (vía Supabase RPC)
- [x] Enviar a todos los conductores en radio de búsqueda
- [x] Emitir evento WebSocket `ride:new` a conductores disponibles

#### 2.3.4.2 Contenido de la Notificación
- [ ] Definir template:
  ```javascript
  {
    type: 'new_ride_available',
    title: '🚗 Nuevo viaje disponible',
    body: 'Viaje de {origin} a {destination}. ${price}',
    data: {
      rideId: 'xxx',
      screen: 'TripRequest',
      pickupAddress: 'Av. Corrientes 1234',
      dropoffAddress: 'Av. Santa Fe 5678',
      estimatedPrice: 1500,
      estimatedDistance: 5.2,
      estimatedDuration: 15
    },
    sound: 'new_ride.wav',
    priority: 'high',
    ttl: 30 // Expira en 30 segundos
  }
  ```

#### 2.3.4.3 Sistema de Búsqueda de Conductores
- [ ] Crear función `findNearbyDrivers(pickup, radius)`:
  - [ ] Buscar conductores con `is_available = true`
  - [ ] Filtrar por tipo de servicio (vuelta_segura, envios, etc.)
  - [ ] Calcular distancia al punto de recogida
  - [ ] Ordenar por cercanía
  - [ ] Límite: 10 conductores más cercanos

#### 2.3.4.4 Sistema de Cola de Notificación
- [ ] Notificar primero a conductores más cercanos
- [ ] Si no aceptan en 15 segundos, notificar al siguiente grupo
- [ ] Máximo 3 rondas de notificación
- [ ] Si nadie acepta → Notificar al usuario "No hay conductores"

#### 2.3.4.5 Timeout y Expiración
- [ ] TTL de notificación: 30 segundos
- [ ] Timeout para aceptar: 15 segundos
- [ ] Si conductor no responde → Marcar como "no disponible temporalmente"
- [ ] Pantalla de solicitud con countdown

#### 2.3.4.6 Información para el Conductor
- [ ] Mostrar en notificación:
  - [ ] Dirección de origen (resumida)
  - [ ] Dirección de destino (resumida)
  - [ ] Precio estimado
  - [ ] Distancia y tiempo estimado
  - [ ] Rating del usuario (opcional)
- [ ] Al abrir → Pantalla con mapa y botones Aceptar/Rechazar

#### 2.3.4.7 Pantalla de Solicitud (Conductor)
- [ ] Crear `/src/screens/driver/TripRequestScreen.js`:
  - [ ] Mapa con origen y destino
  - [ ] Detalles del viaje
  - [ ] Countdown (15 segundos)
  - [ ] Botón "Aceptar" (grande, verde)
  - [ ] Botón "Rechazar" (pequeño, gris)
  - [ ] Auto-rechazar si expira countdown

**Auditoría 2.3.4:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.3.4.1 Trigger | ✅ Completado | 2026-01-08 | 2026-01-08 | ride.controller.js createRide |
| 2.3.4.2 Template | ⬜ Pendiente | - | - | |
| 2.3.4.3 Búsqueda | ✅ Completado | 2026-01-08 | 2026-01-08 | find_nearby_available_drivers RPC |
| 2.3.4.4 Cola | ⬜ Pendiente | - | - | |
| 2.3.4.5 Timeout | ⬜ Pendiente | - | - | |
| 2.3.4.6 Info Conductor | ⬜ Pendiente | - | - | |
| 2.3.4.7 Pantalla | ⬜ Pendiente | - | - | |

---

### 2.3.5 NOTIFICACIÓN: PAGO RECIBIDO
**Estado: ✅ COMPLETADO**
**Prioridad: ALTA**
**Destinatario: Conductor**

#### 2.3.5.1 Trigger de Envío ✅
- [x] Disparar cuando pago es confirmado
- [x] Ubicación en código: `payment.controller.js` → processPayment() y handleWebhook()
- [x] Pago con wallet: Notificación inmediata
- [x] Pago con tarjeta: Notificación inmediata
- [x] Pago via MercadoPago webhook: Notificación cuando aprobado
- [x] Emitir evento WebSocket `payment:received` al conductor

#### 2.3.5.2 Contenido de la Notificación
- [ ] Definir template:
  ```javascript
  {
    type: 'payment_received',
    title: '💰 Pago recibido',
    body: 'Has ganado ${netAmount} por el viaje. Disponible en 72h.',
    data: {
      rideId: 'xxx',
      earningId: 'xxx',
      screen: 'DriverEarnings',
      grossAmount: 1500,
      platformFee: 300,
      netAmount: 1200,
      tipAmount: 0
    }
  }
  ```

#### 2.3.5.3 Información del Pago
- [ ] Incluir en notificación:
  - [ ] Monto bruto del viaje
  - [ ] Comisión de la plataforma
  - [ ] Monto neto para conductor
  - [ ] Propina (si aplica)
  - [ ] Fecha de disponibilidad

#### 2.3.5.4 Deep Linking
- [ ] Al tocar → Abrir pantalla de ganancias
- [ ] Mostrar detalle de este pago específico

#### 2.3.5.5 Variantes según Método de Pago
- [ ] Pago con tarjeta: "Pago recibido. Disponible en 72h."
- [ ] Pago en efectivo: "Viaje completado. Recuerda cobrar ${amount} en efectivo."
- [ ] Pago con wallet: "Pago recibido desde wallet del usuario."

#### 2.3.5.6 Notificación de Propina
- [ ] Notificación separada para propinas:
  ```javascript
  {
    type: 'tip_received',
    title: '🎉 ¡Recibiste una propina!',
    body: '{userName} te dejó ${tipAmount} de propina.',
    data: { rideId, screen: 'DriverEarnings' }
  }
  ```

**Auditoría 2.3.5:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.3.5.1 Trigger | ✅ Completado | 2026-01-08 | 2026-01-08 | payment.controller.js |
| 2.3.5.2 Template | ⬜ Pendiente | - | - | |
| 2.3.5.3 Info Pago | ⬜ Pendiente | - | - | |
| 2.3.5.4 Deep Linking | ⬜ Pendiente | - | - | |
| 2.3.5.5 Variantes | ⬜ Pendiente | - | - | |
| 2.3.5.6 Propina | ⬜ Pendiente | - | - | |

---

### 2.3.6 NOTIFICACIÓN: MENSAJE NUEVO
**Estado: ✅ COMPLETADO**
**Prioridad: ALTA**
**Destinatario: Usuario y Conductor**

#### 2.3.6.1 Trigger de Envío ✅
- [x] Disparar cuando se envía mensaje en chat
- [x] Solo si receptor tiene app en background o cerrada
- [x] No enviar si receptor está viendo el chat (sistema de presencia implementado)

#### 2.3.6.2 Contenido de la Notificación
- [ ] Definir template:
  ```javascript
  {
    type: 'new_message',
    title: 'Mensaje de {senderName}',
    body: '{messagePreview}', // Primeros 50 caracteres
    data: {
      rideId: 'xxx',
      chatId: 'xxx',
      senderId: 'xxx',
      senderName: 'Juan',
      senderPhoto: 'url',
      screen: 'Chat'
    },
    sound: 'message.wav'
  }
  ```

#### 2.3.6.3 Lógica de Envío ✅
- [x] Verificar que receptor no esté en pantalla de chat:
  ```javascript
  // Implementado en chat.handler.js
  socket.emit('chat:viewing', { rideId, isViewing: true/false });

  // Backend verifica presencia antes de enviar push
  const isReceiverViewing = await checkReceiverPresence(rideId, receiverId);
  if (!isReceiverViewing) {
    await notificationService.sendNewMessage(receiverId, ...);
  }
  ```

#### 2.3.6.4 Agrupación de Mensajes
- [ ] Si hay múltiples mensajes sin leer:
  ```javascript
  {
    title: '{count} mensajes nuevos',
    body: 'Tienes mensajes de {senderName}',
  }
  ```
- [ ] Agrupar por conversación (Android: notification groups)

#### 2.3.6.5 Deep Linking ✅
- [x] Al tocar → Abrir chat del viaje (useNotifications.js)
- [x] Navegación configurada en handleNotificationNavigation

#### 2.3.6.6 Tipos de Mensaje ✅
- [x] Mensaje de texto: Mostrar preview (primeros 50 caracteres)
- [x] Mensaje de ubicación: Tipo 'location' con lat/lng
- [x] Mensaje rápido: Tipo 'quick_reply'

**Archivos Creados/Modificados:**
- `/backend/supabase/chat_schema.sql` - Schema de BD para chat
- `/backend/sockets/chat.handler.js` - Handler WebSocket para chat
- `/src/hooks/useChat.js` - Hooks: useChat, useUnreadMessages, useQuickChat
- `/src/screens/chat/ChatScreen.js` - Pantalla de chat completa

**Auditoría 2.3.6:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.3.6.1 Trigger | ✅ Completado | 2026-01-08 | 2026-01-08 | chat.handler.js |
| 2.3.6.2 Template | ✅ Completado | 2026-01-08 | 2026-01-08 | notification.service.js |
| 2.3.6.3 Lógica | ✅ Completado | 2026-01-08 | 2026-01-08 | Presencia + cache |
| 2.3.6.4 Agrupación | ⬜ Pendiente | - | - | |
| 2.3.6.5 Deep Linking | ✅ Completado | 2026-01-08 | 2026-01-08 | useNotifications.js |
| 2.3.6.6 Tipos Mensaje | ✅ Completado | 2026-01-08 | 2026-01-08 | text, location, quick_reply |

---

### 2.3.7 TESTING Y DEBUGGING
**Estado: PENDIENTE**
**Prioridad: ALTA**

#### 2.3.7.1 Testing en Dispositivo Físico
- [ ] Las notificaciones push NO funcionan en emuladores
- [ ] Probar en dispositivo Android físico
- [ ] Probar en dispositivo iOS físico
- [ ] Verificar recepción en foreground, background, killed

#### 2.3.7.2 Herramientas de Debugging
- [ ] Usar Firebase Console para enviar notificaciones de prueba
- [ ] Logs detallados en backend al enviar
- [ ] Verificar tokens en tabla `push_tokens`
- [ ] Revisar errores de FCM en consola

#### 2.3.7.3 Casos de Prueba
- [ ] Recibir notificación con app abierta (foreground)
- [ ] Recibir notificación con app en background
- [ ] Recibir notificación con app cerrada (killed)
- [ ] Tocar notificación y verificar deep linking
- [ ] Verificar badge de contador
- [ ] Verificar sonidos personalizados
- [ ] Verificar que no se dupliquen notificaciones

#### 2.3.7.4 Manejo de Errores
- [ ] Token expirado → Solicitar nuevo token
- [ ] Token inválido → Eliminar de BD
- [ ] Error de FCM → Log y reintento
- [ ] Usuario sin token → No intentar enviar

**Auditoría 2.3.7:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.3.7.1 Testing Físico | ⬜ Pendiente | - | - | |
| 2.3.7.2 Debugging | ⬜ Pendiente | - | - | |
| 2.3.7.3 Casos Prueba | ⬜ Pendiente | - | - | |
| 2.3.7.4 Errores | ⬜ Pendiente | - | - | |

---

## RESUMEN AUDITORÍA 2.3 - NOTIFICACIONES PUSH

| Sub-sección | Descripción | Prioridad | Estado | Progreso |
|-------------|-------------|-----------|--------|----------|
| 2.3.1 | Configuración/Infraestructura | CRÍTICA | ✅ Completado | 100% |
| 2.3.1.8 | Sistema de Preferencias | ALTA | ✅ Completado | 100% |
| 2.3.2 | Notif: Viaje Aceptado | CRÍTICA | ✅ Completado | 100% |
| 2.3.3 | Notif: Conductor Cerca | CRÍTICA | ✅ Completado | 100% |
| 2.3.4 | Notif: Nuevo Viaje (Conductor) | CRÍTICA | ✅ Completado | 100% |
| 2.3.5 | Notif: Pago Recibido | ALTA | ✅ Completado | 100% |
| 2.3.6 | Notif: Mensaje Nuevo + Chat | ALTA | ✅ Completado | 100% |
| 2.3.7 | Testing y Debugging | ALTA | ⬜ Pendiente | 0% |

**Última actualización:** 2026-01-09
**Triggers implementados:** 6/6 (ride_accepted, driver_nearby, new_ride, ride_completed, payment_received, new_message)
**Sistema de Chat:** Completo con WebSocket, BD, hooks y UI
**Sistema de Preferencias:** Completo con quiet hours, categorías, sonido/vibración

**Total Sub-tareas 2.3:** 45 tareas
**Archivos creados:** ~15 archivos (servicios, controllers, componentes, pantallas)
**Tablas:** 3 tablas (`push_tokens`, `notifications`, `notification_preferences`)
**Dependencias:** expo-notifications, firebase-admin

**Tipos de Notificaciones Implementadas:**
| Tipo | Destinatario | Trigger |
|------|--------------|---------|
| `ride_accepted` | Usuario | Conductor acepta viaje |
| `driver_nearby` | Usuario | Conductor a < 200m |
| `driver_arrived` | Usuario | Conductor llega al origen |
| `new_ride_available` | Conductor | Usuario solicita viaje |
| `payment_received` | Conductor | Pago confirmado |
| `tip_received` | Conductor | Usuario deja propina |
| `new_message` | Ambos | Mensaje en chat |

---

## 2.4 SISTEMA DE CALIFICACIONES (RATINGS)
**Estado: COMPLETADO**
**Prioridad: ALTA**
**Implementado: 2026-01-04**

---

### 2.4.1 INFRAESTRUCTURA DE CALIFICACIONES ✅
**Estado: COMPLETADO**

#### 2.4.1.1 Base de Datos ✅
- [x] Crear tabla `ratings` con campos:
  - [x] ride_id / delivery_id (referencia al viaje/entrega)
  - [x] rater_id (quien califica)
  - [x] rated_id (quien recibe la calificación)
  - [x] rating_type ('user_to_driver', 'driver_to_user')
  - [x] stars (1-5)
  - [x] comment (texto opcional)
  - [x] tags (array de tags seleccionados)
- [x] Crear tabla `rating_tags` con tags predefinidos
- [x] Agregar campos a `profiles`: rating_average, rating_count
- [x] Crear función/trigger para actualizar promedio automáticamente
- [x] Crear función `get_rating_stats()` para estadísticas
- [x] Crear función `can_rate_ride()` para validar permisos
- [x] Configurar RLS para ratings

**Archivo:** `/backend/supabase/ratings_schema.sql`

#### 2.4.1.2 Backend Service ✅
- [x] Crear `/backend/services/rating.service.js`:
  - [x] `createRideRating()` - Calificar viaje
  - [x] `createDeliveryRating()` - Calificar entrega
  - [x] `getUserRatings()` - Obtener calificaciones recibidas
  - [x] `getRatingStats()` - Estadísticas de calificación
  - [x] `canRateRide()` - Verificar si puede calificar
  - [x] `getRatingTags()` - Obtener tags disponibles
  - [x] `getTopRatedDrivers()` - Conductores destacados (admin)
  - [x] `getLowRatedDrivers()` - Conductores con baja calificación (admin)

#### 2.4.1.3 Backend Controller y Rutas ✅
- [x] Crear `/backend/controllers/rating.controller.js`
- [x] Crear `/backend/routes/rating.routes.js`
- [x] Endpoints implementados:
  - [x] `POST /api/ratings/ride` - Calificar viaje
  - [x] `POST /api/ratings/delivery` - Calificar entrega
  - [x] `GET /api/ratings/me` - Mis calificaciones recibidas
  - [x] `GET /api/ratings/me/stats` - Mis estadísticas
  - [x] `GET /api/ratings/user/:userId` - Calificaciones de usuario
  - [x] `GET /api/ratings/user/:userId/stats` - Estadísticas de usuario
  - [x] `GET /api/ratings/can-rate/ride/:rideId` - Verificar si puede calificar
  - [x] `GET /api/ratings/ride/:rideId` - Obtener calificación de viaje
  - [x] `GET /api/ratings/tags` - Tags disponibles
  - [x] `GET /api/ratings/admin/top-drivers` - Top conductores (admin)
  - [x] `GET /api/ratings/admin/low-rated` - Conductores con baja calificación (admin)

#### 2.4.1.4 Frontend Service ✅
- [x] Crear `/src/services/rating.service.js`:
  - [x] `rateRide()` - Calificar viaje
  - [x] `rateDelivery()` - Calificar entrega
  - [x] `getMyRatings()` - Mis calificaciones
  - [x] `getMyStats()` - Mis estadísticas
  - [x] `getUserRatings()` - Calificaciones de usuario
  - [x] `getUserStats()` - Estadísticas de usuario
  - [x] `canRateRide()` - Verificar si puede calificar
  - [x] `getTags()` - Tags disponibles
  - [x] Utilidades: formatRating, getRatingText, getRatingColor, getStarsArray

#### 2.4.1.5 Pantallas de Calificación ✅
- [x] Crear `/src/screens/rating/RateRideScreen.js`:
  - [x] Selector de estrellas (1-5)
  - [x] Tags dinámicos según estrellas (positivos/negativos)
  - [x] Comentario opcional (500 caracteres max)
  - [x] Pantalla de éxito después de enviar
  - [x] Opción de omitir calificación
- [x] Crear `/src/screens/rating/RateUserScreen.js`:
  - [x] Similar a RateRideScreen pero para conductores
  - [x] Tags específicos para calificar pasajeros

**Archivos implementados:**
- `/backend/supabase/ratings_schema.sql`
- `/backend/services/rating.service.js`
- `/backend/controllers/rating.controller.js`
- `/backend/routes/rating.routes.js`
- `/src/services/rating.service.js`
- `/src/screens/rating/RateRideScreen.js`
- `/src/screens/rating/RateUserScreen.js`
- `/src/screens/rating/index.js`

**Tags predefinidos:**

| Para calificar conductores | Para calificar pasajeros |
|---------------------------|-------------------------|
| Puntual | Listo a tiempo |
| Amable | Respetuoso |
| Auto limpio | Direcciones claras |
| Manejo seguro | Buena propina |
| Buena ruta | No estaba listo |
| Profesional | Comportamiento grosero |
| Llegó tarde | Dirección incorrecta |
| Poco amable | No apareció |

**Auditoría 2.4.1:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.4.1.1 Base de Datos | ✅ Completado | 2026-01-04 | 2026-01-04 | ratings_schema.sql |
| 2.4.1.2 Backend Service | ✅ Completado | 2026-01-04 | 2026-01-04 | rating.service.js |
| 2.4.1.3 Controller/Rutas | ✅ Completado | 2026-01-04 | 2026-01-04 | 11 endpoints |
| 2.4.1.4 Frontend Service | ✅ Completado | 2026-01-04 | 2026-01-04 | rating.service.js |
| 2.4.1.5 Pantallas | ✅ Completado | 2026-01-04 | 2026-01-04 | RateRideScreen, RateUserScreen |

---

### 2.4.2 PENDIENTE: INTEGRACIÓN CON FLUJO DE VIAJE
**Estado: PENDIENTE**
**Prioridad: ALTA**

#### 2.4.2.1 Trigger de Calificación
- [ ] Mostrar pantalla de calificación automáticamente al completar viaje
- [ ] Navegar a RateRideScreen desde RideCompletedScreen
- [ ] Navegar a RateUserScreen desde DriverTripCompletedScreen

#### 2.4.2.2 Historial de Viajes
- [ ] Mostrar botón "Calificar" en viajes no calificados
- [ ] Indicador visual de viajes pendientes de calificación

#### 2.4.2.3 Perfil con Rating
- [ ] Mostrar rating promedio en perfil de usuario/conductor
- [ ] Mostrar distribución de estrellas
- [ ] Mostrar tags más frecuentes

---

## 2.5 WEBSOCKETS / TIEMPO REAL
**Estado: EN PROGRESO (30%)**
**Prioridad: CRÍTICA**
**Tecnología: Socket.IO**

---

### 2.5.1 CONFIGURAR SOCKET.IO EN BACKEND ✅
**Estado: COMPLETADO**
**Fecha: 2026-01-08**

#### 2.5.1.1 Instalación y Configuración Básica ✅
- [x] Instalar dependencias:
  ```bash
  npm install socket.io
  npm install socket.io-client  # Para testing
  ```
- [x] Crear `/backend/config/socket.js`:
  ```javascript
  import { Server } from 'socket.io';

  let io;

  export const initSocket = (server) => {
    io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });
    return io;
  };

  export const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
  };
  ```

#### 2.5.1.2 Integración con Express Server ✅
- [x] Modificar `/backend/server.js`:
  ```javascript
  import http from 'http';
  import { initSocket } from './config/socket.js';

  const app = express();
  const server = http.createServer(app);
  const io = initSocket(server);

  // Inicializar handlers de socket
  import './sockets/index.js';

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket ready`);
  });
  ```

#### 2.5.1.3 Autenticación de Conexiones ✅
- [x] Crear `/backend/middleware/socket.auth.js`:
  ```javascript
  import { supabaseAdmin } from '../config/supabase.js';

  export const socketAuthMiddleware = async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        return next(new Error('Invalid token'));
      }

      // Obtener perfil del usuario
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      socket.user = { ...user, ...profile };
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  };
  ```
- [x] Aplicar middleware en configuración de socket

#### 2.5.1.4 Estructura de Rooms/Canales ✅
- [x] Definir estructura de rooms:
  ```javascript
  // Rooms por tipo
  `user:${userId}`           // Canal personal del usuario
  `driver:${driverId}`       // Canal personal del conductor
  `ride:${rideId}`           // Canal del viaje (usuario + conductor)
  `delivery:${deliveryId}`   // Canal del envío
  `drivers:available`        // Conductores disponibles
  `drivers:${serviceType}`   // Conductores por tipo de servicio
  ```
- [x] Auto-join a rooms al conectar según rol

#### 2.5.1.5 Manejo de Conexiones ✅
- [x] Crear `/backend/sockets/connection.handler.js`:
  ```javascript
  export const handleConnection = (io, socket) => {
    console.log(`User connected: ${socket.user.id}`);

    // Unirse a room personal
    socket.join(`user:${socket.user.id}`);

    // Si es conductor, unirse a room de conductores
    if (socket.user.is_driver && socket.user.driver_status === 'verified') {
      socket.join(`driver:${socket.user.id}`);
    }

    // Manejar desconexión
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.user.id}, reason: ${reason}`);
      // Actualizar estado del conductor si aplica
    });
  };
  ```

#### 2.5.1.6 Índice de Handlers ✅
- [x] Crear `/backend/sockets/index.js`:
  ```javascript
  import { getIO } from '../config/socket.js';
  import { socketAuthMiddleware } from '../middleware/socket.auth.js';
  import { handleConnection } from './connection.handler.js';
  import { handleRideEvents } from './ride.handler.js';
  import { handleLocationEvents } from './location.handler.js';
  import { handleChatEvents } from './chat.handler.js';

  const io = getIO();

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    handleConnection(io, socket);
    handleRideEvents(io, socket);
    handleLocationEvents(io, socket);
    handleChatEvents(io, socket);
  });
  ```

#### 2.5.1.7 Frontend - Cliente Socket.IO ✅
- [x] Instalar en frontend:
  ```bash
  npm install socket.io-client
  ```
- [x] Crear `/src/services/socket.service.js`:
  ```javascript
  import { io } from 'socket.io-client';
  import AsyncStorage from '@react-native-async-storage/async-storage';

  let socket = null;

  export const connectSocket = async () => {
    const token = await AsyncStorage.getItem('token');

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => console.log('Socket connected'));
    socket.on('disconnect', () => console.log('Socket disconnected'));
    socket.on('connect_error', (err) => console.log('Socket error:', err));

    return socket;
  };

  export const disconnectSocket = () => {
    if (socket) socket.disconnect();
  };

  export const getSocket = () => socket;
  ```

#### 2.5.1.8 Hook useSocket ✅
- [x] Crear `/src/hooks/useSocket.js`:
  ```javascript
  import { useEffect, useState } from 'react';
  import { connectSocket, disconnectSocket, getSocket } from '../services/socket.service';

  export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
      const initSocket = async () => {
        const s = await connectSocket();
        setSocket(s);

        s.on('connect', () => setIsConnected(true));
        s.on('disconnect', () => setIsConnected(false));
      };

      initSocket();
      return () => disconnectSocket();
    }, []);

    return { socket, isConnected };
  };
  ```

**Auditoría 2.5.1:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.5.1.1 Instalación | ✅ Completado | 2026-01-08 | 2026-01-08 | socket.io + socket.io-client |
| 2.5.1.2 Integración Express | ✅ Completado | 2026-01-08 | 2026-01-08 | HTTP server + Socket.IO |
| 2.5.1.3 Autenticación | ✅ Completado | 2026-01-08 | 2026-01-08 | JWT via Supabase |
| 2.5.1.4 Rooms/Canales | ✅ Completado | 2026-01-08 | 2026-01-08 | user:, driver:, ride:, drivers:available |
| 2.5.1.5 Conexiones | ✅ Completado | 2026-01-08 | 2026-01-08 | connection.handler.js |
| 2.5.1.6 Handlers | ✅ Completado | 2026-01-08 | 2026-01-08 | ride, location, driver handlers |
| 2.5.1.7 Frontend Cliente | ✅ Completado | 2026-01-08 | 2026-01-08 | socket.service.js |
| 2.5.1.8 Hook useSocket | ✅ Completado | 2026-01-08 | 2026-01-08 | useSocket, useRideSocket, useDriverSocket |

**Archivos Creados:**
- `/backend/config/socket.js` - Configuración Socket.IO
- `/backend/middleware/socket.auth.js` - Middleware autenticación
- `/backend/sockets/index.js` - Inicialización handlers
- `/backend/sockets/connection.handler.js` - Manejo conexiones
- `/backend/sockets/ride.handler.js` - Eventos de viaje
- `/backend/sockets/location.handler.js` - Ubicación en tiempo real
- `/backend/sockets/driver.handler.js` - Disponibilidad conductor
- `/backend/supabase/websocket_schema.sql` - Schema DB para ubicaciones
- `/src/services/socket.service.js` - Cliente Socket.IO
- `/src/hooks/useSocket.js` - Hooks React

---

### 2.5.2 UBICACIÓN EN VIVO DEL CONDUCTOR (CADA 5 SEGUNDOS)
**Estado: PARCIALMENTE COMPLETADO**
**Prioridad: CRÍTICA**
**Nota:** Backend implementado en 2.5.1. Pendiente integración en app conductor.

#### 2.5.2.1 Backend - Handler de Ubicación ✅
- [x] Crear `/backend/sockets/location.handler.js`:
  ```javascript
  export const handleLocationEvents = (io, socket) => {
    // Conductor envía su ubicación
    socket.on('driver:location:update', async (data) => {
      const { rideId, latitude, longitude, heading, speed } = data;

      // Guardar en base de datos
      await saveDriverLocation(socket.user.id, data);

      // Emitir a usuario del viaje
      if (rideId) {
        io.to(`ride:${rideId}`).emit('driver:location', {
          driverId: socket.user.id,
          latitude,
          longitude,
          heading,
          speed,
          timestamp: new Date()
        });
      }

      // Emitir a room de conductores disponibles (para matching)
      if (socket.user.is_available) {
        io.to('drivers:available').emit('driver:position', {
          driverId: socket.user.id,
          latitude,
          longitude
        });
      }
    });
  };
  ```

#### 2.4.2.2 Frontend Conductor - Envío de Ubicación
- [ ] Crear `/src/services/driverLocation.service.js`:
  ```javascript
  import * as Location from 'expo-location';
  import * as TaskManager from 'expo-task-manager';
  import { getSocket } from './socket.service';

  const LOCATION_TASK = 'DRIVER_LOCATION_TASK';
  let locationSubscription = null;

  // Definir tarea en background
  TaskManager.defineTask(LOCATION_TASK, ({ data, error }) => {
    if (error) return;
    const { locations } = data;
    const location = locations[0];

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('driver:location:update', {
        rideId: currentRideId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading,
        speed: location.coords.speed
      });
    }
  });

  export const startLocationTracking = async (rideId) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;

    // Tracking en foreground (cada 5 segundos)
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10
      },
      (location) => {
        const socket = getSocket();
        if (socket) {
          socket.emit('driver:location:update', {
            rideId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading,
            speed: location.coords.speed
          });
        }
      }
    );

    return true;
  };

  export const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }
  };
  ```

#### 2.4.2.3 Background Location (Conductor)
- [ ] Configurar ubicación en background para conductor:
  ```javascript
  export const startBackgroundLocationTracking = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') return false;

    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
      foregroundService: {
        notificationTitle: 'VNR Conductor',
        notificationBody: 'Compartiendo ubicación con el pasajero',
        notificationColor: '#000000'
      },
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.AutomotiveNavigation
    });
  };

  export const stopBackgroundLocationTracking = async () => {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  };
  ```

#### 2.4.2.4 Frontend Usuario - Recepción de Ubicación
- [ ] Crear `/src/hooks/useDriverLocation.js`:
  ```javascript
  import { useEffect, useState, useRef } from 'react';
  import { useSocket } from './useSocket';

  export const useDriverLocation = (rideId) => {
    const { socket } = useSocket();
    const [driverLocation, setDriverLocation] = useState(null);
    const [eta, setEta] = useState(null);

    useEffect(() => {
      if (!socket || !rideId) return;

      // Unirse al room del viaje
      socket.emit('ride:join', { rideId });

      // Escuchar ubicación del conductor
      socket.on('driver:location', (data) => {
        setDriverLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading
        });

        // Calcular ETA si hay destino
        calculateETA(data);
      });

      return () => {
        socket.emit('ride:leave', { rideId });
        socket.off('driver:location');
      };
    }, [socket, rideId]);

    return { driverLocation, eta };
  };
  ```

#### 2.4.2.5 Optimización de Batería
- [ ] Reducir frecuencia cuando conductor detenido (15 seg)
- [ ] Aumentar frecuencia cuando en movimiento (5 seg)
- [ ] Detectar velocidad 0 por más de 30 seg → reducir
- [ ] Alertar al conductor sobre uso de batería alto

#### 2.4.2.6 Almacenamiento de Ubicaciones
- [ ] Guardar última ubicación en tabla `driver_locations`
- [ ] Guardar historial de ruta del viaje
- [ ] Limpiar ubicaciones > 24 horas
- [ ] Índice geoespacial para búsquedas eficientes

**Auditoría 2.4.2:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.4.2.1 Backend Handler | ⬜ Pendiente | - | - | |
| 2.4.2.2 Frontend Envío | ⬜ Pendiente | - | - | |
| 2.4.2.3 Background | ⬜ Pendiente | - | - | |
| 2.4.2.4 Frontend Recepción | ⬜ Pendiente | - | - | |
| 2.4.2.5 Optimización | ⬜ Pendiente | - | - | |
| 2.4.2.6 Almacenamiento | ⬜ Pendiente | - | - | |

---

### 2.4.3 ESTADO DEL VIAJE EN TIEMPO REAL
**Estado: PENDIENTE**
**Prioridad: CRÍTICA**

#### 2.4.3.1 Definición de Estados del Viaje
- [ ] Definir flujo de estados:
  ```
  pending → confirmed → driver_assigned → driver_arriving →
  driver_arrived → in_progress → completed

  En cualquier momento: cancelled
  ```
- [ ] Crear constantes de estados:
  ```javascript
  export const RIDE_STATUS = {
    PENDING: 'pending',           // Usuario solicitó viaje
    CONFIRMED: 'confirmed',       // Sistema encontró conductores
    DRIVER_ASSIGNED: 'driver_assigned',  // Conductor aceptó
    DRIVER_ARRIVING: 'driver_arriving',  // Conductor en camino al origen
    DRIVER_ARRIVED: 'driver_arrived',    // Conductor llegó al origen
    IN_PROGRESS: 'in_progress',   // Viaje en curso
    COMPLETED: 'completed',       // Viaje terminado
    CANCELLED: 'cancelled'        // Cancelado
  };
  ```

#### 2.4.3.2 Backend - Handler de Estados
- [ ] Crear `/backend/sockets/ride.handler.js`:
  ```javascript
  export const handleRideEvents = (io, socket) => {
    // Usuario solicita viaje
    socket.on('ride:request', async (data) => {
      const ride = await createRide(socket.user.id, data);
      socket.join(`ride:${ride.id}`);
      socket.emit('ride:created', { rideId: ride.id });

      // Iniciar matching
      findAndNotifyDrivers(io, ride);
    });

    // Conductor acepta viaje
    socket.on('ride:accept', async ({ rideId }) => {
      const ride = await acceptRide(rideId, socket.user.id);
      socket.join(`ride:${rideId}`);

      io.to(`ride:${rideId}`).emit('ride:status_changed', {
        rideId,
        status: 'driver_assigned',
        driver: getDriverInfo(socket.user)
      });
    });

    // Conductor llegó al origen
    socket.on('ride:arrived', async ({ rideId }) => {
      await updateRideStatus(rideId, 'driver_arrived');
      io.to(`ride:${rideId}`).emit('ride:status_changed', {
        rideId,
        status: 'driver_arrived'
      });
    });

    // Iniciar viaje
    socket.on('ride:start', async ({ rideId }) => {
      await updateRideStatus(rideId, 'in_progress');
      io.to(`ride:${rideId}`).emit('ride:status_changed', {
        rideId,
        status: 'in_progress',
        startedAt: new Date()
      });
    });

    // Completar viaje
    socket.on('ride:complete', async ({ rideId }) => {
      const ride = await completeRide(rideId);
      io.to(`ride:${rideId}`).emit('ride:status_changed', {
        rideId,
        status: 'completed',
        completedAt: new Date(),
        finalPrice: ride.actual_price
      });
    });

    // Cancelar viaje
    socket.on('ride:cancel', async ({ rideId, reason }) => {
      await cancelRide(rideId, socket.user.id, reason);
      io.to(`ride:${rideId}`).emit('ride:status_changed', {
        rideId,
        status: 'cancelled',
        cancelledBy: socket.user.id,
        reason
      });
    });
  };
  ```

#### 2.4.3.3 Frontend - Hook de Estado del Viaje
- [ ] Crear `/src/hooks/useRideStatus.js`:
  ```javascript
  export const useRideStatus = (rideId) => {
    const { socket } = useSocket();
    const [rideStatus, setRideStatus] = useState(null);
    const [driver, setDriver] = useState(null);

    useEffect(() => {
      if (!socket || !rideId) return;

      socket.emit('ride:join', { rideId });

      socket.on('ride:status_changed', (data) => {
        if (data.rideId === rideId) {
          setRideStatus(data.status);
          if (data.driver) setDriver(data.driver);
        }
      });

      return () => {
        socket.emit('ride:leave', { rideId });
        socket.off('ride:status_changed');
      };
    }, [socket, rideId]);

    return { rideStatus, driver };
  };
  ```

#### 2.4.3.4 UI según Estado del Viaje
- [ ] Pantalla de espera: `pending`, `confirmed`
  - [ ] Animación de búsqueda
  - [ ] Mensaje "Buscando conductor..."
- [ ] Pantalla de conductor asignado: `driver_assigned`, `driver_arriving`
  - [ ] Info del conductor
  - [ ] ETA al origen
  - [ ] Mapa con ubicación del conductor
- [ ] Pantalla conductor llegó: `driver_arrived`
  - [ ] Notificación destacada
  - [ ] Info del vehículo
- [ ] Pantalla de viaje en progreso: `in_progress`
  - [ ] Mapa con ruta al destino
  - [ ] ETA al destino
  - [ ] Botón de emergencia
- [ ] Pantalla de viaje completado: `completed`
  - [ ] Resumen del viaje
  - [ ] Precio final
  - [ ] Calificación

#### 2.4.3.5 Eventos de Viaje (Envíos)
- [ ] Misma lógica para deliveries:
  ```javascript
  DELIVERY_STATUS = {
    PENDING: 'pending',
    CADETE_ASSIGNED: 'cadete_assigned',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  }
  ```

**Auditoría 2.4.3:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.4.3.1 Definición Estados | ⬜ Pendiente | - | - | |
| 2.4.3.2 Backend Handler | ⬜ Pendiente | - | - | |
| 2.4.3.3 Frontend Hook | ⬜ Pendiente | - | - | |
| 2.4.3.4 UI Estados | ⬜ Pendiente | - | - | |
| 2.4.3.5 Eventos Envíos | ⬜ Pendiente | - | - | |

---

### 2.4.4 MATCHING AUTOMÁTICO DE VIAJES
**Estado: PENDIENTE**
**Prioridad: CRÍTICA**

#### 2.4.4.1 Algoritmo de Búsqueda de Conductores Cercanos
- [ ] Crear `/backend/services/matching.service.js`:
  ```javascript
  export const findNearbyDrivers = async (pickup, serviceType, radius = 5000) => {
    // Buscar conductores disponibles cercanos al punto de recogida
    const { data: drivers } = await supabaseAdmin
      .from('driver_locations')
      .select(`
        driver_id,
        latitude,
        longitude,
        profiles!inner(
          id, nombre, apellido, avatar,
          driver_status, driver_type, is_available,
          rating
        )
      `)
      .eq('profiles.is_available', true)
      .eq('profiles.driver_status', 'verified')
      .eq('profiles.driver_type', serviceType);

    // Calcular distancia y ordenar
    const driversWithDistance = drivers
      .map(d => ({
        ...d,
        distance: calculateDistance(
          pickup.lat, pickup.lng,
          d.latitude, d.longitude
        )
      }))
      .filter(d => d.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return driversWithDistance.slice(0, 10); // Máximo 10 conductores
  };
  ```

#### 2.4.4.2 Sistema de Cola de Notificación
- [ ] Crear `/backend/services/rideQueue.service.js`:
  ```javascript
  const rideQueues = new Map(); // rideId -> queue state

  export const startMatchingProcess = async (io, ride) => {
    const drivers = await findNearbyDrivers(
      { lat: ride.pickup_lat, lng: ride.pickup_lng },
      ride.service_type
    );

    if (drivers.length === 0) {
      io.to(`user:${ride.user_id}`).emit('ride:no_drivers', {
        rideId: ride.id,
        message: 'No hay conductores disponibles en tu zona'
      });
      return;
    }

    // Inicializar cola
    rideQueues.set(ride.id, {
      drivers: drivers,
      currentIndex: 0,
      round: 1,
      maxRounds: 3,
      timeoutMs: 15000
    });

    // Notificar al primer grupo
    notifyNextDriverBatch(io, ride.id);
  };

  const notifyNextDriverBatch = async (io, rideId) => {
    const queue = rideQueues.get(rideId);
    if (!queue) return;

    const batchSize = 3;
    const startIdx = queue.currentIndex;
    const endIdx = Math.min(startIdx + batchSize, queue.drivers.length);
    const batch = queue.drivers.slice(startIdx, endIdx);

    // Notificar a cada conductor del batch
    for (const driver of batch) {
      io.to(`driver:${driver.driver_id}`).emit('ride:available', {
        rideId,
        pickup: ride.pickup_address,
        dropoff: ride.dropoff_address,
        estimatedPrice: ride.estimated_price,
        distance: driver.distance
      });
    }

    // Timeout para pasar al siguiente batch
    setTimeout(() => {
      const currentQueue = rideQueues.get(rideId);
      if (!currentQueue || currentQueue.accepted) return;

      currentQueue.currentIndex = endIdx;

      if (currentQueue.currentIndex >= currentQueue.drivers.length) {
        currentQueue.round++;
        currentQueue.currentIndex = 0;

        if (currentQueue.round > currentQueue.maxRounds) {
          // No hay conductores disponibles
          io.to(`user:${ride.user_id}`).emit('ride:no_drivers', {
            rideId,
            message: 'No pudimos encontrar un conductor'
          });
          rideQueues.delete(rideId);
          return;
        }
      }

      notifyNextDriverBatch(io, rideId);
    }, queue.timeoutMs);
  };
  ```

#### 2.4.4.3 Aceptación del Viaje
- [ ] Manejar cuando conductor acepta:
  ```javascript
  export const handleDriverAccept = async (io, rideId, driverId) => {
    const queue = rideQueues.get(rideId);
    if (!queue || queue.accepted) {
      // Viaje ya fue aceptado por otro
      return { success: false, message: 'Viaje ya no disponible' };
    }

    queue.accepted = true;
    rideQueues.delete(rideId);

    // Actualizar viaje en BD
    const ride = await assignDriverToRide(rideId, driverId);

    // Notificar a otros conductores que el viaje ya no está disponible
    for (const driver of queue.drivers) {
      if (driver.driver_id !== driverId) {
        io.to(`driver:${driver.driver_id}`).emit('ride:taken', { rideId });
      }
    }

    return { success: true, ride };
  };
  ```

#### 2.4.4.4 Rechazo y Timeout
- [ ] Manejar rechazo explícito:
  ```javascript
  socket.on('ride:reject', async ({ rideId }) => {
    const queue = rideQueues.get(rideId);
    if (queue) {
      // Marcar conductor como que rechazó
      const driverIdx = queue.drivers.findIndex(
        d => d.driver_id === socket.user.id
      );
      if (driverIdx !== -1) {
        queue.drivers[driverIdx].rejected = true;
      }
    }
  });
  ```
- [ ] Penalización leve por rechazo frecuente
- [ ] No penalizar por timeout (puede estar ocupado)

#### 2.4.4.5 Criterios de Matching
- [ ] Prioridad de asignación:
  1. Distancia al punto de recogida
  2. Rating del conductor
  3. Cantidad de viajes completados
  4. Tiempo de respuesta histórico
- [ ] Crear función de scoring:
  ```javascript
  const calculateDriverScore = (driver, pickup) => {
    const distanceScore = 100 - (driver.distance / 50); // 0-100
    const ratingScore = driver.rating * 20; // 0-100
    const completedScore = Math.min(driver.completed_rides, 100);

    return (distanceScore * 0.5) + (ratingScore * 0.3) + (completedScore * 0.2);
  };
  ```

#### 2.4.4.6 Pantalla de Solicitud (Conductor)
- [ ] Mostrar al conductor:
  - [ ] Mapa con origen y destino
  - [ ] Distancia al punto de recogida
  - [ ] Precio estimado
  - [ ] Countdown de 15 segundos
  - [ ] Botón Aceptar / Rechazar
- [ ] Sonido de alerta para nuevo viaje
- [ ] Vibración

**Auditoría 2.4.4:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.4.4.1 Algoritmo Búsqueda | ⬜ Pendiente | - | - | |
| 2.4.4.2 Cola Notificación | ⬜ Pendiente | - | - | |
| 2.4.4.3 Aceptación | ⬜ Pendiente | - | - | |
| 2.4.4.4 Rechazo/Timeout | ⬜ Pendiente | - | - | |
| 2.4.4.5 Criterios Matching | ⬜ Pendiente | - | - | |
| 2.4.4.6 Pantalla Conductor | ⬜ Pendiente | - | - | |

---

### 2.4.5 ACTUALIZACIÓN DE DISPONIBILIDAD DE CONDUCTORES
**Estado: PENDIENTE**
**Prioridad: ALTA**

#### 2.4.5.1 Estados de Disponibilidad
- [ ] Definir estados:
  ```javascript
  DRIVER_AVAILABILITY = {
    OFFLINE: 'offline',           // App cerrada o desconectado
    ONLINE: 'online',             // Disponible para viajes
    BUSY: 'busy',                 // En viaje activo
    PAUSED: 'paused'              // En línea pero no acepta viajes
  };
  ```

#### 2.4.5.2 Backend - Gestión de Disponibilidad
- [ ] Agregar columna `availability_status` a `profiles`
- [ ] Crear handler de disponibilidad:
  ```javascript
  socket.on('driver:availability', async ({ status }) => {
    await updateDriverAvailability(socket.user.id, status);

    // Actualizar rooms según estado
    if (status === 'online') {
      socket.join('drivers:available');
      socket.join(`drivers:${socket.user.driver_type}`);
    } else {
      socket.leave('drivers:available');
      socket.leave(`drivers:${socket.user.driver_type}`);
    }

    socket.emit('driver:availability:updated', { status });
  });
  ```

#### 2.4.5.3 Cambio Automático de Estado
- [ ] **Online → Busy:** Al aceptar viaje
- [ ] **Busy → Online:** Al completar viaje
- [ ] **Online → Offline:** Al desconectar socket
- [ ] **Cualquiera → Offline:** Al cerrar sesión
- [ ] Implementar en handlers correspondientes

#### 2.4.5.4 Frontend Conductor - Toggle de Disponibilidad
- [ ] Crear componente toggle en DriverHomeScreen:
  ```javascript
  const AvailabilityToggle = () => {
    const [isOnline, setIsOnline] = useState(false);
    const { socket } = useSocket();

    const toggleAvailability = () => {
      const newStatus = isOnline ? 'offline' : 'online';
      socket.emit('driver:availability', { status: newStatus });
      setIsOnline(!isOnline);
    };

    return (
      <Switch
        value={isOnline}
        onValueChange={toggleAvailability}
        trackColor={{ false: '#767577', true: '#81b0ff' }}
      />
    );
  };
  ```

#### 2.4.5.5 Indicador Visual de Estado
- [ ] Mostrar estado actual del conductor:
  - [ ] 🟢 En línea (disponible)
  - [ ] 🔴 Desconectado
  - [ ] 🟡 En viaje
  - [ ] ⚪ Pausado
- [ ] Header con indicador de estado
- [ ] Animación al cambiar estado

#### 2.4.5.6 Manejo de Desconexión
- [ ] Detectar desconexión inesperada:
  ```javascript
  socket.on('disconnect', async (reason) => {
    // Marcar conductor como offline
    await updateDriverAvailability(socket.user.id, 'offline');

    // Si tenía viaje activo, mantener pero notificar
    const activeRide = await getActiveRide(socket.user.id);
    if (activeRide) {
      io.to(`ride:${activeRide.id}`).emit('driver:disconnected', {
        message: 'El conductor perdió conexión'
      });
    }
  });
  ```

#### 2.4.5.7 Reconexión Automática
- [ ] Restaurar estado al reconectar:
  ```javascript
  socket.on('connect', async () => {
    // Verificar si tenía viaje activo
    const activeRide = await getActiveRide(socket.user.id);
    if (activeRide) {
      socket.join(`ride:${activeRide.id}`);
      socket.emit('ride:reconnected', { ride: activeRide });
    }

    // Restaurar disponibilidad anterior
    const lastStatus = await getLastAvailabilityStatus(socket.user.id);
    if (lastStatus === 'online') {
      socket.join('drivers:available');
    }
  });
  ```

**Auditoría 2.4.5:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.4.5.1 Estados | ⬜ Pendiente | - | - | |
| 2.4.5.2 Backend Gestión | ⬜ Pendiente | - | - | |
| 2.4.5.3 Cambio Automático | ⬜ Pendiente | - | - | |
| 2.4.5.4 Frontend Toggle | ⬜ Pendiente | - | - | |
| 2.4.5.5 Indicador Visual | ⬜ Pendiente | - | - | |
| 2.4.5.6 Desconexión | ⬜ Pendiente | - | - | |
| 2.4.5.7 Reconexión | ⬜ Pendiente | - | - | |

---

## RESUMEN AUDITORÍA 2.4 - WEBSOCKETS / TIEMPO REAL

| Sub-sección | Descripción | Prioridad | Estado | Progreso |
|-------------|-------------|-----------|--------|----------|
| 2.4.1 | Configurar Socket.IO | CRÍTICA | ⬜ Pendiente | 0% |
| 2.4.2 | Ubicación en Vivo | CRÍTICA | ⬜ Pendiente | 0% |
| 2.4.3 | Estado del Viaje | CRÍTICA | ⬜ Pendiente | 0% |
| 2.4.4 | Matching Automático | CRÍTICA | ⬜ Pendiente | 0% |
| 2.4.5 | Disponibilidad Conductores | ALTA | ⬜ Pendiente | 0% |

**Total Sub-tareas 2.4:** 32 tareas
**Archivos a crear:** ~12 archivos (handlers, servicios, hooks)
**Dependencias:** socket.io, socket.io-client

**Eventos Socket.IO Principales:**
| Evento | Emisor | Receptor | Descripción |
|--------|--------|----------|-------------|
| `driver:location:update` | Conductor | Backend | Envía ubicación |
| `driver:location` | Backend | Usuario | Recibe ubicación |
| `ride:request` | Usuario | Backend | Solicita viaje |
| `ride:available` | Backend | Conductor | Nuevo viaje disponible |
| `ride:accept` | Conductor | Backend | Acepta viaje |
| `ride:status_changed` | Backend | Ambos | Cambio de estado |
| `driver:availability` | Conductor | Backend | Cambia disponibilidad |

**Rooms Socket.IO:**
| Room | Miembros | Propósito |
|------|----------|-----------|
| `user:{userId}` | Usuario | Notificaciones personales |
| `driver:{driverId}` | Conductor | Notificaciones de viajes |
| `ride:{rideId}` | Usuario + Conductor | Comunicación del viaje |
| `drivers:available` | Conductores online | Matching de viajes |

---

## 2.5 SISTEMA DE RATING
**Estado: PENDIENTE**
**Prioridad: ALTA**
**Descripción:** Sistema completo de calificaciones bidireccionales entre usuarios y conductores

---

### 2.5.1 BASE DE DATOS - MODELO DE RATINGS
**Estado: PENDIENTE**
**Prioridad: ALTA**

#### 2.5.1.1 Tabla Principal de Ratings
- [ ] Crear tabla `ratings` en Supabase:
  ```sql
  CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Referencias
    ride_id UUID REFERENCES rides(id),
    delivery_id UUID REFERENCES deliveries(id),
    flete_id UUID REFERENCES fletes(id),

    -- Participantes
    from_user_id UUID REFERENCES profiles(id) NOT NULL,
    to_user_id UUID REFERENCES profiles(id) NOT NULL,

    -- Tipo de rating
    type VARCHAR(20) NOT NULL, -- 'user_to_driver', 'driver_to_user'
    service_type VARCHAR(20), -- 'vuelta_segura', 'envios', 'fletes', 'chofer'

    -- Calificación
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    -- Tags de feedback rápido
    tags JSONB DEFAULT '[]', -- ['puntual', 'amable', 'limpio', 'seguro']

    -- Metadata
    is_anonymous BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    is_reported BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_service_reference CHECK (
      (ride_id IS NOT NULL AND delivery_id IS NULL AND flete_id IS NULL) OR
      (ride_id IS NULL AND delivery_id IS NOT NULL AND flete_id IS NULL) OR
      (ride_id IS NULL AND delivery_id IS NULL AND flete_id IS NOT NULL)
    ),
    CONSTRAINT different_users CHECK (from_user_id != to_user_id)
  );
  ```

#### 2.5.1.2 Tabla de Tags de Rating
- [ ] Crear tabla `rating_tags`:
  ```sql
  CREATE TABLE rating_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10),
    type VARCHAR(20), -- 'positive', 'negative', 'neutral'
    applies_to VARCHAR(20), -- 'driver', 'user', 'both'
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Tags predefinidos
  INSERT INTO rating_tags (name, display_name, emoji, type, applies_to, sort_order) VALUES
  ('punctual', 'Puntual', '⏰', 'positive', 'driver', 1),
  ('friendly', 'Amable', '😊', 'positive', 'both', 2),
  ('clean_vehicle', 'Vehículo Limpio', '✨', 'positive', 'driver', 3),
  ('safe_driving', 'Manejo Seguro', '🛡️', 'positive', 'driver', 4),
  ('good_conversation', 'Buena Conversación', '💬', 'positive', 'both', 5),
  ('professional', 'Profesional', '👔', 'positive', 'driver', 6),
  ('helpful', 'Servicial', '🤝', 'positive', 'driver', 7),
  ('fast', 'Rápido', '🚀', 'positive', 'driver', 8),
  ('respectful', 'Respetuoso', '🙏', 'positive', 'both', 9),
  ('late', 'Llegó Tarde', '⌛', 'negative', 'driver', 10),
  ('rude', 'Poco Amable', '😤', 'negative', 'both', 11),
  ('dirty_vehicle', 'Vehículo Sucio', '🚗', 'negative', 'driver', 12),
  ('unsafe_driving', 'Manejo Peligroso', '⚠️', 'negative', 'driver', 13);
  ```

#### 2.5.1.3 Tabla de Estadísticas de Rating
- [ ] Crear tabla `rating_stats`:
  ```sql
  CREATE TABLE rating_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) UNIQUE,

    -- Estadísticas como conductor
    driver_total_ratings INTEGER DEFAULT 0,
    driver_average_rating DECIMAL(3,2) DEFAULT 0.00,
    driver_rating_breakdown JSONB DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}',
    driver_positive_tags JSONB DEFAULT '{}', -- {"punctual": 45, "friendly": 32}
    driver_negative_tags JSONB DEFAULT '{}',

    -- Estadísticas como usuario
    user_total_ratings INTEGER DEFAULT 0,
    user_average_rating DECIMAL(3,2) DEFAULT 0.00,
    user_rating_breakdown JSONB DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}',

    -- Contadores por servicio (como conductor)
    vuelta_segura_avg DECIMAL(3,2) DEFAULT 0.00,
    vuelta_segura_count INTEGER DEFAULT 0,
    envios_avg DECIMAL(3,2) DEFAULT 0.00,
    envios_count INTEGER DEFAULT 0,
    fletes_avg DECIMAL(3,2) DEFAULT 0.00,
    fletes_count INTEGER DEFAULT 0,
    chofer_avg DECIMAL(3,2) DEFAULT 0.00,
    chofer_count INTEGER DEFAULT 0,

    -- Timestamps
    last_rating_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

#### 2.5.1.4 Tabla de Reportes de Ratings
- [ ] Crear tabla `rating_reports`:
  ```sql
  CREATE TABLE rating_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rating_id UUID REFERENCES ratings(id),
    reported_by UUID REFERENCES profiles(id),
    reason VARCHAR(50), -- 'inappropriate', 'false_info', 'harassment', 'spam'
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'action_taken', 'dismissed'
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

#### 2.5.1.5 Índices y RLS
- [ ] Crear índices para optimización:
  ```sql
  CREATE INDEX idx_ratings_from_user ON ratings(from_user_id);
  CREATE INDEX idx_ratings_to_user ON ratings(to_user_id);
  CREATE INDEX idx_ratings_ride ON ratings(ride_id);
  CREATE INDEX idx_ratings_delivery ON ratings(delivery_id);
  CREATE INDEX idx_ratings_created ON ratings(created_at DESC);
  CREATE INDEX idx_rating_stats_user ON rating_stats(user_id);
  ```
- [ ] Configurar Row Level Security:
  ```sql
  ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

  -- Ver ratings públicos
  CREATE POLICY "ratings_select" ON ratings FOR SELECT
    USING (is_visible = true OR from_user_id = auth.uid() OR to_user_id = auth.uid());

  -- Crear rating solo si participó en el viaje
  CREATE POLICY "ratings_insert" ON ratings FOR INSERT
    WITH CHECK (from_user_id = auth.uid());
  ```

**Auditoría 2.5.1:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.5.1.1 Tabla ratings | ⬜ Pendiente | - | - | |
| 2.5.1.2 Tabla rating_tags | ⬜ Pendiente | - | - | |
| 2.5.1.3 Tabla rating_stats | ⬜ Pendiente | - | - | |
| 2.5.1.4 Tabla rating_reports | ⬜ Pendiente | - | - | |
| 2.5.1.5 Índices y RLS | ⬜ Pendiente | - | - | |

---

### 2.5.2 BACKEND - SERVICIOS DE RATING
**Estado: PENDIENTE**
**Prioridad: ALTA**

#### 2.5.2.1 Servicio Principal de Ratings
- [ ] Crear `/backend/services/rating.service.js`:
  ```javascript
  const ratingService = {
    // Crear rating
    async createRating(data) {
      const { fromUserId, toUserId, serviceType, serviceId, rating, comment, tags } = data;

      // Validar que el servicio existe y está completado
      const service = await this.getCompletedService(serviceType, serviceId);
      if (!service) throw new Error('Servicio no encontrado o no completado');

      // Validar que el usuario participó en el servicio
      const isParticipant = await this.validateParticipant(fromUserId, service);
      if (!isParticipant) throw new Error('No participaste en este servicio');

      // Verificar si ya existe rating
      const existingRating = await this.getExistingRating(fromUserId, serviceType, serviceId);
      if (existingRating) throw new Error('Ya calificaste este servicio');

      // Verificar tiempo límite (48 horas)
      const hoursSinceCompletion = this.getHoursSince(service.completed_at);
      if (hoursSinceCompletion > 48) throw new Error('El tiempo para calificar ha expirado');

      // Crear rating
      const newRating = await supabase.from('ratings').insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        [this.getServiceColumn(serviceType)]: serviceId,
        type: this.getRatingType(fromUserId, service),
        service_type: serviceType,
        rating,
        comment,
        tags
      }).select().single();

      // Actualizar estadísticas
      await this.updateRatingStats(toUserId);

      // Actualizar Trust Points
      await trustPointsService.addPointsFromRating(toUserId, rating);

      return newRating;
    },

    // Obtener ratings de un usuario
    async getUserRatings(userId, type = 'received', filters = {}) {
      let query = supabase.from('ratings')
        .select(`
          *,
          from_user:profiles!from_user_id(id, full_name, avatar_url),
          ride:rides(id, pickup_address, dropoff_address)
        `)
        .eq('is_visible', true);

      if (type === 'received') {
        query = query.eq('to_user_id', userId);
      } else {
        query = query.eq('from_user_id', userId);
      }

      if (filters.serviceType) {
        query = query.eq('service_type', filters.serviceType);
      }

      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      return query.order('created_at', { ascending: false }).limit(filters.limit || 20);
    },

    // Obtener estadísticas
    async getRatingStats(userId) {
      const { data } = await supabase
        .from('rating_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      return data;
    },

    // Actualizar estadísticas de rating
    async updateRatingStats(userId) {
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating, tags, service_type')
        .eq('to_user_id', userId);

      if (!ratings || ratings.length === 0) return;

      // Calcular promedios
      const total = ratings.length;
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      const average = (sum / total).toFixed(2);

      // Calcular breakdown
      const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(r => breakdown[r.rating]++);

      // Contar tags
      const tagCounts = {};
      ratings.forEach(r => {
        (r.tags || []).forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      await supabase.from('rating_stats').upsert({
        user_id: userId,
        driver_total_ratings: total,
        driver_average_rating: average,
        driver_rating_breakdown: breakdown,
        driver_positive_tags: tagCounts,
        last_rating_at: new Date(),
        updated_at: new Date()
      });
    }
  };
  ```

#### 2.5.2.2 Servicio de Validación de Ratings
- [ ] Validar que el viaje/servicio está completado
- [ ] Validar que el usuario fue participante
- [ ] Validar tiempo límite de 48 horas
- [ ] Validar que no existe rating duplicado
- [ ] Validar rating entre 1 y 5
- [ ] Sanitizar comentarios (filtrar palabras ofensivas)

#### 2.5.2.3 Servicio de Cálculo de Promedios
- [ ] Calcular promedio general
- [ ] Calcular promedio por tipo de servicio
- [ ] Calcular promedio últimos 30 días
- [ ] Calcular tendencia (subiendo/bajando)
- [ ] Job nocturno para recalcular estadísticas

**Auditoría 2.5.2:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.5.2.1 Servicio Principal | ⬜ Pendiente | - | - | |
| 2.5.2.2 Validaciones | ⬜ Pendiente | - | - | |
| 2.5.2.3 Cálculo Promedios | ⬜ Pendiente | - | - | |

---

### 2.5.3 BACKEND - CONTROLLER Y RUTAS
**Estado: PENDIENTE**
**Prioridad: ALTA**

#### 2.5.3.1 Rating Controller
- [ ] Crear `/backend/controllers/rating.controller.js`:
  ```javascript
  const ratingController = {
    // Crear rating
    async create(req, res) {
      const { serviceType, serviceId, rating, comment, tags } = req.body;
      const fromUserId = req.user.id;

      // Obtener el ID del otro participante
      const toUserId = await ratingService.getOtherParticipant(serviceType, serviceId, fromUserId);

      const newRating = await ratingService.createRating({
        fromUserId,
        toUserId,
        serviceType,
        serviceId,
        rating,
        comment,
        tags
      });

      res.status(201).json({ success: true, data: newRating });
    },

    // Verificar si puede calificar
    async canRate(req, res) {
      const { serviceType, serviceId } = req.params;
      const userId = req.user.id;

      const canRate = await ratingService.canUserRate(userId, serviceType, serviceId);
      const hoursRemaining = await ratingService.getHoursRemaining(serviceType, serviceId);

      res.json({
        canRate,
        hoursRemaining,
        reason: canRate ? null : 'Ya calificaste o el tiempo expiró'
      });
    },

    // Obtener ratings recibidos
    async getReceived(req, res) {
      const userId = req.params.userId || req.user.id;
      const { serviceType, page = 1, limit = 20 } = req.query;

      const ratings = await ratingService.getUserRatings(userId, 'received', {
        serviceType,
        limit,
        offset: (page - 1) * limit
      });

      res.json({ success: true, data: ratings });
    },

    // Obtener estadísticas
    async getStats(req, res) {
      const userId = req.params.userId || req.user.id;
      const stats = await ratingService.getRatingStats(userId);

      res.json({ success: true, data: stats });
    },

    // Obtener tags disponibles
    async getTags(req, res) {
      const { appliesTo } = req.query;
      const tags = await ratingService.getAvailableTags(appliesTo);

      res.json({ success: true, data: tags });
    },

    // Reportar rating
    async report(req, res) {
      const { ratingId } = req.params;
      const { reason, description } = req.body;

      const report = await ratingService.reportRating({
        ratingId,
        reportedBy: req.user.id,
        reason,
        description
      });

      res.json({ success: true, data: report });
    }
  };
  ```

#### 2.5.3.2 Rating Routes
- [ ] Crear `/backend/routes/rating.routes.js`:
  ```javascript
  router.post('/', authMiddleware, ratingController.create);
  router.get('/can-rate/:serviceType/:serviceId', authMiddleware, ratingController.canRate);
  router.get('/received', authMiddleware, ratingController.getReceived);
  router.get('/received/:userId', ratingController.getReceived);
  router.get('/given', authMiddleware, ratingController.getGiven);
  router.get('/stats', authMiddleware, ratingController.getStats);
  router.get('/stats/:userId', ratingController.getStats);
  router.get('/tags', ratingController.getTags);
  router.post('/:ratingId/report', authMiddleware, ratingController.report);
  ```

**Auditoría 2.5.3:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.5.3.1 Rating Controller | ⬜ Pendiente | - | - | |
| 2.5.3.2 Rating Routes | ⬜ Pendiente | - | - | |

---

### 2.5.4 FRONTEND - PANTALLAS DE RATING
**Estado: PENDIENTE**
**Prioridad: ALTA**

#### 2.5.4.1 Pantalla de Calificación Post-Viaje
- [ ] Crear `/src/screens/rating/RateRideScreen.js`:
  ```javascript
  const RateRideScreen = ({ route, navigation }) => {
    const { serviceType, serviceId, driverName, driverAvatar } = route.params;
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);

    const availableTags = [
      { id: 'punctual', label: 'Puntual', emoji: '⏰' },
      { id: 'friendly', label: 'Amable', emoji: '😊' },
      { id: 'clean_vehicle', label: 'Vehículo Limpio', emoji: '✨' },
      { id: 'safe_driving', label: 'Manejo Seguro', emoji: '🛡️' },
      { id: 'professional', label: 'Profesional', emoji: '👔' },
    ];

    const submitRating = async () => {
      if (rating === 0) {
        Alert.alert('Error', 'Por favor selecciona una calificación');
        return;
      }

      setLoading(true);
      try {
        await ratingService.createRating({
          serviceType,
          serviceId,
          rating,
          comment: comment.trim(),
          tags: selectedTags
        });

        navigation.replace('RatingSuccess');
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Avatar source={{ uri: driverAvatar }} size={80} />
          <Text style={styles.title}>¿Cómo estuvo tu viaje?</Text>
          <Text style={styles.subtitle}>Califica a {driverName}</Text>
        </View>

        <StarRating
          rating={rating}
          onChange={setRating}
          size={48}
        />

        <View style={styles.tagsContainer}>
          <Text style={styles.tagsLabel}>¿Qué destacarías?</Text>
          <View style={styles.tags}>
            {availableTags.map(tag => (
              <TagChip
                key={tag.id}
                label={`${tag.emoji} ${tag.label}`}
                selected={selectedTags.includes(tag.id)}
                onPress={() => toggleTag(tag.id)}
              />
            ))}
          </View>
        </View>

        <TextInput
          style={styles.commentInput}
          placeholder="Deja un comentario (opcional)"
          multiline
          maxLength={500}
          value={comment}
          onChangeText={setComment}
        />

        <Button
          title="Enviar Calificación"
          onPress={submitRating}
          loading={loading}
        />

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>Omitir por ahora</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  };
  ```

#### 2.5.4.2 Componente de Estrellas Interactivo
- [ ] Crear `/src/components/rating/StarRating.js`:
  ```javascript
  const StarRating = ({ rating, onChange, size = 32, readonly = false }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const renderStar = (index) => {
      const starValue = index + 1;
      const filled = readonly
        ? starValue <= rating
        : starValue <= (hoverRating || rating);

      return (
        <TouchableOpacity
          key={index}
          onPress={() => !readonly && onChange(starValue)}
          onPressIn={() => !readonly && setHoverRating(starValue)}
          onPressOut={() => setHoverRating(0)}
          disabled={readonly}
        >
          <Ionicons
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? '#FFD700' : '#CCCCCC'}
          />
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.starsContainer}>
        {[0, 1, 2, 3, 4].map(renderStar)}
      </View>
    );
  };
  ```

#### 2.5.4.3 Componente de Tags de Rating
- [ ] Crear `/src/components/rating/TagChip.js`:
  ```javascript
  const TagChip = ({ label, selected, onPress }) => (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
  ```

#### 2.5.4.4 Pantalla de Éxito
- [ ] Crear `/src/screens/rating/RatingSuccessScreen.js`
- [ ] Animación de confirmación
- [ ] Mensaje de agradecimiento
- [ ] Botón para volver al inicio

**Auditoría 2.5.4:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.5.4.1 Pantalla RateRide | ⬜ Pendiente | - | - | |
| 2.5.4.2 StarRating Component | ⬜ Pendiente | - | - | |
| 2.5.4.3 TagChip Component | ⬜ Pendiente | - | - | |
| 2.5.4.4 Pantalla Success | ⬜ Pendiente | - | - | |

---

### 2.5.5 VISUALIZACIÓN DE RATINGS
**Estado: PENDIENTE**
**Prioridad: MEDIA**

#### 2.5.5.1 Rating en Perfil del Conductor
- [ ] Mostrar rating promedio con estrellas
- [ ] Mostrar número total de viajes/ratings
- [ ] Mostrar tags más frecuentes
- [ ] Gráfico de distribución de ratings

#### 2.5.5.2 Lista de Ratings Recibidos
- [ ] Crear `/src/screens/rating/MyRatingsScreen.js`:
  ```javascript
  const MyRatingsScreen = () => {
    const [ratings, setRatings] = useState([]);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('received');

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.statsCard}>
          <Text style={styles.averageRating}>
            {stats?.driver_average_rating?.toFixed(1)} ⭐
          </Text>
          <Text style={styles.totalRatings}>
            {stats?.driver_total_ratings} calificaciones
          </Text>
          <RatingBreakdown data={stats?.driver_rating_breakdown} />
        </View>

        <TabSelector
          tabs={['Recibidas', 'Dadas']}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <FlatList
          data={ratings}
          renderItem={({ item }) => <RatingCard rating={item} />}
          keyExtractor={item => item.id}
        />
      </SafeAreaView>
    );
  };
  ```

#### 2.5.5.3 Card de Rating Individual
- [ ] Crear `/src/components/rating/RatingCard.js`:
  ```javascript
  const RatingCard = ({ rating }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar source={{ uri: rating.from_user.avatar_url }} size={40} />
        <View>
          <Text style={styles.userName}>{rating.from_user.full_name}</Text>
          <Text style={styles.date}>{formatDate(rating.created_at)}</Text>
        </View>
        <StarRating rating={rating.rating} readonly size={16} />
      </View>

      {rating.comment && (
        <Text style={styles.comment}>{rating.comment}</Text>
      )}

      {rating.tags?.length > 0 && (
        <View style={styles.tags}>
          {rating.tags.map(tag => (
            <Text key={tag} style={styles.tag}>{getTagEmoji(tag)}</Text>
          ))}
        </View>
      )}
    </View>
  );
  ```

#### 2.5.5.4 Componente de Breakdown
- [ ] Crear `/src/components/rating/RatingBreakdown.js`:
  - [ ] Barras de progreso para cada estrella (5 a 1)
  - [ ] Porcentaje de cada calificación
  - [ ] Animación al cargar

#### 2.5.5.5 Badges por Buen Rating
- [ ] Definir badges:
  - [ ] ⭐ Nuevo (< 10 viajes)
  - [ ] 🌟 Bien Calificado (4.5+ con 50+ viajes)
  - [ ] 💎 Excelente (4.8+ con 100+ viajes)
  - [ ] 👑 Top Conductor (4.9+ con 500+ viajes)
- [ ] Mostrar badge en perfil y búsqueda

**Auditoría 2.5.5:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.5.5.1 Rating en Perfil | ⬜ Pendiente | - | - | |
| 2.5.5.2 Lista Ratings | ⬜ Pendiente | - | - | |
| 2.5.5.3 RatingCard | ⬜ Pendiente | - | - | |
| 2.5.5.4 Breakdown | ⬜ Pendiente | - | - | |
| 2.5.5.5 Badges | ⬜ Pendiente | - | - | |

---

### 2.5.6 INTEGRACIÓN CON TRUST POINTS
**Estado: PENDIENTE**
**Prioridad: MEDIA**

#### 2.5.6.1 Puntos por Rating Recibido
- [ ] Definir puntos según rating:
  ```javascript
  const RATING_POINTS = {
    5: +15,  // Excelente
    4: +8,   // Muy bueno
    3: 0,    // Normal
    2: -10,  // Malo
    1: -25   // Muy malo
  };
  ```
- [ ] Actualizar Trust Points automáticamente
- [ ] Notificar cambio de puntos

#### 2.5.6.2 Alertas por Rating Bajo
- [ ] Alerta cuando promedio baja de 4.5
- [ ] Alerta cuando promedio baja de 4.0
- [ ] Suspensión temporal si promedio < 3.5
- [ ] Email/notificación con recomendaciones

#### 2.5.6.3 Bonus por Racha de Buenos Ratings
- [ ] Bonus por 5 ratings de 5 estrellas consecutivos
- [ ] Bonus por mantener 4.8+ durante 30 días
- [ ] Mostrar racha actual en dashboard

**Auditoría 2.5.6:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.5.6.1 Puntos por Rating | ⬜ Pendiente | - | - | |
| 2.5.6.2 Alertas Rating Bajo | ⬜ Pendiente | - | - | |
| 2.5.6.3 Bonus por Racha | ⬜ Pendiente | - | - | |

---

## RESUMEN AUDITORÍA 2.5 - SISTEMA DE RATING

| Sub-sección | Descripción | Prioridad | Estado | Progreso |
|-------------|-------------|-----------|--------|----------|
| 2.5.1 | Base de Datos | ALTA | ⬜ Pendiente | 0% |
| 2.5.2 | Backend Servicios | ALTA | ⬜ Pendiente | 0% |
| 2.5.3 | Controller y Rutas | ALTA | ⬜ Pendiente | 0% |
| 2.5.4 | Frontend Pantallas | ALTA | ⬜ Pendiente | 0% |
| 2.5.5 | Visualización | MEDIA | ⬜ Pendiente | 0% |
| 2.5.6 | Integración Trust Points | MEDIA | ⬜ Pendiente | 0% |

**Total Sub-tareas 2.5:** 23 tareas
**Tablas a crear:** 4 (ratings, rating_tags, rating_stats, rating_reports)
**Archivos a crear:** ~10 archivos
**Componentes:** StarRating, TagChip, RatingCard, RatingBreakdown

---

## 2.6 CHAT USUARIO-CONDUCTOR
**Estado: ✅ INFRAESTRUCTURA COMPLETADA**
**Prioridad: ALTA**
**Descripción:** Sistema de mensajería en tiempo real entre usuarios y conductores durante viajes activos

### IMPLEMENTACIÓN COMPLETADA (2026-01-08):
- ✅ Schema de BD (`chat_schema.sql`) con tablas messages, triggers y funciones
- ✅ Handler WebSocket (`chat.handler.js`) con eventos chat:join, chat:send, chat:typing, chat:read
- ✅ Hooks de chat (`useChat.js`): useChat, useUnreadMessages, useQuickChat
- ✅ ChatScreen.js con UI completa (mensajes, typing indicator, quick replies)
- ✅ ConversationsScreen.js para lista de conversaciones
- ✅ Integración en TripActiveScreen (botón de chat para usuario y conductor)
- ✅ Badge de mensajes no leídos en TabBar (navegación)
- ✅ Notificación push de nuevos mensajes
- ✅ Acceso a mensajes desde menú de perfil (usuario y conductor)

---

### 2.6.1 BASE DE DATOS - MODELO DE CHAT
**Estado: PENDIENTE**
**Prioridad: ALTA**

#### 2.6.1.1 Tabla de Conversaciones
- [ ] Crear tabla `chat_conversations` en Supabase:
  ```sql
  CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Referencias al servicio
    ride_id UUID REFERENCES rides(id),
    delivery_id UUID REFERENCES deliveries(id),
    flete_id UUID REFERENCES fletes(id),

    -- Participantes
    user_id UUID REFERENCES profiles(id) NOT NULL,
    driver_id UUID REFERENCES profiles(id) NOT NULL,

    -- Metadata
    service_type VARCHAR(20), -- 'vuelta_segura', 'envios', 'fletes', 'chofer'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed', 'archived'

    -- Contadores
    total_messages INTEGER DEFAULT 0,
    unread_user INTEGER DEFAULT 0,    -- Mensajes sin leer por usuario
    unread_driver INTEGER DEFAULT 0,  -- Mensajes sin leer por conductor

    -- Último mensaje
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    last_message_by UUID,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT unique_ride_conversation UNIQUE (ride_id),
    CONSTRAINT unique_delivery_conversation UNIQUE (delivery_id),
    CONSTRAINT unique_flete_conversation UNIQUE (flete_id)
  );
  ```

#### 2.6.1.2 Tabla de Mensajes
- [ ] Crear tabla `chat_messages` en Supabase:
  ```sql
  CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES chat_conversations(id) NOT NULL,

    -- Participantes
    sender_id UUID REFERENCES profiles(id) NOT NULL,
    receiver_id UUID REFERENCES profiles(id) NOT NULL,

    -- Contenido
    message_type VARCHAR(20) NOT NULL, -- 'text', 'image', 'location', 'audio', 'quick_reply'
    content TEXT,

    -- Para mensajes de ubicación
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,

    -- Para mensajes de imagen/audio
    media_url TEXT,
    media_thumbnail TEXT,
    media_duration INTEGER, -- Para audio, en segundos

    -- Para mensajes rápidos
    quick_reply_id VARCHAR(50),

    -- Estado del mensaje
    status VARCHAR(20) DEFAULT 'sent', -- 'sending', 'sent', 'delivered', 'read', 'failed'
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

#### 2.6.1.3 Tabla de Mensajes Rápidos
- [ ] Crear tabla `chat_quick_replies` en Supabase:
  ```sql
  CREATE TABLE chat_quick_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    message TEXT NOT NULL,
    emoji VARCHAR(10),
    for_role VARCHAR(20), -- 'user', 'driver', 'both'
    category VARCHAR(50), -- 'arrival', 'waiting', 'problem', 'general'
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Mensajes rápidos predefinidos
  INSERT INTO chat_quick_replies (code, message, emoji, for_role, category, sort_order) VALUES
  ('arriving', 'Estoy llegando', '🚗', 'driver', 'arrival', 1),
  ('arrived', 'Ya llegué', '📍', 'driver', 'arrival', 2),
  ('waiting', 'Te estoy esperando', '⏳', 'driver', 'waiting', 3),
  ('on_my_way', 'Voy en camino', '🏃', 'user', 'arrival', 4),
  ('wait_moment', 'Espérame un momento', '✋', 'user', 'waiting', 5),
  ('coming_down', 'Ya estoy bajando', '🚶', 'user', 'arrival', 6),
  ('cant_find', 'No encuentro la dirección', '❓', 'driver', 'problem', 7),
  ('wrong_address', 'La dirección está incorrecta', '📍', 'driver', 'problem', 8),
  ('traffic', 'Hay mucho tráfico', '🚦', 'driver', 'problem', 9),
  ('call_me', '¿Puedes llamarme?', '📞', 'both', 'general', 10),
  ('thanks', '¡Gracias!', '🙏', 'both', 'general', 11),
  ('cancel_please', 'Necesito cancelar', '❌', 'user', 'problem', 12);
  ```

#### 2.6.1.4 Índices y RLS
- [ ] Crear índices para optimización:
  ```sql
  CREATE INDEX idx_chat_conversations_ride ON chat_conversations(ride_id);
  CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id);
  CREATE INDEX idx_chat_conversations_driver ON chat_conversations(driver_id);
  CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
  CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
  CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
  CREATE INDEX idx_chat_messages_unread ON chat_messages(receiver_id, is_read) WHERE is_read = false;
  ```
- [ ] Configurar Row Level Security:
  ```sql
  ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

  -- Solo participantes pueden ver conversación
  CREATE POLICY "conversation_access" ON chat_conversations FOR ALL
    USING (user_id = auth.uid() OR driver_id = auth.uid());

  -- Solo participantes pueden ver mensajes
  CREATE POLICY "messages_access" ON chat_messages FOR ALL
    USING (
      sender_id = auth.uid() OR
      receiver_id = auth.uid()
    );
  ```

**Auditoría 2.6.1:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.6.1.1 Tabla conversations | ⬜ Pendiente | - | - | |
| 2.6.1.2 Tabla messages | ⬜ Pendiente | - | - | |
| 2.6.1.3 Tabla quick_replies | ⬜ Pendiente | - | - | |
| 2.6.1.4 Índices y RLS | ⬜ Pendiente | - | - | |

---

### 2.6.2 BACKEND - SERVICIOS DE CHAT
**Estado: PENDIENTE**
**Prioridad: ALTA**

#### 2.6.2.1 Servicio Principal de Chat
- [ ] Crear `/backend/services/chat.service.js`:
  ```javascript
  const chatService = {
    // Obtener o crear conversación
    async getOrCreateConversation(serviceType, serviceId, userId, driverId) {
      const serviceColumn = this.getServiceColumn(serviceType);

      // Buscar conversación existente
      let { data: conversation } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq(serviceColumn, serviceId)
        .single();

      // Si no existe, crearla
      if (!conversation) {
        const { data } = await supabase
          .from('chat_conversations')
          .insert({
            [serviceColumn]: serviceId,
            user_id: userId,
            driver_id: driverId,
            service_type: serviceType
          })
          .select()
          .single();
        conversation = data;
      }

      return conversation;
    },

    // Enviar mensaje
    async sendMessage(conversationId, senderId, data) {
      const { messageType, content, location, mediaUrl, quickReplyId } = data;

      // Obtener conversación para saber el receptor
      const { data: conversation } = await supabase
        .from('chat_conversations')
        .select('user_id, driver_id')
        .eq('id', conversationId)
        .single();

      const receiverId = senderId === conversation.user_id
        ? conversation.driver_id
        : conversation.user_id;

      // Crear mensaje
      const { data: message } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          receiver_id: receiverId,
          message_type: messageType,
          content,
          location_lat: location?.lat,
          location_lng: location?.lng,
          location_address: location?.address,
          media_url: mediaUrl,
          quick_reply_id: quickReplyId
        })
        .select(`
          *,
          sender:profiles!sender_id(id, full_name, avatar_url)
        `)
        .single();

      // Actualizar conversación
      await this.updateConversationLastMessage(conversationId, content, senderId, receiverId);

      // Emitir por WebSocket
      io.to(`conversation:${conversationId}`).emit('chat:message', message);

      // Si el receptor está offline, enviar push notification
      const isOnline = await this.isUserOnline(receiverId);
      if (!isOnline) {
        await notificationService.sendChatNotification(receiverId, message);
      }

      return message;
    },

    // Obtener mensajes de conversación
    async getMessages(conversationId, options = {}) {
      const { limit = 50, before, after } = options;

      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!sender_id(id, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }
      if (after) {
        query = query.gt('created_at', after);
      }

      const { data } = await query;
      return data?.reverse() || [];
    },

    // Marcar mensajes como leídos
    async markAsRead(conversationId, userId) {
      const now = new Date();

      await supabase
        .from('chat_messages')
        .update({
          is_read: true,
          read_at: now,
          status: 'read'
        })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('is_read', false);

      // Resetear contador de no leídos
      const { data: conversation } = await supabase
        .from('chat_conversations')
        .select('user_id, driver_id')
        .eq('id', conversationId)
        .single();

      const updateField = userId === conversation.user_id
        ? 'unread_user'
        : 'unread_driver';

      await supabase
        .from('chat_conversations')
        .update({ [updateField]: 0 })
        .eq('id', conversationId);

      // Emitir evento de lectura
      io.to(`conversation:${conversationId}`).emit('chat:read', {
        conversationId,
        readBy: userId,
        readAt: now
      });
    },

    // Actualizar último mensaje
    async updateConversationLastMessage(conversationId, content, senderId, receiverId) {
      const { data: conversation } = await supabase
        .from('chat_conversations')
        .select('user_id, unread_user, unread_driver')
        .eq('id', conversationId)
        .single();

      const isUserSender = senderId === conversation.user_id;
      const unreadField = isUserSender ? 'unread_driver' : 'unread_user';
      const currentUnread = isUserSender
        ? conversation.unread_driver
        : conversation.unread_user;

      await supabase
        .from('chat_conversations')
        .update({
          last_message: content?.substring(0, 100),
          last_message_at: new Date(),
          last_message_by: senderId,
          total_messages: supabase.sql`total_messages + 1`,
          [unreadField]: currentUnread + 1
        })
        .eq('id', conversationId);
    }
  };
  ```

#### 2.6.2.2 Servicio de Mensajes Rápidos
- [ ] Crear `/backend/services/quickReply.service.js`:
  ```javascript
  const quickReplyService = {
    async getQuickReplies(role) {
      const { data } = await supabase
        .from('chat_quick_replies')
        .select('*')
        .eq('is_active', true)
        .or(`for_role.eq.${role},for_role.eq.both`)
        .order('sort_order');

      return data;
    },

    async getQuickReplyContent(code) {
      const { data } = await supabase
        .from('chat_quick_replies')
        .select('message, emoji')
        .eq('code', code)
        .single();

      return data ? `${data.emoji} ${data.message}` : null;
    }
  };
  ```

#### 2.6.2.3 Servicio de Ubicación en Chat
- [ ] Crear handler para compartir ubicación
- [ ] Generar thumbnail de mapa estático
- [ ] Guardar coordenadas en mensaje
- [ ] Mostrar dirección legible

**Auditoría 2.6.2:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.6.2.1 Servicio Principal | ⬜ Pendiente | - | - | |
| 2.6.2.2 Quick Replies | ⬜ Pendiente | - | - | |
| 2.6.2.3 Ubicación en Chat | ⬜ Pendiente | - | - | |

---

### 2.6.3 BACKEND - CONTROLLER Y RUTAS
**Estado: PENDIENTE**
**Prioridad: ALTA**

#### 2.6.3.1 Chat Controller
- [ ] Crear `/backend/controllers/chat.controller.js`:
  ```javascript
  const chatController = {
    // Obtener conversación de un viaje
    async getConversation(req, res) {
      const { serviceType, serviceId } = req.params;
      const userId = req.user.id;

      const conversation = await chatService.getConversationByService(
        serviceType,
        serviceId
      );

      if (!conversation) {
        return res.status(404).json({ error: 'Conversación no encontrada' });
      }

      // Verificar que el usuario es participante
      if (conversation.user_id !== userId && conversation.driver_id !== userId) {
        return res.status(403).json({ error: 'No tienes acceso a esta conversación' });
      }

      res.json({ success: true, data: conversation });
    },

    // Obtener mensajes
    async getMessages(req, res) {
      const { conversationId } = req.params;
      const { limit, before } = req.query;

      const messages = await chatService.getMessages(conversationId, {
        limit: parseInt(limit) || 50,
        before
      });

      res.json({ success: true, data: messages });
    },

    // Enviar mensaje (respaldo HTTP)
    async sendMessage(req, res) {
      const { conversationId } = req.params;
      const { messageType, content, location, mediaUrl, quickReplyId } = req.body;
      const senderId = req.user.id;

      const message = await chatService.sendMessage(conversationId, senderId, {
        messageType,
        content,
        location,
        mediaUrl,
        quickReplyId
      });

      res.status(201).json({ success: true, data: message });
    },

    // Marcar como leído
    async markAsRead(req, res) {
      const { conversationId } = req.params;
      const userId = req.user.id;

      await chatService.markAsRead(conversationId, userId);

      res.json({ success: true });
    },

    // Obtener mensajes rápidos
    async getQuickReplies(req, res) {
      const { role } = req.query;
      const replies = await quickReplyService.getQuickReplies(role || 'both');

      res.json({ success: true, data: replies });
    },

    // Subir imagen para chat
    async uploadImage(req, res) {
      const { conversationId } = req.params;
      const file = req.file;

      const mediaUrl = await storageService.uploadChatImage(
        conversationId,
        file
      );

      res.json({ success: true, data: { mediaUrl } });
    }
  };
  ```

#### 2.6.3.2 Chat Routes
- [ ] Crear `/backend/routes/chat.routes.js`:
  ```javascript
  router.get('/conversation/:serviceType/:serviceId', authMiddleware, chatController.getConversation);
  router.get('/:conversationId/messages', authMiddleware, chatController.getMessages);
  router.post('/:conversationId/messages', authMiddleware, chatController.sendMessage);
  router.put('/:conversationId/read', authMiddleware, chatController.markAsRead);
  router.get('/quick-replies', authMiddleware, chatController.getQuickReplies);
  router.post('/:conversationId/upload', authMiddleware, upload.single('image'), chatController.uploadImage);
  ```

**Auditoría 2.6.3:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.6.3.1 Chat Controller | ⬜ Pendiente | - | - | |
| 2.6.3.2 Chat Routes | ⬜ Pendiente | - | - | |

---

### 2.6.4 CHAT EN TIEMPO REAL (WEBSOCKET)
**Estado: PENDIENTE**
**Prioridad: CRÍTICA**

#### 2.6.4.1 Handlers de Socket.IO para Chat
- [ ] Crear `/backend/socket/handlers/chat.handler.js`:
  ```javascript
  const chatHandler = (io, socket) => {
    // Unirse a conversación
    socket.on('chat:join', async ({ conversationId }) => {
      // Verificar acceso
      const hasAccess = await chatService.verifyAccess(
        conversationId,
        socket.user.id
      );

      if (!hasAccess) {
        socket.emit('chat:error', { message: 'Sin acceso' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      socket.emit('chat:joined', { conversationId });

      // Marcar mensajes como leídos al entrar
      await chatService.markAsRead(conversationId, socket.user.id);
    });

    // Salir de conversación
    socket.on('chat:leave', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Enviar mensaje
    socket.on('chat:send', async ({ conversationId, messageType, content, location, quickReplyId }) => {
      try {
        const message = await chatService.sendMessage(conversationId, socket.user.id, {
          messageType,
          content,
          location,
          quickReplyId
        });

        // El mensaje ya se emite dentro del servicio
      } catch (error) {
        socket.emit('chat:error', {
          message: 'Error al enviar mensaje',
          error: error.message
        });
      }
    });

    // Indicador de escribiendo
    socket.on('chat:typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        conversationId,
        userId: socket.user.id,
        userName: socket.user.full_name,
        isTyping
      });
    });

    // Marcar como leído
    socket.on('chat:read', async ({ conversationId }) => {
      await chatService.markAsRead(conversationId, socket.user.id);
    });
  };
  ```

#### 2.6.4.2 Eventos de Chat
- [ ] Definir eventos Socket.IO:
  ```javascript
  CHAT_EVENTS = {
    // Cliente → Servidor
    JOIN: 'chat:join',
    LEAVE: 'chat:leave',
    SEND: 'chat:send',
    TYPING: 'chat:typing',
    READ: 'chat:read',

    // Servidor → Cliente
    JOINED: 'chat:joined',
    MESSAGE: 'chat:message',
    TYPING_STATUS: 'chat:typing',
    READ_RECEIPT: 'chat:read',
    ERROR: 'chat:error',
    USER_ONLINE: 'chat:user_online',
    USER_OFFLINE: 'chat:user_offline'
  };
  ```

#### 2.6.4.3 Integración con Notificaciones Push
- [ ] Detectar si usuario está en chat activo
- [ ] Si está offline → enviar push notification
- [ ] Si está en otra pantalla → badge de mensajes nuevos
- [ ] Contenido de notificación: "Nuevo mensaje de [nombre]"

**Auditoría 2.6.4:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.6.4.1 Socket Handlers | ⬜ Pendiente | - | - | |
| 2.6.4.2 Eventos Chat | ⬜ Pendiente | - | - | |
| 2.6.4.3 Push Notifications | ⬜ Pendiente | - | - | |

---

### 2.6.5 FRONTEND - PANTALLA DE CHAT
**Estado: PENDIENTE**
**Prioridad: ALTA**

#### 2.6.5.1 Pantalla Principal de Chat
- [ ] Crear `/src/screens/chat/ChatScreen.js`:
  ```javascript
  const ChatScreen = ({ route, navigation }) => {
    const { conversationId, otherUser, serviceInfo } = route.params;
    const { user } = useAuth();
    const { socket } = useSocket();

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [loading, setLoading] = useState(true);

    const flatListRef = useRef();
    const typingTimeoutRef = useRef();

    useEffect(() => {
      // Cargar mensajes iniciales
      loadMessages();

      // Unirse a la conversación
      socket.emit('chat:join', { conversationId });

      // Listeners
      socket.on('chat:message', handleNewMessage);
      socket.on('chat:typing', handleTypingStatus);
      socket.on('chat:read', handleReadReceipt);

      return () => {
        socket.emit('chat:leave', { conversationId });
        socket.off('chat:message');
        socket.off('chat:typing');
        socket.off('chat:read');
      };
    }, [conversationId]);

    const loadMessages = async () => {
      const response = await chatApi.getMessages(conversationId);
      setMessages(response.data);
      setLoading(false);
    };

    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();

      // Marcar como leído si estamos en el chat
      if (message.sender_id !== user.id) {
        socket.emit('chat:read', { conversationId });
      }
    };

    const handleTypingStatus = ({ userId, isTyping }) => {
      if (userId !== user.id) {
        setOtherUserTyping(isTyping);
      }
    };

    const sendMessage = () => {
      if (!inputText.trim()) return;

      socket.emit('chat:send', {
        conversationId,
        messageType: 'text',
        content: inputText.trim()
      });

      setInputText('');
      stopTyping();
    };

    const handleTextChange = (text) => {
      setInputText(text);

      // Emitir typing
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('chat:typing', { conversationId, isTyping: true });
      }

      // Reset timeout
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(stopTyping, 2000);
    };

    const stopTyping = () => {
      setIsTyping(false);
      socket.emit('chat:typing', { conversationId, isTyping: false });
    };

    const sendQuickReply = (reply) => {
      socket.emit('chat:send', {
        conversationId,
        messageType: 'quick_reply',
        content: `${reply.emoji} ${reply.message}`,
        quickReplyId: reply.code
      });
    };

    const sendLocation = async () => {
      const location = await getCurrentLocation();
      const address = await reverseGeocode(location);

      socket.emit('chat:send', {
        conversationId,
        messageType: 'location',
        content: address,
        location: {
          lat: location.latitude,
          lng: location.longitude,
          address
        }
      });
    };

    return (
      <SafeAreaView style={styles.container}>
        <ChatHeader
          user={otherUser}
          serviceInfo={serviceInfo}
          onCall={() => makeCall(otherUser.phone)}
          onBack={() => navigation.goBack()}
        />

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender_id === user.id}
            />
          )}
          keyExtractor={item => item.id}
          inverted={false}
          onEndReached={loadMoreMessages}
          ListFooterComponent={
            otherUserTyping && <TypingIndicator name={otherUser.full_name} />
          }
        />

        <QuickRepliesBar
          onSelect={sendQuickReply}
          userRole={user.is_driver ? 'driver' : 'user'}
        />

        <ChatInput
          value={inputText}
          onChangeText={handleTextChange}
          onSend={sendMessage}
          onSendLocation={sendLocation}
          onAttach={openImagePicker}
        />
      </SafeAreaView>
    );
  };
  ```

#### 2.6.5.2 Hook de Chat
- [ ] Crear `/src/hooks/useChat.js`:
  ```javascript
  const useChat = (conversationId) => {
    const { socket } = useSocket();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);

    const loadMessages = async (before = null) => {
      const response = await chatApi.getMessages(conversationId, { before });

      if (before) {
        setMessages(prev => [...response.data, ...prev]);
      } else {
        setMessages(response.data);
      }

      setHasMore(response.data.length === 50);
      setLoading(false);
    };

    const sendMessage = (messageType, content, extras = {}) => {
      socket.emit('chat:send', {
        conversationId,
        messageType,
        content,
        ...extras
      });
    };

    const markAsRead = () => {
      socket.emit('chat:read', { conversationId });
    };

    return {
      messages,
      loading,
      hasMore,
      loadMessages,
      sendMessage,
      markAsRead
    };
  };
  ```

**Auditoría 2.6.5:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.6.5.1 ChatScreen | ⬜ Pendiente | - | - | |
| 2.6.5.2 useChat Hook | ⬜ Pendiente | - | - | |

---

### 2.6.6 COMPONENTES DE CHAT
**Estado: PENDIENTE**
**Prioridad: ALTA**

#### 2.6.6.1 Burbuja de Mensaje
- [ ] Crear `/src/components/chat/MessageBubble.js`:
  ```javascript
  const MessageBubble = ({ message, isOwn }) => {
    const renderContent = () => {
      switch (message.message_type) {
        case 'text':
        case 'quick_reply':
          return <Text style={styles.text}>{message.content}</Text>;

        case 'location':
          return (
            <TouchableOpacity onPress={() => openMaps(message.location_lat, message.location_lng)}>
              <Image
                source={{ uri: getStaticMapUrl(message.location_lat, message.location_lng) }}
                style={styles.locationImage}
              />
              <Text style={styles.locationText}>{message.location_address}</Text>
            </TouchableOpacity>
          );

        case 'image':
          return (
            <TouchableOpacity onPress={() => openImageViewer(message.media_url)}>
              <Image
                source={{ uri: message.media_thumbnail || message.media_url }}
                style={styles.imageMessage}
              />
            </TouchableOpacity>
          );

        default:
          return <Text>{message.content}</Text>;
      }
    };

    return (
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {renderContent()}
        <View style={styles.footer}>
          <Text style={styles.time}>{formatTime(message.created_at)}</Text>
          {isOwn && <MessageStatus status={message.status} />}
        </View>
      </View>
    );
  };
  ```

#### 2.6.6.2 Input de Chat
- [ ] Crear `/src/components/chat/ChatInput.js`:
  ```javascript
  const ChatInput = ({ value, onChangeText, onSend, onSendLocation, onAttach }) => {
    return (
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={onAttach} style={styles.attachButton}>
          <Ionicons name="attach" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onSendLocation} style={styles.locationButton}>
          <Ionicons name="location" size={24} color="#666" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Escribe un mensaje..."
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          onPress={onSend}
          style={[styles.sendButton, !value.trim() && styles.sendButtonDisabled]}
          disabled={!value.trim()}
        >
          <Ionicons name="send" size={24} color={value.trim() ? '#007AFF' : '#CCC'} />
        </TouchableOpacity>
      </View>
    );
  };
  ```

#### 2.6.6.3 Indicador de Escribiendo
- [ ] Crear `/src/components/chat/TypingIndicator.js`:
  ```javascript
  const TypingIndicator = ({ name }) => (
    <View style={styles.typingContainer}>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
      </View>
      <Text style={styles.typingText}>{name} está escribiendo...</Text>
    </View>
  );
  ```

#### 2.6.6.4 Estado del Mensaje
- [ ] Crear `/src/components/chat/MessageStatus.js`:
  ```javascript
  const MessageStatus = ({ status }) => {
    const getIcon = () => {
      switch (status) {
        case 'sending':
          return <ActivityIndicator size="small" />;
        case 'sent':
          return <Ionicons name="checkmark" size={14} color="#999" />;
        case 'delivered':
          return <Ionicons name="checkmark-done" size={14} color="#999" />;
        case 'read':
          return <Ionicons name="checkmark-done" size={14} color="#007AFF" />;
        case 'failed':
          return <Ionicons name="alert-circle" size={14} color="#FF3B30" />;
        default:
          return null;
      }
    };

    return <View style={styles.status}>{getIcon()}</View>;
  };
  ```

#### 2.6.6.5 Barra de Respuestas Rápidas
- [ ] Crear `/src/components/chat/QuickRepliesBar.js`:
  ```javascript
  const QuickRepliesBar = ({ onSelect, userRole }) => {
    const [replies, setReplies] = useState([]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
      loadQuickReplies();
    }, [userRole]);

    const loadQuickReplies = async () => {
      const response = await chatApi.getQuickReplies(userRole);
      setReplies(response.data);
    };

    if (!expanded) {
      return (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpanded(true)}
        >
          <Ionicons name="flash" size={20} color="#007AFF" />
          <Text style={styles.expandText}>Respuestas rápidas</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {replies.map(reply => (
            <TouchableOpacity
              key={reply.id}
              style={styles.replyChip}
              onPress={() => {
                onSelect(reply);
                setExpanded(false);
              }}
            >
              <Text style={styles.replyEmoji}>{reply.emoji}</Text>
              <Text style={styles.replyText}>{reply.message}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={() => setExpanded(false)}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };
  ```

#### 2.6.6.6 Header de Chat
- [ ] Crear `/src/components/chat/ChatHeader.js`:
  - [ ] Avatar del otro usuario
  - [ ] Nombre y rol (Usuario/Conductor)
  - [ ] Estado (En línea / Última vez)
  - [ ] Botón de llamar
  - [ ] Información del viaje

**Auditoría 2.6.6:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.6.6.1 MessageBubble | ⬜ Pendiente | - | - | |
| 2.6.6.2 ChatInput | ⬜ Pendiente | - | - | |
| 2.6.6.3 TypingIndicator | ⬜ Pendiente | - | - | |
| 2.6.6.4 MessageStatus | ⬜ Pendiente | - | - | |
| 2.6.6.5 QuickRepliesBar | ⬜ Pendiente | - | - | |
| 2.6.6.6 ChatHeader | ⬜ Pendiente | - | - | |

---

### 2.6.7 FUNCIONALIDADES ADICIONALES
**Estado: PENDIENTE**
**Prioridad: MEDIA**

#### 2.6.7.1 Compartir Ubicación en Tiempo Real
- [ ] Botón para iniciar compartición de ubicación
- [ ] Actualizar ubicación cada 10 segundos mientras está activo
- [ ] Mostrar mapa con posición actualizada
- [ ] Opción para detener compartición

#### 2.6.7.2 Llamadas Directas
- [ ] Botón de llamar en header del chat
- [ ] Abrir aplicación de teléfono con número
- [ ] Registro de llamadas realizadas
- [ ] Número enmascarado (opcional, para privacidad)

#### 2.6.7.3 Reportar Problema desde Chat
- [ ] Botón de menú con opción "Reportar problema"
- [ ] Modal con razones de reporte
- [ ] Adjuntar screenshots del chat
- [ ] Enviar a soporte

#### 2.6.7.4 Historial de Chats
- [ ] Crear `/src/screens/chat/ChatHistoryScreen.js`
- [ ] Lista de conversaciones pasadas
- [ ] Filtrar por servicio/fecha
- [ ] Buscar en mensajes
- [ ] Chat de solo lectura para viajes completados

**Auditoría 2.6.7:**
| Tarea | Estado | Fecha Inicio | Fecha Fin | Notas |
|-------|--------|--------------|-----------|-------|
| 2.6.7.1 Ubicación Real-time | ⬜ Pendiente | - | - | |
| 2.6.7.2 Llamadas Directas | ⬜ Pendiente | - | - | |
| 2.6.7.3 Reportar Problema | ⬜ Pendiente | - | - | |
| 2.6.7.4 Historial | ⬜ Pendiente | - | - | |

---

## RESUMEN AUDITORÍA 2.6 - CHAT USUARIO-CONDUCTOR

| Sub-sección | Descripción | Prioridad | Estado | Progreso |
|-------------|-------------|-----------|--------|----------|
| 2.6.1 | Base de Datos | ALTA | ✅ Completado | 100% |
| 2.6.2 | Backend Servicios | ALTA | ✅ Completado | 100% |
| 2.6.3 | Controller y Rutas | ALTA | ✅ Completado | 100% |
| 2.6.4 | WebSocket Chat | CRÍTICA | ✅ Completado | 100% |
| 2.6.5 | Frontend Pantallas | ALTA | ✅ Completado | 100% |
| 2.6.6 | Componentes | ALTA | ✅ Completado | 90% |
| 2.6.7 | Funcionalidades Extra | MEDIA | ⬜ Pendiente | 0% |

**Total Sub-tareas 2.6:** 27 tareas
**Tablas a crear:** 3 (chat_conversations, chat_messages, chat_quick_replies)
**Archivos a crear:** ~12 archivos
**Componentes:** MessageBubble, ChatInput, TypingIndicator, MessageStatus, QuickRepliesBar, ChatHeader

**Eventos WebSocket Chat:**
| Evento | Emisor | Receptor | Descripción |
|--------|--------|----------|-------------|
| `chat:join` | Cliente | Servidor | Unirse a conversación |
| `chat:leave` | Cliente | Servidor | Salir de conversación |
| `chat:send` | Cliente | Servidor | Enviar mensaje |
| `chat:message` | Servidor | Clientes | Nuevo mensaje |
| `chat:typing` | Cliente | Servidor/Cliente | Indicador escribiendo |
| `chat:read` | Cliente | Servidor/Cliente | Mensaje leído |

---

## RESUMEN AUDITORÍA FASE 2

| Paso | Descripción | Sub-tareas | Prioridad | Estado | Progreso |
|------|-------------|------------|-----------|--------|----------|
| 2.1 | Sistema de Pagos | 56 | CRÍTICO | ✅ Infraestructura | 87% |
| 2.2 | Google Maps Completo | 42 | CRÍTICO | 🔄 En Progreso | 40% |
| 2.3 | Notificaciones Push | 45 | CRÍTICO | ⬜ Pendiente | 0% |
| 2.5 | WebSockets / Tiempo Real | 32 | CRÍTICO | 🔄 En Progreso | 30% |
| 2.4 | Sistema de Rating | 23 | ALTA | ✅ Infraestructura | 90% |
| 2.6 | Chat Usuario-Conductor | 27 | ALTA | ✅ Infraestructura | 90% |

**Total Sub-tareas Fase 2:** 225+ tareas detalladas
**Completadas:** ~150
**En Progreso:** ~30
**Pendientes:** ~45

---

## Tablas de Base de Datos a Crear (Fase 2)

| Sistema | Tablas | Descripción |
|---------|--------|-------------|
| Pagos | 10 | user_wallets, wallet_transactions, driver_wallets, driver_earnings, driver_withdrawals, bank_accounts, payments, invoices, refunds, payment_splits |
| Notificaciones | 2 | push_tokens, notification_logs |
| Ubicación | 1 | driver_locations |
| Rating | 4 | ratings, rating_tags, rating_stats, rating_reports |
| Chat | 3 | chat_conversations, chat_messages, chat_quick_replies |

**Total Tablas Nuevas:** 20 tablas

---

## Archivos a Crear por Sistema

| Sistema | Backend | Frontend | Total |
|---------|---------|----------|-------|
| 2.1 Pagos | ~15 | ~12 | ~27 |
| 2.2 Google Maps | ~8 | ~10 | ~18 |
| 2.3 Notificaciones | ~10 | ~6 | ~16 |
| 2.5 WebSockets | ~12 | ~8 | ~20 |
| 2.4 Rating | ~6 | ~8 | ~14 |
| 2.6 Chat | ~8 | ~10 | ~18 |

**Total Archivos Nuevos:** ~113 archivos

---

## Dependencias entre Pasos Fase 2

```
2.5 WebSockets ──────┬──> 2.6 Chat (requiere tiempo real)
                     │
                     └──> 2.2 Google Maps (tracking requiere tiempo real)
                              │
                              └──> 2.3 Notificaciones (notificar ubicación)

2.1 Pagos ──────────────> Independiente (puede iniciarse primero)

2.5 Rating ─────────────> Requiere viajes completados funcionales

2.6 Chat ───────────────> Requiere 2.5 WebSockets + 2.3 Notificaciones
```

**Orden Recomendado de Implementación:**
1. **2.1 Sistema de Pagos** - Puede desarrollarse en paralelo (independiente)
2. **2.5 WebSockets** - Base fundamental para tiempo real ✅ INFRAESTRUCTURA COMPLETADA
3. **2.2 Google Maps** - Tracking depende de WebSockets
4. **2.3 Notificaciones Push** - Alertas del sistema
5. **2.5 Sistema de Rating** - Post-viaje, depende de viajes funcionales
6. **2.6 Chat** - Comunicación en tiempo real (depende de 2.4)

---

## Dependencias NPM a Instalar (Fase 2)

**Backend:**
```bash
npm install mercadopago socket.io firebase-admin
```

**Frontend:**
```bash
npx expo install expo-notifications expo-location react-native-maps
npm install socket.io-client @mercadopago/sdk-react
```

---

## Resumen Ejecutivo Fase 2

| Métrica | Valor |
|---------|-------|
| Sub-tareas totales | 225+ |
| Tablas de BD nuevas | 20 |
| Archivos nuevos | ~113 |
| Paquetes NPM nuevos | ~8 |
| APIs externas | MercadoPago, Google Maps, Firebase |
| Prioridad | CRÍTICA - Bloqueante para lanzamiento |

---

*Última actualización: 3 Enero 2026*
*FASE 0 COMPLETADA - App React Native funcional con 40+ pantallas*
*FASE 1 COMPLETADA - Infraestructura de Conductores*
*FASE 2 EN PROGRESO - Funcionalidades Core de Producción*
