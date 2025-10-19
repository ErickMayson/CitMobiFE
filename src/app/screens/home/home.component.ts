import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  sidebarOpen: boolean = true;
  username: string = 'João';
  companyId: string = '33';
  companyName: string = 'Viação Gato Preto LTDA';
  companyLogo: string = 'assets/viacaoGatoPreto.png';
  showSidebarContent: boolean = false;
  showMainContent: boolean = false;

  // TODO: Criar view e conectar aos endpoints

  // Mock: KPI cards principais
  stats = {
    motoristasAtivos: 124,
    veiculosAtivos: 89,
    rotasEmOperacao: 45,
    coberturaTotal: '12.5K km',
  };

  // Mock: Gráfico de barras - Rotas por dia da semana
  routesByDay = [
    { label: 'Seg', value: 42 },
    { label: 'Ter', value: 38 },
    { label: 'Qua', value: 45 },
    { label: 'Qui', value: 51 },
    { label: 'Sex', value: 48 },
    { label: 'Sáb', value: 32 },
    { label: 'Dom', value: 28 },
  ];

  maxRoutesValue = Math.max(...this.routesByDay.map((d) => d.value));

  // Mock: Status de veículos com porcentagem
  vehicleStatus = [
    { label: 'Em Operação', value: 54, percentage: 61, color: '#00b4d8' },
    { label: 'Disponível', value: 23, percentage: 26, color: '#10b981' },
    { label: 'Manutenção', value: 8, percentage: 9, color: '#f59e0b' },
    { label: 'Indisponível', value: 4, percentage: 4, color: '#ef4444' },
  ];

  // Mock: Distribuição de motoristas por turno
  driversByShift = [
    { label: 'Manhã', value: 52, color: '#00b4d8' },
    { label: 'Tarde', value: 41, color: '#0891b2' },
    { label: 'Noite', value: 31, color: '#0e7490' },
  ];

  // Mock: Feed de atividades recentes do sistema
  recentActivity = [
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

  // Mock: Gráfico de linha - Rotas em operação por hora (24h)
  routesByHour = [
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

  maxRoutesHourValue = Math.max(...this.routesByHour.map((d) => d.value));

  // Mock: Gráfico de barras - Capacidade de passageiros por hora (12h)
  passengerCapacityByHour = [
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

  maxPassengerCapacity = Math.max(
    ...this.passengerCapacityByHour.map((d) => d.value)
  );

  // Mock: Barras horizontais - Veículos por linha de rota
  vehiclesByRoute = [
    { route: 'Linha 001 - Centro/Bairro A', vehicles: 12, color: '#00b4d8' },
    { route: 'Linha 002 - Aeroporto/Centro', vehicles: 8, color: '#0891b2' },
    { route: 'Linha 003 - Zona Norte/Sul', vehicles: 15, color: '#0e7490' },
    { route: 'Linha 004 - Terminal A/B', vehicles: 10, color: '#06b6d4' },
    { route: 'Linha 005 - Circular Centro', vehicles: 6, color: '#0284c7' },
  ];

  maxVehiclesByRoute = Math.max(...this.vehiclesByRoute.map((r) => r.vehicles));

  // Mock: Gráfico de área - Veículos em reserva por hora (12h)
  reserveVehiclesByHour = [
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

  maxReserveVehicles = Math.max(
    ...this.reserveVehiclesByHour.map((d) => d.value)
  );

  // Mock: Veículos em ocorrência por tipo
  vehicleIncidents = [
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

  ngOnInit(): void {
    setTimeout(() => {
      this.showSidebarContent = true;
    }, 200);

    setTimeout(() => {
      this.showMainContent = true;
    }, 400);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  getIncidentTotal(): number {
    return this.vehicleIncidents.reduce(
      (sum, incident) => sum + incident.count,
      0
    );
  }
}
