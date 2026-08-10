import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function AuthFlow({ theme, handleLogin }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeScreen" options={{ title: 'Dashboard APM Labuan', headerStyle: { backgroundColor: theme.background }, headerTitleStyle: { color: theme.text, fontWeight: 'bold' } }}>
        {(props) => <HomeScreen {...props} theme={theme} isAuthFlow={true} onGuestLogin={() => handleLogin('guest')} onDriverLogin={() => handleLogin('driver')} onAgencyLogin={() => handleLogin('agency')} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}