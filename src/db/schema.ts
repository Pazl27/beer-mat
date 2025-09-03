import { ItemType } from "@/types";

// Database row interfaces
export interface UserRow {
  id: number;
  name: string;
  total_debt: number;
}

export interface ItemRow {
  id: number;
  name: string;
  type: ItemType;
  price: number;
  info: string | null;
  category: string | null;
}

export interface UserItemRow {
  id: number;
  user_id: number;
  item_id: number;
  price_per_item: number;
  item_name: string;
  item_type: ItemType;
  item_price: number;
}

export interface HistoryRow {
  id: number;
  user_id: number | null;
  item_id: number | null;
  timestamp: number;
  paid: number;
  item_name: string | null;
  item_type: ItemType | null;
  item_price: number | null;
}

// Types for inserts (without id and with optional fields)
export type UserInsert = Omit<UserRow, 'id' | 'total_debt'> & { total_debt?: number };
export type ItemInsert = Omit<ItemRow, 'id'>;
export type UserItemInsert = Omit<UserItemRow, 'id'>;
export type HistoryInsert = Omit<HistoryRow, 'id'>;

// Legacy exports for compatibility
export type User = UserInsert;
export type Item = ItemInsert;
export type UserItem = UserItemInsert;
export type History = HistoryInsert;