import { registerRootComponent } from 'expo';

import App from './App';

// Registra el task de ubicación en background del chofer (debe ejecutarse al
// iniciar la app, incluso en relanzamientos headless en segundo plano).
import './src/services/driverPresence.service';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
