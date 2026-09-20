import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { LoginService } from './login.service';
import { VeiculoService } from './veiculo.service';
import { TelemetriaService } from './telemetria.service';
import { environment } from '../../../environments/enviroment';
import { Endereco } from '../models/endereco.model';
import { Veiculo } from '../models/veiculo.model';
import { TelemetriaVeiculo } from '../models/telemetria.model';

export interface LinhaTelemetrySummary {
  veiculosTotal: number;
  veiculosComMotorista: number;
  veiculosSemMotorista: number;
  veiculosEmIda: number;
  veiculosEmVolta: number;
  veiculosEmGaragem: number;
}

export interface LinhaDriverShift {
  name: string;
  startTime?: string;
  endTime?: string;
  days?: string[];
}

export interface LinhaAssignedVehicle {
  plate: string;
  model: string;
  type?: string;
  capacity?: number;
  sentido: 'IDA' | 'VOLTA' | 'GARAGEM' | 'INATIVO';
  motoristas: string[];
  driverShifts?: LinhaDriverShift[];
  activeDriverName?: string;
  activeDriverShift?: string;
  hasDriver: boolean;
  driverCount: number;
  pendingDrivers: boolean;
}

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
      enderecos: Endereco[];
    };
    volta?: {
      id?: number;
      prefixo: string;
      sentido: 'VOLTA';
      enderecos: Endereco[];
    };
  };
  telemetry?: LinhaTelemetrySummary;
  assignedVehicles?: LinhaAssignedVehicle[];
}

@Injectable({
  providedIn: 'root',
})
export class LinhaService {
  private apiUrl = environment.apiUrl;

  private activeLinhas: LinhaDetails[] = [];
  private inactiveLinhas: LinhaDetails[] = [];
  private cachedLinhas: LinhaDetails[] | null = null;
  private cachedParadas: any[] | null = null;

  constructor(
    private http: HttpClient,
    private loginService: LoginService,
    private veiculoService: VeiculoService,
    private telemetriaService: TelemetriaService
  ) {}

  clearCache(): void {
    this.cachedLinhas = null;
    this.cachedParadas = null;
  }

