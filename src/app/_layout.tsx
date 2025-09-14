import { Suspense, useEffect, useState } from "react";
import "../global.css";
import { Slot } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SQLiteProvider, openDatabaseSync } from "expo-sqlite";
import { addDummyData } from "@/db/addDummyData";
import { initializeDatabase } from "@/db/migrations";
import { TrainingsstrichProvider } from "@/contexts/TrainingsstrichContext";
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

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
          await addDummyData(db);
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
                  borderLeftColor: '#10B981',
                  zIndex: 999999,
                  elevation: 999999,
                }}
                contentContainerStyle={{ paddingHorizontal: 15 }}
                text1Style={{
                  fontSize: 15,
                  fontWeight: '400'
                }}
              />
            ),
            error: (internalState) => (
              <ErrorToast
                {...internalState}
                style={{
                  borderLeftColor: '#EF4444',
                  zIndex: 999999,
                  elevation: 999999,
                }}
                text1Style={{
                  fontSize: 15,
                  fontWeight: '400'
                }}
                text2Style={{
                  fontSize: 13
                }}
              />
            ),
            info: (internalState) => (
              <BaseToast
                {...internalState}
                style={{
                  borderLeftColor: '#3B82F6',
                  zIndex: 999999,
                  elevation: 999999,
                }}
                text1Style={{
                  fontSize: 15,
                  fontWeight: '400'
                }}
              />
            ),
          }} />
        </TrainingsstrichProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
