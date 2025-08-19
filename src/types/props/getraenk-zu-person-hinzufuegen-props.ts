import { Getraenk } from '../getraenk';

export interface GetraenkZuPersonHinzufuegenProps {
  getraenk: Getraenk;
  visible: boolean;
  onClose: () => void;
  onAddToPerson: (personId: number, getraenk: Getraenk, quantity: number) => void;
}
