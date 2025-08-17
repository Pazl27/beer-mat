import { Person } from '../person';

export interface PersonBegleichenProps {
  person: Person;
  visible: boolean;
  onClose: () => void;
  onPayItem: (personId: string, itemName: string, itemType: 'speise' | 'getraenk') => void;
  onPayAll: (personId: string) => void;
}
