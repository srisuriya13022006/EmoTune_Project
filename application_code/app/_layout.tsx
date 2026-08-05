import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const segments = useSegments(); // This will give you the current path segments

  useEffect(() => {
    const prepare = async () => {
      try {
        // Prevent splash screen from hiding
        await SplashScreen.preventAutoHideAsync();

        // Get token from AsyncStorage to check if the user is authenticated
        const token = await AsyncStorage.getItem('userToken');
        const auth = !!token; // if token exists, the user is authenticated
        setIsAuthenticated(auth);

        // If the user is not authenticated and trying to access a page other than login, redirect them
        const currentPath = segments.join('/'); // like "", "home", "report"
        if (!auth && currentPath !== '') {
          router.replace('/'); // Go to the login page
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, [segments]); // Use segments as a dependency

  if (!isReady) {
    return null; // Wait for the splash screen to hide and the app to be ready
  }

  return <Slot />; // Render the child routes (tabs, etc.)
}