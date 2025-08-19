import { Getraenk } from '../getraenk';

export interface GetraenkDetailsProps {
  getraenk: Getraenk;
  visible: boolean;
  onClose: () => void;
  onUpdate: (updatedGetraenk: Getraenk) => void;
  onDelete: (id: number) => void;
}
