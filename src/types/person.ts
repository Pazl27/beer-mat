import { Item } from './item';

export type Person = {
  id: number;
  name: string;
  totalDebt: number;
  items: Item[];
};