  /** Queries all Lines, their child Rotas, Vehicles, and Telemetry dynamically from backend */
  getLinhas(forceRefresh: boolean = false): Observable<LinhaDetails[]> {
    if (!forceRefresh && this.cachedLinhas) {
      return of(this.cachedLinhas);
    }

    const headers = this.loginService.getAuthHeaders();
    const currentUser = this.loginService.currentUserValue;

    const params: any = {};
    if (currentUser?.role !== 'ADMIN' && currentUser?.operador?.id) {
      params.operadorId = currentUser.operador.id.toString();
    }

    return forkJoin({
      linhasRes: this.http
        .get<any>(`${this.apiUrl}/v1/api/linhas/detalhes`, { headers, params })
        .pipe(
          tap((res) => console.log('[LinhaService] /v1/api/linhas/detalhes response:', res)),
          catchError((err) => {
            console.error('[LinhaService] ❌ ERRO ao chamar /v1/api/linhas/detalhes:', err.status, err.statusText, err);
            return throwError(() => err);
          })
        ),
      veiculos: this.veiculoService.getVeiculos(forceRefresh).pipe(
        catchError(() => of([] as Veiculo[]))
      ),
      telemetria: this.telemetriaService.getVeiculosAtivos().pipe(
        catchError(() => of([] as TelemetriaVeiculo[]))
      ),
    }).pipe(
      map(({ linhasRes, veiculos, telemetria }) => {
        let rawLinhas: any[] = [];
        if (Array.isArray(linhasRes)) {
          rawLinhas = linhasRes;
        } else if (linhasRes && Array.isArray(linhasRes.data)) {
          rawLinhas = linhasRes.data;
        }

        const detailsList: LinhaDetails[] = rawLinhas.map((item) => {
          const l = item.linha || item;
          const codigo = String(l.codigoLinha || l.linhaId || '').trim();
          const atendimento = String(l.atendimento || l.linhaAtendimento || '10').trim();
          const descricao = l.linhaDescricao || l.descricao || codigo;
          const parsed = this.parsePartidaChegada(descricao);
          const flagAtiva = l.flagAtiva === 'S';

          // Extract rotas from any possible container
          const rotasData =
            l.rotas ||
            item.rotas ||
            (l.linha && l.linha.rotas) ||
            (item.linha && item.linha.rotas) ||
            l.rotaRecords ||
            item.rotaRecords ||
            [];

          const rotasObj: LinhaDetails['rotas'] = {};

          if (Array.isArray(rotasData)) {
            rotasData.forEach((r: any) => {
              const rawSentido = String(r.linhaSentido || r.sentido || r.tipo || '').toUpperCase().trim();
              const isIda = rawSentido === 'IDA' || rawSentido === 'I' || rawSentido === '1' || rawSentido.startsWith('IDA');
              const isVolta = rawSentido === 'VOLTA' || rawSentido === 'V' || rawSentido === '2' || rawSentido.startsWith('VOLTA');

              const paradasList: Endereco[] = [];

              let itinParadas: any[] = [];
              if (Array.isArray(r.itinerario)) {
                itinParadas = r.itinerario;
              } else if (r.itinerario && Array.isArray(r.itinerario.paradas)) {
                itinParadas = r.itinerario.paradas;
              } else if (Array.isArray(r.paradas)) {
                itinParadas = r.paradas;
              } else if (Array.isArray(r.itinerarioParadas)) {
                itinParadas = r.itinerarioParadas;
              }

              if (Array.isArray(itinParadas)) {
                itinParadas.forEach((p: any, idx: number) => {
                  const lat = Array.isArray(p.latLong) && p.latLong.length >= 2
                    ? Number(p.latLong[0])
                    : Number(p.latitude || p.lat || 0);
                  const lng = Array.isArray(p.latLong) && p.latLong.length >= 2
                    ? Number(p.latLong[1])
                    : Number(p.longitude || p.lng || 0);

                  paradasList.push({
                    id: p.paradaId || p.id || idx,
                    nome: p.logradouro || p.nome || p.name || `Parada ${idx + 1}`,
                    endereco: `${p.logradouro || p.nome || p.name || ''}, ${p.numero || 'S/N'}`,
                    cep: p.cep || '',
                    lat,
                    lng,
                    ordem: idx,
                  });
                });
              }

              const defaultPrefixo = isIda
                ? `${parsed.partida} - ${parsed.chegada}`
                : `${parsed.chegada} - ${parsed.partida}`;

              if (isIda) {
                rotasObj.ida = {
                  id: r.itinerario?.itinerarioId || r.id || 0,
                  prefixo: r.prefixo || defaultPrefixo,
                  sentido: 'IDA',
                  enderecos: paradasList,
                };
              } else if (isVolta) {
                rotasObj.volta = {
                  id: r.itinerario?.itinerarioId || r.id || 0,
                  prefixo: r.prefixo || defaultPrefixo,
                  sentido: 'VOLTA',
                  enderecos: paradasList,
                };
              } else if (!rotasObj.ida) {
                rotasObj.ida = {
                  id: r.itinerario?.itinerarioId || r.id || 0,
                  prefixo: r.prefixo || defaultPrefixo,
                  sentido: 'IDA',
                  enderecos: paradasList,
                };
              } else if (!rotasObj.volta) {
                rotasObj.volta = {
                  id: r.itinerario?.itinerarioId || r.id || 0,
                  prefixo: r.prefixo || defaultPrefixo,
                  sentido: 'VOLTA',
                  enderecos: paradasList,
                };
              }
            });
          }

          const details: LinhaDetails = {
            id: Number(l.id || this.getNumberFromString(codigo)),
            codigo,
            atendimento,
            partida: parsed.partida,
            chegada: parsed.chegada,
            nome: descricao,
            descricao,
            status: flagAtiva ? 'ativa' : 'inativa',
            rotas: rotasObj,
          };

          this.attachFleetAndTelemetry(details, veiculos, telemetria);
          return details;
        });

        this.cachedLinhas = detailsList;
        this.activeLinhas = detailsList.filter((l) => l.status === 'ativa');
        this.inactiveLinhas = detailsList.filter((l) => l.status === 'inativa');
        return detailsList;
      }),
      catchError(() => of([]))
    );
  }

