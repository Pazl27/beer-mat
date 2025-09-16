import { DrinkCategory, FoodCategory } from './category';

export type Item = {
  id?: number;
  name: string;
  price: number;
  type: ItemType;
  category?: FoodCategory | DrinkCategory;
  info?: string;
  originalItemId?: number; // Reference to the original item in items table
};

export enum ItemType {
  Drink = 'drink',
  Food = 'food',
}
