// import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
// import { createItem } from "./dbFunctions";
// import { ItemType } from "@/types";
// import { DrinkCategory, FoodCategory } from "@/types/category";
// import { AsyncStorage } from "node_modules/expo-sqlite/build/Storage";

// const defaultItems = [
//   // Drinks
//   { name: 'Bier', price: 2.50, category: DrinkCategory.Bier, info: 'Flasche, 0,5l', type: ItemType.Drink },
//   { name: 'Radler', price: 2.50, category: DrinkCategory.Bier, info: 'Flasche, 0,5l', type: ItemType.Drink },
//   { name: 'Alkoholfreies Bier', price: 2.50, category: DrinkCategory.Bier, info: 'Flasche, 0,5l', type: ItemType.Drink },
//   { name: 'Alkoholfreies Radler', price: 2.50, category: DrinkCategory.Bier, info: 'Flasche, 0,5l', type: ItemType.Drink },
//   { name: 'Mineralwasser', price: 1.50, category: DrinkCategory.Softdrinks, info: 'Flasche, 0,5l', type: ItemType.Drink },
//   { name: 'Cola Mix', price: 2.00, category: DrinkCategory.Softdrinks, info: 'Flasche, 0,5l', type: ItemType.Drink },
//   { name: 'Iso Sport', price: 2.00, category: DrinkCategory.Softdrinks, info: 'Flasche, 0,5l', type: ItemType.Drink },
//   { name: 'Bio Apfel-Birnen-Schorle', price: 2.00, category: DrinkCategory.Softdrinks, info: 'Flasche, 0,5l', type: ItemType.Drink },
//   { name: 'Kaffee (Tasse)', price: 1.50, category: DrinkCategory.Heissgetraenke, info: 'mit/ohne Zucker, mit/ohne Milch', type: ItemType.Drink },

//   // Food
//   { name: 'Hot Dog', price: 2.00, category: FoodCategory.Hauptgericht, type: ItemType.Food },
//   { name: 'Bratwurst', price: 2.00, category: FoodCategory.Hauptgericht, type: ItemType.Food },
//   { name: 'Paar Bratwürste', price: 3.00, category: FoodCategory.Hauptgericht, type: ItemType.Food },
//   { name: 'Steak', price: 3.50, category: FoodCategory.Hauptgericht, type: ItemType.Food },
//   { name: 'Kuchen', price: 1.00, category: FoodCategory.Nachspeise, type: ItemType.Food },
// ];

// export const addDefaultItems = async (db: ExpoSQLiteDatabase) => {
//   try {
//     const value = AsyncStorage.getItemSync("dbInitialized");
//     if (value) return;

//     for (const item of defaultItems) {
//       await createItem(db, {
//         name: item.name,
//         type: item.type,
//         price: Math.round(item.price * 100), // convert to cents
//         info: item.info,
//         category: item.category
//       });
//     }

//     AsyncStorage.setItemSync('dbInitialized', 'true');

//     console.log("Default items added.");
//   } catch (e) {
//     console.error("Error adding default items:", e);
//   }
// };