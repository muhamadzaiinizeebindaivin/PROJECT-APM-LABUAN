// src/navigation/JawatankuasaFlow.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomHeader from '../components/CustomHeader';
import JawatankuasaScreen from '../screens/JawatankuasaScreen';

const Stack = createNativeStackNavigator();

export default function JawatankuasaFlow({ theme, handleLogout, onBack }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="JawatankuasaApp" options={{ header: () => <CustomHeader title="SEKRETARIAT" theme={theme} userRole="jawatankuasa" onLogout={handleLogout} /> }}>
        {(props) => <JawatankuasaScreen {...props} onBack={onBack} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
