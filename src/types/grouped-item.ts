import { ItemType } from './item';

export type GroupedItem = {
  name: string;
  type: ItemType;
  count: number;
  totalPrice: number;
  unitPrice: number;
  dateAdded?: string;
};
