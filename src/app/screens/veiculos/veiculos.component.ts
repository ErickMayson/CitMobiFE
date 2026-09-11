import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  Motorista,
  Linha,
  RouteInterval,
  Veiculo,
  ScheduleBlock,
} from '../../models/veiculo.model';
import { Motorista as MotoristaEntity } from '../../models/motorista.model';
import { User } from '../../models/userLiteResponse.model';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { VeiculoService } from '../../services/veiculo.service';
import { LoginService } from '../../services/login.service';
import { MotoristaService } from '../../services/motorista.service';
import { LinhaService } from '../../services/linha.service';
import { formatPlate, formatOnlyNumbers, abbreviateName, formatCpf } from '../../utils/mask.utils';
import { AbbreviateNamePipe } from '../../pipes/abbreviate-name.pipe';
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
  imports: [CommonModule, FormsModule, SidebarComponent, AbbreviateNamePipe],
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
  selectedDay: string = this.getCurrentDayCode();
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
    days: [] as string[],
    intervals: [{ startTime: '06:00', endTime: '22:00' }] as RouteInterval[],
  };

  statusOrder = ['ATIVO', 'MANUTENCAO', 'INATIVO', 'SUCATEADO', 'VENDIDO'];
  availableStatuses = ['ATIVO', 'MANUTENCAO', 'INATIVO', 'SUCATEADO', 'VENDIDO'];
  models = MODELS;
  types = TYPES;
  garages = GARAGES;
  mockDrivers: string[] = MOCK_DRIVERS;
  mockRoutes: string[] = MOCK_LINHAS;

  availableDrivers: MotoristaEntity[] = [];
  filteredDrivers: MotoristaEntity[] = [];
  isDriverDropdownOpen: boolean = false;

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
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    this.loadVeiculos();
    setTimeout(() => (this.showSidebarContent = true), 100);
  }

  ensureDriversLoaded(): void {
    if (this.driversLoaded && this.availableDrivers.length > 0) {
      this.filterDrivers(this.driverForm.name);
      return;
    }
    this.isLoadingDrivers = true;
    this.motoristaService.getMotoristas().subscribe({
      next: (motoristas) => {
        if (motoristas && motoristas.length > 0) {
          this.availableDrivers = motoristas;
          this.mockDrivers = motoristas.map((m) => m.nome);
        } else {
          this.availableDrivers = this.mockDrivers.map((name, i) => ({
            id: String(i + 1),
            nome: name,
            cpf: '',
            cnhNumero: '',
            cnhValidade: '',
            telefone: '',
            status: 'AGUARDANDO',
            horarios: [],
          }));
        }
        this.filterDrivers(this.driverForm.name);
        this.driversLoaded = true;
        this.isLoadingDrivers = false;
      },
      error: () => {
        this.availableDrivers = this.mockDrivers.map((name, i) => ({
          id: String(i + 1),
          nome: name,
          cpf: '',
          cnhNumero: '',
          cnhValidade: '',
          telefone: '',
          status: 'AGUARDANDO',
          horarios: [],
        }));
        this.filterDrivers(this.driverForm.name);
        this.driversLoaded = true;
        this.isLoadingDrivers = false;
      },
    });
  }

  onDriverInputFocus(): void {
    this.ensureDriversLoaded();
    this.isDriverDropdownOpen = true;
    this.filterDrivers(this.driverForm.name);
  }

  onDriverInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.driverForm.name = input.value;
    this.ensureDriversLoaded();
    this.isDriverDropdownOpen = true;
    this.filterDrivers(input.value);
  }

  onDriverInputBlur(): void {
    setTimeout(() => {
      this.isDriverDropdownOpen = false;
    }, 200);
  }

  selectDriver(driver: MotoristaEntity): void {
    this.driverForm.name = driver.nome;
    this.isDriverDropdownOpen = false;
  }

  filterDrivers(term?: string): void {
    const query = (term !== undefined ? term : this.driverForm.name || '').trim().toLowerCase();
    if (!query) {
      this.filteredDrivers = [...this.availableDrivers];
      return;
    }

    const normalizedQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    this.filteredDrivers = this.availableDrivers.filter((driver) => {
      const normName = (driver.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normCpf = (driver.cpf || '').replace(/\D/g, '');
      const cleanDigits = query.replace(/\D/g, '');

      const matchesName = normName.includes(normalizedQuery);
      const matchesCpf = cleanDigits.length > 0 && normCpf.includes(cleanDigits);

      return matchesName || matchesCpf;
    });
  }

  formatCpf(cpf: string): string {
    return formatCpf(cpf);
  }

  getInitials(name: string): string {
    if (!name) return 'M';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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

  checkQueryParamsForSelection(): void {
    this.route.queryParams.subscribe((params) => {
      const targetPlate = params['plate'] || params['placa'] || params['search'];
      if (targetPlate && this.veiculos.length > 0) {
        const cleanTarget = targetPlate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const found = this.veiculos.find(
          (v) => v.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanTarget
        );
        if (found) {
          setTimeout(() => this.openEditModal(found), 150);
        }
      }
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
        list = list.map((v) => ({
          ...v,
          routes: this.consolidateVehicleRoutes(v.routes || []),
        }));
        this.veiculos = list;
        this.sortVeiculos();
        this.isLoading = false;
        this.checkQueryParamsForSelection();
      },
      error: (err) => {
        if (ENABLE_DEMO_MOCKUP) {
          this.veiculos = [DEMO_MOCK_VEICULO as unknown as Veiculo];
          this.sortVeiculos();
          this.checkQueryParamsForSelection();
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

  getVehicleStatusColor(veiculo: Veiculo): string {
    if (veiculo.status === 'ATIVO') {
      const routesCount = veiculo.routes?.length || 0;
      const driversCount = veiculo.drivers?.length || 0;
      if (routesCount > 0 && driversCount > 0) {
        return 'status-active'; // Green: Em Operação
      } else if (routesCount > 0 && driversCount === 0) {
        return 'status-waiting'; // Amber: Aguardando Motorista
      } else {
        return 'status-reserve'; // Blue: Reserva / Disponível
      }
    }
    return this.getStatusColor(veiculo.status);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ATIVO':
        return 'Ativo';
      case 'MANUTENCAO':
        return 'Manutenção';
      case 'INATIVO':
        return 'Inativo';
      case 'SUCATEADO':
        return 'Sucateado';
      case 'VENDIDO':
        return 'Vendido';
      default:
        return status;
    }
  }

  getVehicleStatusLabel(veiculo: Veiculo): string {
    if (veiculo.status === 'ATIVO') {
      const routesCount = veiculo.routes?.length || 0;
      const driversCount = veiculo.drivers?.length || 0;
      if (routesCount > 0 && driversCount > 0) {
        return 'Em Operação';
      } else if (routesCount > 0 && driversCount === 0) {
        return '⚠️ Aguardando Motorista';
      } else {
        return 'Reserva / Na Garagem';
      }
    }
    return this.getStatusLabel(veiculo.status);
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

  getCurrentDayCode(): string {
    const dayMap: { [key: number]: string } = {
      0: 'DOM',
      1: 'SEG',
      2: 'TER',
      3: 'QUA',
      4: 'QUI',
      5: 'SEX',
      6: 'SAB',
    };
    return dayMap[new Date().getDay()] || 'SEG';
  }

  openEditModal(veiculo: Veiculo): void {
    this.selectedVeiculo = JSON.parse(JSON.stringify(veiculo));
    if (this.selectedVeiculo && this.selectedVeiculo.routes) {
      this.selectedVeiculo.routes = this.consolidateVehicleRoutes(this.selectedVeiculo.routes);
    }
    this.showEditModal = true;
    this.selectedDay = this.getCurrentDayCode();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedVeiculo = null;
  }

  handleSaveEdit(): void {
    if (this.selectedVeiculo) {
      this.isSaving = true;
      this.veiculoService.updateVeiculo(this.selectedVeiculo).subscribe({
        next: () => {
          this.isSaving = false;
          this.loadVeiculos(true);
          this.closeEditModal();
        },
        error: (err) => {
          this.isSaving = false;
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

  // Route Interval Management
  addRouteInterval(): void {
    const last = this.routeForm.intervals[this.routeForm.intervals.length - 1];
    let defaultStart = '06:00';
    let defaultEnd = '14:00';
    if (last && last.endTime) {
      const endHour = parseInt(last.endTime.split(':')[0], 10);
      const nextStart = Math.min(23, endHour + 2);
      const nextEnd = Math.min(23, nextStart + 4);
      defaultStart = `${String(nextStart).padStart(2, '0')}:00`;
      defaultEnd = `${String(nextEnd).padStart(2, '0')}:00`;
    }
    this.routeForm.intervals.push({ startTime: defaultStart, endTime: defaultEnd });
  }

  removeRouteInterval(index: number): void {
    if (this.routeForm.intervals.length > 1) {
      this.routeForm.intervals.splice(index, 1);
    }
  }

  formatRouteIntervals(route: Linha): string {
    if (route.intervals && route.intervals.length > 0) {
      return route.intervals.map((i) => `${i.startTime} - ${i.endTime}`).join(' / ');
    }
    if (route.startTime && route.endTime) {
      return `${route.startTime} - ${route.endTime}`;
    }
    return 'Horário não definido';
  }

  consolidateVehicleRoutes(routes: Linha[]): Linha[] {
    if (!routes || routes.length === 0) return [];
    const map = new Map<string, Linha>();

    for (const r of routes) {
      const key = (r.routeName || '').trim().toLowerCase();
      if (!map.has(key)) {
        const intervals: RouteInterval[] = [];
        if (r.intervals && r.intervals.length > 0) {
          intervals.push(...r.intervals);
        } else if (r.startTime && r.endTime) {
          intervals.push({ startTime: r.startTime, endTime: r.endTime });
        }
        map.set(key, {
          routeName: r.routeName,
          days: [...(r.days || [])],
          intervals: intervals.length > 0 ? intervals : [{ startTime: '06:00', endTime: '22:00' }],
          startTime: intervals[0]?.startTime || r.startTime || '06:00',
          endTime: intervals[intervals.length - 1]?.endTime || r.endTime || '22:00',
        });
      } else {
        const existing = map.get(key)!;
        const combinedDays = Array.from(new Set([...existing.days, ...(r.days || [])]));
        existing.days = combinedDays;
        const intervals = existing.intervals || [];
        if (r.intervals && r.intervals.length > 0) {
          intervals.push(...r.intervals);
        } else if (r.startTime && r.endTime) {
          intervals.push({ startTime: r.startTime, endTime: r.endTime });
        }
        existing.intervals = intervals;
      }
    }
    return Array.from(map.values());
  }

  // Route CRUD
  openAddRouteModal(): void {
    this.routeForm = {
      routeName: '',
      days: [],
      intervals: [{ startTime: '06:00', endTime: '22:00' }],
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
      let intervals: RouteInterval[] = [];
      if (route.intervals && route.intervals.length > 0) {
        intervals = route.intervals.map((i) => ({ ...i }));
      } else if (route.startTime && route.endTime) {
        intervals = [{ startTime: route.startTime, endTime: route.endTime }];
      } else {
        intervals = [{ startTime: '06:00', endTime: '22:00' }];
      }
      this.routeForm = {
        routeName: route.routeName,
        days: [...route.days],
        intervals: intervals,
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
      this.routeForm.intervals.length > 0 &&
      this.routeForm.days.length > 0
    ) {
      const validIntervals = this.routeForm.intervals.filter((i) => i.startTime && i.endTime);
      if (validIntervals.length === 0) return;

      const newRoute: Linha = {
        routeName: this.routeForm.routeName,
        startTime: validIntervals[0].startTime,
        endTime: validIntervals[validIntervals.length - 1].endTime,
        intervals: validIntervals,
        days: [...this.routeForm.days],
      };

      const existingIdx = this.selectedVeiculo.routes.findIndex(
        (r) => r.routeName.trim().toLowerCase() === newRoute.routeName.trim().toLowerCase()
      );
      if (existingIdx >= 0) {
        const existing = this.selectedVeiculo.routes[existingIdx];
        const combinedDays = Array.from(new Set([...existing.days, ...newRoute.days]));
        const combinedIntervals = [
          ...(existing.intervals || [
            { startTime: existing.startTime || '06:00', endTime: existing.endTime || '22:00' },
          ]),
          ...newRoute.intervals!,
        ];
        this.selectedVeiculo.routes[existingIdx] = {
          ...existing,
          days: combinedDays,
          intervals: combinedIntervals,
        };
      } else {
        this.selectedVeiculo.routes.push(newRoute);
      }

      this.closeAddRouteModal();
    }
  }

  handleEditRoute(): void {
    if (
      this.selectedVeiculo &&
      this.editingRouteIndex >= 0 &&
      this.routeForm.routeName &&
      this.routeForm.intervals.length > 0 &&
      this.routeForm.days.length > 0
    ) {
      const validIntervals = this.routeForm.intervals.filter((i) => i.startTime && i.endTime);
      if (validIntervals.length === 0) return;

      this.selectedVeiculo.routes[this.editingRouteIndex] = {
        routeName: this.routeForm.routeName,
        startTime: validIntervals[0].startTime,
        endTime: validIntervals[validIntervals.length - 1].endTime,
        intervals: validIntervals,
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

  getDriverScheduleBlocks(): ScheduleBlock[] {
    if (!this.selectedVeiculo || !this.selectedVeiculo.drivers) return [];

    const dayMap: { [key: number]: string } = {
      0: 'DOM',
      1: 'SEG',
      2: 'TER',
      3: 'QUA',
      4: 'QUI',
      5: 'SEX',
      6: 'SAB',
    };
    const now = new Date();
    const currentDayCode = dayMap[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isViewingToday = this.selectedDay === currentDayCode;

    const blocks: ScheduleBlock[] = [];

    this.selectedVeiculo.drivers
      .filter((d) => d.days && d.days.includes(this.selectedDay))
      .forEach((driver) => {
        const start = parseInt(driver.startTime.split(':')[0], 10);
        const end = parseInt(driver.endTime.split(':')[0], 10);
        const duration = Math.max(1, end - start);

        const startMin = start * 60;
        const endMin = end * 60;
        const isActiveNow =
          isViewingToday &&
          currentMinutes >= startMin &&
          currentMinutes < endMin &&
          !!driver.name &&
          driver.name !== 'Desconhecido';

        const driverName =
          driver.name && driver.name !== 'Desconhecido'
            ? driver.name
            : 'Vago / Aguardando Motorista';

        const tooltip = isActiveNow
          ? `${driverName} — Dirigindo este veículo no momento (${driver.startTime} - ${driver.endTime})`
          : `${driverName} — Não está dirigindo esse veículo no momento (${driver.startTime} - ${driver.endTime})`;

        blocks.push({
          type: 'driver',
          name: driver.name,
          start,
          end,
          duration,
          isActiveNow,
          tooltip,
        });
      });

    return blocks;
  }

  getRouteScheduleBlocks(): ScheduleBlock[] {
    if (!this.selectedVeiculo || !this.selectedVeiculo.routes) return [];

    const dayMap: { [key: number]: string } = {
      0: 'DOM',
      1: 'SEG',
      2: 'TER',
      3: 'QUA',
      4: 'QUI',
      5: 'SEX',
      6: 'SAB',
    };
    const now = new Date();
    const currentDayCode = dayMap[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isViewingToday = this.selectedDay === currentDayCode;

    // 1. Filter routes for the selected day and extract all intervals as discrete blocks
    const rawBlocks: { name: string; start: number; end: number; rawStart: string; rawEnd: string }[] = [];
    this.selectedVeiculo.routes
      .filter((r) => r.days && r.days.includes(this.selectedDay))
      .forEach((route) => {
        if (route.intervals && route.intervals.length > 0) {
          route.intervals.forEach((interval) => {
            const start = parseInt(interval.startTime.split(':')[0], 10);
            const end = parseInt(interval.endTime.split(':')[0], 10);
            rawBlocks.push({
              name: route.routeName,
              start,
              end,
              rawStart: interval.startTime,
              rawEnd: interval.endTime,
            });
          });
        } else if (route.startTime && route.endTime) {
          const start = parseInt(route.startTime.split(':')[0], 10);
          const end = parseInt(route.endTime.split(':')[0], 10);
          rawBlocks.push({
            name: route.routeName,
            start,
            end,
            rawStart: route.startTime,
            rawEnd: route.endTime,
          });
        }
      });

    // 2. Sort by start time
    rawBlocks.sort((a, b) => a.start - b.start);

    // 3. Merge contiguous / adjacent segments with the same route name (only if overlapping or adjacent, preserving gaps)
    const merged: { name: string; start: number; end: number; rawStart: string; rawEnd: string }[] = [];
    for (const b of rawBlocks) {
      if (merged.length === 0) {
        merged.push({ ...b });
      } else {
        const prev = merged[merged.length - 1];
        if (prev.name.trim() === b.name.trim() && b.start <= prev.end) {
          prev.end = Math.max(prev.end, b.end);
          prev.rawEnd = b.rawEnd;
        } else {
          merged.push({ ...b });
        }
      }
    }

    // 4. Check if any route is active right now on this day
    const hasAnyActiveRoute =
      isViewingToday &&
      merged.some((m) => currentMinutes >= m.start * 60 && currentMinutes < m.end * 60);

    // 5. Map to ScheduleBlock with active status and tooltips
    return merged.map((m) => {
      const duration = Math.max(1, m.end - m.start);
      const isActiveNow =
        isViewingToday &&
        currentMinutes >= m.start * 60 &&
        currentMinutes < m.end * 60;

      let tooltip = '';
      if (isActiveNow) {
        tooltip = `${m.name} — Operando nesta linha no momento (${m.rawStart || m.start + ':00'} - ${m.rawEnd || m.end + ':00'})`;
      } else if (hasAnyActiveRoute) {
        tooltip = `${m.name} — Operando em outra linha no momento (${m.rawStart || m.start + ':00'} - ${m.rawEnd || m.end + ':00'})`;
      } else {
        tooltip = `${m.name} — Não está operando nesta linha no momento (${m.rawStart || m.start + ':00'} - ${m.rawEnd || m.end + ':00'})`;
      }

      return {
        type: 'route',
        name: m.name,
        start: m.start,
        end: m.end,
        duration,
        isActiveNow,
        tooltip,
      };
    });
  }

  getScheduleBlocks(type?: 'driver' | 'route'): ScheduleBlock[] {
    if (type === 'driver') return this.getDriverScheduleBlocks();
    if (type === 'route') return this.getRouteScheduleBlocks();
    return [...this.getDriverScheduleBlocks(), ...this.getRouteScheduleBlocks()];
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
