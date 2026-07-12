import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  MOCK_STATS,
  MOCK_LINHAS_BY_DAY,
  MOCK_VEHICLE_STATUS,
  MOCK_DRIVERS_BY_SHIFT,
  MOCK_RECENT_ACTIVITY,
  MOCK_LINHAS_BY_HOUR,
  MOCK_PASSENGER_CAPACITY_BY_HOUR,
  MOCK_VEHICLES_BY_LINHA,
  MOCK_RESERVE_VEHICLES_BY_HOUR,
  MOCK_VEHICLE_INCIDENTS,
} from '../mock-data/mock-data';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor() {}

  getStats(): Observable<any> {
    return of(MOCK_STATS);
  }

  getLinhasByDay(): Observable<any[]> {
    return of(MOCK_LINHAS_BY_DAY);
  }

  getVehicleStatus(): Observable<any[]> {
    return of(MOCK_VEHICLE_STATUS);
  }

  getDriversByShift(): Observable<any[]> {
    return of(MOCK_DRIVERS_BY_SHIFT);
  }

  getRecentActivity(): Observable<any[]> {
    return of(MOCK_RECENT_ACTIVITY);
  }

  getLinhasByHour(): Observable<any[]> {
    return of(MOCK_LINHAS_BY_HOUR);
  }

  getPassengerCapacityByHour(): Observable<any[]> {
    return of(MOCK_PASSENGER_CAPACITY_BY_HOUR);
  }

  getVehiclesByLinha(): Observable<any[]> {
    return of(MOCK_VEHICLES_BY_LINHA);
  }

  getReserveVehiclesByHour(): Observable<any[]> {
    return of(MOCK_RESERVE_VEHICLES_BY_HOUR);
  }

  getVehicleIncidents(): Observable<any[]> {
    return of(MOCK_VEHICLE_INCIDENTS);
  }
}
