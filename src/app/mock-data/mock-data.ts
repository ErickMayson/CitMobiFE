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
  veiculoId: string | number;
  veiculoPlaca: string;
  veiculoModelo: string;
  rotaId: string | number;
  rotaNome: string;
  startTime: string;
  endTime: string;
  days: string[];
}


export interface MockMotorista {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  status: 'EM ATENDIMENTO' | 'AGUARDANDO' | 'PAUSA' | 'FORA DE TURNO';
  horarios: MockHorarioMotorista[];
}

// ---------------------------------------------------------
// Demo Mockup Toggle (Set to false to remove demo items)
// ---------------------------------------------------------
export const ENABLE_DEMO_MOCKUP: boolean = true;

export const DEMO_MOCK_VEICULO: MockVeiculo = {
  id: '1',
  plate: 'ABC1D23',
  model: 'Apache VIP IV',
  type: 'Padrao',
  capacity: 80,
  status: 'ATIVO',
  garage: 'Garagem Central',
  routes: [
    {
      routeName: 'Linha 3301 - 10 (Term. Amaral Gurgel / Term. Pq. D. Pedro II)',
      startTime: '06:00',
      endTime: '22:00',
      days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
    },
  ],
  drivers: [
    {
      name: 'Antonio Souza',
      startTime: '06:00',
      endTime: '14:00',
      days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
    },
  ],
};

export const DEMO_MOCK_MOTORISTA: MockMotorista = {
  id: '00000000-0000-0000-0003-000000000001',
  nome: 'Antonio Souza',
  cpf: '111.222.333-44',
  telefone: '(11) 98765-4321',
  status: 'EM ATENDIMENTO',
  horarios: [
    {
      veiculoId: '1',
      veiculoPlaca: 'ABC1D23',
      veiculoModelo: 'Apache VIP IV',
      rotaId: '1',
      rotaNome: 'Linha 3301 - 10',
      startTime: '06:00',
      endTime: '14:00',
      days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
    },
  ],
};


// ---------------------------------------------------------
// Linhas Mock Data
// ---------------------------------------------------------
export const MOCK_LINHAS_ATIVAS: MockRota[] = [
  {
    id: 1,
    nome: 'Linha 3301 - Term. Amaral Gurgel / Term. Pq. D. Pedro II',
    codigo: '3301',
    descricao: 'Term. Amaral Gurgel / Term. Pq. D. Pedro II',
    distancia: '14.2 km',
    duracao: '40 min',
    veiculos: 6,
    status: 'ativa',
    enderecos: [],
  },
  {
    id: 2,
    nome: 'Linha 001 - Centro/Bairro A',
    codigo: '001',
    descricao: 'Rota principal do centro',
    distancia: '12.5 km',
    duracao: '45 min',
    veiculos: 8,
    status: 'ativa',
    enderecos: [],
  },
  {
    id: 3,
    nome: 'Linha 002 - Aeroporto/Centro',
    codigo: '002',
    descricao: 'Conexão aeroporto',
    distancia: '18.2 km',
    duracao: '35 min',
    veiculos: 5,
    status: 'ativa',
    enderecos: [],
  },
  {
    id: 4,
    nome: 'Linha 003 - Zona Norte/Sul',
    codigo: '003',
    descricao: 'Ligação norte-sul',
    distancia: '22.8 km',
    duracao: '55 min',
    veiculos: 12,
    status: 'ativa',
    enderecos: [],
  },
];

export const MOCK_LINHAS_INATIVAS: MockRota[] = [
  {
    id: 5,
    nome: 'Linha 004 - Terminal A/B',
    codigo: '004',
    descricao: 'Rota entre terminais',
    distancia: '8.5 km',
    duracao: '25 min',
    veiculos: 0,
    status: 'inativa',
    enderecos: [],
  },
  {
    id: 6,
    nome: 'Linha 005 - Circular Centro',
    codigo: '005',
    descricao: 'Rota circular centro',
    distancia: '15.0 km',
    duracao: '50 min',
    veiculos: 0,
    status: 'inativa',
    enderecos: [],
  },
];

