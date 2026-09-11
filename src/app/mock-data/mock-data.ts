// Centralized Mock Data for CitMobi aligned with Modern Database & Backend Seeds
import { VeiculoStatus } from '../models/veiculo.model';

export interface MockEndereco {
  id: number;
  nome: string;
  endereco: string;
  cep: string;
  lat: number;
  lng: number;
  ordem: number;
}

export interface MockRota {
  id: number;
  nome: string;
  codigo: string;
  descricao: string;
  distancia: string;
  duracao: string;
  veiculos: number;
  status: 'ativa' | 'inativa';
  enderecos: MockEndereco[];
}

export interface MockVehicleRoute {
  routeName: string;
  startTime: string;
  endTime: string;
  days: string[];
}

export interface MockVehicleDriver {
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
}

export interface MockVeiculo {
  id: string | number;
  plate: string;
  model: string;
  type: string;
  capacity: number;
  status: VeiculoStatus;
  garage: string;
  routes: MockVehicleRoute[];
  drivers: MockVehicleDriver[];
}

export interface MockHorarioMotorista {
  id?: number | string;
  veiculoId: string | number;
  veiculoPlaca: string;
  veiculoModelo: string;
  rotaId: string | number;
  rotaNome: string;
  startTime: string;
  endTime: string;
  days: string[];
  pausaInicio?: string;
  pausaFim?: string;
}

export interface MockOperador {
  id: number;
  razaoSocial: string;
  cnpj: string;
}

export const MOCK_OPERADORES: MockOperador[] = [
  { id: 1, razaoSocial: 'Metrópole Paulista Transportes', cnpj: '11.111.111/0001-11' },
  { id: 2, razaoSocial: 'Viação Gato Preto Ltda', cnpj: '22.222.222/0001-22' },
  { id: 3, razaoSocial: 'Viação Santa Brígida', cnpj: '33.333.333/0001-33' },
  { id: 4, razaoSocial: 'Pêssego Transportes', cnpj: '44.444.444/0001-44' },
  { id: 5, razaoSocial: 'CitMobi Mobilidade Urbana', cnpj: '01.234.567/8901-23' },
];

export interface MockMotorista {
  id: string;
  nome: string;
  cpf: string;
  cnhNumero: string;
  cnhValidade: string;
  telefone: string;
  operadorId?: number;
  operadorNome?: string;
  status: 'EM ATENDIMENTO' | 'AGUARDANDO' | 'PAUSA' | 'FORA DE TURNO' | 'ATIVO' | 'INATIVO';
  horarios: MockHorarioMotorista[];
}

// ---------------------------------------------------------
// Demo Mockup Toggle (Set to false to remove demo items)
// ---------------------------------------------------------
export const ENABLE_DEMO_MOCKUP: boolean = true;

export const DEMO_MOCK_VEICULO: MockVeiculo = {
  id: '1',
  plate: 'ABC-1234',
  model: 'Apache VIP IV',
  type: 'Padrao',
  capacity: 80,
  status: 'ATIVO',
  garage: 'Garagem Central',
  routes: [
    {
      routeName: 'Linha 3301 - 10 (Term. São Miguel / Term. Pq. D. Pedro II)',
      startTime: '06:00',
      endTime: '22:00',
      days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
    },
  ],
  drivers: [
    {
      name: 'João Silva',
      startTime: '06:00',
      endTime: '14:00',
      days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
    },
    {
      name: 'Ana Costa',
      startTime: '14:00',
      endTime: '22:00',
      days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
    },
  ],
};

export const DEMO_MOCK_MOTORISTA: MockMotorista = {
  id: '00000000-0000-0000-0003-000000000001',
  nome: 'João Silva',
  cpf: '111.222.333-44',
  cnhNumero: '12345678900',
  cnhValidade: '2028-12-31',
  telefone: '(11) 98765-4321',
  operadorId: 1,
  operadorNome: 'Metrópole Paulista Transportes',
  status: 'EM ATENDIMENTO',
  horarios: [
    {
      veiculoId: '1',
      veiculoPlaca: 'ABC-1234',
      veiculoModelo: 'Apache VIP IV',
      rotaId: '1',
      rotaNome: 'Linha 3301 - 10',
      startTime: '06:00',
      endTime: '14:00',
      days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      pausaInicio: '10:00',
      pausaFim: '11:00',
    },
  ],
};


