import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Motorista } from '../models/motorista.model';
import { ENABLE_DEMO_MOCKUP, DEMO_MOCK_MOTORISTA } from '../mock-data/mock-data';
import { environment } from '../../../environments/enviroment';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root',
})
export class MotoristaService {
  private apiUrl = environment.apiUrl;
  private cachedMotoristas: Motorista[] | null = null;

  constructor(
    private http: HttpClient,
    private loginService: LoginService
  ) {}

  getMotoristas(forceRefresh: boolean = false): Observable<Motorista[]> {
    if (!forceRefresh && this.cachedMotoristas) {
      return of(this.cachedMotoristas);
    }

    const headers = this.loginService.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/v1/api/motoristas`, { headers }).pipe(
      map((res) => {
        const rawList = this.extractArray(res);
        const list: Motorista[] = rawList.map((item) => this.normalizeMotorista(item));

        this.cachedMotoristas = list;
        return list;
      }),
      catchError(() => {
        if (ENABLE_DEMO_MOCKUP) {
          const fallback = [this.normalizeMotorista(DEMO_MOCK_MOTORISTA)];
          this.cachedMotoristas = fallback;
          return of(fallback);
        }
        return of([]);
      })
    );
  }

  clearCache(): void {
    this.cachedMotoristas = null;
  }

  addMotorista(motorista: Partial<Motorista>): Observable<Motorista> {
    this.clearCache();
    const headers = this.loginService.getAuthHeaders();
    const currentUser = this.loginService.currentUserValue;
    const payload = {
      ...motorista,
      operadorId: motorista.operadorId || currentUser?.operador?.id,
    };

    return this.http.post<any>(`${this.apiUrl}/v1/api/motoristas`, payload, { headers }).pipe(
      map((res) => {
        const data = res?.data || res;
        return this.normalizeMotorista(data);
      })
    );
  }

  updateMotorista(motorista: Motorista): Observable<Motorista> {
    this.clearCache();
    const headers = this.loginService.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/v1/api/motoristas/${motorista.id}`, motorista, { headers }).pipe(
      map((res) => {
        const data = res?.data || res;
        return this.normalizeMotorista(data);
      })
    );
  }

  /**
   * Transfer a driver to a new operator (concessionaire).
   * Restricted to System Admins (ROLE_ADMIN) and Regulators (flagRegulador = 'S').
   *
   * @param id Driver UUID
   * @param novoOperadorId Target operator ID
   */
  transferDriverOperator(id: string, novoOperadorId: number): Observable<Motorista> {
    this.clearCache();
    const headers = this.loginService.getAuthHeaders();
    const params = new HttpParams().set('novoOperadorId', novoOperadorId.toString());

    return this.http.patch<any>(`${this.apiUrl}/v1/api/motoristas/${id}/operador`, null, { headers, params }).pipe(
      map((res) => {
        const data = res?.data || res;
        return this.normalizeMotorista(data);
      })
    );
  }

  deleteMotorista(id: string): Observable<boolean> {
    this.clearCache();
    const headers = this.loginService.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/v1/api/motoristas/${id}`, { headers }).pipe(
      map((res) => res?.status === '200' || res?.status === 200 || res?.success || !res?.status)
    );
  }

  private extractArray(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.content)) return res.content;
    if (res.data && Array.isArray(res.data.motoristas)) return res.data.motoristas;
    return [];
  }

  private normalizeMotorista(raw: any): Motorista {
    if (!raw) {
      return {
        id: '',
        nome: '',
        cpf: '',
        cnhNumero: '',
        cnhValidade: '',
        telefone: '',
        status: 'FORA DE TURNO',
        horarios: [],
      };
    }

    return {
      id: String(raw.id || raw.uuid || raw.usuarioId || raw.cpf || ''),
      nome: raw.nome || raw.name || raw.login || 'Motorista',
      cpf: raw.cpf || raw.login || '',
      cnhNumero: raw.cnhNumero || '',
      cnhValidade: raw.cnhValidade || '',
      login: raw.login || undefined,
      telefone: raw.telefone || raw.phone || '',
      operadorId: raw.operadorId || raw.operador?.id || undefined,
      operadorNome: raw.operadorNome || raw.operador?.razaoSocial || undefined,
      status: raw.status || 'FORA DE TURNO',
      horarios: Array.isArray(raw.horarios) ? raw.horarios : [],
    };
  }
}
