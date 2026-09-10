import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MockMotorista, ENABLE_DEMO_MOCKUP, DEMO_MOCK_MOTORISTA } from '../mock-data/mock-data';
import { environment } from '../../../environments/enviroment';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root',
})
export class MotoristaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private loginService: LoginService) {}

  getMotoristas(): Observable<MockMotorista[]> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/v1/api/motoristas`, { headers }).pipe(
      map(res => {
        const list = res.data || [];
        if (list.length === 0 && ENABLE_DEMO_MOCKUP) {
          return [DEMO_MOCK_MOTORISTA];
        }
        return list;
      }),
      catchError(() => {
        if (ENABLE_DEMO_MOCKUP) {
          return of([DEMO_MOCK_MOTORISTA]);
        }
        return of([]);
      })
    );
  }

  addMotorista(motorista: MockMotorista): Observable<MockMotorista> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/v1/api/motoristas`, motorista, { headers }).pipe(
      map(res => res.data || motorista)
    );
  }

  updateMotorista(motorista: MockMotorista): Observable<MockMotorista> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/v1/api/motoristas/${motorista.id}`, motorista, { headers }).pipe(
      map(res => res.data || motorista)
    );
  }

  deleteMotorista(id: string): Observable<boolean> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/v1/api/motoristas/${id}`, { headers }).pipe(
      map(res => res.status === '200' || res.status === 200 || !res.status)
    );
  }
}
