import { v4 as uuidv4 } from 'uuid';
import { Bill, BillItem, DiscountApplied } from '../../types';
import { dataStore } from './dataStore';
import { petSizes, extraServices } from '../../data/initialData';

export interface CalculateBillRequest {
  bookingId: string;
  petSizeId: string;
  extraServiceIds: string[];
  applyDiscounts?: boolean;
}

export interface BillCalculationResult {
  items: BillItem[];
  subtotal: number;
  discounts: DiscountApplied[];
  totalAmount: number;
}

export class BillingService {
  calculateBill(request: CalculateBillRequest): BillCalculationResult {
    const items: BillItem[] = [];

    const petSize = petSizes.find(p => p.id === request.petSizeId);
    if (petSize) {
      items.push({
        name: `${petSize.name}基础洗护`,
        price: petSize.basePrice,
        quantity: 1,
      });
    }

    for (const serviceId of request.extraServiceIds) {
      const service = extraServices.find(s => s.id === serviceId);
      if (service) {
        items.push({
          name: service.name,
          price: service.price,
          quantity: 1,
        });
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discounts: DiscountApplied[] = [];

    if (request.applyDiscounts !== false) {
      const enabledRules = dataStore.getEnabledDiscountRules();
      let currentTotal = subtotal;

      for (const rule of enabledRules) {
        let discountAmount = 0;

        switch (rule.type) {
          case 'percentage':
            discountAmount = currentTotal * (rule.value / 100);
            break;
          case 'fixed':
            discountAmount = rule.value;
            break;
          case 'threshold':
            if (rule.threshold && currentTotal >= rule.threshold) {
              discountAmount = rule.value;
            }
            break;
        }

        if (discountAmount > 0) {
          discounts.push({
            ruleId: rule.id,
            ruleName: `${rule.name} ${rule.type === 'percentage' ? `${rule.value}%` : ''}`,
            discountAmount: Math.round(discountAmount * 100) / 100,
          });
          currentTotal -= discountAmount;
        }
      }
    }

    const totalDiscount = discounts.reduce((sum, d) => sum + d.discountAmount, 0);
    const totalAmount = Math.round((subtotal - totalDiscount) * 100) / 100;

    return {
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discounts,
      totalAmount,
    };
  }

  createBill(bookingId: string, petSizeId: string, extraServiceIds: string[]): Bill {
    const calculation = this.calculateBill({
      bookingId,
      petSizeId,
      extraServiceIds,
    });

    const bill: Bill = {
      id: uuidv4(),
      bookingId,
      items: calculation.items,
      subtotal: calculation.subtotal,
      discounts: calculation.discounts,
      totalAmount: calculation.totalAmount,
      createdAt: new Date(),
      status: 'unpaid',
    };

    dataStore.addBill(bill);
    return bill;
  }

  getBill(id: string): Bill | undefined {
    return dataStore.getBill(id);
  }

  getBillByBookingId(bookingId: string): Bill | undefined {
    return dataStore.getBillByBookingId(bookingId);
  }

  getAllBills(): Bill[] {
    return dataStore.getAllBills();
  }

  markBillAsPaid(id: string): boolean {
    const bill = dataStore.getBill(id);
    if (bill) {
      bill.status = 'paid';
      return true;
    }
    return false;
  }

  quickCalculate(petSizeId: string, extraServiceIds: string[]): number {
    const result = this.calculateBill({
      bookingId: 'quick',
      petSizeId,
      extraServiceIds,
    });
    return result.totalAmount;
  }
}

export const billingService = new BillingService();
