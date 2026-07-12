import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, tap, switchMap, timeout } from 'rxjs/operators';
import { LoginService } from './login.service';
import { environment } from '../../../environments/enviroment';
import { MockRota, MockEndereco, MOCK_LINHAS_ATIVAS, MOCK_LINHAS_INATIVAS, MOCK_PARADAS } from '../mock-data/mock-data';

export interface LinhaDetails {
  id: number;
  codigo: string;
  atendimento: string;
  partida: string;
  chegada: string;
  nome: string;
  descricao: string;
  status: 'ativa' | 'inativa';
  rotas: {
    ida?: {
      id?: number;
      prefixo: string;
      sentido: 'IDA';
      enderecos: MockEndereco[];
    };
    volta?: {
      id?: number;
      prefixo: string;
      sentido: 'VOLTA';
      enderecos: MockEndereco[];
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class LinhaService {
  private apiUrl = environment.apiUrl;
  private static readonly CUSTOM_LINHAS_KEY = 'citmobi_custom_linhas';

  private activeLinhas: LinhaDetails[] = [];
  private inactiveLinhas: LinhaDetails[] = [];

  private readonly hardcodedLines = [
    { id: '001', atendimento: '1', partida: 'Centro', chegada: 'Bairro A', desc: 'Centro/Bairro A', status: 'ativa' as const },
    { id: '002', atendimento: '1', partida: 'Aeroporto', chegada: 'Centro', desc: 'Aeroporto/Centro', status: 'ativa' as const },
    { id: '003', atendimento: '1', partida: 'Zona Norte', chegada: 'Zona Sul', desc: 'Zona Norte/Sul', status: 'ativa' as const },
    { id: '004', atendimento: '1', partida: 'Terminal A', chegada: 'Terminal B', desc: 'Terminal A/B', status: 'inativa' as const },
    { id: '005', atendimento: '1', partida: 'Terminal Central', chegada: 'Circular', desc: 'Circular', status: 'inativa' as const },
    { id: '372F', atendimento: '10', partida: 'Univ. São Judas', chegada: 'Metrô Bresser', desc: 'Via Alcântara Machado', status: 'ativa' as const },
    { id: '1178', atendimento: '10', partida: 'T. São Miguel', chegada: 'Praça do Correio', desc: 'Via Celso Garcia', status: 'ativa' as const },
    { id: '3301', atendimento: '10', partida: 'T. São Miguel', chegada: 'T. Pq Dom Pedro', desc: 'Via Celso Garcia', status: 'ativa' as const },
    { id: '9051', atendimento: '10', partida: 'T. Pinheiros', chegada: 'Lapa', desc: 'Via Sumaré', status: 'ativa' as const },
    { id: '8000', atendimento: '10', partida: 'Pça Ramos', chegada: 'T. Lapa', desc: 'Via Lapa', status: 'ativa' as const },
  ];

  private defaultLines: { id: string; atendimento: string; partida: string; chegada: string; desc: string; status: 'ativa' | 'inativa' }[] = [];

  constructor(private http: HttpClient, private loginService: LoginService) {
    this.defaultLines = [...this.hardcodedLines, ...this.loadCustomLinhasFromStorage()];
  }

  /** Queries all Lines and their child Rotas dynamically from the backend DB */
  getLinhas(): Observable<LinhaDetails[]> {
    const headers = this.loginService.getAuthHeaders();

    const requests = this.defaultLines.map((lineDef) => {
      // Step A: Load Linha Metadata
      return this.http
        .get<any>(`${this.apiUrl}/v1/api/linha`, {
          headers,
          params: {
            linha: lineDef.id,
            atendimento: lineDef.atendimento,
            municipio: '3550308',
          },
        })
        .pipe(
          map((res) => {
            if (res && res.data && res.data.linha) {
              return res.data.linha;
            }
            return null;
          }),
          catchError(() => of(null))
        );
    });

    return forkJoin(requests).pipe(
      // Step B: Load associated IDA/VOLTA Rotas for each loaded Linha
      map((linhaResults) => {
        const loadedLinhas: any[] = [];
        linhaResults.forEach((l, index) => {
          const lineDef = this.defaultLines[index];
          if (l) {
            loadedLinhas.push({
              codigo: l.linhaId.trim(),
              atendimento: l.linhaId.linhaAtendimento ? l.linhaId.linhaAtendimento.trim() : lineDef.atendimento,
              descricao: l.linhaDescricao,
              status: l.flagAtiva === 'S' ? 'ativa' : 'inativa',
              isFromBackend: true
            });
          } else {
            // Offline fallback
            loadedLinhas.push({
              codigo: lineDef.id,
              atendimento: lineDef.atendimento,
              descricao: `${lineDef.partida} - ${lineDef.chegada}`,
              status: lineDef.status,
              isFromBackend: false
            });
          }
        });
        return loadedLinhas;
      }),
      // Query rotas in parallel for all lines
      switchMap((linhas) => {
        if (linhas.length === 0) return of([]);

        const rotaRequests = linhas.map((linha) => {
          return this.http
            .get<any>(`${this.apiUrl}/v1/api/rotas`, {
              headers,
              params: {
                linha: linha.codigo,
                atendimento: linha.atendimento,
                municipio: '3550308',
              },
            })
            .pipe(
              map((res) => {
                if (res && res.data && Array.isArray(res.data.rotaRecords)) {
                  return res.data.rotaRecords;
                }
                return [];
              }),
      catchError(() => {
        console.warn('Backend /paradas unreachable. Falling back to mock data.');
        return of(MOCK_PARADAS);
      })
            );
        });

        return forkJoin(rotaRequests).pipe(
          map((rotasResults) => {
            return linhas.map((linha, index) => {
              const rotas = rotasResults[index];
              const parsedName = this.parsePartidaChegada(linha.descricao);
              
              const details: LinhaDetails = {
                id: this.getNumberFromString(linha.codigo),
                codigo: linha.codigo,
                atendimento: linha.atendimento,
                partida: parsedName.partida || lineDefName(linha.codigo).partida,
                chegada: parsedName.chegada || lineDefName(linha.codigo).chegada,
                nome: linha.descricao,
                descricao: linha.descricao,
                status: linha.status,
                rotas: {},
              };

              // Map IDA and VOLTA routes from response
              rotas.forEach((r: any) => {
                const sentido = String(r.linhaSentido).toUpperCase();
                const paradas = r.itinerario && Array.isArray(r.itinerario.paradas)
                  ? r.itinerario.paradas.map((p: any, idx: number) => {
                      const lat = Array.isArray(p.latLong) && p.latLong.length >= 2 ? Number(p.latLong[0]) : 0;
                      const lng = Array.isArray(p.latLong) && p.latLong.length >= 2 ? Number(p.latLong[1]) : 0;
                      return {
                        id: p.paradaId || idx,
                        nome: p.logradouro || `Parada ${idx + 1}`,
                        endereco: `${p.logradouro || ''}, ${p.numero || ''}`,
                        cep: '',
                        lat: lat,
                        lng: lng,
                        ordem: idx,
                      } as MockEndereco;
                    })
                  : [];

                if (sentido === 'IDA') {
                  details.rotas.ida = {
                    id: r.itinerario?.itinerarioId || 0,
                    prefixo: r.prefixo || `${details.partida} - ${details.chegada}`,
                    sentido: 'IDA',
                    enderecos: paradas,
                  };
                } else if (sentido === 'VOLTA') {
                  details.rotas.volta = {
                    id: r.itinerario?.itinerarioId || 0,
                    prefixo: r.prefixo || `${details.chegada} - ${details.partida}`,
                    sentido: 'VOLTA',
                    enderecos: paradas,
                  };
                }
              });

              return details;
            });
          })
        );
      }),
      tap((results) => {
        this.activeLinhas = results.filter((l) => l.status === 'ativa');
        this.inactiveLinhas = results.filter((l) => l.status === 'inativa');
      }),
      catchError(() => {
        const fallbackLinhas = this.buildFallbackLinhas();
        this.activeLinhas = fallbackLinhas.filter((l) => l.status === 'ativa');
        this.inactiveLinhas = fallbackLinhas.filter((l) => l.status === 'inativa');
        return of(fallbackLinhas);
      }),
      timeout(15000)
    );

    // Helpers
    const lineDefName = (code: string) => {
      const match = this.defaultLines.find((x: any) => x.id === code);
      return match ? { partida: match.partida, chegada: match.chegada } : { partida: 'Origem', chegada: 'Destino' };
    };
  }

  private buildFallbackLinhas(): LinhaDetails[] {
    return this.defaultLines.map((lineDef) => ({
      id: this.getNumberFromString(lineDef.id),
      codigo: lineDef.id,
      atendimento: lineDef.atendimento,
      partida: lineDef.partida,
      chegada: lineDef.chegada,
      nome: lineDef.desc,
      descricao: lineDef.desc,
      status: lineDef.status,
      rotas: {},
    }));
  }

  getLinhasAtivas(): Observable<MockRota[]> {
    return of([...MOCK_LINHAS_ATIVAS]);
  }

  getLinhasInativas(): Observable<MockRota[]> {
    return of([...MOCK_LINHAS_INATIVAS]);
  }

  /** Saves a Linha record to the backend DB */
  saveLinha(linhaForm: {
    codigo: string;
    atendimento: string;
    partida: string;
    chegada: string;
    descricao: string;
  }): Observable<any> {
    const headers = this.loginService.getAuthHeaders();
    const currentUser = this.loginService.currentUserValue;
    const operadorCnpj = currentUser?.operador?.cnpj || '33333333000133';
    const operadorRazao = currentUser?.operador?.razaoSocial || 'Viação Gato Preto LTDA';

    const linhaRecord = {
      linhaId: linhaForm.codigo.trim(),
      linhaAtendimento: (linhaForm.atendimento || '10').trim(),
      municipio: 3550308,
      operador: {
        cnpj: operadorCnpj,
        razaoSocial: operadorRazao,
      },
      linhaDescricao: `${linhaForm.partida.trim()} - ${linhaForm.chegada.trim()}`,
      flagIntermunicipal: 'N',
      flagMetro: 'N',
      flagTrem: 'N',
      flagAtiva: 'N',
    };

    const isNew = !this.defaultLines.some(
      (l) => l.id === linhaForm.codigo && l.atendimento === linhaForm.atendimento
    );

    const request$ = isNew
      ? this.http.post<any>(`${this.apiUrl}/v1/api/linha`, linhaRecord, { headers })
      : this.http.patch<any>(`${this.apiUrl}/v1/api/linha`, linhaRecord, { headers });

    return request$.pipe(
      tap(() => {
        if (isNew) {
          this.defaultLines.push({
            id: linhaForm.codigo.trim(),
            atendimento: linhaForm.atendimento.trim(),
            partida: linhaForm.partida.trim(),
            chegada: linhaForm.chegada.trim(),
            desc: `${linhaForm.partida.trim()} - ${linhaForm.chegada.trim()}`,
            status: 'inativa',
          });
          this.saveCustomLinhasToStorage();

          const newLinha: LinhaDetails = {
            id: this.getNumberFromString(linhaForm.codigo.trim()),
            codigo: linhaForm.codigo.trim(),
            atendimento: linhaForm.atendimento.trim(),
            partida: linhaForm.partida.trim(),
            chegada: linhaForm.chegada.trim(),
            nome: `${linhaForm.partida.trim()} - ${linhaForm.chegada.trim()}`,
            descricao: linhaForm.descricao || `${linhaForm.partida.trim()} - ${linhaForm.chegada.trim()}`,
            status: 'inativa',
            rotas: {},
          };
          this.inactiveLinhas.push(newLinha);
        }
      }),
      catchError((err) => {
        console.warn('Backend Linha save failed. Fallback to local simulation. Error:', err);
        if (isNew) {
          this.defaultLines.push({
            id: linhaForm.codigo.trim(),
            atendimento: linhaForm.atendimento.trim(),
            partida: linhaForm.partida.trim(),
            chegada: linhaForm.chegada.trim(),
            desc: `${linhaForm.partida.trim()} - ${linhaForm.chegada.trim()}`,
            status: 'inativa',
          });
          this.saveCustomLinhasToStorage();
          const newLinha: LinhaDetails = {
            id: this.getNumberFromString(linhaForm.codigo.trim()),
            codigo: linhaForm.codigo.trim(),
            atendimento: linhaForm.atendimento.trim(),
            partida: linhaForm.partida.trim(),
            chegada: linhaForm.chegada.trim(),
            nome: `${linhaForm.partida.trim()} - ${linhaForm.chegada.trim()}`,
            descricao: linhaForm.descricao || `${linhaForm.partida.trim()} - ${linhaForm.chegada.trim()}`,
            status: 'inativa',
            rotas: {},
          };
          this.inactiveLinhas.push(newLinha);
        }
        return of({
          status: 'success_simulated',
          message: 'Saved locally (simulated success)',
        });
      })
    );
  }

  /** Saves/Links a Rota (itinerary) to a specific Linha in the backend DB */
  saveRotaItinerario(
    linhaId: string,
    atendimento: string,
    sentido: 'IDA' | 'VOLTA',
    prefixo: string,
    enderecos: MockEndereco[]
  ): Observable<any> {
    const headers = this.loginService.getAuthHeaders();

    // Map frontend Endereco[] to backend ParadaRecord[]
    const paradasList = enderecos.map((end, idx) => {
      // Parse coordinates to big decimals
      const lat = end.lat ? parseFloat(end.lat.toString()) : 0;
      const lng = end.lng ? parseFloat(end.lng.toString()) : 0;

      return {
        paradaId: typeof end.id === 'number' && end.id > 1000000000 ? null : end.id, // null if temporary Date.now() ID
        logradouro: end.nome.trim(),
        numero: end.endereco.trim() || 'S/N',
        obs: '',
        latLong: [lat, lng],
        municipio: 3550308,
        ufSigla: 'SP',
        tipoId: 2,
        flagAtiva: 'S',
      };
    });

    const rotaRecord = {
      linhaId: linhaId.trim(),
      linhaAtendimento: atendimento.trim(),
      prefixo: prefixo.trim(),
      municipio: 3550308,
      linhaSentido: sentido,
      itinerario: {
        itinerarioId: 0, // Generated by database
        paradas: paradasList,
      },
    };

    return this.http
      .post<any>(`${this.apiUrl}/v1/api/rotas`, rotaRecord, {
        headers,
        params: {
          linha: linhaId.trim(),
          atendimento: atendimento.trim(),
          municipio: '3550308',
        },
      })
      .pipe(
        tap(() => {
          this.updateLinhaInStore(linhaId.trim(), atendimento.trim(), sentido, prefixo, enderecos);
        }),
        catchError((err) => {
          console.warn('Backend save Rota failed. Fallback to local simulation. Error:', err);
          this.updateLinhaInStore(linhaId.trim(), atendimento.trim(), sentido, prefixo, enderecos);
          return of({
            status: 'success_simulated',
            message: 'Saved Rota locally (simulated success)',
          });
        })
      );
  }

  /** Fetch all registered stops for a municipality from backend, optionally filtering by logradouro */
  getParadas(municipio: number, logradouro?: string): Observable<any[]> {
    const headers = this.loginService.getAuthHeaders();
    const params: any = { municipio: municipio.toString() };
    if (logradouro) {
      params.logradouro = logradouro;
    }
    return this.http.get<any>(`${this.apiUrl}/v1/api/paradas`, {
      headers,
      params,
    }).pipe(
      map(res => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
        return this.filterMockParadas(logradouro);
      }),
      catchError(() => {
        console.warn('Backend /paradas unreachable. Falling back to mock data.');
        return of(this.filterMockParadas(logradouro));
      })
    );
  }

  private filterMockParadas(logradouro?: string): any[] {
    if (!logradouro) return [...MOCK_PARADAS];
    const q = logradouro.toLowerCase();
    return MOCK_PARADAS.filter((p: any) =>
      (p.logradouro || '').toLowerCase().includes(q) ||
      String(p.numero || '').toLowerCase().includes(q)
    );
  }

  /** Fetch itinerary (stops) for a specific line from backend */
  getItinerarioForLine(linhaId: string, atendimento: string, municipio: number): Observable<MockEndereco[]> {
    const headers = this.loginService.getAuthHeaders();
    return this.http
      .get<any>(`${this.apiUrl}/v1/api/itinerario`, {
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
              const lat = Array.isArray(parada.latLong) && parada.latLong.length >= 2 ? Number(parada.latLong[0]) : 0;
              const lng = Array.isArray(parada.latLong) && parada.latLong.length >= 2 ? Number(parada.latLong[1]) : 0;
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
        catchError(() => of([]))
      );
  }

  toggleLinhaStatus(linha: LinhaDetails): void {
    const newStatus: 'ativa' | 'inativa' = linha.status === 'ativa' ? 'inativa' : 'ativa';
    linha.status = newStatus;

    if (newStatus === 'ativa') {
      this.inactiveLinhas = this.inactiveLinhas.filter((l) => l.codigo !== linha.codigo || l.atendimento !== linha.atendimento);
      if (!this.activeLinhas.find((l) => l.codigo === linha.codigo && l.atendimento === linha.atendimento)) {
        this.activeLinhas.push(linha);
      }
    } else {
      this.activeLinhas = this.activeLinhas.filter((l) => l.codigo !== linha.codigo || l.atendimento !== linha.atendimento);
      if (!this.inactiveLinhas.find((l) => l.codigo === linha.codigo && l.atendimento === linha.atendimento)) {
        this.inactiveLinhas.push(linha);
      }
    }

    const headers = this.loginService.getAuthHeaders();
    this.http.patch<any>(`${this.apiUrl}/v1/api/linha`, {
      linhaId: linha.codigo,
      linhaAtendimento: linha.atendimento,
      municipio: 3550308,
      flagAtiva: newStatus === 'ativa' ? 'S' : 'N',
    }, { headers }).pipe(catchError(() => of(null))).subscribe();

    const lineDef = this.defaultLines.find((l) => l.id === linha.codigo && l.atendimento === linha.atendimento);
    if (lineDef) {
      lineDef.status = newStatus;
      this.saveCustomLinhasToStorage();
    }
  }

  getStoredLinhas(): { ativas: LinhaDetails[]; inativas: LinhaDetails[] } {
    return { ativas: this.activeLinhas, inativas: this.inactiveLinhas };
  }

  private updateLinhaInStore(
    linhaId: string,
    atendimento: string,
    sentido: 'IDA' | 'VOLTA',
    prefixo: string,
    enderecos: MockEndereco[]
  ): void {
    let linha: LinhaDetails | undefined;
    linha = this.activeLinhas.find((l) => l.codigo === linhaId && l.atendimento === atendimento);
    if (!linha) {
      linha = this.inactiveLinhas.find((l) => l.codigo === linhaId && l.atendimento === atendimento);
    }
    if (!linha) return;

    if (!linha.rotas) linha.rotas = {};

    if (sentido === 'IDA') {
      linha.rotas.ida = {
        prefixo,
        sentido: 'IDA',
        enderecos: [...enderecos],
      };
    } else {
      linha.rotas.volta = {
        prefixo,
        sentido: 'VOLTA',
        enderecos: [...enderecos],
      };
    }

    if (linha.rotas.ida && linha.rotas.volta && linha.status === 'inativa') {
      this.inactiveLinhas = this.inactiveLinhas.filter((l) => l.codigo !== linhaId || l.atendimento !== atendimento);
      linha.status = 'ativa';
      if (!this.activeLinhas.find((l) => l.codigo === linhaId && l.atendimento === atendimento)) {
        this.activeLinhas.push(linha);
      }
    }
  }

  private parsePartidaChegada(desc: string): { partida: string; chegada: string } {
    if (!desc || !desc.includes('-')) {
      return { partida: desc || '', chegada: '' };
    }
    const parts = desc.split('-');
    return {
      partida: parts[0].trim(),
      chegada: parts[1] ? parts[1].trim() : '',
    };
  }

  private getNumberFromString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  private loadCustomLinhasFromStorage(): { id: string; atendimento: string; partida: string; chegada: string; desc: string; status: 'ativa' | 'inativa' }[] {
    try {
      const raw = localStorage.getItem(LinhaService.CUSTOM_LINHAS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveCustomLinhasToStorage(): void {
    const custom = this.defaultLines.filter(
      (l) => !this.hardcodedLines.some((h) => h.id === l.id && h.atendimento === l.atendimento)
    );
    try {
      localStorage.setItem(LinhaService.CUSTOM_LINHAS_KEY, JSON.stringify(custom));
    } catch {
      // localStorage not available
    }
  }
}