// ---------------------------------------------------------
// Linhas Mock Data (100% Aligned with Backend Seeds)
// ---------------------------------------------------------
export const MOCK_LINHAS_ATIVAS: MockRota[] = [
  {
    id: 1,
    nome: 'Linha 3301 - 10 (Term. São Miguel / Term. Pq. D. Pedro II)',
    codigo: '3301-10',
    descricao: 'Term. São Miguel – Term. Pq. D. Pedro II',
    distancia: '18.4 km',
    duracao: '50 min',
    veiculos: 1,
    status: 'ativa',
    enderecos: [],
  },
  {
    id: 2,
    nome: 'Linha 1178 - 10 (Term. São Miguel / Pça. do Correio)',
    codigo: '1178-10',
    descricao: 'Term. São Miguel – Pça. do Correio',
    distancia: '16.2 km',
    duracao: '45 min',
    veiculos: 0,
    status: 'ativa',
    enderecos: [],
  },
  {
    id: 3,
    nome: 'Linha 9051 - 10 (Term. Pinheiros / Lapa)',
    codigo: '9051-10',
    descricao: 'Term. Pinheiros – Lapa',
    distancia: '11.8 km',
    duracao: '35 min',
    veiculos: 1,
    status: 'ativa',
    enderecos: [],
  },
  {
    id: 4,
    nome: 'Linha 8000 - 10 (Pça. Ramos de Azevedo / Term. Lapa)',
    codigo: '8000-10',
    descricao: 'Pça. Ramos de Azevedo – Term. Lapa',
    distancia: '14.0 km',
    duracao: '40 min',
    veiculos: 0,
    status: 'ativa',
    enderecos: [],
  },
  {
    id: 5,
    nome: 'Linha 372F - 10 (Univ. São Judas Tadeu / Metrô Bresser)',
    codigo: '372F-10',
    descricao: 'Univ. São Judas Tadeu – Metrô Bresser',
    distancia: '8.5 km',
    duracao: '25 min',
    veiculos: 0,
    status: 'ativa',
    enderecos: [],
  },
];

export const MOCK_LINHAS_INATIVAS: MockRota[] = [];

