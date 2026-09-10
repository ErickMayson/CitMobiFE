export type MotoristaStatus =
  | 'EM ATENDIMENTO'
  | 'AGUARDANDO'
  | 'PAUSA'
  | 'FORA DE TURNO'
  | 'ATIVO'
  | 'INATIVO';

export interface HorarioMotorista {
  id?: number | string;
  veiculoId: string | number;
  veiculoPlaca: string;
  veiculoModelo: string;
  rotaId: string | number;
  rotaNome: string;
  startTime: string;
  endTime: string;
  days: string[];
}

export interface Motorista {
  id: string; // UUID or string identifier
  nome: string;
  cpf: string;
  login?: string;
  telefone: string;
  operadorId?: number;
  status: MotoristaStatus;
  horarios: HorarioMotorista[];
}
