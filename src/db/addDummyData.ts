import { SQLiteDatabase } from "expo-sqlite";
import AsyncStorage from "expo-sqlite/kv-store";
import { createUser, createItem, addItemToUser, payUserItem, clearUserDebt, getHistoryForUser, deleteItem } from "./dbFunctions";
import { ItemType } from "@/types";
import { DrinkCategory, FoodCategory } from "@/types/category";

export const addDummyData = async (db: SQLiteDatabase) => {
  try {
    const value = AsyncStorage.getItemSync("dbInitialized");
    if (value) return;

    // Check if users already exist
    const existingUsers = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0]?.count > 0) {
      console.log("Data already exists, skipping dummy data");
      AsyncStorage.setItemSync('dbInitialized', 'true');
      return;
    }

    console.log("Adding dummy data...");

    const user1 = await createUser(db,  "Max Mustermann" );
    const user2 = await createUser(db,  "Erika Mustermann" );
    const user3 = await createUser(db, "Hans Müller" );

    if (!user1 || !user2 || !user3) {
      console.error("Failed to create users");
      return;
    }

    // add dummy drink items
    const item1 = await createItem(db, { name: "Bier", type: ItemType.Drink, price: 250, info: "Flasche, 0,5l", category: DrinkCategory.Bier });
    const item2 = await createItem(db, { name: "Wasser", type: ItemType.Drink, price: 150, info: "Flasche, 0,5l", category: DrinkCategory.Softdrinks });

    // add dummy food items
    const speise1 = await createItem(db, { name: "Hot Dog", type: ItemType.Food, price: 200, category: FoodCategory.Hauptgericht });
    const speise2 = await createItem(db, { name: "Bratwurst", type: ItemType.Food, price: 200, category: FoodCategory.Hauptgericht });
    const speise3 = await createItem(db, { name: "Kuchen", type: ItemType.Food, price: 100, category: FoodCategory.Nachspeise });

    if (!item1 || !item2 || !speise1 || !speise2 || !speise3) {
      console.error("Failed to create items");
      return;
    }

    // Ensure all items have valid IDs
    if (!item1.id || !item2.id || !speise1.id || !speise2.id || !speise3.id) {
      console.error("Some items don't have valid IDs");
      return;
    }

    console.log("Created items:", item1, item2);
    console.log("Created food items:", speise1, speise2, speise3);

    await addItemToUser(db, user1, item1, 2);
    await addItemToUser(db, user1, item2, 1);
    await addItemToUser(db, user1, item2, 3);

    await payUserItem(db, user1.id, item1.name, item1.type, item1.price / 100); // Convert cents to euros
    await clearUserDebt(db, user1.id);

    const history = await getHistoryForUser(db, user1.id);
    console.log("User 1 Payment History:", history);

    await addItemToUser(db, user1, item1, 2);

    if (item1.id) {
      await deleteItem(db, item1.id);
    }

    AsyncStorage.setItemSync('dbInitialized', 'true');

    console.log("Dummy data added successfully.");
  } catch (e) {
    console.error("Error adding dummy data:", e);
  }
};