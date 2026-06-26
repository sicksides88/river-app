import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

import DriverEarningsScreen from '../screens/driver/earnings/DriverEarningsScreen';
import EarningsDetailScreen from '../screens/driver/earnings/EarningsDetailScreen';
import WalletScreen from '../screens/driver/wallet/WalletScreen';
import AddBankAccountScreen from '../screens/driver/wallet/AddBankAccountScreen';
import PaymentMethodsScreen from '../screens/driver/wallet/PaymentMethodsScreen';
import DriverWithdrawScreen from '../screens/driver/wallet/DriverWithdrawScreen';
import DriverWithdrawalsScreen from '../screens/driver/wallet/DriverWithdrawalsScreen';

const Stack = createNativeStackNavigator();

const DriverEarningsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DriverEarnings" component={DriverEarningsScreen} />
      <Stack.Screen name="EarningsDetail" component={EarningsDetailScreen} />
      <Stack.Screen name="DriverWallet" component={WalletScreen} />
      <Stack.Screen name="DriverWithdraw" component={DriverWithdrawScreen} />
      <Stack.Screen name="DriverWithdrawals" component={DriverWithdrawalsScreen} />
      <Stack.Screen name="AddBankAccount" component={AddBankAccountScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
    </Stack.Navigator>
  );
};

export default DriverEarningsStack;
