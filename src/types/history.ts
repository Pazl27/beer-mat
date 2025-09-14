export type History = {
  id: number;
  userId: number;
  itemId: number | null;
  paid: number;
  timestamp: string;
  details?: string; // JSON string containing payment details
};

// Details structure for payment breakdowns
export interface PaymentDetail {
  name: string;
  price: number; // Price in cents
  quantity: number;
  type: 'drink' | 'food';
}
