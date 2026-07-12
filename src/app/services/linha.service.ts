import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { LoginService } from './login.service';
import { environment } from '../../../environments/enviroment';
import { MockRota, MockEndereco, MOCK_ROTAS_ATIVAS, MOCK_ROTAS_INATIVAS } from '../mock-data/mock-data';

@Injectable({
  providedIn: 'root',
})
export class LinhaService {
  private apiUrl = environment.apiUrl;
  private activeRoutes: MockRota[] = [];
  private inactiveRoutes: MockRota[] = [];

  // Default set of line IDs to sync/fetch (includes local mocks & backend database test lines)
  private defaultLineIds = [
    { id: '001', atendimento: '1', name: 'Linha 001 - Centro/Bairro A', status: 'ativa' as const },
    { id: '002', atendimento: '1', name: 'Linha 002 - Aeroporto/Centro', status: 'ativa' as const },
    { id: '003', atendimento: '1', name: 'Linha 003 - Zona Norte/Sul', status: 'ativa' as const },
    { id: '004', atendimento: '1', name: 'Linha 004 - Terminal A/B', status: 'inativa' as const },
    { id: '005', atendimento: '1', name: 'Linha 005 - Circular', status: 'inativa' as const },
    // Database test lines inserted by V2__INSERT_MOCK.sql:
    { id: '372F', atendimento: '10', name: 'Linha 372F - USJT / Metrô Bresser', status: 'ativa' as const },
    { id: '1178', atendimento: '10', name: 'Linha 1178 - T. São Miguel / Correio', status: 'ativa' as const },
    { id: '3301', atendimento: '10', name: 'Linha 3301 - T. São Miguel / Pq Dom Pedro', status: 'ativa' as const },
    { id: '9051', atendimento: '10', name: 'Linha 9051 - T. Pinheiros / Lapa', status: 'ativa' as const },
    { id: '8000', atendimento: '10', name: 'Linha 8000 - Pça Ramos / T. Lapa', status: 'ativa' as const },
  ];

  constructor(private http: HttpClient, private loginService: LoginService) {}

  /** Queries all routes dynamically from backend or local fallback */
  private getRotas(): Observable<MockRota[]> {
    const headers = this.loginService.getAuthHeaders();

    const requests = this.defaultLineIds.map((lineDef) => {
      return this.http
        .get<any>(`${this.apiUrl}/citmobi/v1/api/linha`, {
          headers,
          params: {
            linha: lineDef.id,
            atendimento: lineDef.atendimento,
            municipio: '3550308', // Default municipality (São Paulo SP)
          },
        })
        .pipe(
          map((res) => {
            if (res && res.data && res.data.linha) {
              const l = res.data.linha;
              const status = l.flagAtiva === 'S' ? 'ativa' : 'inativa';
              
              let codeString = '';
              if (typeof l.linhaId === 'object' && l.linhaId !== null) {
                const id = (l.linhaId.linhaId || '').trim();
                const atendimento = (l.linhaId.linhaAtendimento || '').trim();
                codeString = atendimento && atendimento !== '1' ? `${id}-${atendimento}` : id;
              } else {
                codeString = String(l.linhaId).trim();
              }

              return {
                id: this.getNumberFromString(codeString),
                nome: l.linhaDescricao || lineDef.name,
                codigo: codeString,
                descricao: l.linhaDescricao || 'Linha sincronizada com banco de dados',
                distancia: '12.5 km',
                duracao: '45 min',
                veiculos: 0,
                status: status,
                enderecos: [],
              } as MockRota;
            }
            return null;
          }),
          catchError(() => {
            // Fallback to offline mocks for 001-005
            const localMock = [...MOCK_ROTAS_ATIVAS, ...MOCK_ROTAS_INATIVAS].find(
              (r) => r.codigo === lineDef.id
            );
            if (localMock) {
              return of(localMock);
            }
            // For test lines, return a default mock representation so the UI can still display it
            return of({
              id: this.getNumberFromString(lineDef.id),
              nome: lineDef.name,
              codigo: lineDef.id,
              descricao: 'Carregado de mock local (sem conexão)',
              distancia: '10.0 km',
              duracao: '30 min',
              veiculos: 0,
              status: lineDef.status,
              enderecos: [],
            } as MockRota);
          })
        );
    });

    return forkJoin(requests).pipe(
      map((results) => {
        const validRotas = results.filter((r): r is MockRota => r !== null);
        this.activeRoutes = validRotas.filter((r) => r.status === 'ativa');
        this.inactiveRoutes = validRotas.filter((r) => r.status === 'inativa');
        return validRotas;
      })
    );
  }

  getRotasAtivas(): Observable<MockRota[]> {
    return this.getRotas().pipe(map(() => this.activeRoutes));
  }

  getRotasInativas(): Observable<MockRota[]> {
    return this.getRotas().pipe(map(() => this.inactiveRoutes));
  }

