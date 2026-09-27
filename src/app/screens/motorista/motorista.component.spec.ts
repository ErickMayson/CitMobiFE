import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MotoristaComponent } from './motorista.component';
import { LinhaDetails } from '../../services/linha.service';
import { Motorista, HorarioMotorista } from '../../models/motorista.model';

describe('MotoristaComponent - Line Name & Direction in Veículos e Linhas', () => {
  let component: MotoristaComponent;
  let fixture: ComponentFixture<MotoristaComponent>;

  const mockLinha1178: LinhaDetails = {
    id: 2,
    codigo: '1178',
    atendimento: '10',
    partida: 'TERMINAL SÃO MIGUEL',
    chegada: 'PÇA. DO CORREIO',
    nome: 'TERMINAL SÃO MIGUEL - PÇA. DO CORREIO',
    descricao: 'TERMINAL SÃO MIGUEL - PÇA. DO CORREIO',
    status: 'ativa',
    rotas: {
      ida: {
        prefixo: 'PÇA. DO CORREIO',
        sentido: 'IDA',
        enderecos: [],
      },
      volta: {
        prefixo: 'TERM. SÃO MIGUEL',
        sentido: 'VOLTA',
        enderecos: [],
      },
    },
    assignedVehicles: [
      {
        plate: 'ABC-1234',
        model: 'Millennium IV',
        sentido: 'VOLTA',
        motoristas: ['João Silva'],
        hasDriver: true,
        driverCount: 1,
        pendingDrivers: false,
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MotoristaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MotoristaComponent);
    component = fixture.componentInstance;
    component.linhasList = [mockLinha1178];
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should format location names with standard transit abbreviations', () => {
    expect(component.formatLocationName('TERMINAL SÃO MIGUEL')).toBe('Term. São Miguel');
    expect(component.formatLocationName('PÇA. DO CORREIO')).toBe('Praça do Correio');
    expect(component.formatLocationName('Praça do Aviao')).toBe('Praça do Avião');
    expect(component.formatLocationName('praca do aviao', 'short')).toBe('Pça. do Avião');
    expect(component.abbreviateLocationName('Praça do Avião')).toBe('Pça. do Avião');
    expect(component.formatLocationName('Avenida Paulista', 'short')).toBe('Av. Paulista');
    expect(component.formatLocationName('HOSPITAL DAS CLINICAS', 'short')).toBe('Hosp. das Clínicas');
  });

  it('should format full line name as "1178-10 - Term. São Miguel - Praça do Correio"', () => {
    const formatted = component.formatLinhaFullName(mockLinha1178);
    expect(formatted).toBe('1178-10 - Term. São Miguel - Praça do Correio');
  });

  it('should resolve full line name for a schedule using findLinha and getFormattedHorarioRota', () => {
    const horario: HorarioMotorista = {
      veiculoId: 1,
      veiculoPlaca: 'ABC-1234',
      veiculoModelo: 'Millennium IV',
      rotaId: '1178-10',
      rotaNome: 'Linha 1178 - 10',
      startTime: '06:00',
      endTime: '14:00',
      days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
    };

    const rotaName = component.getFormattedHorarioRota(horario);
    expect(rotaName).toBe('1178-10 - Term. São Miguel - Praça do Correio');
  });

  it('should display "1178-10 - Praça do Correio" when heading to Praça do Correio (IDA)', () => {
    const horario: HorarioMotorista = {
      veiculoId: 1,
      veiculoPlaca: 'ABC-1234',
      veiculoModelo: 'Millennium IV',
      rotaId: '1178-10',
      rotaNome: 'Linha 1178 - 10',
      startTime: '06:00',
      endTime: '14:00',
      days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
    };

    component.selectedMotorista = {
      id: '00000000-0000-0000-0003-000000000002',
      nome: 'João Silva',
      cpf: '12345678900',
      cnhNumero: '1234567890',
      cnhValidade: '2028-12-31',
      telefone: '11987654321',
      status: 'EM ATENDIMENTO',
      horarios: [horario],
    };

    // Live trip heading in IDA direction towards Praça do Correio
    component.viagensAtivasList = [
      {
        id: 1,
        usuarioId: '00000000-0000-0000-0003-000000000002',
        veiculoId: 1,
        veiculoPlaca: 'ABC-1234',
        linhaId: 2,
        linhaCodigo: '1178',
        rotaId: 1,
        sentido: 'IDA',
        dataInicio: new Date().toISOString(),
        status: 'EM_ANDAMENTO',
      },
    ];

    const dirInfo = component.getCurrentDirectionInfo(horario);
    expect(dirInfo.isGoing).toBeTrue();
    expect(dirInfo.sentido).toBe('IDA');
    expect(dirInfo.destination).toBe('Praça do Correio');
    expect(dirInfo.displayLabel).toBe('1178-10 - Praça do Correio');

    component.selectedDay = component.getCurrentDayCode();
    horario.days.push(component.selectedDay);
    const blocks = component.getScheduleBlocks();
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].rotaNome).toBe('1178-10 - Praça do Correio');
    expect(blocks[0].isActiveNow).toBeTrue();
  });

  it('should display "1178-10 - Term. São Miguel" when heading to Term. São Miguel (VOLTA)', () => {
    const horario: HorarioMotorista = {
      veiculoId: 1,
      veiculoPlaca: 'ABC-1234',
      veiculoModelo: 'Millennium IV',
      rotaId: '1178-10',
      rotaNome: 'Linha 1178 - 10',
      startTime: '06:00',
      endTime: '14:00',
      days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
    };

    component.selectedMotorista = {
      id: '00000000-0000-0000-0003-000000000002',
      nome: 'João Silva',
      cpf: '12345678900',
      cnhNumero: '1234567890',
      cnhValidade: '2028-12-31',
      telefone: '11987654321',
      status: 'EM ATENDIMENTO',
      horarios: [horario],
    };

    // Live trip heading in VOLTA direction towards Term. São Miguel
    component.viagensAtivasList = [
      {
        id: 1,
        usuarioId: '00000000-0000-0000-0003-000000000002',
        veiculoId: 1,
        veiculoPlaca: 'ABC-1234',
        linhaId: 2,
        linhaCodigo: '1178',
        rotaId: 2,
        sentido: 'VOLTA',
        dataInicio: new Date().toISOString(),
        status: 'EM_ANDAMENTO',
      },
    ];

    const dirInfo = component.getCurrentDirectionInfo(horario);
    expect(dirInfo.isGoing).toBeTrue();
    expect(dirInfo.sentido).toBe('VOLTA');
    expect(dirInfo.destination).toBe('Term. São Miguel');
    expect(dirInfo.displayLabel).toBe('1178-10 - Term. São Miguel');

    component.selectedDay = component.getCurrentDayCode();
    horario.days.push(component.selectedDay);
    const blocks = component.getScheduleBlocks();
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].rotaNome).toBe('1178-10 - Term. São Miguel');
    expect(blocks[0].isActiveNow).toBeTrue();
  });

  it('should fall back to full line name when heading cannot be pinpointed', () => {
    const horario: HorarioMotorista = {
      veiculoId: 1,
      veiculoPlaca: 'ABC-1234',
      veiculoModelo: 'Millennium IV',
      rotaId: '1178-10',
      rotaNome: 'Linha 1178 - 10',
      startTime: '06:00',
      endTime: '14:00',
      days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
    };

    component.selectedMotorista = {
      id: '00000000-0000-0000-0003-000000000002',
      nome: 'João Silva',
      cpf: '12345678900',
      cnhNumero: '1234567890',
      cnhValidade: '2028-12-31',
      telefone: '11987654321',
      status: 'INATIVO',
      horarios: [horario],
    };

    // No active trip, no telemetry
    component.viagensAtivasList = [];
    component.veiculosAtivosList = [];

    const dirInfo = component.getCurrentDirectionInfo(horario);
    expect(dirInfo.isGoing).toBeFalse();

    component.selectedDay = component.getCurrentDayCode();
    horario.days.push(component.selectedDay);
    const blocks = component.getScheduleBlocks();
    expect(blocks.length).toBeGreaterThan(0);
    // Should fallback to full line name with proper casing
    expect(blocks[0].rotaNome).toBe('1178-10 - Term. São Miguel - Praça do Correio');
    // Inactive driver without active trip should be inactive (lightish grey)
    expect(blocks[0].isActiveNow).toBeFalse();
  });

  it('should automatically abbreviate route name to compact form on short timeline blocks (duration <= 3 hours)', () => {
    const shortHorario: HorarioMotorista = {
      veiculoId: 1,
      veiculoPlaca: 'ABC-1234',
      veiculoModelo: 'Millennium IV',
      rotaId: '1178-10',
      rotaNome: 'Linha 1178 - 10',
      startTime: '08:00',
      endTime: '10:00', // 2 hours
      days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
    };

    component.selectedMotorista = {
      id: '00000000-0000-0000-0003-000000000002',
      nome: 'João Silva',
      cpf: '12345678900',
      cnhNumero: '1234567890',
      cnhValidade: '2028-12-31',
      telefone: '11987654321',
      status: 'EM ATENDIMENTO',
      horarios: [shortHorario],
    };

    component.viagensAtivasList = [
      {
        id: 1,
        usuarioId: '00000000-0000-0000-0003-000000000002',
        veiculoId: 1,
        veiculoPlaca: 'ABC-1234',
        linhaId: 2,
        linhaCodigo: '1178',
        rotaId: 1,
        sentido: 'IDA',
        dataInicio: new Date().toISOString(),
        status: 'EM_ANDAMENTO',
      },
    ];

    component.selectedDay = component.getCurrentDayCode();
    shortHorario.days.push(component.selectedDay);
    const blocks = component.getScheduleBlocks();
    expect(blocks.length).toBe(1);
    // Because duration is 2 hours (<= 3), Praça is automatically shortened to Pça.
    expect(blocks[0].rotaNome).toBe('1178-10 - Pça. do Correio');
  });
});
