import { Person } from '../person';
import { ItemType } from '../item';

export interface PersonArtikelHinzufuegenProps {
  person: Person;
  visible: boolean;
  onClose: () => void;
  onAddItems: (
    personId: number,
    selectedItems: Array<{ name: string; price: number; type: ItemType; quantity: number; itemId: number }>
  ) => void;
}
