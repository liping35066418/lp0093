import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { bookingService } from './modules/8853/bookingService';
import { billingService } from './modules/8853/billingService';
import { discountService } from './modules/8853/discountService';
import { petSizes, extraServices, stations } from './data/initialData';
import { formatDate } from './modules/8853/timeUtils';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/pet-sizes', (req: Request, res: Response) => {
  res.json(petSizes);
});

app.get('/api/extra-services', (req: Request, res: Response) => {
  res.json(extraServices);
});

app.get('/api/stations', (req: Request, res: Response) => {
  const date = (req.query.date as string) || formatDate(new Date());
  const availability = bookingService.getAllStationsAvailability(date);
  
  const stationsWithAvailability = stations.map(station => {
    const stationAvail = availability.find(a => a.stationId === station.id);
    return {
      ...station,
      timeSlots: stationAvail?.timeSlots || [],
    };
  });
  
  res.json(stationsWithAvailability);
});

app.get('/api/stations/:id/availability', (req: Request, res: Response) => {
  const { id } = req.params;
  const date = (req.query.date as string) || formatDate(new Date());
  
  const availability = bookingService.getStationAvailability(id, date);
  if (!availability) {
    return res.status(404).json({ error: '工位不存在' });
  }
  
  res.json(availability);
});

app.post('/api/bookings', (req: Request, res: Response) => {
  const result = bookingService.createBooking(req.body);
  res.json(result);
});

app.get('/api/bookings', (req: Request, res: Response) => {
  const date = (req.query.date as string) || formatDate(new Date());
  const bookings = bookingService.getAllBookings().filter(b => b.date === date);
  res.json(bookings);
});

app.get('/api/bookings/:id', (req: Request, res: Response) => {
  const booking = bookingService.getBooking(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: '预约不存在' });
  }
  res.json(booking);
});

app.put('/api/bookings/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const success = bookingService.updateBookingStatus(req.params.id, status);
  if (!success) {
    return res.status(404).json({ error: '预约不存在' });
  }
  res.json({ success: true });
});

app.post('/api/billing/calculate', (req: Request, res: Response) => {
  const { petSizeId, extraServiceIds } = req.body;
  const result = billingService.calculateBill({
    bookingId: req.body.bookingId,
    petSizeId,
    extraServiceIds,
  });
  res.json(result);
});

app.post('/api/billing/booking/:bookingId', (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { petSizeId, extraServiceIds } = req.body;
  
  const bill = billingService.createBill(bookingId, petSizeId, extraServiceIds);
  res.json(bill);
});

app.get('/api/billing', (req: Request, res: Response) => {
  const bills = billingService.getAllBills();
  res.json(bills);
});

app.get('/api/billing/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (id === 'booking') {
    const bookingId = req.query.bookingId as string;
    if (bookingId) {
      const bill = billingService.getBillByBookingId(bookingId);
      if (!bill) {
        return res.status(404).json({ error: '账单不存在' });
      }
      return res.json(bill);
    }
  }
  
  const bill = billingService.getBill(id);
  if (!bill) {
    return res.status(404).json({ error: '账单不存在' });
  }
  res.json(bill);
});

app.put('/api/billing/:id/pay', (req: Request, res: Response) => {
  const success = billingService.markBillAsPaid(req.params.id);
  if (!success) {
    return res.status(404).json({ error: '账单不存在' });
  }
  res.json({ success: true });
});

app.get('/api/billing/quick', (req: Request, res: Response) => {
  const petSizeId = req.query.petSizeId as string;
  const extraServiceIdsStr = req.query.extraServiceIds as string;
  const extraServiceIds = extraServiceIdsStr ? extraServiceIdsStr.split(',') : [];
  
  const result = billingService.quickCalculate(petSizeId, extraServiceIds);
  res.json(result);
});

app.get('/api/discounts', (req: Request, res: Response) => {
  res.json(discountService.getAllRules());
});

app.get('/api/discounts/enabled', (req: Request, res: Response) => {
  res.json(discountService.getEnabledRules());
});

app.post('/api/discounts', (req: Request, res: Response) => {
  const rule = discountService.createRule(req.body);
  res.json(rule);
});

app.put('/api/discounts/:id', (req: Request, res: Response) => {
  const updated = discountService.updateRule(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: '规则不存在' });
  }
  res.json(updated);
});

app.put('/api/discounts/:id/toggle', (req: Request, res: Response) => {
  const success = discountService.toggleRuleStatus(req.params.id);
  if (!success) {
    return res.status(404).json({ error: '规则不存在' });
  }
  res.json({ success: true });
});

app.delete('/api/discounts/:id', (req: Request, res: Response) => {
  const success = discountService.deleteRule(req.params.id);
  if (!success) {
    return res.status(404).json({ error: '规则不存在' });
  }
  res.json({ success: true });
});

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🐾 宠物洗护门店预约系统已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📦 模块 8853: 预约与计费核心逻辑 - 已加载`);
  console.log(`🏪 模块 3853: 门店平面工位页面 - 已就绪`);
});

export default app;
