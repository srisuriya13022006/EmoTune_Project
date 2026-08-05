import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function TabLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        // If no token, redirect to login
        router.replace('/');
      } else {
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
  }, []);

  if (!isAuthenticated) {
    return null; // Don't render tabs if not authenticated
  }

  return (
    <Tabs 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#8A2BE2',
        tabBarIcon: ({ color, size }) => {
          let iconName: any;
          if (route.name === 'home') iconName = 'home';
          else if (route.name === 'ser') iconName = 'mic';
          else if (route.name === 'report') iconName = 'bar-chart';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="ser" options={{ title: 'SER' }} />
      <Tabs.Screen name="report" options={{ title: 'Report' }} />
    </Tabs>
  );
}
