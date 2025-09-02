import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { Person, Item, ItemType, History, Speise } from "@/types"
import { users, items, userItems, history } from "./schema";
import { eq, desc } from "drizzle-orm";
import { DrinkCategory, FoodCategory } from "@/types/category";

export const createUser = async (db: ExpoSQLiteDatabase, name: string): Promise<Person | undefined> => {
  try {
    const insertedUser = await db.insert(users).values([
      { name: name },
    ]).returning();

    const newPerson: Person = {
      id: insertedUser[0].id,
      name: insertedUser[0].name,
      totalDebt: 0,
      items: [],
    }

    return newPerson;

  } catch (e) {
    console.error("Error adding dummy data:", e);
  }
}

function parseCategory(category: string | undefined): DrinkCategory | FoodCategory | undefined {
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
  db: ExpoSQLiteDatabase,
  item: { name: string; type: ItemType; price: number; info?: string; category?: DrinkCategory | FoodCategory }
): Promise<Item | undefined> => {
  try {
    // Save the enum as a string in the DB
    const insertedItem = await db.insert(items).values({
      ...item,
      category: item.category ?? null,
    }).returning();

    const dbItem = insertedItem[0];

    const newItem: Item = {
      id: dbItem.id,
      name: dbItem.name,
      type: dbItem.type,
      price: dbItem.price,
      info: dbItem.info,
      category: parseCategory(dbItem.category),
    };

    return newItem;

  } catch (e) {
    console.error("Error creating item:", e);
  }
};

export const addItemToUser = async (
  db: ExpoSQLiteDatabase,
  user: Person,
  item: Item,
  quantity: number
): Promise<void> => {
  try {
    // Insert one row per item (not just one row with quantity)
    for (let i = 0; i < quantity; i++) {
      await db.insert(userItems).values({
        userId: user.id,
        itemId: item.id,
        pricePerItem: item.price,
        itemName: item.name,
        itemPrice: item.price,
        itemType: item.type,
      });
    }

    const additionalDebt = item.price * quantity;

    const userRow = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));

    const currentDebt = userRow[0]?.totalDebt ?? 0;

    await db
      .update(users)
      .set({ totalDebt: currentDebt + additionalDebt })
      .where(eq(users.id, user.id));
  } catch (e) {
    console.error("Error adding item to user:", e);
  }
};

export const getItemsForUser = async (db: ExpoSQLiteDatabase, userId: number): Promise<Item[]> => {
  const rows = await db
    .select()
    .from(userItems)
    .where(eq(userItems.userId, userId));

  return rows.map((row) => ({
    id: row.itemId ?? undefined,
    name: row.itemName,
    price: row.itemPrice,
    type: row.itemType as ItemType,
  }));
};

// Main function to get all users with items and totalDebt
export const getAllUsers = async (db: ExpoSQLiteDatabase): Promise<Person[]> => {
  const userRows = await db.select().from(users);

  const persons: Person[] = [];
  for (const user of userRows) {
    const userItems = await getItemsForUser(db, user.id);

    persons.push({
      id: user.id,
      name: user.name,
      totalDebt: user.totalDebt ?? 0,
      items: userItems,
    });
  }
  return persons;
};

export const getAllItems = async (db: ExpoSQLiteDatabase): Promise<Item[]> => {
  const result = await db.select().from(items);

  return result.map(row => ({
    id: row.id,
    name: row.name,
    price: row.price,
    type: row.type,
    info: row.info || undefined,
    category: parseCategory(row.category),
  }));
};

export const getAllFoodItems = async (db: ExpoSQLiteDatabase): Promise<Speise[]> => {
  const result = await db.select().from(items).where(eq(items.type, ItemType.Food));

  return result.map(row => ({
    id: row.id,
    name: row.name,
    price: row.price,
    info: row.info || undefined,
    category: parseCategory(row.category) as FoodCategory || FoodCategory.Hauptgericht,
  }));
};

export const createFoodItem = async (
  db: ExpoSQLiteDatabase,
  speise: { name: string; price: number; category: FoodCategory; info?: string }
): Promise<Speise | undefined> => {
  try {
    const insertedItem = await db.insert(items).values({
      name: speise.name,
      type: ItemType.Food,
      price: speise.price,
      info: speise.info || null,
      category: speise.category,
    }).returning();

    const dbItem = insertedItem[0];

    const newSpeise: Speise = {
      id: dbItem.id,
      name: dbItem.name,
      price: dbItem.price,
      info: dbItem.info || undefined,
      category: parseCategory(dbItem.category) as FoodCategory || FoodCategory.Hauptgericht,
    };

    return newSpeise;

  } catch (e) {
    console.error("Error creating food item:", e);
  }
};

