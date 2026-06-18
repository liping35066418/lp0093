import { Booking, Bill, DiscountRule } from '../../types';
import { discountRules as initialDiscountRules } from '../../data/initialData';

export class DataStore {
  private bookings: Map<string, Booking> = new Map();
  private bills: Map<string, Bill> = new Map();
  private discountRules: DiscountRule[] = [...initialDiscountRules];

  addBooking(booking: Booking): void {
    this.bookings.set(booking.id, booking);
  }

  getBooking(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  getAllBookings(): Booking[] {
    return Array.from(this.bookings.values());
  }

  getBookingsByStationAndDate(stationId: string, date: string): Booking[] {
    return this.getAllBookings().filter(
      b => b.stationId === stationId && b.date === date && b.status !== 'cancelled'
    );
  }

  updateBookingStatus(id: string, status: Booking['status']): boolean {
    const booking = this.bookings.get(id);
    if (booking) {
      booking.status = status;
      return true;
    }
    return false;
  }

  addBill(bill: Bill): void {
    this.bills.set(bill.id, bill);
  }

  getBill(id: string): Bill | undefined {
    return this.bills.get(id);
  }

  getBillByBookingId(bookingId: string): Bill | undefined {
    return Array.from(this.bills.values()).find(b => b.bookingId === bookingId);
  }

  getAllBills(): Bill[] {
    return Array.from(this.bills.values());
  }

  getDiscountRules(): DiscountRule[] {
    return [...this.discountRules];
  }

  getEnabledDiscountRules(): DiscountRule[] {
    return this.discountRules.filter(r => r.enabled);
  }

  addDiscountRule(rule: DiscountRule): void {
    const existingIndex = this.discountRules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.discountRules[existingIndex] = rule;
    } else {
      this.discountRules.push(rule);
    }
  }

  updateDiscountRuleStatus(id: string, enabled: boolean): boolean {
    const rule = this.discountRules.find(r => r.id === id);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }

  deleteDiscountRule(id: string): boolean {
    const index = this.discountRules.findIndex(r => r.id === id);
    if (index >= 0) {
      this.discountRules.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const dataStore = new DataStore();
