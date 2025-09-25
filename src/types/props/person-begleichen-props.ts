import { Person } from '../person';
import { ItemType } from '../item';

export interface PersonBegleichenProps {
  person: Person;
  visible: boolean;
  onClose: () => void;
  onPayItem: (personId: number, itemName: string, itemType: ItemType, itemPrice: number) => void;
  onPayItems: (personId: number, itemName: string, itemType: ItemType, itemPrice: number, quantity: number) => void;
  onPayAll: (personId: number) => void;
}
