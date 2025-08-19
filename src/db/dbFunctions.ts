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