  private attachFleetAndTelemetry(
    details: LinhaDetails,
    veiculos: Veiculo[],
    telemetria: TelemetriaVeiculo[]
  ): void {
    const rawCode = details.codigo.replace('-', '').trim().toLowerCase();
    const cleanCode = details.codigo.trim().toLowerCase();

    const matchingVehicles = veiculos.filter((v) => {
      if (!v.routes || v.routes.length === 0) return false;
      return v.routes.some((r) => {
        const routeName = (r.routeName || '').toLowerCase();
        return (
          routeName.includes(cleanCode) ||
          routeName.includes(rawCode)
        );
      });
    });

    const assigned: LinhaAssignedVehicle[] = matchingVehicles.map((v) => {
      const driverShifts: LinhaDriverShift[] = (v.drivers || []).map((d) => ({
        name: d.name,
        startTime: d.startTime,
        endTime: d.endTime,
        days: d.days,
      }));
      const driverNames = driverShifts.map((d) => d.name).filter(Boolean);
      const hasDriver = driverNames.length > 0;
      const pendingDrivers = driverNames.length < 2;

      // Check live telemetry for directional status if available
      const liveTel = telemetria.find(
        (t) => t.placa.replace(/\D/g, '') === v.plate.replace(/\D/g, '') || t.veiculoId === Number(v.id)
      );

      let sentido: 'IDA' | 'VOLTA' | 'GARAGEM' | 'INATIVO' = 'IDA';
      if (v.status === 'INATIVO') {
        sentido = 'INATIVO';
      } else if (liveTel?.sentido) {
        sentido = liveTel.sentido;
      }

      // Determine active driver based on schedule & current time
      let activeDriverName: string | undefined;
      let activeDriverShift: string | undefined;

      if (driverShifts.length > 0) {
        const now = new Date();
        const curMin = now.getHours() * 60 + now.getMinutes();
        const activeShift = driverShifts.find((s) => {
          if (!s.startTime || !s.endTime) return false;
          const [sh, sm] = s.startTime.split(':').map(Number);
          const [eh, em] = s.endTime.split(':').map(Number);
          const startMin = sh * 60 + (sm || 0);
          const endMin = eh * 60 + (em || 0);
          return curMin >= startMin && curMin < endMin;
        }) || driverShifts[0];

        activeDriverName = activeShift.name;
        if (activeShift.startTime && activeShift.endTime) {
          activeDriverShift = `${activeShift.startTime} - ${activeShift.endTime}`;
        }
      }

      return {
        plate: v.plate,
        model: v.model,
        type: v.type,
        capacity: v.capacity,
        sentido,
        motoristas: driverNames,
        driverShifts,
        activeDriverName,
        activeDriverShift,
        hasDriver,
        driverCount: driverNames.length,
        pendingDrivers,
      };
    });

    let veiculosEmIda = 0;
    let veiculosEmVolta = 0;
    let veiculosEmGaragem = 0;

    assigned.forEach((a) => {
      if (a.sentido === 'IDA') veiculosEmIda++;
      else if (a.sentido === 'VOLTA') veiculosEmVolta++;
      else veiculosEmGaragem++;
    });

    details.assignedVehicles = assigned;
    details.telemetry = {
      veiculosTotal: assigned.length,
      veiculosComMotorista: assigned.filter((a) => a.hasDriver).length,
      veiculosSemMotorista: assigned.filter((a) => !a.hasDriver).length,
      veiculosEmIda,
      veiculosEmVolta,
      veiculosEmGaragem,
    };
  }

