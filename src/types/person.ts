import { Item } from './item';

export type Person = {
  id: string;
  name: string;
  totalDebt: number;
  items: Item[];
};
