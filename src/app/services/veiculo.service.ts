import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Veiculo } from '../models/veiculo.model';
import { environment } from '../../../environments/enviroment';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root',
})
export class VeiculoService {
  private apiUrl = environment.apiUrl;
  private cachedVeiculos: Veiculo[] | null = null;

  constructor(private http: HttpClient, private loginService: LoginService) {}

  getVeiculos(forceRefresh: boolean = false): Observable<Veiculo[]> {
    if (!forceRefresh && this.cachedVeiculos) {
      return of(this.cachedVeiculos);
    }

    const headers = this.loginService.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/v1/api/veiculos`, { headers }).pipe(
      map((res) => {
        let list: Veiculo[] = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (res && Array.isArray(res.data)) {
          list = res.data;
        }
        this.cachedVeiculos = list;
        return list;
      }),
      catchError(() => of([]))
    );
  }

  clearCache(): void {
    this.cachedVeiculos = null;
  }

  addVeiculo(veiculo: Veiculo): Observable<Veiculo> {
    this.clearCache();
    const headers = this.loginService.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/v1/api/veiculos`, veiculo, { headers }).pipe(
      map((res) => res?.data || veiculo)
    );
  }

  updateVeiculo(veiculo: Veiculo): Observable<Veiculo> {
    this.clearCache();
    const headers = this.loginService.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/v1/api/veiculos/${veiculo.plate}`, veiculo, { headers }).pipe(
      map((res) => res?.data || veiculo)
    );
  }

  deleteVeiculo(plate: string): Observable<boolean> {
    this.clearCache();
    const headers = this.loginService.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/v1/api/veiculos/${plate}`, { headers }).pipe(
      map((res) => res?.status === '200' || res?.status === 200 || !res?.status)
    );
  }
}
