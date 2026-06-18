import { v4 as uuidv4 } from 'uuid';
import { Booking, StationAvailability } from '../../types';
import { dataStore } from './dataStore';
import { stations } from '../../data/initialData';
import {
  generateTimeSlots,
  checkTimeOverlap,
  formatDate,
  getSlotsInRange,
} from './timeUtils';

export interface CreateBookingRequest {
  stationId: string;
  petName: string;
  petSizeId: string;
  extraServiceIds: string[];
  startTime: string;
  endTime: string;
  date?: string;
  customerName: string;
  customerPhone: string;
}

export interface BookingResult {
  success: boolean;
  booking?: Booking;
  error?: string;
}

export class BookingService {
  getStationAvailability(stationId: string, date?: string): StationAvailability | null {
    const station = stations.find(s => s.id === stationId);
    if (!station) return null;

    const targetDate = date || formatDate(new Date());
    const existingBookings = dataStore.getBookingsByStationAndDate(stationId, targetDate);
    const timeSlots = generateTimeSlots();

    for (const booking of existingBookings) {
      const slotsToMark = getSlotsInRange(timeSlots, booking.startTime, booking.endTime);
      for (const slot of slotsToMark) {
        slot.available = false;
        slot.bookingId = booking.id;
      }
    }

    return {
      stationId: station.id,
      stationName: station.name,
      date: targetDate,
      timeSlots,
    };
  }

  getAllStationsAvailability(date?: string): StationAvailability[] {
    const targetDate = date || formatDate(new Date());
    return stations
      .map(s => this.getStationAvailability(s.id, targetDate))
      .filter((s): s is StationAvailability => s !== null);
  }

  checkTimeConflict(
    stationId: string,
    startTime: string,
    endTime: string,
    date?: string,
    excludeBookingId?: string
  ): { conflict: boolean; conflictingBooking?: Booking } {
    const targetDate = date || formatDate(new Date());
    const existingBookings = dataStore.getBookingsByStationAndDate(stationId, targetDate);

    for (const booking of existingBookings) {
      if (excludeBookingId && booking.id === excludeBookingId) continue;
      if (checkTimeOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
        return { conflict: true, conflictingBooking: booking };
      }
    }

    return { conflict: false };
  }

  createBooking(request: CreateBookingRequest): BookingResult {
    const station = stations.find(s => s.id === request.stationId);
    if (!station) {
      return { success: false, error: '工位不存在' };
    }

    const targetDate = request.date || formatDate(new Date());

    const { conflict, conflictingBooking } = this.checkTimeConflict(
      request.stationId,
      request.startTime,
      request.endTime,
      targetDate
    );

    if (conflict && conflictingBooking) {
      return {
        success: false,
        error: `时段冲突：${request.startTime}-${request.endTime} 已被 ${conflictingBooking.petName} 预约`,
      };
    }

    const booking: Booking = {
      id: uuidv4(),
      stationId: request.stationId,
      petName: request.petName,
      petSizeId: request.petSizeId,
      extraServiceIds: request.extraServiceIds,
      startTime: request.startTime,
      endTime: request.endTime,
      date: targetDate,
      customerName: request.customerName,
      customerPhone: request.customerPhone,
      status: 'confirmed',
      createdAt: new Date(),
    };

    dataStore.addBooking(booking);
    return { success: true, booking };
  }

  getBooking(id: string): Booking | undefined {
    return dataStore.getBooking(id);
  }

  getAllBookings(): Booking[] {
    return dataStore.getAllBookings();
  }

  updateBookingStatus(id: string, status: Booking['status']): boolean {
    return dataStore.updateBookingStatus(id, status);
  }

  getOccupiedSlotCount(stationId: string, date?: string): number {
    const availability = this.getStationAvailability(stationId, date);
    if (!availability) return 0;
    return availability.timeSlots.filter(s => !s.available).length;
  }
}

export const bookingService = new BookingService();
