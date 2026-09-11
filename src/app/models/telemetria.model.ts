export interface TelemetriaVeiculo {
  veiculoId: number;
  placa: string;
  latitude: number;
  longitude: number;
  velocidade: number;
  bearing: number;
  sentido?: 'IDA' | 'VOLTA';
  linhaId?: string | number;
  linhaCodigo?: string;
  motoristaNome?: string;
  statusParadaAtual?: string;
  ultimaAtualizacao?: string;
}

export interface TelemetriaPingRequest {
  viagemId: number;
  veiculoId: number;
  latitude: number;
  longitude: number;
  velocidade: number;
  bearing: number;
  odometer: number;
  sequenciaParadaAtual?: number;
  statusParadaAtual?: string;
  paradaId?: number;
}

export interface ViagemAtiva {
  id: number;
  usuarioId: string;
  motoristaNome?: string;
  veiculoId: number;
  veiculoPlaca?: string;
  linhaId: number;
  linhaCodigo?: string;
  rotaId: number;
  sentido?: 'IDA' | 'VOLTA';
  dataInicio: string;
  dataFim?: string;
  status: 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
}
