import { Suspense, useEffect, useState } from "react";
import "../global.css";
import { Slot } from "expo-router";
import { ActivityIndicator, Platform } from "react-native";
import { SQLiteProvider, openDatabaseSync } from "expo-sqlite";
import { addDefaultItems } from "@/db/addDefaultItems";
import { initializeDatabase } from "@/db/migrations";
import { TrainingsstrichProvider } from "@/contexts/TrainingsstrichContext";
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';

export const DATABASE_NAME = "beer-mat";

// Global flag to track database initialization
let databaseInitialized = false;
let initializationPromise: Promise<void> | null = null;

export const waitForDatabaseInitialization = async (): Promise<void> => {
  if (databaseInitialized) return;
  if (initializationPromise) return initializationPromise;
  // If no initialization is in progress, assume it will happen soon
  return new Promise((resolve) => {
    const checkInitialization = () => {
      if (databaseInitialized) {
        resolve();
      } else {
        setTimeout(checkInitialization, 50);
      }
    };
    checkInitialization();
  });
};

export default function Layout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // Hide Android navigation bar for immersive experience
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
      NavigationBar.setBackgroundColorAsync('#00000000');
    }

    const setupDatabase = async () => {
      if (databaseInitialized) {
        setDbReady(true);
        return;
      }

      try {
        initializationPromise = (async () => {
          const db = openDatabaseSync(DATABASE_NAME);
          await initializeDatabase(db);
          console.log("Database initialized successfully");
          await addDefaultItems(db);
          databaseInitialized = true;
        })();

        await initializationPromise;
        setDbReady(true);
      } catch (error) {
        console.error("Database setup error:", error);
        setDbReady(true); // Still allow app to load even if setup fails
      }
    };

    setupDatabase();
  }, []);

  if (!dbReady) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <StatusBar style="light" backgroundColor="#4F46E5" />
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        options={{ enableChangeListener: true }}
        useSuspense
      >
        <TrainingsstrichProvider>
          <Slot />
          <Toast config={{
            success: (internalState) => (
              <BaseToast
                {...internalState}
                style={{
                  backgroundColor: '#10B981',
                  borderLeftColor: '#10B981',
                  borderLeftWidth: 0,
                  zIndex: 999999,
                  elevation: 999999,
                }}
                contentContainerStyle={{ paddingHorizontal: 15 }}
                text1Style={{
                  fontSize: 15,
                  fontWeight: 'bold',
                  color: 'white'
                }}
              />
            ),
            error: (internalState) => (
              <ErrorToast
                {...internalState}
                style={{
                  backgroundColor: '#EF4444',
                  borderLeftColor: '#EF4444',
                  borderLeftWidth: 0,
                  zIndex: 999999,
                  elevation: 999999,
                }}
                text1Style={{
                  fontSize: 15,
                  fontWeight: 'bold',
                  color: 'white'
                }}
                text2Style={{
                  fontSize: 13,
                  color: 'white'
                }}
              />
            ),
            info: (internalState) => (
              <BaseToast
                {...internalState}
                style={{
                  backgroundColor: '#3B82F6',
                  borderLeftColor: '#3B82F6',
                  borderLeftWidth: 0,
                  zIndex: 999999,
                  elevation: 999999,
                }}
                text1Style={{
                  fontSize: 15,
                  fontWeight: 'bold',
                  color: 'white'
                }}
              />
            ),
            warning: (internalState) => (
              <BaseToast
                {...internalState}
                style={{
                  backgroundColor: '#F59E0B',
                  borderLeftColor: '#F59E0B',
                  borderLeftWidth: 0,
                  zIndex: 999999,
                  elevation: 999999,
                }}
                text1Style={{
                  fontSize: 15,
                  fontWeight: 'bold',
                  color: 'white'
                }}
              />
            ),
          }} />
        </TrainingsstrichProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
