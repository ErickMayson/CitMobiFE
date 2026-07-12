export interface Motorista {
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
}

export interface Linha {
  routeName: string;
  startTime: string;
  endTime: string;
  days: string[];
}

export interface Veiculo {
  id: string;
  plate: string;
  model: string;
  type: string;
  capacity: number;
  status: 'EM ATENDIMENTO' | 'GARAGEM' | 'RESERVA' | 'INATIVO';
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
}
