import { SQLiteDatabase } from "expo-sqlite";
import { Person, Item, ItemType, History, Speise, Getraenk, PaymentDetail } from "@/types"
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

    // Get current date in YYYY-MM-DD format (without time)
    const currentDate = new Date().toISOString().split('T')[0];

    // Insert one row per item (not just one row with quantity)
    for (let i = 0; i < quantity; i++) {
      await db.runAsync(
        'INSERT INTO user_items (user_id, item_id, price_per_item, item_name, item_price, item_type, date_added) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.id, item.id, item.price, item.name, item.price, item.type, currentDate]
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
    date_added: string;
  }>('SELECT id, item_id, item_name, item_price, item_type, date_added FROM user_items WHERE user_id = ?', [userId]);

  return rows.map((row) => ({
    id: row.id, // Use the unique user_items.id instead of item_id
    name: row.item_name,
    price: row.item_price,
    type: row.item_type as ItemType,
    originalItemId: row.item_id, // Keep reference to original item if needed
    dateAdded: row.date_added, // Add the date field
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

export const getAllDrinkItems = async (db: SQLiteDatabase): Promise<Getraenk[]> => {
  const result = await db.getAllAsync<{
    id: number;
    name: string;
    price: number;
    info: string | null;
    category: string | null;
  }>('SELECT id, name, price, info, category FROM items WHERE type = ?', ['drink']);

  return result.map(row => ({
    id: row.id,
    name: row.name,
    price: row.price,
    info: row.info || undefined,
    category: parseCategory(row.category) as DrinkCategory || DrinkCategory.Bier,
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

export const createDrinkItem = async (
  db: SQLiteDatabase,
  getraenk: { name: string; price: number; category: DrinkCategory; info?: string }
): Promise<Getraenk | undefined> => {
  try {
    const result = await db.runAsync(
      'INSERT INTO items (name, type, price, info, category) VALUES (?, ?, ?, ?, ?)',
      [getraenk.name, 'drink', getraenk.price, getraenk.info || null, getraenk.category]
    );

    const newGetraenk: Getraenk = {
      id: result.lastInsertRowId,
      name: getraenk.name,
      price: getraenk.price,
      info: getraenk.info,
      category: getraenk.category,
    };

    return newGetraenk;

  } catch (e) {
    console.error("Error creating drink item:", e);
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

export const updateDrinkItem = async (
  db: SQLiteDatabase,
  getraenk: Getraenk
): Promise<void> => {
  try {
    await db.runAsync(
      'UPDATE items SET name = ?, price = ?, info = ?, category = ? WHERE id = ?',
      [getraenk.name, getraenk.price, getraenk.info || null, getraenk.category, getraenk.id]
    );
  } catch (e) {
    console.error("Error updating drink item:", e);
  }
};

export const deleteFoodItem = async (db: SQLiteDatabase, itemId: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM items WHERE id = ?', [itemId]);
  } catch (e) {
    console.error("Error deleting food item:", e);
  }
};

export const deleteDrinkItem = async (db: SQLiteDatabase, itemId: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM items WHERE id = ?', [itemId]);
  } catch (e) {
    console.error("Error deleting drink item:", e);
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

    // Collect payment details before clearing items - now including date_added
    const userItems = await db.getAllAsync<{
      id: number;
      item_id: number;
      item_name: string;
      item_price: number;
      item_type: string;
      date_added: string;
    }>('SELECT id, item_id, item_name, item_price, item_type, date_added FROM user_items WHERE user_id = ?', [userId]);
    
    const details: PaymentDetail[] = [];
    
    // Count quantities for each unique combination of item name, price, type AND date
    const itemCounts = new Map<string, {
      name: string, 
      price: number, 
      type: 'drink' | 'food', 
      count: number, 
      dateAdded: string
    }>();
    
    userItems.forEach(item => {
      const key = `${item.item_name}-${item.item_price}-${item.item_type}-${item.date_added}`;
      if (itemCounts.has(key)) {
        itemCounts.get(key)!.count += 1;
      } else {
        itemCounts.set(key, {
          name: item.item_name,
          price: item.item_price,
          type: item.item_type as 'drink' | 'food',
          count: 1,
          dateAdded: item.date_added
        });
      }
    });
    
    // Convert to PaymentDetail array
    itemCounts.forEach(item => {
      details.push({
        name: item.name,
        price: item.price,
        quantity: item.count,
        type: item.type,
        dateAdded: item.dateAdded
      });
    });

    await db.runAsync('DELETE FROM user_items WHERE user_id = ?', [userId]);
    await db.runAsync('UPDATE users SET total_debt = 0 WHERE id = ?', [userId]);

    await addToHistory(db, userId, null, userResult?.total_debt ?? 0, undefined, undefined, undefined, details);
  } catch (e) {
    console.error("Error clearing user debt:", e);
  }
};

export const payUserItem = async (db: SQLiteDatabase, userId: number, itemName: string, itemType: ItemType, itemPrice: number, dateAdded?: string): Promise<void> => {
  try {
    // Erweiterte Query um Datum zu berücksichtigen
    let query = 'SELECT id, item_id, price_per_item, item_name, item_type, date_added FROM user_items WHERE user_id = ? AND item_name = ? AND item_type = ? AND price_per_item = ?';
    let params: any[] = [userId, itemName, itemType, Math.round(itemPrice * 100)];
    
    if (dateAdded) {
      query += ' AND date_added = ?';
      params.push(dateAdded);
    }
    
    query += ' ORDER BY id ASC LIMIT 1';

    const matchingUserItem = await db.getFirstAsync<{
      id: number;
      item_id: number;
      price_per_item: number;
      item_name: string;
      item_type: string;
      date_added: string;
    }>(query, params);

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
    
    // Erstelle einen einzelnen History-Eintrag mit Details (wie bei payUserItems)
    const details: PaymentDetail[] = [{
      name: matchingUserItem.item_name,
      price: matchingUserItem.price_per_item,
      quantity: 1,
      type: matchingUserItem.item_type as 'drink' | 'food',
      dateAdded: matchingUserItem.date_added
    }];

    await addToHistory(
      db, 
      userId, 
      null, // Konsistent mit payUserItems - kein einzelnes item_id
      matchingUserItem.price_per_item, 
      matchingUserItem.item_name, 
      matchingUserItem.item_type as ItemType, 
      matchingUserItem.price_per_item,
      details
    );
    
    await db.runAsync('DELETE FROM user_items WHERE id = ?', [matchingUserItem.id]);

  } catch (e) {
    console.error("Error paying user item:", e);
  }
};

export const payUserItems = async (
  db: SQLiteDatabase, 
  userId: number, 
  itemName: string, 
  itemType: ItemType, 
  itemPrice: number, 
  quantity: number,
  dateAdded?: string
): Promise<void> => {
  try {
    // Erweiterte Query um Datum zu berücksichtigen
    let query = `SELECT id, item_id, price_per_item, item_name, item_type, date_added
        FROM user_items 
        WHERE user_id = ? AND item_name = ? AND item_type = ? AND price_per_item = ?`;
    let params: any[] = [userId, itemName, itemType, Math.round(itemPrice * 100)];
    
    if (dateAdded) {
      query += ' AND date_added = ?';
      params.push(dateAdded);
    }
    
    query += ` ORDER BY id ASC LIMIT ?`;
    params.push(quantity);

    // Hole alle passenden Items (sortiert nach ID für konsistente Reihenfolge)
    const matchingItems = await db.getAllAsync<{
      id: number;
      item_id: number;
      price_per_item: number;
      item_name: string;
      item_type: string;
      date_added: string;
    }>(query, params);

    if (matchingItems.length === 0) {
      console.warn("No matching items found to pay");
      return;
    }

    const actualQuantity = matchingItems.length;
    // Berechne die Gesamtsumme aus den tatsächlichen Preisen in Cent
    const totalAmount = matchingItems.reduce((sum, item) => sum + item.price_per_item, 0);

    // Update user debt
    const userResult = await db.getFirstAsync<{ total_debt: number }>(
      'SELECT total_debt FROM users WHERE id = ?',
      [userId]
    );

    const currentDebt = userResult?.total_debt ?? 0;
    const newDebt = Math.max(0, currentDebt - totalAmount);

    await db.runAsync('UPDATE users SET total_debt = ? WHERE id = ?', [newDebt, userId]);

    // Gruppiere Items nach Datum für bessere Historie-Anzeige
    const itemsByDate = new Map<string, { items: typeof matchingItems[0][], count: number }>();
    
    matchingItems.forEach(item => {
      const dateKey = item.date_added;
      if (itemsByDate.has(dateKey)) {
        const existing = itemsByDate.get(dateKey)!;
        existing.items.push(item);
        existing.count += 1;
      } else {
        itemsByDate.set(dateKey, { items: [item], count: 1 });
      }
    });

    // Erstelle Payment Details gruppiert nach Datum
    const details: PaymentDetail[] = [];
    itemsByDate.forEach((group, dateAdded) => {
      details.push({
        name: matchingItems[0].item_name,
        price: matchingItems[0].price_per_item,
        quantity: group.count,
        type: matchingItems[0].item_type as 'drink' | 'food',
        dateAdded: dateAdded
      });
    });

    // Erstelle einen einzigen History-Eintrag mit allen Details
    await addToHistory(
      db, 
      userId, 
      null, // Kein einzelnes item_id da es mehrere Items sind
      totalAmount, 
      matchingItems[0].item_name, 
      matchingItems[0].item_type as ItemType, 
      matchingItems[0].price_per_item, 
      details
    );

    // Delete all selected items in one go
    const itemIds = matchingItems.map(item => item.id);
    const placeholders = itemIds.map(() => '?').join(',');
    await db.runAsync(`DELETE FROM user_items WHERE id IN (${placeholders})`, itemIds);

  } catch (e) {
    console.error("Error paying user items:", e);
  }
};

const addToHistory = async (db: SQLiteDatabase, userId: number, itemId: number | null, paid: number, itemName?: string, itemType?: ItemType, itemPrice?: number, details?: PaymentDetail[]): Promise<void> => {
  try {
    const detailsJson = details ? JSON.stringify(details) : '[]';
    await db.runAsync(
      'INSERT INTO history (user_id, item_id, paid, timestamp, item_name, item_type, item_price, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, itemId, paid, Date.now(), itemName || null, itemType || null, itemPrice || null, detailsJson]
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
      details: string | null;
    }>(`
      SELECT h.id, h.user_id, h.item_id, h.paid, h.timestamp, h.item_name, h.item_type, h.details
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
      details: row.details || undefined,
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

export const cancelUserItem = async (db: SQLiteDatabase, userId: number, itemName: string, itemType: ItemType, itemPrice: number, dateAdded?: string): Promise<void> => {
  try {
    // Erweiterte Query um Datum zu berücksichtigen
    let query = 'SELECT id, item_id, price_per_item, item_name, item_type FROM user_items WHERE user_id = ? AND item_name = ? AND item_type = ? AND price_per_item = ?';
    let params: any[] = [userId, itemName, itemType, Math.round(itemPrice * 100)];
    
    if (dateAdded) {
      query += ' AND date_added = ?';
      params.push(dateAdded);
    }
    
    query += ' ORDER BY id ASC LIMIT 1';

    const matchingUserItem = await db.getFirstAsync<{
      id: number;
      item_id: number;
      price_per_item: number;
      item_name: string;
      item_type: string;
    }>(query, params);

    if (!matchingUserItem) {
      console.warn("No matching item found to cancel");
      return;
    }

    const userResult = await db.getFirstAsync<{ total_debt: number }>(
      'SELECT total_debt FROM users WHERE id = ?',
      [userId]
    );

    const currentDebt = userResult?.total_debt ?? 0;
    const newDebt = Math.max(0, currentDebt - matchingUserItem.price_per_item);

    await db.runAsync('UPDATE users SET total_debt = ? WHERE id = ?', [newDebt, userId]);
    await db.runAsync('DELETE FROM user_items WHERE id = ?', [matchingUserItem.id]);

    // Note: No history entry is created for cancellations, unlike payUserItem

  } catch (e) {
    console.error("Error canceling user item:", e);
  }
};

export const cancelUserItems = async (
  db: SQLiteDatabase, 
  userId: number, 
  itemName: string, 
  itemType: ItemType, 
  itemPrice: number, 
  quantity: number,
  dateAdded?: string
): Promise<void> => {
  try {
    // Erweiterte Query um Datum zu berücksichtigen
    let query = `SELECT id, item_id, price_per_item, item_name, item_type 
        FROM user_items 
        WHERE user_id = ? AND item_name = ? AND item_type = ? AND price_per_item = ?`;
    let params: any[] = [userId, itemName, itemType, Math.round(itemPrice * 100)];
    
    if (dateAdded) {
      query += ' AND date_added = ?';
      params.push(dateAdded);
    }
    
    query += ` ORDER BY id ASC LIMIT ?`;
    params.push(quantity);

    // Hole alle passenden Items (sortiert nach ID für konsistente Reihenfolge)
    const matchingItems = await db.getAllAsync<{
      id: number;
      item_id: number;
      price_per_item: number;
      item_name: string;
      item_type: string;
    }>(query, params);

    if (matchingItems.length === 0) {
      console.warn("No matching items found to cancel");
      return;
    }

    // Berechne die Gesamtsumme aus den tatsächlichen Preisen in Cent
    const totalAmount = matchingItems.reduce((sum, item) => sum + item.price_per_item, 0);

    // Update user debt
    const userResult = await db.getFirstAsync<{ total_debt: number }>(
      'SELECT total_debt FROM users WHERE id = ?',
      [userId]
    );

    const currentDebt = userResult?.total_debt ?? 0;
    const newDebt = Math.max(0, currentDebt - totalAmount);

    await db.runAsync('UPDATE users SET total_debt = ? WHERE id = ?', [newDebt, userId]);

    // Delete all selected items in one go
    const itemIds = matchingItems.map(item => item.id);
    const placeholders = itemIds.map(() => '?').join(',');
    await db.runAsync(`DELETE FROM user_items WHERE id IN (${placeholders})`, itemIds);

    // Note: No history entry is created for cancellations (wie bei cancelUserItem)

  } catch (e) {
    console.error("Error canceling user items:", e);
  }
};