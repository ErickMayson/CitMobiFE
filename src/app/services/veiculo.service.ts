import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Veiculo } from '../models/veiculo.model';
import { ENABLE_DEMO_MOCKUP, DEMO_MOCK_VEICULO } from '../mock-data/mock-data';
import { environment } from '../../../environments/enviroment';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root',
})
export class VeiculoService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private loginService: LoginService) {}

  getVeiculos(): Observable<Veiculo[]> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/v1/api/veiculos`, { headers }).pipe(
      map(res => {
        const list = res.data || [];
        if (list.length === 0 && ENABLE_DEMO_MOCKUP) {
          return [DEMO_MOCK_VEICULO as unknown as Veiculo];
        }
        return list;
      }),
      catchError(() => {
        if (ENABLE_DEMO_MOCKUP) {
          return of([DEMO_MOCK_VEICULO as unknown as Veiculo]);
        }
        return of([]);
      })
    );
  }

  addVeiculo(veiculo: Veiculo): Observable<Veiculo> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/v1/api/veiculos`, veiculo, { headers }).pipe(
      map(res => res.data || veiculo)
    );
  }

  updateVeiculo(veiculo: Veiculo): Observable<Veiculo> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/v1/api/veiculos/${veiculo.plate}`, veiculo, { headers }).pipe(
      map(res => res.data || veiculo)
    );
  }

  deleteVeiculo(plate: string): Observable<boolean> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/v1/api/veiculos/${plate}`, { headers }).pipe(
      map(res => res.status === '200' || res.status === 200 || !res.status)
    );
  }
}

