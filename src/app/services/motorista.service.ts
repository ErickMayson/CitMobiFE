import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MockMotorista, MOCK_MOTORISTAS } from '../mock-data/mock-data';

@Injectable({
  providedIn: 'root',
})
export class MotoristaService {
  private motoristas = [...MOCK_MOTORISTAS];

  constructor() {}

  getMotoristas(): Observable<MockMotorista[]> {
    return of(this.motoristas);
  }

  addMotorista(motorista: MockMotorista): Observable<MockMotorista> {
    this.motoristas.push(motorista);
    return of(motorista);
  }

  updateMotorista(motorista: MockMotorista): Observable<MockMotorista> {
    const index = this.motoristas.findIndex((m) => m.id === motorista.id);
    if (index !== -1) {
      this.motoristas[index] = motorista;
    }
    return of(motorista);
  }

  deleteMotorista(id: string): Observable<boolean> {
    const index = this.motoristas.findIndex((m) => m.id === id);
    if (index !== -1) {
      this.motoristas.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
