import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MockVeiculo, MOCK_VEICULOS } from '../mock-data/mock-data';

@Injectable({
  providedIn: 'root',
})
export class VeiculoService {
  private veiculos = [...MOCK_VEICULOS];

  constructor() {}

  getVeiculos(): Observable<MockVeiculo[]> {
    return of(this.veiculos);
  }

  addVeiculo(veiculo: MockVeiculo): Observable<MockVeiculo> {
    this.veiculos.push(veiculo);
    return of(veiculo);
  }

  updateVeiculo(veiculo: MockVeiculo): Observable<MockVeiculo> {
    const index = this.veiculos.findIndex((v) => v.id === veiculo.id);
    if (index !== -1) {
      this.veiculos[index] = veiculo;
    }
    return of(veiculo);
  }

  deleteVeiculo(id: string): Observable<boolean> {
    const index = this.veiculos.findIndex((v) => v.id === id);
    if (index !== -1) {
      this.veiculos.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
