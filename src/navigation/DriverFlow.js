import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomHeader from '../components/CustomHeader';
import DriverScreen from '../screens/DriverScreen';

const Stack = createNativeStackNavigator();

export default function DriverFlow({ theme, handleLogout }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DriverApp" options={{ header: () => <CustomHeader title="PEMANDU APM" theme={theme} userRole="driver" onLogout={handleLogout} /> }}>
        {(props) => <DriverScreen {...props} onLogout={handleLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}