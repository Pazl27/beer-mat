import { users, items, userItems, ItemType } from "./schema";
import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import AsyncStorage from "expo-sqlite/kv-store";

export const addDummyData = async (db: ExpoSQLiteDatabase) => {
  try {
    const value = AsyncStorage.getItemSync("dbInitialized");
    if (value) return;

    console.log("Adding dummy data...");

    await db.insert(users).values([
      { name: "John Doe" },
      { name: "Jane Smith" },
    ]);

    await db.insert(items).values([
      { name: "Beer", type: ItemType.Drink, price: 500 },
      { name: "Burger", type: ItemType.Food, price: 1200 },
    ]);

    AsyncStorage.setItemSync('dbInitialized', 'true');

    console.log("Dummy data added successfully.");
  } catch (e) {
    console.error("Error adding dummy data:", e);
  }
};