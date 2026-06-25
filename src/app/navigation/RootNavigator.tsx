import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { OnboardingScreen } from '../../features/auth/screens/OnboardingScreen';
import { ProfileSetupScreen } from '../../features/auth/screens/ProfileSetupScreen';
import { SignUpScreen } from '../../features/auth/screens/SignUpScreen';
import { SplashScreen } from '../../features/auth/screens/SplashScreen';
import { JoinGroupScreen } from '../../features/groups/screens/JoinGroupScreen';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Mientras la app ya pasó el Splash inicial, reacciona a cambios de sesión
 * (p. ej. signOut desde Perfil) navegando de vuelta a Login automáticamente.
 * El paso Splash -> {Onboarding|Login|ProfileSetup|Main} ya lo maneja
 * SplashScreen al montar.
 */
function AuthGate() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const session = useAuthStore((s) => s.session);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);
  const hasHandledInitial = useRef(false);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!hasHandledInitial.current) {
      // El primer tránsito (incluyendo el de Splash) ya está cubierto por
      // SplashScreen; aquí solo nos importan los cambios posteriores.
      hasHandledInitial.current = true;
      return;
    }

    if (!session) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } else {
      // Sesión recién creada (login/signup en vivo, sin recarga de página):
      // volvemos a Splash para que su lógica centralizada decida el siguiente
      // paso (Onboarding, ProfileSetup o Main) una vez cargado el perfil.
      navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
    }
  }, [session, isAuthLoading, navigation]);

  return null;
}

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="Join" component={JoinGroupScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
    </Stack.Navigator>
  );
}

export { AuthGate };
