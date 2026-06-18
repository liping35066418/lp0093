export * from './timeUtils';
export * from './dataStore';
export * from './bookingService';
export * from './billingService';
export * from './discountService';

import { bookingService } from './bookingService';
import { billingService } from './billingService';
import { discountService } from './discountService';
import { dataStore } from './dataStore';

export const module8853 = {
  booking: bookingService,
  billing: billingService,
  discount: discountService,
  store: dataStore,
};
