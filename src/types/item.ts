export type Item = {
  id?: number;
  name: string;
  price: number;
  type: ItemType;
};

export enum ItemType {
  Drink = 'drink',
  Food = 'food',
}
