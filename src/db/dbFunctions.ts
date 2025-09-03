import { SQLiteDatabase } from "expo-sqlite";
import { Person, Item, ItemType, History, Speise } from "@/types"
import { DrinkCategory, FoodCategory } from "@/types/category";

export const createUser = async (db: SQLiteDatabase, name: string): Promise<Person | undefined> => {
  try {
    const result = await db.runAsync(
      'INSERT INTO users (name) VALUES (?) RETURNING id, name, total_debt',
      [name]
    );

    const newPerson: Person = {
      id: result.lastInsertRowId,
      name: name,
      totalDebt: 0,
      items: [],
    }

    return newPerson;

  } catch (e) {
    console.error("Error creating user:", e);
  }
}

function parseCategory(category: string | null): DrinkCategory | FoodCategory | undefined {
  if (!category) return undefined;
  if (Object.values(DrinkCategory).includes(category as DrinkCategory)) {
    return category as DrinkCategory;
  }
  if (Object.values(FoodCategory).includes(category as FoodCategory)) {
    return category as FoodCategory;
  }
  return undefined;
}

export const createItem = async (
  db: SQLiteDatabase,
  item: { name: string; type: ItemType; price: number; info?: string; category?: DrinkCategory | FoodCategory }
): Promise<Item | undefined> => {
  try {
    const result = await db.runAsync(
      'INSERT INTO items (name, type, price, info, category) VALUES (?, ?, ?, ?, ?)',
      [item.name, item.type, item.price, item.info || null, item.category || null]
    );

    const newItem: Item = {
      id: result.lastInsertRowId,
      name: item.name,
      type: item.type,
      price: item.price,
      info: item.info,
      category: item.category,
    };

    return newItem;

  } catch (e) {
    console.error("Error creating item:", e);
  }
};

export const addItemToUser = async (
  db: SQLiteDatabase,
  user: Person,
  item: Item,
  quantity: number
): Promise<void> => {
  try {
    if (!item.id) {
      console.error("Cannot add item to user: item.id is undefined");
      return;
    }

    // Insert one row per item (not just one row with quantity)
    for (let i = 0; i < quantity; i++) {
      await db.runAsync(
        'INSERT INTO user_items (user_id, item_id, price_per_item, item_name, item_price, item_type) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, item.id, item.price, item.name, item.price, item.type]
      );
    }

    const additionalDebt = item.price * quantity;

    const userResult = await db.getFirstAsync<{ total_debt: number }>(
      'SELECT total_debt FROM users WHERE id = ?',
      [user.id]
    );

    const currentDebt = userResult?.total_debt ?? 0;

    await db.runAsync(
      'UPDATE users SET total_debt = ? WHERE id = ?',
      [currentDebt + additionalDebt, user.id]
    );
  } catch (e) {
    console.error("Error adding item to user:", e);
  }
};

export const getItemsForUser = async (db: SQLiteDatabase, userId: number): Promise<Item[]> => {
  const rows = await db.getAllAsync<{
    id: number;
    item_id: number;
    item_name: string;
    item_price: number;
    item_type: string;
  }>('SELECT id, item_id, item_name, item_price, item_type FROM user_items WHERE user_id = ?', [userId]);

  return rows.map((row) => ({
    id: row.id, // Use the unique user_items.id instead of item_id
    name: row.item_name,
    price: row.item_price,
    type: row.item_type as ItemType,
    originalItemId: row.item_id, // Keep reference to original item if needed
  }));
};

export const getAllUsers = async (db: SQLiteDatabase): Promise<Person[]> => {
  const userRows = await db.getAllAsync<{ id: number; name: string; total_debt: number }>(
    'SELECT id, name, total_debt FROM users'
  );

  const persons: Person[] = [];
  for (const user of userRows) {
    const userItems = await getItemsForUser(db, user.id);

    persons.push({
      id: user.id,
      name: user.name,
      totalDebt: user.total_debt ?? 0,
      items: userItems,
    });
  }
  return persons;
};

export const getAllItems = async (db: SQLiteDatabase): Promise<Item[]> => {
  const result = await db.getAllAsync<{
    id: number;
    name: string;
    price: number;
    type: string;
    info: string | null;
    category: string | null;
  }>('SELECT id, name, price, type, info, category FROM items');

  return result.map(row => ({
    id: row.id,
    name: row.name,
    price: row.price,
    type: row.type as ItemType,
    info: row.info || undefined,
    category: parseCategory(row.category),
  }));
};

export const getAllFoodItems = async (db: SQLiteDatabase): Promise<Speise[]> => {
  const result = await db.getAllAsync<{
    id: number;
    name: string;
    price: number;
    info: string | null;
    category: string | null;
  }>('SELECT id, name, price, info, category FROM items WHERE type = ?', ['food']);

  return result.map(row => ({
    id: row.id,
    name: row.name,
    price: row.price,
    info: row.info || undefined,
    category: parseCategory(row.category) as FoodCategory || FoodCategory.Hauptgericht,
  }));
};

export const createFoodItem = async (
  db: SQLiteDatabase,
  speise: { name: string; price: number; category: FoodCategory; info?: string }
): Promise<Speise | undefined> => {
  try {
    const result = await db.runAsync(
      'INSERT INTO items (name, type, price, info, category) VALUES (?, ?, ?, ?, ?)',
      [speise.name, 'food', speise.price, speise.info || null, speise.category]
    );

    const newSpeise: Speise = {
      id: result.lastInsertRowId,
      name: speise.name,
      price: speise.price,
      info: speise.info,
      category: speise.category,
    };

    return newSpeise;

  } catch (e) {
    console.error("Error creating food item:", e);
  }
};

