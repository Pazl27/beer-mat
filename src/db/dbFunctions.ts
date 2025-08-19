import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { Person, Item, ItemType,} from "@/types"
import { users, items, userItems } from "./schema";
import { eq } from "drizzle-orm";

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

export const createItem = async (db: ExpoSQLiteDatabase, item: { name: string; type: ItemType; price: number }): Promise<Item | undefined> => {
  try {
    const insertedItem = await db.insert(items).values(item).returning();

    const newItem: Item = {
      id: insertedItem[0].id,
      name: insertedItem[0].name,
      type: insertedItem[0].type,
      price: insertedItem[0].price,
    };

    return newItem;

  } catch (e) {
    console.error("Error creating item:", e);
  }
};

export const addItemToUser = async (db: ExpoSQLiteDatabase, user: Person, item: Item, quantity: number): Promise<void> => {
  try {
    await db.insert(userItems).values({
      userId: user.id,
      itemId: item.id,
      quantity: quantity,
    });

    const additionalDebt = item.price * quantity;

    const userRow = await db.select().from(users).where(eq(users.id, user.id));
    const currentDebt = userRow[0]?.totalDebt ?? 0;

    await db.update(users)
      .set({ totalDebt: currentDebt + additionalDebt })
      .where(eq(users.id, user.id));
  } catch (e) {
    console.error("Error adding item to user:", e);
  }
};

// Helper to get items for a user
const getItemsForUser = async (db: ExpoSQLiteDatabase, userId: number): Promise<Item[]> => {
  const result = await db
    .select({
      id: items.id,
      name: items.name,
      price: items.price,
      type: items.type,
      quantity: userItems.quantity,
    })
    .from(userItems)
    .innerJoin(items, eq(userItems.itemId, items.id))
    .where(eq(userItems.userId, userId));

  // Flatten out quantity (repeat item per quantity)
  const itemsList: Item[] = [];
  result.forEach(row => {
    for (let i = 0; i < (row.quantity ?? 1); i++) {
      itemsList.push({
        id: row.id,
        name: row.name,
        price: row.price,
        type: row.type as ItemType,
      });
    }
  });
  return itemsList;
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
  }));
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
    // Delete all user items
    await db.delete(userItems).where(eq(userItems.userId, userId));
    
    // Reset totalDebt to 0
    await db.update(users)
      .set({ totalDebt: 0 })
      .where(eq(users.id, userId));
  } catch (e) {
    console.error("Error clearing user debt:", e);
  }
};

// Remove one item from user by name and type (for paying individual items)
export const payUserItem = async (db: ExpoSQLiteDatabase, userId: number, itemName: string, itemType: ItemType): Promise<void> => {
  try {
    // Find the first matching item for this user
    const userItemsWithDetails = await db
      .select({
        userItemId: userItems.id,
        itemId: userItems.itemId,
        quantity: userItems.quantity,
        itemName: items.name,
        itemType: items.type,
        itemPrice: items.price,
      })
      .from(userItems)
      .innerJoin(items, eq(userItems.itemId, items.id))
      .where(eq(userItems.userId, userId));

    const matchingUserItem = userItemsWithDetails.find(
      item => item.itemName === itemName && item.itemType === itemType
    );

    if (!matchingUserItem) {
      console.warn("No matching item found to pay");
      return;
    }

    // If quantity is 1, delete the entire userItem record
    if (matchingUserItem.quantity <= 1) {
      await db.delete(userItems).where(eq(userItems.id, matchingUserItem.userItemId));
    } else {
      // Otherwise, decrease quantity by 1
      await db.update(userItems)
        .set({ quantity: matchingUserItem.quantity - 1 })
        .where(eq(userItems.id, matchingUserItem.userItemId));
    }

    // Update user's totalDebt (subtract the price of one item)
    const userRow = await db.select().from(users).where(eq(users.id, userId));
    const currentDebt = userRow[0]?.totalDebt ?? 0;
    const newDebt = Math.max(0, currentDebt - matchingUserItem.itemPrice);

    await db.update(users)
      .set({ totalDebt: newDebt })
      .where(eq(users.id, userId));

  } catch (e) {
    console.error("Error paying user item:", e);
  }
};