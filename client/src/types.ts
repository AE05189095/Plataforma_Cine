// src/types.ts

// Definición básica del estado del asiento para el ShowTime
export type SeatStatus = 'available' | 'premium' | 'occupied' | 'reserved';

// Definición de la estructura del asiento
export interface Seat {
  id: string;
  row: string;
  number: number;
  status: SeatStatus;
}

// Tipos para las respuestas de la API
export interface Showtime {
  id: string;
  movie: {
    title: string;
    duration: number;
  };
  hall: {
    name: string;
    capacity: number;
  };
  startAt: string;
  seatsBooked: string[];
  seatsLocked: string[];
}

export interface PurchaseRequest {
  showtimeId: string;
  seats: string[];
  paymentInfo: PaymentInfo;
}

export interface PaymentInfo {
  method: 'card' | 'cash' | 'transfer';
  details?: {
    cardNumber?: string;
    cardHolder?: string;
    expiryDate?: string;
    cvv?: string;
  };
}

export interface PurchaseResponse {
  id: string;
  showtime: Showtime;
  seats: string[];
  total: number;
  purchaseDate: string;
}

export interface LockSeatsResponse {
  lockedSeats: string[];
  userLockedSeats: string[];
  expirationTime: string;
}