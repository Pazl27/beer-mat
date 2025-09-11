import { Getraenk } from '../getraenk';
import { Person } from '../person';

export interface GetraenkZuPersonHinzufuegenProps {
  getraenk: Getraenk;
  visible: boolean;
  onClose: () => void;
  onAddToPerson: (person: Person, getraenk: Getraenk, quantity: number) => void;
}
