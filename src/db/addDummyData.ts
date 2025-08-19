import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import AsyncStorage from "expo-sqlite/kv-store";
import { createUser, createItem, addItemToUser, payUserItem, clearUserDebt, getHistoryForUser } from "./dbFunctions";
import { ItemType } from "@/types";
import { DrinkCategory } from "@/types/category";

export const addDummyData = async (db: ExpoSQLiteDatabase) => {
  try {
    const value = AsyncStorage.getItemSync("dbInitialized");
    if (value) return;

    console.log("Adding dummy data...");

    const user1 = await createUser(db,  "Max Mustermann" );
    const user2 = await createUser(db,  "Erika Mustermann" );
    const user3 = await createUser(db, "Hans Müller" );

    const item1 = await createItem(db, { name: "Bier", type: ItemType.Drink, price: 250, info: "Flasche, 0,5l", category: DrinkCategory.Bier });
    const item2 = await createItem(db, { name: "Wasser", type: ItemType.Drink, price: 150, info: "Flasche, 0,5l", category: DrinkCategory.Softdrinks });

    console.log("Created items:", item1, item2);

    await addItemToUser(db, user1, item1, 2);
    await addItemToUser(db, user1, item2, 1);
    await addItemToUser(db, user1, item2, 3);

    await payUserItem(db, user1.id, item1.name, item1.type);
    await clearUserDebt(db, user1.id);

    const history = await getHistoryForUser(db, user1.id);
    console.log("User 1 Payment History:", history);

    await addItemToUser(db, user1, item1, 2);

    AsyncStorage.setItemSync('dbInitialized', 'true');

    console.log("Dummy data added successfully.");
  } catch (e) {
    console.error("Error adding dummy data:", e);
  }
};