// ---------------------------------------------------------
// Veiculos Mock Data (100% Aligned with Backend Seeds)
// ---------------------------------------------------------
export const MOCK_VEICULOS: MockVeiculo[] = [
  {
    id: '1',
    plate: 'ABC-1234',
    model: 'Apache VIP IV',
    type: 'Padrao',
    capacity: 80,
    status: 'ATIVO',
    garage: 'Garagem Central',
    routes: [
      {
        routeName: 'Linha 3301 - 10 (Term. São Miguel / Term. Pq. D. Pedro II)',
        startTime: '06:00',
        endTime: '22:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
    ],
    drivers: [
      {
        name: 'João Silva',
        startTime: '06:00',
        endTime: '14:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
      {
        name: 'Ana Costa',
        startTime: '14:00',
        endTime: '22:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
    ],
  },
  {
    id: '2',
    plate: 'DEF-5678',
    model: 'CAIO Millennium',
    type: 'Articulado',
    capacity: 120,
    status: 'ATIVO',
    garage: 'Garagem Oeste',
    routes: [
      {
        routeName: 'Linha 9051 - 10 (Term. Pinheiros / Lapa)',
        startTime: '06:00',
        endTime: '14:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
    ],
    drivers: [
      {
        name: 'Maria Santos',
        startTime: '06:00',
        endTime: '14:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
    ],
  },
  {
    id: '3',
    plate: 'GHI-9012',
    model: 'Apache VIP V',
    type: 'BRT',
    capacity: 160,
    status: 'ATIVO',
    garage: 'Garagem Sul',
    routes: [],
    drivers: [],
  },
  {
    id: '4',
    plate: 'JKL-3456',
    model: 'Caio Millennium III',
    type: 'Padrao',
    capacity: 80,
    status: 'INATIVO',
    garage: 'Garagem Norte',
    routes: [],
    drivers: [],
  },
];

export const MOCK_MODELS = ['Apache VIP IV', 'CAIO Millennium', 'Caio Millennium III', 'Apache VIP V'];
export const MOCK_TYPES = ['Básico', 'Padrao', 'Padrão', 'Articulado', 'Bi-articulado', 'BRT'];
export const MOCK_GARAGES = [
  'Garagem Central',
  'Garagem Norte',
  'Garagem Sul',
  'Garagem Leste',
  'Garagem Oeste',
];
export const MOCK_DROPDOWN_DRIVERS = [
  'João Silva',
  'Ana Costa',
  'Maria Santos',
  'Marcos Oliveira',
  'Ana Júlia',
];
export const MOCK_DROPDOWN_LINHAS = [
  'Linha 3301 - 10 (Term. São Miguel / Term. Pq. D. Pedro II)',
  'Linha 1178 - 10 (Term. São Miguel / Pça. do Correio)',
  'Linha 9051 - 10 (Term. Pinheiros / Lapa)',
  'Linha 8000 - 10 (Pça. Ramos de Azevedo / Term. Lapa)',
  'Linha 372F - 10 (Univ. São Judas Tadeu / Metrô Bresser)',
];

// ---------------------------------------------------------
// Motoristas Mock Data (100% Aligned with Backend Seeds)
// ---------------------------------------------------------
export const MOCK_MOTORISTAS: MockMotorista[] = [
  {
    id: '00000000-0000-0000-0003-000000000001',
    nome: 'João Silva',
    cpf: '111.222.333-44',
    cnhNumero: '12345678900',
    cnhValidade: '2028-12-31',
    telefone: '(11) 98765-4321',
    operadorId: 1,
    operadorNome: 'Metrópole Paulista Transportes',
    status: 'EM ATENDIMENTO',
    horarios: [
      {
        veiculoId: '1',
        veiculoPlaca: 'ABC-1234',
        veiculoModelo: 'Apache VIP IV',
        rotaId: '1',
        rotaNome: 'Linha 3301 - 10',
        startTime: '06:00',
        endTime: '14:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
        pausaInicio: '10:00',
        pausaFim: '11:00',
      },
    ],
  },
  {
    id: '00000000-0000-0000-0003-000000000002',
    nome: 'Ana Costa',
    cpf: '222.333.444-55',
    cnhNumero: '98765432100',
    cnhValidade: '2027-06-15',
    telefone: '(11) 91234-5678',
    operadorId: 1,
    operadorNome: 'Metrópole Paulista Transportes',
    status: 'EM ATENDIMENTO',
    horarios: [
      {
        veiculoId: '1',
        veiculoPlaca: 'ABC-1234',
        veiculoModelo: 'Apache VIP IV',
        rotaId: '1',
        rotaNome: 'Linha 3301 - 10',
        startTime: '14:00',
        endTime: '22:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
        pausaInicio: '18:00',
        pausaFim: '19:00',
      },
    ],
  },
  {
    id: '00000000-0000-0000-0003-000000000003',
    nome: 'Maria Santos',
    cpf: '333.444.555-66',
    cnhNumero: '55443322110',
    cnhValidade: '2026-10-01',
    telefone: '(11) 99876-5432',
    operadorId: 2,
    operadorNome: 'Viação Gato Preto Ltda',
    status: 'EM ATENDIMENTO',
    horarios: [
      {
        veiculoId: '2',
        veiculoPlaca: 'DEF-5678',
        veiculoModelo: 'CAIO Millennium',
        rotaId: '3',
        rotaNome: 'Linha 9051 - 10',
        startTime: '06:00',
        endTime: '14:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
        pausaInicio: '10:00',
        pausaFim: '11:00',
      },
    ],
  },
  {
    id: '00000000-0000-0000-0003-000000000004',
    nome: 'Marcos Oliveira',
    cpf: '444.555.666-77',
    cnhNumero: '77889900112',
    cnhValidade: '2026-09-25',
    telefone: '(11) 97766-5544',
    operadorId: 3,
    operadorNome: 'Viação Santa Brígida',
    status: 'AGUARDANDO',
    horarios: [],
  },
  {
    id: '00000000-0000-0000-0002-000000000001',
    nome: 'Ana Júlia',
    cpf: '321.654.987-00',
    cnhNumero: '11223344556',
    cnhValidade: '2029-01-20',
    telefone: '(11) 97654-3210',
    operadorId: 5,
    operadorNome: 'CitMobi Mobilidade Urbana',
    status: 'PAUSA',
    horarios: [],
  },
];

export const MOCK_VEICULOS_DISPONIVEIS = [
  { id: '1', placa: 'ABC-1234', modelo: 'Apache VIP IV' },
  { id: '2', placa: 'DEF-5678', modelo: 'CAIO Millennium' },
  { id: '3', placa: 'GHI-9012', modelo: 'Apache VIP V' },
  { id: '4', placa: 'JKL-3456', modelo: 'Caio Millennium III' },
];

export const MOCK_LINHAS_DISPONIVEIS = [
  { id: '1', nome: 'Linha 3301 - 10 (Term. São Miguel / Term. Pq. D. Pedro II)' },
  { id: '2', nome: 'Linha 1178 - 10 (Term. São Miguel / Pça. do Correio)' },
  { id: '3', nome: 'Linha 9051 - 10 (Term. Pinheiros / Lapa)' },
  { id: '4', nome: 'Linha 8000 - 10 (Pça. Ramos de Azevedo / Term. Lapa)' },
  { id: '5', nome: 'Linha 372F - 10 (Univ. São Judas Tadeu / Metrô Bresser)' },
];

export const MOCK_PARADAS = [
  { paradaId: 1, logradouro: 'Terminal São Miguel', numero: 'S/N', obs: 'Ponto Inicial', cep: '08010-000', latLong: [-23.5020, -46.4653], municipio: 3550308, ufSigla: 'SP', tipoId: 2, flagAtiva: 'S' },
  { paradaId: 2, logradouro: 'Terminal Pq Dom Pedro II', numero: 'S/N', obs: 'Ponto Final / Conexão Central', cep: '03010-000', latLong: [-23.5440, -46.6278], municipio: 3550308, ufSigla: 'SP', tipoId: 2, flagAtiva: 'S' },
  { paradaId: 3, logradouro: 'Praça do Correio', numero: 'S/N', obs: 'Centro Histórico', cep: '01031-000', latLong: [-23.543456, -46.635122], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 4, logradouro: 'Terminal Pinheiros', numero: 'S/N', obs: 'Integração Metrô/CPTM', cep: '05422-010', latLong: [-23.5675, -46.6945], municipio: 3550308, ufSigla: 'SP', tipoId: 2, flagAtiva: 'S' },
  { paradaId: 5, logradouro: 'Terminal Lapa', numero: 'S/N', obs: 'Zona Oeste', cep: '05036-000', latLong: [-23.5188, -46.7012], municipio: 3550308, ufSigla: 'SP', tipoId: 2, flagAtiva: 'S' },
  { paradaId: 6, logradouro: 'Praça Ramos de Azevedo', numero: 'S/N', obs: 'Teatro Municipal', cep: '01037-010', latLong: [-23.5458, -46.6389], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 7, logradouro: 'Univ. São Judas Tadeu', numero: '546', obs: 'Rua Taquari', cep: '03166-000', latLong: [-23.5512, -46.5980], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 8, logradouro: 'Metrô Bresser', numero: 'S/N', obs: 'Estação Linha 3 Vermelha', cep: '03054-000', latLong: [-23.5364, -46.6059], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 9, logradouro: 'Rua do Arouche', numero: '100', obs: 'Em frente à praça', cep: '01219-010', latLong: [-23.541234, -46.643210], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 10, logradouro: 'Av. São João', numero: '450', obs: '', cep: '01036-000', latLong: [-23.543456, -46.641122], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 11, logradouro: 'Av. Paulista', numero: '1000', obs: '', cep: '01310-100', latLong: [-23.5614, -46.6561], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 12, logradouro: 'Av. Brigadeiro Faria Lima', numero: '3000', obs: '', cep: '04538-132', latLong: [-23.5788, -46.6849], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
];

// ---------------------------------------------------------
// Home Dashboard Mock Data
// ---------------------------------------------------------
export const MOCK_STATS = {
  motoristasAtivos: 3,
  veiculosAtivos: 3,
  linhasEmOperacao: 5,
  coberturaTotal: '68.9 km',
};

export const MOCK_LINHAS_BY_DAY = [
  { label: 'Seg', value: 5 },
  { label: 'Ter', value: 5 },
  { label: 'Qua', value: 5 },
  { label: 'Qui', value: 5 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 4 },
  { label: 'Dom', value: 3 },
];

export const MOCK_VEHICLE_STATUS = [
  { label: 'Ativo', value: 3, percentage: 75, color: '#00b4d8' },
  { label: 'Manutenção', value: 0, percentage: 0, color: '#f59e0b' },
  { label: 'Inativo', value: 1, percentage: 25, color: '#94a3b8' },
  { label: 'Sucateado', value: 0, percentage: 0, color: '#ef4444' },
  { label: 'Vendido', value: 0, percentage: 0, color: '#64748b' },
];

export const MOCK_DRIVERS_BY_SHIFT = [
  { label: 'Manhã', value: 2, color: '#00b4d8' },
  { label: 'Tarde', value: 1, color: '#0891b2' },
  { label: 'Noite', value: 0, color: '#0e7490' },
];

export const MOCK_RECENT_ACTIVITY = [
  {
    type: 'route',
    text: 'Operação iniciada: 3301-10 (Term. São Miguel → Term. Pq. D. Pedro II)',
    time: 'há 5 min',
  },
  {
    type: 'driver',
    text: 'Motorista João Silva assumiu veículo ABC-1234',
    time: 'há 15 min',
  },
  {
    type: 'driver',
    text: 'Motorista Maria Santos assumiu veículo DEF-5678 (Linha 9051-10)',
    time: 'há 28 min',
  },
  {
    type: 'vehicle',
    text: 'Veículo GHI-9012 alocado como Reserva Técnica',
    time: 'há 1h',
  },
  {
    type: 'route',
    text: 'Cadastro de Rotas e 6 Paradas concluído para Linha 372F-10',
    time: 'há 2h',
  },
];

export const MOCK_LINHAS_BY_HOUR = [
  { label: '00h', value: 0 },
  { label: '01h', value: 0 },
  { label: '02h', value: 0 },
  { label: '03h', value: 0 },
  { label: '04h', value: 1 },
  { label: '05h', value: 2 },
  { label: '06h', value: 5 },
  { label: '07h', value: 5 },
  { label: '08h', value: 5 },
  { label: '09h', value: 5 },
  { label: '10h', value: 5 },
  { label: '11h', value: 5 },
  { label: '12h', value: 5 },
  { label: '13h', value: 5 },
  { label: '14h', value: 5 },
  { label: '15h', value: 5 },
  { label: '16h', value: 5 },
  { label: '17h', value: 5 },
  { label: '18h', value: 5 },
  { label: '19h', value: 4 },
  { label: '20h', value: 4 },
  { label: '21h', value: 3 },
  { label: '22h', value: 2 },
  { label: '23h', value: 1 },
];

export const MOCK_PASSENGER_CAPACITY_BY_HOUR = [
  { label: '12h', value: 200 },
  { label: '13h', value: 200 },
  { label: '14h', value: 200 },
  { label: '15h', value: 200 },
  { label: '16h', value: 200 },
  { label: '17h', value: 200 },
  { label: '18h', value: 200 },
  { label: '19h', value: 120 },
  { label: '20h', value: 120 },
  { label: '21h', value: 80 },
  { label: '22h', value: 80 },
  { label: '23h', value: 0 },
];

export const MOCK_VEHICLES_BY_LINHA = [
  { route: '3301-10 - Term. São Miguel / Term. Pq. D. Pedro II', vehicles: 1, color: '#00b4d8' },
  { route: '9051-10 - Term. Pinheiros / Lapa', vehicles: 1, color: '#0891b2' },
  { route: '372F-10 - Univ. São Judas Tadeu / Metrô Bresser', vehicles: 0, color: '#0e7490' },
  { route: '1178-10 - Term. São Miguel / Pça. do Correio', vehicles: 0, color: '#06b6d4' },
  { route: '8000-10 - Pça. Ramos de Azevedo / Term. Lapa', vehicles: 0, color: '#0284c7' },
];

export const MOCK_RESERVE_VEHICLES_BY_HOUR = [
  { label: '12h', value: 1 },
  { label: '13h', value: 1 },
  { label: '14h', value: 1 },
  { label: '15h', value: 1 },
  { label: '16h', value: 1 },
  { label: '17h', value: 1 },
  { label: '18h', value: 1 },
  { label: '19h', value: 1 },
  { label: '20h', value: 1 },
  { label: '21h', value: 1 },
  { label: '22h', value: 1 },
  { label: '23h', value: 1 },
];

export const MOCK_VEHICLE_INCIDENTS = [
  {
    type: 'Mecânico',
    count: 0,
    percentage: 0,
    color: '#ef4444',
    icon: 'wrench',
  },
  {
    type: 'Acidente Leve',
    count: 0,
    percentage: 0,
    color: '#f59e0b',
    icon: 'alert',
  },
  {
    type: 'Pneu Furado',
    count: 0,
    percentage: 0,
    color: '#f97316',
    icon: 'circle',
  },
  {
    type: 'Elétrico',
    count: 0,
    percentage: 0,
    color: '#eab308',
    icon: 'zap',
  },
  {
    type: 'Outros',
    count: 0,
    percentage: 0,
    color: '#94a3b8',
    icon: 'more',
  },
];


