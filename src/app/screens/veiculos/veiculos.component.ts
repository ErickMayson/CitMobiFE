import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Motorista,
  Rota,
  Veiculo,
  ScheduleBlock,
} from '../../models/veiculo.model';

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './veiculos.component.html',
  styleUrls: ['./veiculos.component.scss'],
})
export class VeiculosComponent implements OnInit {
  veiculos: Veiculo[] = [
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

  showAddModal = false;
  showEditModal = false;
  showAddDriverModal = false;
  showAddRouteModal = false;
  showEditDriverModal = false;
  showEditRouteModal = false;
  selectedVeiculo: Veiculo | null = null;
  selectedDay: string = 'SEG';
  editingDriverIndex: number = -1;
  editingRouteIndex: number = -1;

  newVeiculo = {
    plate: '',
    id: '',
    model: '',
    type: '',
    garage: '',
  };

  driverForm = {
    name: '',
    startTime: '06:00',
    endTime: '14:00',
    days: [] as string[],
  };

  routeForm = {
    routeName: '',
    startTime: '06:00',
    endTime: '22:00',
    days: [] as string[],
  };

  statusOrder = ['EM ATENDIMENTO', 'GARAGEM', 'RESERVA', 'INATIVO'];
  models = ['Caio Millennium III', 'Apache VIP V'];
  types = ['Básico', 'Padrão', 'Articulado', 'Bi-articulado', 'BRT'];
  garages = [
    'Garagem Central',
    'Garagem Norte',
    'Garagem Sul',
    'Garagem Leste',
    'Garagem Oeste',
  ];
  mockDrivers = [
    'João Silva',
    'Maria Santos',
    'Pedro Oliveira',
    'Ana Costa',
    'Carlos Souza',
  ];
  mockRoutes = [
    'Linha 100 - Centro/Bairro',
    'Linha 200 - Expresso',
    'Linha 300 - Circular',
    'Linha 400 - Terminal',
  ];

  daysOfWeek = [
    { code: 'SEG', label: 'Seg' },
    { code: 'TER', label: 'Ter' },
    { code: 'QUA', label: 'Qua' },
    { code: 'QUI', label: 'Qui' },
    { code: 'SEX', label: 'Sex' },
    { code: 'SAB', label: 'Sáb' },
    { code: 'DOM', label: 'Dom' },
  ];

  hours = Array.from({ length: 24 }, (_, i) => i);

  ngOnInit(): void {
    this.sortVeiculos();
  }

  get sortedVeiculos(): Veiculo[] {
    return [...this.veiculos].sort((a, b) => {
      return (
        this.statusOrder.indexOf(a.status) - this.statusOrder.indexOf(b.status)
      );
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'EM ATENDIMENTO':
        return 'status-active';
      case 'GARAGEM':
        return 'status-garage';
      case 'RESERVA':
        return 'status-reserve';
      case 'INATIVO':
        return 'status-inactive';
      default:
        return 'status-inactive';
    }
  }

  // Vehicle CRUD
  openAddModal(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.newVeiculo = { plate: '', id: '', model: '', type: '', garage: '' };
  }

  handleAddVeiculo(): void {
    if (
      this.newVeiculo.plate &&
      this.newVeiculo.id &&
      this.newVeiculo.model &&
      this.newVeiculo.type &&
      this.newVeiculo.garage
    ) {
      const capacityMap: { [key: string]: number } = {
        Básico: 60,
        Padrão: 80,
        Articulado: 120,
        'Bi-articulado': 180,
        BRT: 160,
      };

      const veiculo: Veiculo = {
        id: this.newVeiculo.id,
        plate: this.newVeiculo.plate,
        model: this.newVeiculo.model,
        type: this.newVeiculo.type,
        garage: this.newVeiculo.garage,
        capacity: capacityMap[this.newVeiculo.type],
        status: 'GARAGEM',
        routes: [],
        drivers: [],
      };

      this.veiculos.push(veiculo);
      this.closeAddModal();
    }
  }

  openEditModal(veiculo: Veiculo): void {
    this.selectedVeiculo = JSON.parse(JSON.stringify(veiculo));
    this.showEditModal = true;
    this.selectedDay = 'SEG';
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedVeiculo = null;
  }

  handleSaveEdit(): void {
    if (this.selectedVeiculo) {
      const index = this.veiculos.findIndex(
        (v) => v.id === this.selectedVeiculo!.id
      );
      if (index !== -1) {
        this.veiculos[index] = this.selectedVeiculo;
      }
    }
    this.closeEditModal();
  }

  // Driver CRUD
  openAddDriverModal(): void {
    this.driverForm = {
      name: '',
      startTime: '06:00',
      endTime: '14:00',
      days: [],
    };
    this.showAddDriverModal = true;
  }

  closeAddDriverModal(): void {
    this.showAddDriverModal = false;
  }

  openEditDriverModal(index: number): void {
    const driver = this.selectedVeiculo?.drivers[index];
    if (driver) {
      this.driverForm = {
        name: driver.name,
        startTime: driver.startTime,
        endTime: driver.endTime,
        days: [...driver.days],
      };
      this.editingDriverIndex = index;
      this.showEditDriverModal = true;
    }
  }

  closeEditDriverModal(): void {
    this.showEditDriverModal = false;
    this.editingDriverIndex = -1;
  }

  toggleDriverDay(day: string): void {
    const index = this.driverForm.days.indexOf(day);
    if (index > -1) {
      this.driverForm.days.splice(index, 1);
    } else {
      this.driverForm.days.push(day);
    }
  }

  isDriverDaySelected(day: string): boolean {
    return this.driverForm.days.includes(day);
  }

  handleAddDriver(): void {
    if (
      this.selectedVeiculo &&
      this.driverForm.name &&
      this.driverForm.startTime &&
      this.driverForm.endTime &&
      this.driverForm.days.length > 0
    ) {
      const newDriver: Motorista = {
        name: this.driverForm.name,
        startTime: this.driverForm.startTime,
        endTime: this.driverForm.endTime,
        days: [...this.driverForm.days],
      };
      this.selectedVeiculo.drivers.push(newDriver);
      this.closeAddDriverModal();
    }
  }

  handleEditDriver(): void {
    if (
      this.selectedVeiculo &&
      this.editingDriverIndex >= 0 &&
      this.driverForm.name &&
      this.driverForm.startTime &&
      this.driverForm.endTime &&
      this.driverForm.days.length > 0
    ) {
      this.selectedVeiculo.drivers[this.editingDriverIndex] = {
        name: this.driverForm.name,
        startTime: this.driverForm.startTime,
        endTime: this.driverForm.endTime,
        days: [...this.driverForm.days],
      };
      this.closeEditDriverModal();
    }
  }

  removeDriver(index: number): void {
    if (this.selectedVeiculo) {
      this.selectedVeiculo.drivers.splice(index, 1);
    }
  }

  // Route CRUD
  openAddRouteModal(): void {
    this.routeForm = {
      routeName: '',
      startTime: '06:00',
      endTime: '22:00',
      days: [],
    };
    this.showAddRouteModal = true;
  }

  closeAddRouteModal(): void {
    this.showAddRouteModal = false;
  }

  openEditRouteModal(index: number): void {
    const route = this.selectedVeiculo?.routes[index];
    if (route) {
      this.routeForm = {
        routeName: route.routeName,
        startTime: route.startTime,
        endTime: route.endTime,
        days: [...route.days],
      };
      this.editingRouteIndex = index;
      this.showEditRouteModal = true;
    }
  }

  closeEditRouteModal(): void {
    this.showEditRouteModal = false;
    this.editingRouteIndex = -1;
  }

  toggleRouteDay(day: string): void {
    const index = this.routeForm.days.indexOf(day);
    if (index > -1) {
      this.routeForm.days.splice(index, 1);
    } else {
      this.routeForm.days.push(day);
    }
  }

  isRouteDaySelected(day: string): boolean {
    return this.routeForm.days.includes(day);
  }

  handleAddRoute(): void {
    if (
      this.selectedVeiculo &&
      this.routeForm.routeName &&
      this.routeForm.startTime &&
      this.routeForm.endTime &&
      this.routeForm.days.length > 0
    ) {
      const newRoute: Rota = {
        routeName: this.routeForm.routeName,
        startTime: this.routeForm.startTime,
        endTime: this.routeForm.endTime,
        days: [...this.routeForm.days],
      };
      this.selectedVeiculo.routes.push(newRoute);
      this.closeAddRouteModal();
    }
  }

  handleEditRoute(): void {
    if (
      this.selectedVeiculo &&
      this.editingRouteIndex >= 0 &&
      this.routeForm.routeName &&
      this.routeForm.startTime &&
      this.routeForm.endTime &&
      this.routeForm.days.length > 0
    ) {
      this.selectedVeiculo.routes[this.editingRouteIndex] = {
        routeName: this.routeForm.routeName,
        startTime: this.routeForm.startTime,
        endTime: this.routeForm.endTime,
        days: [...this.routeForm.days],
      };
      this.closeEditRouteModal();
    }
  }

  removeRoute(index: number): void {
    if (this.selectedVeiculo) {
      this.selectedVeiculo.routes.splice(index, 1);
    }
  }

  // Schedule visualization
  selectDay(day: string): void {
    this.selectedDay = day;
  }

  getScheduleBlocks(): ScheduleBlock[] {
    if (!this.selectedVeiculo) return [];

    const blocks: ScheduleBlock[] = [];

    // Add driver blocks
    this.selectedVeiculo.drivers
      .filter((d) => d.days.includes(this.selectedDay))
      .forEach((driver) => {
        const start = parseInt(driver.startTime.split(':')[0]);
        const end = parseInt(driver.endTime.split(':')[0]);
        blocks.push({
          type: 'driver',
          name: driver.name,
          start,
          end,
          duration: end - start,
        });
      });

    // Add route blocks
    this.selectedVeiculo.routes
      .filter((r) => r.days.includes(this.selectedDay))
      .forEach((route) => {
        const start = parseInt(route.startTime.split(':')[0]);
        const end = parseInt(route.endTime.split(':')[0]);
        blocks.push({
          type: 'route',
          name: route.routeName,
          start,
          end,
          duration: end - start,
        });
      });

    return blocks;
  }

  getBlockPosition(start: number): string {
    return `${(start / 24) * 100}%`;
  }

  getBlockWidth(duration: number): string {
    return `${(duration / 24) * 100}%`;
  }

  private sortVeiculos(): void {
    this.veiculos.sort((a, b) => {
      return (
        this.statusOrder.indexOf(a.status) - this.statusOrder.indexOf(b.status)
      );
    });
  }
}