export const updateFoodItem = async (
  db: SQLiteDatabase,
  speise: Speise
): Promise<void> => {
  try {
    await db.runAsync(
      'UPDATE items SET name = ?, price = ?, info = ?, category = ? WHERE id = ?',
      [speise.name, speise.price, speise.info || null, speise.category, speise.id]
    );
  } catch (e) {
    console.error("Error updating food item:", e);
  }
};

export const deleteFoodItem = async (db: SQLiteDatabase, itemId: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM items WHERE id = ?', [itemId]);
  } catch (e) {
    console.error("Error deleting food item:", e);
  }
};

export const deleteUser = async (db: SQLiteDatabase, userId: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM users WHERE id = ?', [userId]);
  } catch (e) {
    console.error("Error deleting user:", e);
  }
};

export const deleteItem = async (db: SQLiteDatabase, itemId: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM items WHERE id = ?', [itemId]);
  } catch (e) {
    console.error("Error deleting item:", e);
  }
};

export const clearUserDebt = async (db: SQLiteDatabase, userId: number): Promise<void> => {
  try {
    const userResult = await db.getFirstAsync<{ total_debt: number }>(
      'SELECT total_debt FROM users WHERE id = ?',
      [userId]
    );

    await db.runAsync('DELETE FROM user_items WHERE user_id = ?', [userId]);
    await db.runAsync('UPDATE users SET total_debt = 0 WHERE id = ?', [userId]);

    await addToHistory(db, userId, null, userResult?.total_debt ?? 0);
  } catch (e) {
    console.error("Error clearing user debt:", e);
  }
};

export const payUserItem = async (db: SQLiteDatabase, userId: number, itemName: string, itemType: ItemType, itemPrice: number): Promise<void> => {
  try {
    const matchingUserItem = await db.getFirstAsync<{
      id: number;
      item_id: number;
      price_per_item: number;
      item_name: string;
      item_type: string;
    }>('SELECT id, item_id, price_per_item, item_name, item_type FROM user_items WHERE user_id = ? AND item_name = ? AND item_type = ? AND price_per_item = ? ORDER BY id ASC LIMIT 1',
      [userId, itemName, itemType, Math.round(itemPrice * 100)]);

    if (!matchingUserItem) {
      console.warn("No matching item found to pay");
      return;
    }

    const userResult = await db.getFirstAsync<{ total_debt: number }>(
      'SELECT total_debt FROM users WHERE id = ?',
      [userId]
    );

    const currentDebt = userResult?.total_debt ?? 0;
    const newDebt = Math.max(0, currentDebt - matchingUserItem.price_per_item);

    await db.runAsync('UPDATE users SET total_debt = ? WHERE id = ?', [newDebt, userId]);
    await addToHistory(db, userId, matchingUserItem.item_id, matchingUserItem.price_per_item, matchingUserItem.item_name, matchingUserItem.item_type as ItemType, matchingUserItem.price_per_item);
    await db.runAsync('DELETE FROM user_items WHERE id = ?', [matchingUserItem.id]);

  } catch (e) {
    console.error("Error paying user item:", e);
  }
};

const addToHistory = async (db: SQLiteDatabase, userId: number, itemId: number | null, paid: number, itemName?: string, itemType?: ItemType, itemPrice?: number): Promise<void> => {
  try {
    await db.runAsync(
      'INSERT INTO history (user_id, item_id, paid, timestamp, item_name, item_type, item_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, itemId, paid, Date.now(), itemName || null, itemType || null, itemPrice || null]
    );
  } catch (e) {
    console.error("Error adding to history:", e);
  }
};

export const getHistoryForUser = async (db: SQLiteDatabase, userId: number): Promise<History[]> => {
  try {
    const result = await db.getAllAsync<{
      id: number;
      user_id: number;
      item_id: number | null;
      paid: number;
      timestamp: number;
    }>('SELECT id, user_id, item_id, paid, timestamp FROM history WHERE user_id = ?', [userId]);

    return result.map(row => ({
      id: row.id,
      userId: row.user_id,
      itemId: row.item_id,
      paid: row.paid,
      timestamp: String(row.timestamp),
    }));
  } catch(e) {
    console.error("Error fetching history for user:", e);
    return [];
  }
};

export const getDetailedHistoryForUser = async (db: SQLiteDatabase, userId: number): Promise<(History & { itemName?: string; itemType?: ItemType })[]> => {
  try {
    const result = await db.getAllAsync<{
      id: number;
      user_id: number;
      item_id: number | null;
      paid: number;
      timestamp: number;
      item_name: string | null;
      item_type: string | null;
    }>(`
      SELECT h.id, h.user_id, h.item_id, h.paid, h.timestamp, h.item_name, h.item_type
      FROM history h
      WHERE h.user_id = ?
      ORDER BY h.timestamp DESC
    `, [userId]);

    return result.map(row => ({
      id: row.id,
      userId: row.user_id,
      itemId: row.item_id,
      paid: row.paid,
      timestamp: String(row.timestamp),
      itemName: row.item_name || undefined,
      itemType: row.item_type as ItemType || undefined,
    }));
  } catch(e) {
    console.error("Error fetching detailed history for user:", e);
    return [];
  }
};

export const clearUserHistory = async (db: SQLiteDatabase, userId: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM history WHERE user_id = ?', [userId]);
  } catch (e) {
    console.error("Error clearing user history:", e);
  }
};