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
    const bier = await createItem(db, { name: "Bier", type: ItemType.Drink, price: 250, info: "Flasche, 0,5l", category: DrinkCategory.Bier });
    const radler = await createItem(db, { name: "Radler", type: ItemType.Drink, price: 250, info: "Flasche, 0,5l", category: DrinkCategory.Bier });
    const alkoholfreiesBier = await createItem(db, { name: "Alkoholfreies Bier", type: ItemType.Drink, price: 250, info: "Flasche, 0,5l", category: DrinkCategory.Bier });
    const alkoholfreiesRadler = await createItem(db, { name: "Alkoholfreies Radler", type: ItemType.Drink, price: 250, info: "Flasche, 0,5l", category: DrinkCategory.Bier });
    const mineralwasser = await createItem(db, { name: "Mineralwasser", type: ItemType.Drink, price: 150, info: "Flasche, 0,5l", category: DrinkCategory.Softdrinks });
    const colaMix = await createItem(db, { name: "Cola Mix", type: ItemType.Drink, price: 200, info: "Flasche, 0,5l", category: DrinkCategory.Softdrinks });
    const isoSport = await createItem(db, { name: "Iso Sport", type: ItemType.Drink, price: 200, info: "Flasche, 0,5l", category: DrinkCategory.Softdrinks });
    const apfelSchorle = await createItem(db, { name: "Bio Apfel-Birnen-Schorle", type: ItemType.Drink, price: 200, info: "Flasche, 0,5l", category: DrinkCategory.Softdrinks });
    const kaffee = await createItem(db, { name: "Kaffee (Tasse)", type: ItemType.Drink, price: 150, info: "mit/ohne Zucker, mit/ohne Milch", category: DrinkCategory.Heissgetraenke });

    // add dummy food items
    const speise1 = await createItem(db, { name: "Hot Dog", type: ItemType.Food, price: 200, category: FoodCategory.Hauptgericht });
    const speise2 = await createItem(db, { name: "Bratwurst", type: ItemType.Food, price: 200, category: FoodCategory.Hauptgericht });
    const speise3 = await createItem(db, { name: "Kuchen", type: ItemType.Food, price: 100, category: FoodCategory.Nachspeise });

    if (!bier || !mineralwasser || !speise1 || !speise2 || !speise3) {
      console.error("Failed to create items");
      return;
    }

    // Ensure all items have valid IDs
    if (!bier.id || !mineralwasser.id || !speise1.id || !speise2.id || !speise3.id) {
      console.error("Some items don't have valid IDs");
      return;
    }

    console.log("Created items:", bier, mineralwasser);
    console.log("Created food items:", speise1, speise2, speise3);

    await addItemToUser(db, user1, bier, 2);
    await addItemToUser(db, user1, mineralwasser, 1);
    await addItemToUser(db, user1, mineralwasser, 3);

    await payUserItem(db, user1.id, bier.name, bier.type, bier.price / 100); // Convert cents to euros
    await clearUserDebt(db, user1.id);

    const history = await getHistoryForUser(db, user1.id);
    console.log("User 1 Payment History:", history);

    await addItemToUser(db, user1, bier, 2);

    if (bier.id) {
      await deleteItem(db, bier.id);
    }

    AsyncStorage.setItemSync('dbInitialized', 'true');

    console.log("Dummy data added successfully.");
  } catch (e) {
    console.error("Error adding dummy data:", e);
  }
};