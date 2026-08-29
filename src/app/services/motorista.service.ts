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
    return this.http.get<any>(`${this.apiUrl}/v1/api/usuarios`, {
      headers,
      params: { role: 'MOTORISTA' }
    }).pipe(
      map(res => {
        const list = (res.data || []).map((u: any) => {
          return {
            id: u.login,
            nome: u.nome,
            cpf: u.cpf,
            telefone: u.telefone,
            status: 'FORA DE TURNO',
            horarios: []
          } as MockMotorista;
        });

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
    const currentUser = this.loginService.currentUserValue;
    const body = {
      login: motorista.cpf.replace(/\D/g, ''),
      senha: 'mobibrasil', // Default password
      email: `${motorista.nome.toLowerCase().replace(/\s+/g, '')}@citmobi.com.br`,
      nome: motorista.nome,
      telefone: motorista.telefone.replace(/\D/g, ''),
      cpf: motorista.cpf.replace(/\D/g, ''),
      flagAtivo: 'S',
      role: 'MOTORISTA',
      operador: currentUser?.operador
    };

    return this.http.post<any>(`${this.apiUrl}/v1/api/usuarios`, body, { headers }).pipe(
      map(() => motorista)
    );
  }

  updateMotorista(motorista: MockMotorista): Observable<MockMotorista> {
    const headers = this.loginService.getAuthHeaders();
    const body = {
      nome: motorista.nome,
      telefone: motorista.telefone.replace(/\D/g, ''),
      cpf: motorista.cpf.replace(/\D/g, ''),
      flagAtivo: 'S',
      role: 'MOTORISTA'
    };
    return this.http.patch<any>(`${this.apiUrl}/v1/api/usuarios/${motorista.id}`, body, { headers }).pipe(
      map(() => motorista)
    );
  }

  deleteMotorista(id: string): Observable<boolean> {
    const headers = this.loginService.getAuthHeaders();
    const body = {
      flagAtivo: 'N'
    };
    return this.http.patch<any>(`${this.apiUrl}/v1/api/usuarios/${id}`, body, { headers }).pipe(
      map(res => res.status === '200' || res.status === 200)
    );
  }
}
