import { createItem } from "./dbFunctions";
import { ItemType } from "@/types";
import { DrinkCategory, FoodCategory } from "@/types/category";
import AsyncStorage from "expo-sqlite/kv-store";
import { SQLiteDatabase } from "expo-sqlite";

const defaultItems = [
  // Drinks
  { name: 'Bier', price: 2.50, category: DrinkCategory.Bier, info: 'Flasche, 0,5l', type: ItemType.Drink },
  { name: 'Radler', price: 2.50, category: DrinkCategory.Bier, info: 'Flasche, 0,5l', type: ItemType.Drink },
  { name: 'Alkoholfreies Bier', price: 2.50, category: DrinkCategory.Bier, info: 'Flasche, 0,5l', type: ItemType.Drink },
  { name: 'Alkoholfreies Radler', price: 2.50, category: DrinkCategory.Bier, info: 'Flasche, 0,5l', type: ItemType.Drink },
  { name: 'Mineralwasser', price: 1.50, category: DrinkCategory.Softdrinks, info: 'Flasche, 0,5l', type: ItemType.Drink },
  { name: 'Cola Mix', price: 2.00, category: DrinkCategory.Softdrinks, info: 'Flasche, 0,5l', type: ItemType.Drink },
  { name: 'Iso Sport', price: 2.00, category: DrinkCategory.Softdrinks, info: 'Flasche, 0,5l', type: ItemType.Drink },
  { name: 'Bio Apfel-Birnen-Schorle', price: 2.00, category: DrinkCategory.Softdrinks, info: 'Flasche, 0,5l', type: ItemType.Drink },
  { name: 'Kaffee (Tasse)', price: 1.50, category: DrinkCategory.Heissgetraenke, info: 'mit/ohne Zucker, mit/ohne Milch', type: ItemType.Drink },

  // Food
  { name: 'Hot Dog', price: 2.00, category: FoodCategory.Hauptgericht, type: ItemType.Food },
  { name: 'Bratwurst', price: 2.00, category: FoodCategory.Hauptgericht, type: ItemType.Food },
  { name: 'Paar Bratwürste', price: 3.00, category: FoodCategory.Hauptgericht, type: ItemType.Food },
  { name: 'Steak', price: 3.50, category: FoodCategory.Hauptgericht, type: ItemType.Food },
  { name: 'Kuchen', price: 1.00, category: FoodCategory.Nachspeise, type: ItemType.Food },
];

export const addDefaultItems = async (db: SQLiteDatabase) => {
  try {
    const value = AsyncStorage.getItemSync("defaultItemsInitialized");
    if (value) return;

    // Check if items already exist
    const existingItems = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM items');
    if (existingItems[0]?.count > 0) {
      console.log("Items already exist, skipping default items");
      AsyncStorage.setItemSync('defaultItemsInitialized', 'true');
      return;
    }

    console.log("Adding default items...");

    for (const item of defaultItems) {
      await createItem(db, {
        name: item.name,
        type: item.type,
        price: Math.round(item.price * 100), // convert to cents
        info: item.info,
        category: item.category
      });
    }

    AsyncStorage.setItemSync('defaultItemsInitialized', 'true');

    console.log("Default items added successfully.");
  } catch (e) {
    console.error("Error adding default items:", e);
  }
};