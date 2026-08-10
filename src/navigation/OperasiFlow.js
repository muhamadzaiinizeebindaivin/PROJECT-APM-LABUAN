import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomHeader from '../components/CustomHeader';
import LaporKesScreen from '../screens/LaporKesScreen';

const Stack = createNativeStackNavigator();

export default function OperasiFlow({ theme, handleLogout }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OperasiApp" options={{ header: () => <CustomHeader title="LAPOR KES" theme={theme} userRole="operasi" onLogout={handleLogout} /> }}>
        {(props) => <LaporKesScreen {...props} onLogout={handleLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}