// ---------------------------------------------------------
// Veiculos Mock Data
// ---------------------------------------------------------
export const MOCK_VEICULOS: MockVeiculo[] = [
  {
    id: '1',
    plate: 'ABC1D23',
    model: 'Apache VIP IV',
    type: 'Padrao',
    capacity: 80,
    status: 'ATIVO',
    garage: 'Garagem Central',
    routes: [
      {
        routeName: 'Linha 3301 - 10',
        startTime: '06:00',
        endTime: '22:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
    ],
    drivers: [
      {
        name: 'Antonio Souza',
        startTime: '06:00',
        endTime: '14:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
    ],
  },
  {
    id: '2',
    plate: 'BRA4E56',
    model: 'CAIO Millennium',
    type: 'Articulado',
    capacity: 120,
    status: 'ATIVO',
    garage: 'Garagem Central',
    routes: [
      {
        routeName: 'Linha 3301 - 10',
        startTime: '06:00',
        endTime: '18:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
    ],
    drivers: [
      {
        name: 'Carlos Silva',
        startTime: '06:00',
        endTime: '14:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
    ],
  },
  {
    id: '3',
    plate: 'GHI9012',
    model: 'Apache VIP V',
    type: 'BRT',
    capacity: 160,
    status: 'MANUTENCAO',
    garage: 'Garagem Sul',
    routes: [],
    drivers: [],
  },
  {
    id: '4',
    plate: 'JKL3456',
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
  'Antonio Souza',
  'Carlos Silva',
  'Marcos Oliveira',
  'João Silva',
  'Maria Santos',
];
export const MOCK_DROPDOWN_LINHAS = [
  'Linha 3301 - 10',
  'Linha 100 - Centro/Bairro',
  'Linha 200 - Expresso',
  'Linha 300 - Circular',
  'Linha 400 - Terminal',
];

// ---------------------------------------------------------
// Motoristas Mock Data
// ---------------------------------------------------------
export const MOCK_MOTORISTAS: MockMotorista[] = [
  {
    id: '00000000-0000-0000-0003-000000000001',
    nome: 'Antonio Souza',
    cpf: '111.222.333-44',
    telefone: '(11) 98765-4321',
    status: 'EM ATENDIMENTO',
    horarios: [
      {
        veiculoId: '1',
        veiculoPlaca: 'ABC1D23',
        veiculoModelo: 'Apache VIP IV',
        rotaId: '1',
        rotaNome: 'Linha 3301 - 10',
        startTime: '06:00',
        endTime: '14:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
    ],
  },
  {
    id: '00000000-0000-0000-0003-000000000002',
    nome: 'Carlos Silva',
    cpf: '222.333.444-55',
    telefone: '(11) 91234-5678',
    status: 'EM ATENDIMENTO',
    horarios: [
      {
        veiculoId: '2',
        veiculoPlaca: 'BRA4E56',
        veiculoModelo: 'CAIO Millennium',
        rotaId: '1',
        rotaNome: 'Linha 3301 - 10',
        startTime: '06:00',
        endTime: '14:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
    ],
  },
  {
    id: '00000000-0000-0000-0003-000000000003',
    nome: 'Marcos Oliveira',
    cpf: '333.444.555-66',
    telefone: '(11) 99876-5432',
    status: 'AGUARDANDO',
    horarios: [],
  },
  {
    id: '00000000-0000-0000-0002-000000000001',
    nome: 'Ana Júlia',
    cpf: '321.654.987-00',
    telefone: '(11) 97654-3210',
    status: 'PAUSA',
    horarios: [],
  },
];

export const MOCK_VEICULOS_DISPONIVEIS = [
  { id: '1', placa: 'ABC1D23', modelo: 'Apache VIP IV' },
  { id: '2', placa: 'BRA4E56', modelo: 'CAIO Millennium' },
  { id: '3', placa: 'GHI9012', modelo: 'Apache VIP V' },
  { id: '4', placa: 'JKL3456', modelo: 'Caio Millennium III' },
];

export const MOCK_LINHAS_DISPONIVEIS = [
  { id: '1', nome: 'Linha 3301 - 10 (Term. Amaral Gurgel / Term. Pq. D. Pedro II)' },
  { id: '2', nome: 'Linha 100 - Centro/Bairro' },
  { id: '3', nome: 'Linha 200 - Expresso' },
  { id: '4', nome: 'Linha 300 - Circular' },
];

export const MOCK_PARADAS = [
  { paradaId: 1, logradouro: 'Rua do Arouche', numero: '100', obs: 'Em frente à praça', cep: '01219-010', latLong: [-23.541234, -46.643210], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 2, logradouro: 'Av. São João', numero: '450', obs: '', cep: '01036-000', latLong: [-23.543456, -46.641122], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 3, logradouro: 'Av. Paulista', numero: '1000', obs: '', cep: '01310-100', latLong: [-23.5614, -46.6561], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 4, logradouro: 'Rua Augusta', numero: '500', obs: '', cep: '01304-000', latLong: [-23.5550, -46.6450], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 5, logradouro: 'Av. Brigadeiro Faria Lima', numero: '3000', obs: '', cep: '04538-132', latLong: [-23.5788, -46.6849], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 6, logradouro: 'Praça da Sé', numero: 'S/N', obs: '', cep: '01001-000', latLong: [-23.5505, -46.6333], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 7, logradouro: 'Terminal Pq Dom Pedro II', numero: 'S/N', obs: '', cep: '03010-000', latLong: [-23.5440, -46.6278], municipio: 3550308, ufSigla: 'SP', tipoId: 2, flagAtiva: 'S' },
  { paradaId: 8, logradouro: 'Terminal Amaral Gurgel', numero: 'S/N', obs: '', cep: '01229-000', latLong: [-23.5380, -46.6500], municipio: 3550308, ufSigla: 'SP', tipoId: 2, flagAtiva: 'S' },
  { paradaId: 9, logradouro: 'Terminal Pinheiros', numero: 'S/N', obs: '', cep: '05422-010', latLong: [-23.5675, -46.6945], municipio: 3550308, ufSigla: 'SP', tipoId: 2, flagAtiva: 'S' },
  { paradaId: 10, logradouro: 'Terminal São Miguel', numero: 'S/N', obs: '', cep: '08010-000', latLong: [-23.5020, -46.4653], municipio: 3550308, ufSigla: 'SP', tipoId: 2, flagAtiva: 'S' },
  { paradaId: 11, logradouro: 'Metrô Bresser', numero: 'S/N', obs: '', cep: '03054-000', latLong: [-23.5364, -46.6059], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 12, logradouro: 'Largo da Batata', numero: 'S/N', obs: '', cep: '05422-020', latLong: [-23.5692, -46.6843], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
];

// ---------------------------------------------------------
// Home Dashboard Mock Data
// ---------------------------------------------------------
export const MOCK_STATS = {
  motoristasAtivos: 124,
  veiculosAtivos: 89,
  linhasEmOperacao: 45,
  coberturaTotal: '12.5K km',
};

export const MOCK_LINHAS_BY_DAY = [
  { label: 'Seg', value: 42 },
  { label: 'Ter', value: 38 },
  { label: 'Qua', value: 45 },
  { label: 'Qui', value: 51 },
  { label: 'Sex', value: 48 },
  { label: 'Sáb', value: 32 },
  { label: 'Dom', value: 28 },
];

export const MOCK_VEHICLE_STATUS = [
  { label: 'Ativo', value: 54, percentage: 61, color: '#00b4d8' },
  { label: 'Manutenção', value: 12, percentage: 14, color: '#f59e0b' },
  { label: 'Inativo', value: 15, percentage: 17, color: '#94a3b8' },
  { label: 'Sucateado', value: 5, percentage: 5, color: '#ef4444' },
  { label: 'Vendido', value: 3, percentage: 3, color: '#64748b' },
];

export const MOCK_DRIVERS_BY_SHIFT = [
  { label: 'Manhã', value: 52, color: '#00b4d8' },
  { label: 'Tarde', value: 41, color: '#0891b2' },
  { label: 'Noite', value: 31, color: '#0e7490' },
];

export const MOCK_RECENT_ACTIVITY = [
  {
    type: 'route',
    text: 'Nova rota iniciada: Term. Amaral Gurgel → Term. Pq. D. Pedro II',
    time: 'há 5 min',
  },
  {
    type: 'vehicle',
    text: 'Veículo #ABC1D23 entrou em manutenção',
    time: 'há 12 min',
  },
  {
    type: 'driver',
    text: 'Motorista Antonio Souza finalizou turno',
    time: 'há 28 min',
  },
  {
    type: 'route',
    text: 'Rota concluída: Term. Pq. D. Pedro II → Amaral Gurgel',
    time: 'há 45 min',
  },
  {
    type: 'vehicle',
    text: 'Veículo #BRA4E56 voltou à operação',
    time: 'há 1h',
  },
];

export const MOCK_LINHAS_BY_HOUR = [
  { label: '00h', value: 8 },
  { label: '01h', value: 5 },
  { label: '02h', value: 3 },
  { label: '03h', value: 4 },
  { label: '04h', value: 6 },
  { label: '05h', value: 12 },
  { label: '06h', value: 28 },
  { label: '07h', value: 42 },
  { label: '08h', value: 45 },
  { label: '09h', value: 38 },
  { label: '10h', value: 35 },
  { label: '11h', value: 40 },
  { label: '12h', value: 43 },
  { label: '13h', value: 38 },
  { label: '14h', value: 36 },
  { label: '15h', value: 39 },
  { label: '16h', value: 41 },
  { label: '17h', value: 46 },
  { label: '18h', value: 48 },
  { label: '19h', value: 35 },
  { label: '20h', value: 28 },
  { label: '21h', value: 22 },
  { label: '22h', value: 18 },
  { label: '23h', value: 12 },
];

export const MOCK_PASSENGER_CAPACITY_BY_HOUR = [
  { label: '12h', value: 1250 },
  { label: '13h', value: 1180 },
  { label: '14h', value: 1220 },
  { label: '15h', value: 1340 },
  { label: '16h', value: 1420 },
  { label: '17h', value: 1680 },
  { label: '18h', value: 1850 },
  { label: '19h', value: 1320 },
  { label: '20h', value: 980 },
  { label: '21h', value: 720 },
  { label: '22h', value: 580 },
  { label: '23h', value: 420 },
];

export const MOCK_VEHICLES_BY_LINHA = [
  { route: 'Linha 3301 - Term. Amaral Gurgel / Pq D Pedro', vehicles: 12, color: '#00b4d8' },
  { route: 'Linha 001 - Centro/Bairro A', vehicles: 10, color: '#0891b2' },
  { route: 'Linha 002 - Aeroporto/Centro', vehicles: 8, color: '#0e7490' },
  { route: 'Linha 003 - Zona Norte/Sul', vehicles: 15, color: '#06b6d4' },
  { route: 'Linha 005 - Circular Centro', vehicles: 6, color: '#0284c7' },
];

export const MOCK_RESERVE_VEHICLES_BY_HOUR = [
  { label: '12h', value: 18 },
  { label: '13h', value: 16 },
  { label: '14h', value: 15 },
  { label: '15h', value: 12 },
  { label: '16h', value: 8 },
  { label: '17h', value: 5 },
  { label: '18h', value: 4 },
  { label: '19h', value: 8 },
  { label: '20h', value: 12 },
  { label: '21h', value: 15 },
  { label: '22h', value: 18 },
  { label: '23h', value: 20 },
];

export const MOCK_VEHICLE_INCIDENTS = [
  {
    type: 'Mecânico',
    count: 5,
    percentage: 42,
    color: '#ef4444',
    icon: 'wrench',
  },
  {
    type: 'Acidente Leve',
    count: 3,
    percentage: 25,
    color: '#f59e0b',
    icon: 'alert',
  },
  {
    type: 'Pneu Furado',
    count: 2,
    percentage: 17,
    color: '#f97316',
    icon: 'circle',
  },
  {
    type: 'Elétrico',
    count: 1,
    percentage: 8,
    color: '#eab308',
    icon: 'zap',
  },
  {
    type: 'Outros',
    count: 1,
    percentage: 8,
    color: '#94a3b8',
    icon: 'more',
  },
];