  /** Saves a Linha record to backend DB */
  saveLinha(linhaForm: {
    codigo: string;
    atendimento: string;
    partida: string;
    chegada: string;
    descricao: string;
  }): Observable<any> {
    const headers = this.loginService.getAuthHeaders();
    const currentUser = this.loginService.currentUserValue;
    const operadorCnpj = currentUser?.operador?.cnpj || '01234567890123';
    const operadorRazao = currentUser?.operador?.razaoSocial || 'CitMobi Mobilidade Urbana';

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
      flagAtiva: 'S',
    };

    const exists = this.activeLinhas.some(
      (l) => l.codigo === linhaForm.codigo && l.atendimento === linhaForm.atendimento
    ) || this.inactiveLinhas.some(
      (l) => l.codigo === linhaForm.codigo && l.atendimento === linhaForm.atendimento
    );

    const request$ = exists
      ? this.http.patch<any>(`${this.apiUrl}/v1/api/linha`, linhaRecord, { headers })
      : this.http.post<any>(`${this.apiUrl}/v1/api/linha`, linhaRecord, { headers });

    return request$.pipe(
      tap(() => this.clearCache())
    );
  }

  /** Saves/Links a Rota (itinerary) to a specific Linha in backend DB */
  saveRotaItinerario(
    linhaId: string,
    atendimento: string,
    sentido: 'IDA' | 'VOLTA',
    prefixo: string,
    enderecos: Endereco[]
  ): Observable<any> {
    const headers = this.loginService.getAuthHeaders();

    const paradasList = enderecos.map((end, idx) => {
      const lat = end.lat ? parseFloat(end.lat.toString()) : 0;
      const lng = end.lng ? parseFloat(end.lng.toString()) : 0;

      let logradouro = end.nome?.trim() || 'Parada';
      let numero = 'S/N';

      if (end.endereco && end.endereco.includes(',')) {
        const parts = end.endereco.split(',');
        logradouro = parts[0].trim();
        numero = parts[1].trim() || 'S/N';
      } else if (end.nome && end.nome.includes(',')) {
        const parts = end.nome.split(',');
        logradouro = parts[0].trim();
        numero = parts[1].trim() || 'S/N';
      }

      return {
        paradaId: typeof end.id === 'number' && end.id > 1000000000 ? null : end.id,
        logradouro,
        numero,
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
        itinerarioId: 0,
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
        tap(() => this.clearCache())
      );
  }

  /** Fetch all registered stops for a municipality from backend, optionally filtering by logradouro */
  getParadas(municipio: number = 3550308, logradouro?: string): Observable<any[]> {
    if (!logradouro && this.cachedParadas && this.cachedParadas.length > 0) {
      return of(this.cachedParadas);
    }

    const headers = this.loginService.getAuthHeaders();
    const params: any = { municipio: municipio.toString() };
    if (logradouro) {
      params.logradouro = logradouro;
    }

    return this.http.get<any>(`${this.apiUrl}/v1/api/paradas`, {
      headers,
      params,
    }).pipe(
      map((res) => {
        let result: any[] = [];
        if (res && res.data && Array.isArray(res.data)) {
          result = res.data;
        } else if (Array.isArray(res)) {
          result = res;
        }

        if (!logradouro) {
          this.cachedParadas = result;
        }
        return result;
      }),
      catchError(() => of([]))
    );
  }

  toggleLinhaStatus(linha: LinhaDetails): void {
    this.clearCache();
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
  }

  getStoredLinhas(): { ativas: LinhaDetails[]; inativas: LinhaDetails[] } {
    return { ativas: this.activeLinhas, inativas: this.inactiveLinhas };
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
}
