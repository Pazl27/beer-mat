import { Suspense, useEffect } from "react";
import "../global.css";
import { Slot } from "expo-router";
import { ActivityIndicator } from "react-native";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { SQLiteProvider, openDatabaseSync } from "expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../../drizzle/migrations";
import { addDummyData } from "./db/addDummyData";

export const DATABASE_NAME = "beer-mat";

export default function Layout() {
  const expoDb = openDatabaseSync(DATABASE_NAME);
  const db = drizzle(expoDb);
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    console.log("Migrations success:", success);
    console.log("Migrations error:", error);
    if (success) {
      addDummyData(db);
    }
  }, [success, error]);

  return (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        options={{ enableChangeListener: true }}
        useSuspense
      >
        <Slot />
      </SQLiteProvider>
    </Suspense>
  );
}
