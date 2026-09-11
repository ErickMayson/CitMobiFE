import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TelemetriaVeiculo, TelemetriaPingRequest, ViagemAtiva } from '../models/telemetria.model';
import { environment } from '../../../environments/enviroment';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root',
})
export class TelemetriaService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private loginService: LoginService
  ) {}

  /**
   * Retrieves real-time positions for all active vehicles on the map
   */
  getVeiculosAtivos(
    linhaId?: number,
    operadorId?: number,
    municipio?: number
  ): Observable<TelemetriaVeiculo[]> {
    const headers = this.loginService.getAuthHeaders();
    let params = new HttpParams();
    if (linhaId) params = params.set('linhaId', linhaId.toString());
    if (operadorId) params = params.set('operadorId', operadorId.toString());
    if (municipio) params = params.set('municipio', municipio.toString());

    return this.http
      .get<any>(`${this.apiUrl}/v1/api/telemetria/veiculos`, { headers, params })
      .pipe(
        map((res) => {
          let list: any[] = [];
          if (Array.isArray(res)) {
            list = res;
          } else if (res && Array.isArray(res.data)) {
            list = res.data;
          }
          return list.map((item) => ({
            veiculoId: Number(item.veiculoId || 0),
            placa: item.placa || item.plate || '',
            latitude: Number(item.latitude || 0),
            longitude: Number(item.longitude || 0),
            velocidade: Number(item.velocidade || 0),
            bearing: Number(item.bearing || 0),
            sentido: item.sentido || (item.linhaSentido === 'VOLTA' ? 'VOLTA' : 'IDA'),
            linhaId: item.linhaId,
            linhaCodigo: item.linhaCodigo || item.codigoLinha,
            motoristaNome: item.motoristaNome,
            statusParadaAtual: item.statusParadaAtual,
            ultimaAtualizacao: item.ultimaAtualizacao,
          }));
        }),
        catchError(() => of([]))
      );
  }

  /**
   * Ingest GPS ping from driver app / AVL simulator
   */
  registrarPing(ping: TelemetriaPingRequest): Observable<any> {
    const headers = this.loginService.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/v1/api/telemetria/ping`, ping, { headers });
  }

  /**
   * Queries active operational trips
   */
  getViagensAtivas(operadorId?: number, linhaId?: number): Observable<ViagemAtiva[]> {
    const headers = this.loginService.getAuthHeaders();
    let params = new HttpParams();
    if (operadorId) params = params.set('operadorId', operadorId.toString());
    if (linhaId) params = params.set('linhaId', linhaId.toString());

    return this.http
      .get<any>(`${this.apiUrl}/v1/api/viagens/ativas`, { headers, params })
      .pipe(
        map((res) => {
          let list: any[] = [];
          if (Array.isArray(res)) {
            list = res;
          } else if (res && Array.isArray(res.data)) {
            list = res.data;
          }
          return list;
        }),
        catchError(() => of([]))
      );
  }
}
