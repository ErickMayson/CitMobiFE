import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Motorista,
  Linha,
  Veiculo,
  ScheduleBlock,
} from '../../models/veiculo.model';
import { User } from '../../models/userLiteResponse.model';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { VeiculoService } from '../../services/veiculo.service';
import { LoginService } from '../../services/login.service';
import { MotoristaService } from '../../services/motorista.service';
import { LinhaService } from '../../services/linha.service';
import { formatPlate, formatOnlyNumbers } from '../../utils/mask.utils';
import {
  MOCK_MODELS as MODELS,
  MOCK_TYPES as TYPES,
  MOCK_GARAGES as GARAGES,
  MOCK_DROPDOWN_DRIVERS as MOCK_DRIVERS,
  MOCK_DROPDOWN_LINHAS as MOCK_LINHAS,
  ENABLE_DEMO_MOCKUP,
  DEMO_MOCK_VEICULO,
} from '../../mock-data/mock-data';

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './veiculos.component.html',
  styleUrls: ['./veiculos.component.scss'],
})
export class VeiculosComponent implements OnInit {
  sidebarOpen: boolean = true;
  showSidebarContent: boolean = true;
  currentUser: User | null = null;
  companyLogo: string = 'assets/viacaoGatoPreto.png';

  isLoading: boolean = false;
  isLoadingDrivers: boolean = false;
  isLoadingRoutes: boolean = false;
  private driversLoaded: boolean = false;
  private routesLoaded: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';

  veiculos: Veiculo[] = ENABLE_DEMO_MOCKUP ? [DEMO_MOCK_VEICULO] : [];

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

  onPlateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newVeiculo.plate = formatPlate(input.value);
  }

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

  statusOrder = ['ATIVO', 'MANUTENCAO', 'INATIVO', 'SUCATEADO', 'VENDIDO'];
  availableStatuses = ['ATIVO', 'MANUTENCAO', 'INATIVO', 'SUCATEADO', 'VENDIDO'];
  models = MODELS;
  types = TYPES;
  garages = GARAGES;
  mockDrivers: string[] = MOCK_DRIVERS;
  mockRoutes: string[] = MOCK_LINHAS;

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

  constructor(
    private veiculoService: VeiculoService,
    private loginService: LoginService,
    private motoristaService: MotoristaService,
    private linhaService: LinhaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    this.loadVeiculos();
    setTimeout(() => (this.showSidebarContent = true), 100);
  }

  ensureDriversLoaded(): void {
    if (this.driversLoaded) return;
    this.isLoadingDrivers = true;
    this.motoristaService.getMotoristas().subscribe({
      next: (motoristas) => {
        if (motoristas && motoristas.length > 0) {
          this.mockDrivers = motoristas.map((m) => m.nome);
        }
        this.driversLoaded = true;
        this.isLoadingDrivers = false;
      },
      error: () => {
        this.driversLoaded = true;
        this.isLoadingDrivers = false;
      },
    });
  }

  ensureRoutesLoaded(): void {
    if (this.routesLoaded) return;
    this.isLoadingRoutes = true;
    this.linhaService.getLinhas().subscribe({
      next: (linhas) => {
        if (linhas && linhas.length > 0) {
          this.mockRoutes = linhas.map(
            (l) => l.descricao || `${l.codigo} - ${l.partida} / ${l.chegada}`
          );
        }
        this.routesLoaded = true;
        this.isLoadingRoutes = false;
      },
      error: () => {
        this.routesLoaded = true;
        this.isLoadingRoutes = false;
      },
    });
  }

  loadVeiculos(forceRefresh: boolean = false): void {
    this.isLoading = true;
    this.veiculoService.getVeiculos(forceRefresh).subscribe({
      next: (data) => {
        let list = (data || []) as Veiculo[];
        if (ENABLE_DEMO_MOCKUP && !list.some((v) => v.plate === DEMO_MOCK_VEICULO.plate)) {
          list = [DEMO_MOCK_VEICULO as unknown as Veiculo, ...list];
        }
        this.veiculos = list;
        this.sortVeiculos();
        this.isLoading = false;
      },
      error: (err) => {
        if (ENABLE_DEMO_MOCKUP) {
          this.veiculos = [DEMO_MOCK_VEICULO as unknown as Veiculo];
          this.sortVeiculos();
        }
        this.isLoading = false;
        if (err.status === 401 || err.status === 403) {
          this.loginService.logout();
          this.router.navigate(['/login']);
        }
      },
    });
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
      case 'ATIVO':
      case 'EM ATENDIMENTO':
        return 'status-active';
      case 'MANUTENCAO':
      case 'GARAGEM':
        return 'status-maintenance';
      case 'INATIVO':
        return 'status-inactive';
      case 'SUCATEADO':
      case 'RESERVA':
        return 'status-scrapped';
      case 'VENDIDO':
        return 'status-sold';
      default:
        return 'status-inactive';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ATIVO':
      case 'EM ATENDIMENTO':
        return 'Ativo';
      case 'MANUTENCAO':
      case 'GARAGEM':
        return 'Manutenção';
      case 'INATIVO':
        return 'Inativo';
      case 'SUCATEADO':
        return 'Sucateado';
      case 'VENDIDO':
        return 'Vendido';
      case 'RESERVA':
        return 'Reserva';
      default:
        return status;
    }
  }

  // Vehicle CRUD
  openAddModal(): void {
    this.errorMessage = '';
    this.isSaving = false;
    this.newVeiculo = { plate: '', id: '', model: '', type: '', garage: '' };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.errorMessage = '';
    this.isSaving = false;
    this.newVeiculo = { plate: '', id: '', model: '', type: '', garage: '' };
  }

  handleAddVeiculo(): void {
    this.errorMessage = '';
    if (
      !this.newVeiculo.plate ||
      !this.newVeiculo.id ||
      !this.newVeiculo.model ||
      !this.newVeiculo.type ||
      !this.newVeiculo.garage
    ) {
      this.errorMessage = 'Preencha todos os campos do formulário.';
      return;
    }

    const capacityMap: { [key: string]: number } = {
      Básico: 60,
      Padrao: 80,
      Padrão: 80,
      Articulado: 120,
      'Bi-articulado': 180,
      BRT: 160,
    };

    const veiculo: Veiculo = {
      id: this.newVeiculo.id.trim(),
      plate: this.newVeiculo.plate.trim().toUpperCase(),
      model: this.newVeiculo.model,
      type: this.newVeiculo.type,
      garage: this.newVeiculo.garage,
      capacity: capacityMap[this.newVeiculo.type] || 80,
      status: 'ATIVO',
      routes: [],
      drivers: [],
    };


    this.isSaving = true;
    this.veiculoService.addVeiculo(veiculo).subscribe({
      next: () => {
        this.isSaving = false;
        this.loadVeiculos(true);
        this.closeAddModal();
      },
      error: (err) => {
        this.isSaving = false;
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Sessão expirada ou acesso negado. Redirecionando para login...';
          this.loginService.logout();
          this.router.navigate(['/login']);
        } else {
          this.errorMessage =
            err?.error?.message ||
            err?.error?.error ||
            'Erro ao cadastrar veículo no servidor. Verifique os dados e tente novamente.';
        }
      },
    });
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
      this.veiculoService.updateVeiculo(this.selectedVeiculo).subscribe({
        next: () => {
          this.loadVeiculos(true);
          this.closeEditModal();
        },
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            this.loginService.logout();
            this.router.navigate(['/login']);
          }
        },
      });
    }
  }

  handleDeleteVeiculo(event: Event, veiculo: Veiculo): void {
    event.stopPropagation();
    if (confirm(`Deseja realmente inativar/remover o veículo ${veiculo.plate}?`)) {
      this.veiculoService.deleteVeiculo(veiculo.plate).subscribe({
        next: () => {
          this.loadVeiculos(true);
          if (this.selectedVeiculo?.plate === veiculo.plate) {
            this.closeEditModal();
          }
        },
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            this.loginService.logout();
            this.router.navigate(['/login']);
          }
        },
      });
    }
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
    this.ensureDriversLoaded();
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
      this.ensureDriversLoaded();
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
    this.ensureRoutesLoaded();
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
      this.ensureRoutesLoaded();
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
      const newRoute: Linha = {
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

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
