import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  sidebarOpen: boolean = true;
  username: string = 'João';
  showSidebarContent: boolean = false;
  showMainContent: boolean = false;

  // TODO SUBSTITUIR MOCKS POR API REAL
  stats = {
    motoristasAtivos: 124,
    veiculosAtivos: 89,
    rotasEmOperacao: 45,
    distanciaTotal: '12.5K',
  };

  // Rotas por dia (últimos 7 dias)
  // Criar view e endpoint
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

  // Status dos veículos
  // Criar view e endpoint
  vehicleStatus = [
    {
      label: 'Em Operação',
      value: 54,
      percentage: 61,
      color: '#00b4d8',
    },
    {
      label: 'Disponível',
      value: 23,
      percentage: 26,
      color: '#10b981',
    },
    {
      label: 'Manutenção',
      value: 8,
      percentage: 9,
      color: '#f59e0b',
    },
    {
      label: 'Indisponível',
      value: 4,
      percentage: 4,
      color: '#ef4444',
    },
  ];

  // Motoristas por turno
  // Criar view e endpoint para esses dados
  driversByShift = [
    { label: 'Manhã', value: 52, color: '#00b4d8' },
    { label: 'Tarde', value: 41, color: '#0891b2' },
    { label: 'Noite', value: 31, color: '#0e7490' },
  ];

  // Atividade recente
  // TODO CRIAR ACTIVITYCHART
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

  ngOnInit(): void {
    // Mostra o conteúdo da sidebar com fade in
    setTimeout(() => {
      this.showSidebarContent = true;
    }, 200);

    // Mostra o conteúdo principal com fade in
    setTimeout(() => {
      this.showMainContent = true;
    }, 400);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
