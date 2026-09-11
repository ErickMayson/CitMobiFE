export type VeiculoStatus = 'ATIVO' | 'MANUTENCAO' | 'INATIVO' | 'SUCATEADO' | 'VENDIDO';

export interface Motorista {
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
}

export interface RouteInterval {
  startTime: string;
  endTime: string;
}

export interface Linha {
  routeName: string;
  startTime?: string;
  endTime?: string;
  days: string[];
  intervals?: RouteInterval[];
}

export interface Veiculo {
  id: string | number;
  plate: string;
  model: string;
  type: string;
  capacity: number;
  status: VeiculoStatus;
  garage: string;
  routes: Linha[];
  drivers: Motorista[];
}

export interface ScheduleBlock {
  type: 'driver' | 'route';
  name: string;
  start: number;
  end: number;
  duration: number;
  isActiveNow?: boolean;
  tooltip?: string;
}

export interface Viagem {
  id?: number;
  usuarioId: string;
  veiculoId: number;
  linhaId: number;
  rotaId: number;
  dataInicio: string;
  dataFim?: string;
  status: 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
}

export interface Telemetria {
  veiculoId: number;
  viagemId?: number;
  latitude: number;
  longitude: number;
  velocidade: number;
  bearing: number;
  odometer: number;
  sequenciaParadaAtual?: number;
  statusParadaAtual?: string;
  paradaId?: number;
  ultimaAtualizacao?: string;
}

