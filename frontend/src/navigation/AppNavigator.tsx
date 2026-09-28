import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import EventScreen from '../screens/EventScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import {Hold} from '../types/booking';

export type RootStackParamList = {
  Event: undefined;
  Checkout: {
    hold: Hold;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Event"
        component={EventScreen}
        options={{title: 'Flash Sale'}}
      />

      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{title: 'Checkout'}}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;