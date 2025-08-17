import { Speise } from '../speise';

export interface SpeiseZuPersonHinzufuegenProps {
  speise: Speise;
  visible: boolean;
  onClose: () => void;
  onAddToPerson: (personId: string, speise: Speise, quantity: number) => void;
}
