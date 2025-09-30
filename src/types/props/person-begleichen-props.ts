import { Person } from '../person';
import { ItemType } from '../item';

export interface PersonBegleichenProps {
  person: Person;
  visible: boolean;
  onClose: () => void;
  onPayItem: (personId: number, itemName: string, itemType: ItemType, itemPrice: number, dateAdded?: string) => void;
  onPayItems: (personId: number, itemName: string, itemType: ItemType, itemPrice: number, quantity: number, dateAdded?: string) => void;
  onPaySelectedItems: (personId: number, selectedItems: Array<{itemName: string, itemType: ItemType, itemPrice: number, quantity: number, dateAdded?: string}>) => void;
  onPayAll: (personId: number) => void;
}
