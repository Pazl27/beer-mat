import { Suspense, useEffect, useState } from "react";
import "../global.css";
import { Slot } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SQLiteProvider, openDatabaseSync } from "expo-sqlite";
import { addDummyData } from "@/db/addDummyData";
import { initializeDatabase } from "@/db/migrations";
import { TrainingsstrichProvider } from "@/contexts/TrainingsstrichContext";

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
        </TrainingsstrichProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
