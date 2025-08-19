import { Speise } from '../speise';
import { Person } from '../person';

export interface SpeiseZuPersonHinzufuegenProps {
  speise: Speise;
  visible: boolean;
  onClose: () => void;
  onAddToPerson: (person: Person, speise: Speise, quantity: number) => void;
}
