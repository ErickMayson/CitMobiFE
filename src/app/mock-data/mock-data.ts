// Centralized Mock Data for CitMobi

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
  id: string;
  plate: string;
  model: string;
  type: string;
  capacity: number;
  status: 'EM ATENDIMENTO' | 'GARAGEM' | 'RESERVA' | 'INATIVO';
  garage: string;
  routes: MockVehicleRoute[];
  drivers: MockVehicleDriver[];
}

export interface MockHorarioMotorista {
  veiculoId: string;
  veiculoPlaca: string;
  veiculoModelo: string;
  rotaId: string;
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
// Linhas Mock Data
// ---------------------------------------------------------
export const MOCK_LINHAS_ATIVAS: MockRota[] = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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
    id: 5,
    nome: 'Linha 005 - Circular',
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
    id: 'V001',
    plate: 'ABC-1234',
    model: 'Caio Millennium III',
    type: 'Padrão',
    capacity: 80,
    status: 'EM ATENDIMENTO',
    garage: 'Garagem Central',
    routes: [
      {
        routeName: 'Linha 100 - Centro/Bairro',
        startTime: '06:00',
        endTime: '12:00',
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
    ],
  },
  {
    id: 'V002',
    plate: 'DEF-5678',
    model: 'Apache VIP V',
    type: 'BRT',
    capacity: 160,
    status: 'EM ATENDIMENTO',
    garage: 'Garagem Norte',
    routes: [
      {
        routeName: 'Linha 200 - Expresso',
        startTime: '05:30',
        endTime: '13:30',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'],
      },
    ],
    drivers: [
      {
        name: 'Maria Santos',
        startTime: '05:30',
        endTime: '13:30',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'],
      },
    ],
  },
  {
    id: 'V003',
    plate: 'GHI-9012',
    model: 'Caio Millennium III',
    type: 'Articulado',
    capacity: 120,
    status: 'GARAGEM',
    garage: 'Garagem Sul',
    routes: [],
    drivers: [],
  },
];

