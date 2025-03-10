import { Stack } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: Platform.select({
          ios: 'modal',
          android: 'card',
        }),
      }}
    />
  );
}
