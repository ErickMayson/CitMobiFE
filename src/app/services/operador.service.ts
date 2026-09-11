import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Operador } from '../models/operador.model';
import { environment } from '../../../environments/enviroment';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root',
})
export class OperadorService {
  private apiUrl = environment.apiUrl;
  private cachedOperadores: Operador[] | null = null;

  constructor(
    private http: HttpClient,
    private loginService: LoginService
  ) {}

  clearCache(): void {
    this.cachedOperadores = null;
  }

  getOperadores(forceRefresh: boolean = false): Observable<Operador[]> {
    if (!forceRefresh && this.cachedOperadores) {
      return of(this.cachedOperadores);
    }

    const headers = this.loginService.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/v1/api/operadores`, { headers }).pipe(
      map((res) => {
        let list: any[] = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (res && Array.isArray(res.data)) {
          list = res.data;
        }
        const mapped: Operador[] = list.map((item) => ({
          id: Number(item.id || item.operadorId || 0),
          razaoSocial: item.razaoSocial || item.nome || '',
          cnpj: item.cnpj || '',
          nomeFantasia: item.nomeFantasia || undefined,
          logradouro: item.logradouro || undefined,
          numero: item.numero || undefined,
          cep: item.cep || undefined,
          telefone: item.telefone || undefined,
          email: item.email || undefined,
        }));
        this.cachedOperadores = mapped;
        return mapped;
      }),
      catchError(() => of([]))
    );
  }
}
