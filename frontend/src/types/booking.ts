export type Event = {
  id: number;
  name: string;
  total_seats: number;
  available_seats: number;
};

export type Hold = {
  id: number;
  event: number;
  user_identifier: string;
  quantity: number;
  expires_at: string;
  status: 'ACTIVE' | 'CONFIRMED' | 'EXPIRED';
};

export type Booking = {
  id: number;
  event: number;
  user_identifier: string;
  quantity: number;
  created_at: string;
};