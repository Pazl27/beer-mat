import { DrinkCategory } from './category';

export type Getraenk = {
  id: number;
  name: string;
  price: number;
  category: DrinkCategory;
  info?: string;
};
