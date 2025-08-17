import { Person } from '../person';

export interface PersonArtikelHinzufuegenProps {
  person: Person;
  visible: boolean;
  onClose: () => void;
  onAddItems: (
    personId: string,
    selectedItems: Array<{ name: string; price: number; type: 'speise' | 'getraenk'; quantity: number }>
  ) => void;
}
