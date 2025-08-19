import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import AsyncStorage from "expo-sqlite/kv-store";
import { createUser, createItem, addItemToUser } from "./dbFunctions";
import { ItemType } from "@/types";

export const addDummyData = async (db: ExpoSQLiteDatabase) => {
  try {
    const value = AsyncStorage.getItemSync("dbInitialized");
    if (value) return;

    console.log("Adding dummy data...");

    const user1 = await createUser(db,  "Max Mustermann" );
    const user2 = await createUser(db,  "Erika Mustermann" );

    const item1 = await createItem(db, { name: "Bier", type: ItemType.Drink, price: 250 });
    const item2 = await createItem(db, { name: "Wasser", type: ItemType.Drink, price: 150 });

    await addItemToUser(db, user1, item1, 2);
    await addItemToUser(db, user1, item2, 1);

    AsyncStorage.setItemSync('dbInitialized', 'true');

    console.log("Dummy data added successfully.");
  } catch (e) {
    console.error("Error adding dummy data:", e);
  }
};