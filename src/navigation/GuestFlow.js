import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomHeader from '../components/CustomHeader';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function GuestFlow({ theme, handleLogout, onLoginPress, onSekretariatPress }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="GuestHome" options={{ header: () => <CustomHeader title="DASHBOARD APM" theme={theme} userRole="guest" onLogout={handleLogout} onLoginPress={onLoginPress} onSekretariatPress={onSekretariatPress} /> }}>
        {(props) => <HomeScreen {...props} theme={theme} isAuthFlow={false} userRole="guest" onLogout={handleLogout} onLoginPress={onLoginPress} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}