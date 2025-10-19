import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Motorista {
  name: string;
  startTime: string;
  endTime: string;
  days: string[]; // ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM']
}

interface Rota {
  routeName: string;
  startTime: string;
  endTime: string;
  days: string[];
}

interface Veiculo {
  id: string;
  plate: string;
  model: string;
  type: string;
  capacity: number;
  status: 'EM ATENDIMENTO' | 'GARAGEM' | 'RESERVA' | 'INATIVO';
  routes: Rota[];
  drivers: Motorista[];
}

interface TimeSlot {
  hour: number;
  drivers: string[];
  routes: string[];
}

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [CommonModule, FormsModule], // ← Adicione isso
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
      routes: [],
      drivers: [],
    },
  ];

  showAddModal = false;
  showEditModal = false;
  showAddDriverModal = false;
  showAddRouteModal = false;
  selectedVeiculo: Veiculo | null = null;
  selectedDay: string = 'SEG';

  newVeiculo = {
    plate: '',
    id: '',
    model: '',
    type: '',
  };

  // Driver form
  driverForm = {
    name: '',
    startTime: '06:00',
    endTime: '14:00',
    days: [] as string[],
  };

  // Route form
  routeForm = {
    routeName: '',
    startTime: '06:00',
    endTime: '22:00',
    days: [] as string[],
  };

  statusOrder = ['EM ATENDIMENTO', 'GARAGEM', 'RESERVA', 'INATIVO'];
  models = ['Caio Millennium III', 'Apache VIP V'];
  types = ['Básico', 'Padrão', 'Articulado', 'Bi-articulado', 'BRT'];
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
    this.newVeiculo = { plate: '', id: '', model: '', type: '' };
  }

  handleAddVeiculo(): void {
    if (
      this.newVeiculo.plate &&
      this.newVeiculo.id &&
      this.newVeiculo.model &&
      this.newVeiculo.type
    ) {
      const capacityMap: { [key: string]: number } = {
        Básico: 60,
        Padrão: 80,
        Articulado: 120,
        'Bi-articulado': 180,
        BRT: 160,
      };

      const veiculo: Veiculo = {
        ...this.newVeiculo,
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

  // Driver Modal
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

  removeDriver(index: number): void {
    if (this.selectedVeiculo) {
      this.selectedVeiculo.drivers.splice(index, 1);
    }
  }

  // Route Modal
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

  removeRoute(index: number): void {
    if (this.selectedVeiculo) {
      this.selectedVeiculo.routes.splice(index, 1);
    }
  }

  // Schedule visualization
  selectDay(day: string): void {
    this.selectedDay = day;
  }

  getScheduleForDay(): TimeSlot[] {
    if (!this.selectedVeiculo) return [];

    const slots: TimeSlot[] = this.hours.map((hour) => ({
      hour,
      drivers: [],
      routes: [],
    }));

    // Add drivers to slots
    this.selectedVeiculo.drivers
      .filter((d) => d.days.includes(this.selectedDay))
      .forEach((driver) => {
        const start = parseInt(driver.startTime.split(':')[0]);
        const end = parseInt(driver.endTime.split(':')[0]);
        for (let i = start; i < end; i++) {
          slots[i].drivers.push(driver.name);
        }
      });

    // Add routes to slots
    this.selectedVeiculo.routes
      .filter((r) => r.days.includes(this.selectedDay))
      .forEach((route) => {
        const start = parseInt(route.startTime.split(':')[0]);
        const end = parseInt(route.endTime.split(':')[0]);
        for (let i = start; i < end; i++) {
          slots[i].routes.push(route.routeName);
        }
      });

    return slots;
  }

  private sortVeiculos(): void {
    this.veiculos.sort((a, b) => {
      return (
        this.statusOrder.indexOf(a.status) - this.statusOrder.indexOf(b.status)
      );
    });
  }
}
