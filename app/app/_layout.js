// eecs/app/_layout.js
import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from './context/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
