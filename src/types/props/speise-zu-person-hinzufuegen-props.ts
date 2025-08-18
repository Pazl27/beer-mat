import { Speise } from '../speise';

export interface SpeiseZuPersonHinzufuegenProps {
  speise: Speise;
  visible: boolean;
  onClose: () => void;
  onAddToPerson: (personId: number, speise: Speise, quantity: number) => void;
}
