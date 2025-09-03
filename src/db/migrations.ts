import { SQLiteDatabase } from "expo-sqlite";
import AsyncStorage from "expo-sqlite/kv-store";

export const initializeDatabase = async (db: SQLiteDatabase): Promise<void> => {
  try {
    // Check if we need to migrate from old schema
    const tableInfo = await db.getAllAsync(`PRAGMA table_info(user_items)`);
    const hasItemName = tableInfo.some((col: any) => col.name === 'item_name');

    // Check if history table needs migration
    const historyInfo = await db.getAllAsync(`PRAGMA table_info(history)`);
    const historyHasItemName = historyInfo.some((col: any) => col.name === 'item_name');

    if ((!hasItemName && tableInfo.length > 0) || (!historyHasItemName && historyInfo.length > 0)) {
      console.log("Migrating from old schema...");
      // Drop old tables to recreate with new schema
      await db.execAsync(`DROP TABLE IF EXISTS user_items`);
      await db.execAsync(`DROP TABLE IF EXISTS history`);
      await db.execAsync(`DROP TABLE IF EXISTS items`);
      await db.execAsync(`DROP TABLE IF EXISTS users`);

      // Clear the initialization flag so dummy data gets added
      AsyncStorage.removeItemSync("dbInitialized");
    }

    // Create users table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        total_debt INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Create items table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('drink', 'food')),
        price INTEGER NOT NULL,
        info TEXT,
        category TEXT
      );
    `);

    // Create user_items table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        price_per_item INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        item_type TEXT NOT NULL CHECK (item_type IN ('drink', 'food')),
        item_price INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
      );
    `);

    // Create history table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        item_id INTEGER,
        timestamp INTEGER NOT NULL,
        paid INTEGER NOT NULL,
        item_name TEXT,
        item_type TEXT CHECK (item_type IN ('drink', 'food', NULL)),
        item_price INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
      );
    `);

    console.log("All tables created successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};
