export interface PetSize {
  id: string;
  name: string;
  basePrice: number;
  description: string;
}

export interface ExtraService {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface Station {
  id: string;
  name: string;
  type: 'wash' | 'dry' | 'groom';
  status: 'available' | 'occupied' | 'maintenance';
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  bookingId?: string;
}

export interface DiscountRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'threshold';
  value: number;
  threshold?: number;
  enabled: boolean;
  description: string;
}

export interface Booking {
  id: string;
  stationId: string;
  petName: string;
  petSizeId: string;
  extraServiceIds: string[];
  startTime: string;
  endTime: string;
  date: string;
  customerName: string;
  customerPhone: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface BillItem {
  name: string;
  price: number;
  quantity: number;
}

export interface DiscountApplied {
  ruleId: string;
  ruleName: string;
  discountAmount: number;
}

export interface Bill {
  id: string;
  bookingId: string;
  items: BillItem[];
  subtotal: number;
  discounts: DiscountApplied[];
  totalAmount: number;
  createdAt: Date;
  status: 'unpaid' | 'paid';
}

export interface StationAvailability {
  stationId: string;
  stationName: string;
  date: string;
  timeSlots: TimeSlot[];
}