export const MOCK_MODELS = ['Caio Millennium III', 'Apache VIP V'];
export const MOCK_TYPES = ['Básico', 'Padrão', 'Articulado', 'Bi-articulado', 'BRT'];
export const MOCK_GARAGES = [
  'Garagem Central',
  'Garagem Norte',
  'Garagem Sul',
  'Garagem Leste',
  'Garagem Oeste',
];
export const MOCK_DROPDOWN_DRIVERS = [
  'João Silva',
  'Maria Santos',
  'Pedro Oliveira',
  'Ana Costa',
  'Carlos Souza',
];
export const MOCK_DROPDOWN_LINHAS = [
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
    id: 'M001',
    nome: 'João Silva',
    cpf: '123.456.789-00',
    telefone: '(11) 98765-4321',
    status: 'EM ATENDIMENTO',
    horarios: [
      {
        veiculoId: 'V001',
        veiculoPlaca: 'ABC-1234',
        veiculoModelo: 'Caio Millennium III',
        rotaId: 'R001',
        rotaNome: 'Linha 100 - Centro/Bairro',
        startTime: '06:00',
        endTime: '14:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
    ],
  },
  {
    id: 'M002',
    nome: 'Maria Santos',
    cpf: '987.654.321-00',
    telefone: '(11) 91234-5678',
    status: 'EM ATENDIMENTO',
    horarios: [
      {
        veiculoId: 'V002',
        veiculoPlaca: 'DEF-5678',
        veiculoModelo: 'Apache VIP V',
        rotaId: 'R002',
        rotaNome: 'Linha 200 - Expresso',
        startTime: '05:30',
        endTime: '13:30',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'],
      },
    ],
  },
  {
    id: 'M003',
    nome: 'Pedro Oliveira',
    cpf: '456.789.123-00',
    telefone: '(11) 99876-5432',
    status: 'AGUARDANDO',
    horarios: [],
  },
  {
    id: 'M004',
    nome: 'Ana Costa',
    cpf: '321.654.987-00',
    telefone: '(11) 97654-3210',
    status: 'PAUSA',
    horarios: [
      {
        veiculoId: 'V001',
        veiculoPlaca: 'ABC-1234',
        veiculoModelo: 'Caio Millennium III',
        rotaId: 'R003',
        rotaNome: 'Linha 300 - Circular',
        startTime: '14:00',
        endTime: '22:00',
        days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
    ],
  },
  {
    id: 'M005',
    nome: 'Carlos Souza',
    cpf: '789.123.456-00',
    telefone: '(11) 96543-2109',
    status: 'FORA DE TURNO',
    horarios: [
      {
        veiculoId: 'V003',
        veiculoPlaca: 'GHI-9012',
        veiculoModelo: 'Caio Millennium III',
        rotaId: 'R004',
        rotaNome: 'Linha 400 - Terminal',
        startTime: '22:00',
        endTime: '06:00',
        days: ['DOM'],
      },
    ],
  },
];

export const MOCK_VEICULOS_DISPONIVEIS = [
  { id: 'V001', placa: 'ABC-1234', modelo: 'Caio Millennium III' },
  { id: 'V002', placa: 'DEF-5678', modelo: 'Apache VIP V' },
  { id: 'V003', placa: 'GHI-9012', modelo: 'Caio Millennium III' },
  { id: 'V004', placa: 'JKL-3456', modelo: 'Apache VIP V' },
];

export const MOCK_LINHAS_DISPONIVEIS = [
  { id: 'R001', nome: 'Linha 100 - Centro/Bairro' },
  { id: 'R002', nome: 'Linha 200 - Expresso' },
  { id: 'R003', nome: 'Linha 300 - Circular' },
  { id: 'R004', nome: 'Linha 400 - Terminal' },
];

export const MOCK_PARADAS = [
  { paradaId: 1, logradouro: 'Av. Paulista', numero: '1000', obs: '', cep: '01310-100', latLong: [-23.5614, -46.6561], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 2, logradouro: 'Rua Augusta', numero: '500', obs: '', cep: '01304-000', latLong: [-23.5550, -46.6450], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 3, logradouro: 'Av. Brigadeiro Faria Lima', numero: '3000', obs: '', cep: '04538-132', latLong: [-23.5788, -46.6849], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 4, logradouro: 'Praça da Sé', numero: 'S/N', obs: '', cep: '01001-000', latLong: [-23.5505, -46.6333], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 5, logradouro: 'Av. Rebouças', numero: '2500', obs: '', cep: '05401-400', latLong: [-23.5628, -46.6721], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 6, logradouro: 'Rua da Consolação', numero: '1500', obs: '', cep: '01302-001', latLong: [-23.5492, -46.6578], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 7, logradouro: 'Av. Santo Amaro', numero: '4000', obs: '', cep: '04556-200', latLong: [-23.5984, -46.6805], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 8, logradouro: 'Rua 25 de Março', numero: '900', obs: '', cep: '01021-200', latLong: [-23.5437, -46.6384], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 9, logradouro: 'Av. Celso Garcia', numero: '2000', obs: '', cep: '03064-000', latLong: [-23.5308, -46.5970], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 10, logradouro: 'Terminal Pq Dom Pedro II', numero: 'S/N', obs: '', cep: '03010-000', latLong: [-23.5440, -46.6278], municipio: 3550308, ufSigla: 'SP', tipoId: 2, flagAtiva: 'S' },
  { paradaId: 11, logradouro: 'Terminal Pinheiros', numero: 'S/N', obs: '', cep: '05422-010', latLong: [-23.5675, -46.6945], municipio: 3550308, ufSigla: 'SP', tipoId: 2, flagAtiva: 'S' },
  { paradaId: 12, logradouro: 'Terminal São Miguel', numero: 'S/N', obs: '', cep: '08010-000', latLong: [-23.5020, -46.4653], municipio: 3550308, ufSigla: 'SP', tipoId: 2, flagAtiva: 'S' },
  { paradaId: 13, logradouro: 'Metrô Bresser', numero: 'S/N', obs: '', cep: '03054-000', latLong: [-23.5364, -46.6059], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 14, logradouro: 'Largo da Batata', numero: 'S/N', obs: '', cep: '05422-020', latLong: [-23.5692, -46.6843], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
  { paradaId: 15, logradouro: 'Av. Jabaquara', numero: '1800', obs: '', cep: '04046-200', latLong: [-23.6300, -46.6400], municipio: 3550308, ufSigla: 'SP', tipoId: 1, flagAtiva: 'S' },
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
  { label: 'Em Operação', value: 54, percentage: 61, color: '#00b4d8' },
  { label: 'Disponível', value: 23, percentage: 26, color: '#10b981' },
  { label: 'Manutenção', value: 8, percentage: 9, color: '#f59e0b' },
  { label: 'Indisponível', value: 4, percentage: 4, color: '#ef4444' },
];

export const MOCK_DRIVERS_BY_SHIFT = [
  { label: 'Manhã', value: 52, color: '#00b4d8' },
  { label: 'Tarde', value: 41, color: '#0891b2' },
  { label: 'Noite', value: 31, color: '#0e7490' },
];

export const MOCK_RECENT_ACTIVITY = [
  {
    type: 'route',
    text: 'Nova rota iniciada: Centro → Zona Norte',
    time: 'há 5 min',
  },
  {
    type: 'vehicle',
    text: 'Veículo #VH-1234 entrou em manutenção',
    time: 'há 12 min',
  },
  {
    type: 'driver',
    text: 'Motorista Carlos Silva finalizou turno',
    time: 'há 28 min',
  },
  {
    type: 'route',
    text: 'Rota concluída: Aeroporto → Centro',
    time: 'há 45 min',
  },
  {
    type: 'vehicle',
    text: 'Veículo #VH-5678 voltou à operação',
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
  { route: 'Linha 001 - Centro/Bairro A', vehicles: 12, color: '#00b4d8' },
  { route: 'Linha 002 - Aeroporto/Centro', vehicles: 8, color: '#0891b2' },
  { route: 'Linha 003 - Zona Norte/Sul', vehicles: 15, color: '#0e7490' },
  { route: 'Linha 004 - Terminal A/B', vehicles: 10, color: '#06b6d4' },
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
