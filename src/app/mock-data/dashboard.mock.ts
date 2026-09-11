// Home Dashboard Mock Data (Retained for KPI visualizations)
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
