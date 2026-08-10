import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomHeader from '../components/CustomHeader';
import AgencyTrackingScreen from '../screens/AgencyTrackingScreen';

const Stack = createNativeStackNavigator();

export default function AgencyFlow({ theme, handleLogout }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AgencyApp" options={{ header: () => <CustomHeader title="AGENSI" theme={theme} userRole="agency" onLogout={handleLogout} /> }}>
        {(props) => (
          <AgencyTrackingScreen
            {...props}
            onLogout={handleLogout}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}