  /** Fetch a specific line details from backend */
  getLinhaFromBackend(linhaId: string, atendimento: string, municipio: number): Observable<any> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/citmobi/v1/api/linha`, {
      headers,
      params: {
        linha: linhaId,
        atendimento: atendimento,
        municipio: municipio.toString(),
      },
    });
  }

  /** Fetch all registered stops for a municipality from backend */
  getParadas(municipio: number): Observable<any[]> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/citmobi/v1/api/paradas`, {
      headers,
      params: {
        municipio: municipio.toString()
      }
    }).pipe(
      map(res => {
        if (res && res.data && Array.isArray(res.data)) {
          return res.data;
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  /** Fetch itinerary (stops) for a specific line from backend */
  getItinerarioForLine(linhaId: string, atendimento: string, municipio: number): Observable<MockEndereco[]> {
    const headers = this.loginService.getAuthHeaders();
    return this.http
      .get<any>(`${this.apiUrl}/citmobi/v1/api/itinerario`, {
        headers,
        params: {
          linha: linhaId,
          atendimento: atendimento,
          municipio: municipio.toString(),
        },
      })
      .pipe(
        map((res) => {
          if (res && res.data && Array.isArray(res.data)) {
            return res.data.map((item: any, index: number) => {
              const parada = item.parada || {};
              const lat =
                Array.isArray(parada.latLong) && parada.latLong.length >= 2
                  ? parada.latLong[0]
                  : 0;
              const lng =
                Array.isArray(parada.latLong) && parada.latLong.length >= 2
                  ? parada.latLong[1]
                  : 0;
              return {
                id: parada.paradaId || index,
                nome: parada.logradouro || `Parada ${index + 1}`,
                endereco: `${parada.logradouro || ''}, ${parada.numero || ''}`,
                lat: lat,
                lng: lng,
                ordem: index,
              } as MockEndereco;
            });
          }
          return [];
        }),
        catchError(() => {
          return of([]);
        })
      );
  }

  /** Save a route/line to the backend database */
  saveRota(rota: MockRota): Observable<any> {
    const headers = this.loginService.getAuthHeaders();

    const currentUser = this.loginService.currentUserValue;
    const operadorCnpj = currentUser?.operador?.cnpj || '33333333000133';
    const operadorRazao = currentUser?.operador?.razaoSocial || 'Viação Gato Preto LTDA';

    const parts = (rota.codigo || '').split('-');
    const lineId = parts[0];
    const lineDef = this.defaultLineIds.find((l) => l.id === lineId);
    const atendimento = parts[1] || (lineDef ? lineDef.atendimento : '1');

    const linhaRecord = {
      linhaId: lineId,
      linhaAtendimento: atendimento,
      municipio: 3550308,
      operador: {
        cnpj: operadorCnpj,
        razaoSocial: operadorRazao,
      },
      linhaDescricao: rota.nome,
      flagIntermunicipal: 'N',
      flagMetro: 'N',
      flagTrem: 'N',
      flagAtiva: rota.status === 'ativa' ? 'S' : 'N',
    };

    const isNew =
      !this.activeRoutes.some((r) => r.codigo === rota.codigo) &&
      !this.inactiveRoutes.some((r) => r.codigo === rota.codigo);

    const request$ = isNew
      ? this.http.post<any>(`${this.apiUrl}/citmobi/v1/api/linha`, linhaRecord, { headers })
      : this.http.patch<any>(`${this.apiUrl}/citmobi/v1/api/linha`, linhaRecord, { headers });

    return request$.pipe(
      tap(() => {
        // Sync local memory store
        this.updateLocalRoute(rota, isNew);
      }),
      catchError((err) => {
        console.warn('Backend save failed. Falling back to local state sync. Error:', err);
        this.updateLocalRoute(rota, isNew);
        return of({
          status: 'fallback_success',
          message: 'Saved locally as fallback',
          data: rota,
        });
      })
    );
  }

  private updateLocalRoute(rota: MockRota, isNew: boolean): void {
    if (isNew) {
      if (rota.status === 'ativa') {
        this.activeRoutes.push(rota);
      } else {
        this.inactiveRoutes.push(rota);
      }
    } else {
      let idx = this.activeRoutes.findIndex((r) => r.codigo === rota.codigo);
      if (idx !== -1) {
        if (rota.status === 'ativa') {
          this.activeRoutes[idx] = rota;
        } else {
          this.activeRoutes.splice(idx, 1);
          this.inactiveRoutes.push(rota);
        }
      } else {
        idx = this.inactiveRoutes.findIndex((r) => r.codigo === rota.codigo);
        if (idx !== -1) {
          if (rota.status === 'inativa') {
            this.inactiveRoutes[idx] = rota;
          } else {
            this.inactiveRoutes.splice(idx, 1);
            this.activeRoutes.push(rota);
          }
        }
      }
    }
  }

  private getNumberFromString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }
}
