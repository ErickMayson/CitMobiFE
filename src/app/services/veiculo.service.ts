import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MockVeiculo as Veiculo } from '../mock-data/mock-data';
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
      map(res => res.data || [])
    );
  }

  addVeiculo(veiculo: Veiculo): Observable<Veiculo> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/v1/api/veiculos`, veiculo, { headers }).pipe(
      map(res => res.data)
    );
  }

  updateVeiculo(veiculo: Veiculo): Observable<Veiculo> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/v1/api/veiculos/${veiculo.plate}`, veiculo, { headers }).pipe(
      map(res => res.data)
    );
  }

  deleteVeiculo(plate: string): Observable<boolean> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/v1/api/veiculos/${plate}`, { headers }).pipe(
      map(res => res.status === '200')
    );
  }
}
