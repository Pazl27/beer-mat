import { FoodCategory } from './category';

export type Speise = {
  id: number;
  name: string;
  price: number;
  category: FoodCategory;
  info?: string;
};
