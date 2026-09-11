export type MotoristaStatus =
  | 'EM ATENDIMENTO'
  | 'AGUARDANDO'
  | 'PAUSA'            // NEW: Driver is on legal rest/meal interval
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
  startTime: string;    // e.g. "06:00"
  endTime: string;      // e.g. "11:30"
  days: string[];       // e.g. ["SEG", "TER", "QUA", "QUI", "SEX"]
  pausaInicio?: string; // Optional: "11:30"
  pausaFim?: string;    // Optional: "12:30"
}

export interface Motorista {
  id: string;           // UUID
  nome: string;
  cpf: string;
  cnhNumero: string;    // NEW: Mandatory CNH document number
  cnhValidade: string;  // NEW: Mandatory CNH expiration date (ISO YYYY-MM-DD)
  login?: string;
  telefone: string;
  operadorId?: number;
  operadorNome?: string;// NEW: Name of the transit company
  status: MotoristaStatus;
  horarios: HorarioMotorista[];
}
