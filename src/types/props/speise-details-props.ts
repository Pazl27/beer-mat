import { Speise } from '../speise';

export interface SpeiseDetailsProps {
  speise: Speise;
  visible: boolean;
  onClose: () => void;
  onUpdate: (updatedSpeise: Speise) => void;
  onDelete: (id: number) => void;
}
