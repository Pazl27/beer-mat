import { Tabs } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Text } from 'react-native';
import { useEffect } from 'react';
import { getAllUsers } from '@/db/dbFunctions';
import { waitForDatabaseInitialization } from '../_layout';

export default function TabLayout() {
    const db = useSQLiteContext();

    useEffect(() => {
      const load = async () => {
        try {
          await waitForDatabaseInitialization();
          const data = await getAllUsers(db);
          console.log("Loaded user data:", JSON.stringify(data, null, 2));
        } catch (error) {
          console.error("Error loading users in tab layout:", error);
        }
      }

      load();
    }, []);


  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#ffffff',
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Personen',
          headerTitle: 'Personen',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size - 4 }}>👥</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="speisen"
        options={{
          title: 'Speisen',
          headerTitle: 'Speisen',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size - 4 }}>🍽️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="getraenke"
        options={{
          title: 'Getränke',
          headerTitle: 'Getränke',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size - 4 }}>🍺</Text>
          ),
        }}
      />
    </Tabs>
  );
}