export const updateFoodItem = async (
  db: ExpoSQLiteDatabase,
  speise: Speise
): Promise<void> => {
  try {
    await db.update(items)
      .set({
        name: speise.name,
        price: speise.price,
        info: speise.info || null,
        category: speise.category,
      })
      .where(eq(items.id, speise.id));
  } catch (e) {
    console.error("Error updating food item:", e);
  }
};

export const deleteFoodItem = async (db: ExpoSQLiteDatabase, itemId: number): Promise<void> => {
  try {
    await db.delete(items).where(eq(items.id, itemId));
  } catch (e) {
    console.error("Error deleting food item:", e);
  }
};

export const deleteUser = async (db: ExpoSQLiteDatabase, userId: number): Promise<void> => {
  try {
    await db.delete(users).where(eq(users.id, userId));
  } catch (e) {
    console.error("Error deleting user:", e);
  }
};

export const deleteItem = async (db: ExpoSQLiteDatabase, itemId: number): Promise<void> => {
  try {
    await db.delete(items).where(eq(items.id, itemId));
  } catch (e) {
    console.error("Error deleting item:", e);
  }
};

// Clear all debt and items for a user
export const clearUserDebt = async (db: ExpoSQLiteDatabase, userId: number): Promise<void> => {
  try {
    const totalDebt = await db.select({ totalDebt: users.totalDebt }).from(users).where(eq(users.id, userId));

    // Delete all user items
    await db.delete(userItems).where(eq(userItems.userId, userId));

    // Reset totalDebt to 0
    await db.update(users)
      .set({ totalDebt: 0 })
      .where(eq(users.id, userId));

    await addToHistory(db, userId, null, totalDebt[0]?.totalDebt ?? 0); // Add to history with 0 paid amount
  } catch (e) {
    console.error("Error clearing user debt:", e);
  }
};

// Remove one item from user by name and type (for paying individual items) - for clear single items from debt
export const payUserItem = async (db: ExpoSQLiteDatabase, userId: number, itemName: string, itemType: ItemType): Promise<void> => {
try {
    // Find the first matching snapshot item for this user
    const userItemsWithDetails = await db
      .select()
      .from(userItems)
      .where(eq(userItems.userId, userId));

    const matchingUserItem = userItemsWithDetails.find(
      (item) => item.itemName === itemName && item.itemType === itemType
    );

    if (!matchingUserItem) {
      console.warn("No matching item found to pay");
      return;
    }

    await db
      .delete(userItems)
      .where(eq(userItems.id, matchingUserItem.id));

    // Update user's totalDebt (subtract snapshot price)
    const userRow = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    const currentDebt = userRow[0]?.totalDebt ?? 0;
    const newDebt = Math.max(0, currentDebt - matchingUserItem.pricePerItem);

    await db
      .update(users)
      .set({ totalDebt: newDebt })
      .where(eq(users.id, userId));

    await addToHistory(db, userId, matchingUserItem.itemId, matchingUserItem.pricePerItem);

    // Delete the user_items row (since each row is one item instance)
    await db.delete(userItems).where(eq(userItems.id, matchingUserItem.itemId));

  } catch (e) {
    console.error("Error paying user item:", e);
  }
};

const addToHistory = async (db: ExpoSQLiteDatabase, userId: number, itemId: number | null, paid: number): Promise<void> => {
  try {
    await db.insert(history).values({
      userId,
      itemId,
      paid,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error("Error adding to history:", e);
  }
};

export const getHistoryForUser = async (db: ExpoSQLiteDatabase, userId: number): Promise<History[]> => {
  try {
    const result = await db.select().from(history).where(eq(history.userId, userId));

    return result.map(row => ({
      id: row.id,
      userId: row.userId,
      itemId: row.itemId,
      paid: row.paid,
      timestamp: String(row.timestamp),
    }));
  } catch(e) {
    console.error("Error fetching history for user:", e);
    return [];
  }
};

export const getDetailedHistoryForUser = async (db: ExpoSQLiteDatabase, userId: number): Promise<(History & { itemName?: string; itemType?: ItemType })[]> => {
  try {
    const result = await db
      .select({
        id: history.id,
        userId: history.userId,
        itemId: history.itemId,
        paid: history.paid,
        timestamp: history.timestamp,
        itemName: items.name,
        itemType: items.type,
      })
      .from(history)
      .leftJoin(items, eq(history.itemId, items.id))
      .where(eq(history.userId, userId))
      .orderBy(desc(history.timestamp));

    return result.map(row => ({
      id: row.id,
      userId: row.userId,
      itemId: row.itemId,
      paid: row.paid,
      timestamp: String(row.timestamp),
      itemName: row.itemName || undefined,
      itemType: row.itemType as ItemType || undefined,
    }));
  } catch(e) {
    console.error("Error fetching detailed history for user:", e);
    return [];
  }
};