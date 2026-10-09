import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy, NgZone, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { User } from '../../models/userLiteResponse.model';
import { LoginService } from '../../services/login.service';
import { LinhaService, LinhaDetails, LinhaAssignedVehicle } from '../../services/linha.service';
import { Endereco } from '../../models/endereco.model';
import { GoogleMapsService, RouteCalculationResult } from '../../services/google-maps.service';
import { ComponentCanDeactivate } from '../../guards/pending-changes.guard';
import { TelemetriaService } from '../../services/telemetria.service';
import { TelemetriaVeiculo } from '../../models/telemetria.model';

declare const google: any;

export interface LinhaTag {
  label: string;
  type: 'danger' | 'warning' | 'info' | 'amber' | 'success';
  icon: string;
  tooltip?: string;
}

export interface ChecklogItem {
  id: string;
  type: 'added' | 'removed' | 'reordered' | 'prefix';
  title: string;
  detail: string;
  badge: string;
  color: 'green' | 'red' | 'blue' | 'amber';
  oldIndex?: number;
  newIndex?: number;
}

@Component({
  selector: 'app-rotas',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './rotas.component.html',
  styleUrls: ['./rotas.component.scss'],
})
export class RotasComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  // Sidebar
  sidebarOpen: boolean = true;
  showSidebarContent: boolean = true;
  currentUser: User | null = null;
  companyLogo: string = 'assets/viacaoGatoPreto.png';

  // Google Maps State
  isMapLoading: boolean = false;
  isMapInitialized: boolean = false;
  isCalculatingRoute: boolean = false;
  hasGoogleMapsApiKey: boolean = false;
  routeMetrics: RouteCalculationResult | null = null;
  private map: any = null;
  private routePolyline: any = null;
  private mapMarkers: any[] = [];
  private autocomplete: any = null;
  private routeUpdateSubject = new Subject<boolean>();
  private routeSubscription?: Subscription;
  showParadasMarkers: boolean = true;

  // Loading States
  isLoadingLinhas: boolean = false;
  isLoadingParadas: boolean = false;

  // Wizard and View Navigation State
  activeStep: 'list' | 'create_linha' | 'edit_itinerary' = 'list';
  itineraryMode: 'view' | 'edit' = 'view';
  showLinhaDetailsModal: boolean = false;
  showConfirmationModal: boolean = false;

  linhasAtivas: LinhaDetails[] = [];
  linhasInativas: LinhaDetails[] = [];
  selectedLinha: LinhaDetails | null = null;

  // Search & Filter state for Linhas em Operação & Linhas Inativas
  searchQueryAtivas: string = '';
  isSearchAtivasOpen: boolean = false;
  selectedTagAtivas: string = '';

  searchQueryInativas: string = '';
  isSearchInativasOpen: boolean = false;
  selectedTagInativas: string = '';

  // Step 1: Linha Form Values
  linhaForm = {
    codigo: '',
    atendimento: '10',
    partida: '',
    chegada: '',
    descricao: '',
  };

  // Step 2 & 3: Itinerary Form State
  itineraryForm = {
    sentido: 'IDA' as 'IDA' | 'VOLTA',
    prefixo: '',
  };
  enderecos: Endereco[] = [];
  searchQuery: string = '';
  filteredParadas: any[] = [];
  filteredItineraryStops: { endereco: Endereco; index: number }[] = [];
  googlePredictions: any[] = [];
  isLoadingPredictions: boolean = false;
  todasAsParadas: any[] = [];
  showParadasDropdown: boolean = false;
  draggedIndex: number | null = null;
  dragOverIndex: number | null = null;
  dropPosition: 'above' | 'below' | null = null;
  hasSelectedElementOnMap: boolean = false;
  currentInfoWindow: any = null;
  private searchDebounceTimeout: any = null;

  // Tracked Vehicles Telemetry State
  trackedVehicles: TelemetriaVeiculo[] = [];
  private vehicleMarkers: any[] = [];
  private telemetryInterval: any = null;

  // Checklog and Session Snapshot State
  initialSessionSnapshot: {
    prefixo: string;
    enderecos: Endereco[];
    rotaId?: number;
    itinerarioId?: number;
  } | null = null;
  currentRotaId?: number;
  currentItinerarioId?: number;
  currentChecklog: ChecklogItem[] = [];

  // Modals and Save Animation States
  showSaveModal: boolean = false;
  showUnsavedWarningModal: boolean = false;
  isSavingItinerary: boolean = false;
  saveSuccessState: boolean = false;
  saveErrorMessage: string = '';
  private pendingDeactivateResolver: ((allow: boolean) => void) | null = null;

  get addedStopsCount(): number {
    return this.currentChecklog.filter((i) => i.type === 'added').length;
  }

  get removedStopsCount(): number {
    return this.currentChecklog.filter((i) => i.type === 'removed').length;
  }

  get reorderedStopsCount(): number {
    return this.currentChecklog.filter((i) => i.type === 'reordered').length;
  }

  get totalAlterationsCount(): number {
    return this.currentChecklog.length;
  }

  constructor(
    private loginService: LoginService,
    private linhaService: LinhaService,
    private telemetriaService: TelemetriaService,
    private router: Router,
    private route: ActivatedRoute,
    private googleMapsService: GoogleMapsService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    this.hasGoogleMapsApiKey = this.googleMapsService.hasApiKey();
    this.loadLinhas();
    setTimeout(() => (this.showSidebarContent = true), 100);

    // Setup debounced route calculation to prevent excessive Google Directions API calls
    this.routeSubscription = this.routeUpdateSubject
      .pipe(debounceTime(800))
      .subscribe(() => {
        this.executeRouteCalculation();
      });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    this.stopTelemetryPolling();
    this.cleanupVehicleMarkers();
    this.cleanupMap();
  }

  getLinhaStatusLabel(linha: LinhaDetails): string {
    if (linha.status === 'inativa') {
      return 'INATIVA';
    }

    const hasIda = !!linha.rotas?.ida && (linha.rotas.ida.enderecos?.length ?? 0) > 0;
    const hasVolta = !!linha.rotas?.volta && (linha.rotas.volta.enderecos?.length ?? 0) > 0;

    // 1. Check Itineraries
    if (!hasIda && !hasVolta) {
      return 'AGUARDANDO ITINERARIOS';
    }
    if (!hasIda && hasVolta) {
      return 'AGUARDANDO ITINERARIO (IDA)';
    }
    if (hasIda && !hasVolta) {
      return 'AGUARDANDO ITINERARIO (VOLTA)';
    }

    // 2. Check Vehicles
    const vehiclesCount = linha.assignedVehicles?.length || 0;
    if (vehiclesCount === 0) {
      return 'AGUARDANDO VEICULOS';
    }

    // 3. Check Drivers
    const hasPendingDrivers = linha.assignedVehicles?.some((v) => !v.hasDriver || v.pendingDrivers);
    const totalDrivers = linha.assignedVehicles?.reduce((acc, v) => acc + v.driverCount, 0) || 0;

    if (totalDrivers === 0 || hasPendingDrivers) {
      return 'AGUARDANDO MOTORISTAS';
    }

    // 4. Truly active
    return 'ATIVA';
  }

  getLinhaStatusClass(linha: LinhaDetails): string {
    const label = this.getLinhaStatusLabel(linha);
    switch (label) {
      case 'AGUARDANDO ITINERARIOS':
        return 'status-danger';
      case 'AGUARDANDO ITINERARIO (IDA)':
      case 'AGUARDANDO ITINERARIO(IDA)':
      case 'AGUARDANDO ITINERARIO (VOLTA)':
      case 'AGUARDANDO ITINERARIO(VOLTA)':
        return 'status-warning';
      case 'AGUARDANDO VEICULOS':
        return 'status-info';
      case 'AGUARDANDO MOTORISTAS':
        return 'status-amber';
      case 'ATIVA':
        return 'status-active';
      case 'INATIVA':
      default:
        return 'status-inactive';
    }
  }

  getTotalDrivers(linha: LinhaDetails): number {
    return (linha.assignedVehicles || []).reduce((acc, v) => acc + (v.driverCount || 0), 0);
  }

  showGeneralFleetDetails: boolean = false;
  showIdaFleetDetails: boolean = false;
  showVoltaFleetDetails: boolean = false;

  toggleGeneralFleet(): void {
    this.showGeneralFleetDetails = !this.showGeneralFleetDetails;
  }

  toggleIdaFleet(): void {
    this.showIdaFleetDetails = !this.showIdaFleetDetails;
  }

  toggleVoltaFleet(): void {
    this.showVoltaFleetDetails = !this.showVoltaFleetDetails;
  }

  getVehiclesBySentido(linha: LinhaDetails | null, sentido: 'IDA' | 'VOLTA'): LinhaAssignedVehicle[] {
    if (!linha || !linha.assignedVehicles) return [];
    return linha.assignedVehicles.filter((v) => v.sentido === sentido);
  }

  getVehicleTypesSummary(linha: LinhaDetails | null): string {
    if (!linha || !linha.assignedVehicles || linha.assignedVehicles.length === 0) return 'Nenhum veículo alocado';
    const types = Array.from(new Set(linha.assignedVehicles.map((v) => v.type || v.model)));
    return types.join(', ');
  }

  hasPendingDrivers(linha: LinhaDetails): boolean {
    if (!linha.assignedVehicles || linha.assignedVehicles.length === 0) return false;
    return linha.assignedVehicles.some((v) => !v.hasDriver || v.pendingDrivers);
  }

  getPlatesList(linha: LinhaDetails): string {
    if (!linha.assignedVehicles || linha.assignedVehicles.length === 0) return 'Nenhum';
    return linha.assignedVehicles.map((v) => v.plate).join(', ');
  }

  getDriversNames(linha: LinhaDetails): string {
    if (!linha.assignedVehicles || linha.assignedVehicles.length === 0) return 'Nenhum';
    const names = linha.assignedVehicles.flatMap((v) => v.motoristas).filter(Boolean);
    const hasVacant = linha.assignedVehicles.some((v) => v.pendingDrivers);
    if (names.length === 0) return 'Nenhum motorista alocado';
    return names.join(', ') + (hasVacant ? ' (1 Turno Vago)' : '');
  }

  goToVeiculo(plate: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.closeDetailsModal();
    this.router.navigate(['/veiculos'], { queryParams: { plate: plate.trim() } });
  }

  goToMotorista(driverName: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!driverName || driverName === 'Sem motorista' || driverName === 'Nenhum') return;
    this.closeDetailsModal();
    this.router.navigate(['/motoristas'], { queryParams: { search: driverName.trim() } });
  }

  getActiveDriver(v: LinhaAssignedVehicle): { name: string; shift?: string } | null {
    if (v.activeDriverName) {
      return { name: v.activeDriverName, shift: v.activeDriverShift };
    }
    if (v.motoristas && v.motoristas.length > 0) {
      return { name: v.motoristas[0] };
    }
    return null;
  }

  loadLinhas(forceRefresh: boolean = false): void {
    this.isLoadingLinhas = true;
    this.linhaService.getLinhas(forceRefresh).subscribe({
      next: (data) => {
        if (data) {
          this.linhasAtivas = data.filter((l) => l.status === 'ativa');
          this.linhasInativas = data.filter((l) => l.status === 'inativa');
        }
        this.isLoadingLinhas = false;
        this.cdr.detectChanges();
        this.checkQueryParamsForSelection();
      },
      error: () => {
        this.isLoadingLinhas = false;
        this.cdr.detectChanges();
      },
    });
  }

  checkQueryParamsForSelection(): void {
    this.route.queryParams.subscribe((params) => {
      const target = params['search'] || params['codigo'] || params['linha'];
      if (target && (this.linhasAtivas.length > 0 || this.linhasInativas.length > 0)) {
        this.searchQueryAtivas = target;
        this.isSearchAtivasOpen = true;

        const allLinhas = [...this.linhasAtivas, ...this.linhasInativas];
        const normalizedTarget = this.normalizeSearchText(target);
        const cleanDigits = target.replace(/\D/g, '');

        const found = allLinhas.find((l) => {
          const lCodigo = (l.codigo || '').toLowerCase().trim();
          const lFull = `${l.codigo}-${l.atendimento || '10'}`.toLowerCase();
          const lPartida = this.normalizeSearchText(l.partida || '');
          const lChegada = this.normalizeSearchText(l.chegada || '');
          const lNome = this.normalizeSearchText(l.nome || l.descricao || '');

          return (
            lCodigo === target.toLowerCase().trim() ||
            lFull === target.toLowerCase().trim() ||
            (cleanDigits.length > 0 && lCodigo === cleanDigits) ||
            lNome.includes(normalizedTarget) ||
            lPartida.includes(normalizedTarget) ||
            lChegada.includes(normalizedTarget)
          );
        });

        if (found) {
          setTimeout(() => this.openLinhaDetails(found), 150);
        }
      }
    });
  }

  toggleSearchAtivas(): void {
    this.isSearchAtivasOpen = !this.isSearchAtivasOpen;
    if (this.isSearchAtivasOpen) {
      setTimeout(() => {
        const input = document.getElementById('search-ativas-input') as HTMLInputElement;
        if (input) input.focus();
      }, 50);
    }
  }

  clearSearchAtivas(): void {
    this.searchQueryAtivas = '';
    this.selectedTagAtivas = '';
  }

  setTagAtivas(tag: string): void {
    this.selectedTagAtivas = this.selectedTagAtivas === tag ? '' : tag;
  }

  toggleSearchInativas(): void {
    this.isSearchInativasOpen = !this.isSearchInativasOpen;
    if (this.isSearchInativasOpen) {
      setTimeout(() => {
        const input = document.getElementById('search-inativas-input') as HTMLInputElement;
        if (input) input.focus();
      }, 50);
    }
  }

  clearSearchInativas(): void {
    this.searchQueryInativas = '';
    this.selectedTagInativas = '';
  }

  setTagInativas(tag: string): void {
    this.selectedTagInativas = this.selectedTagInativas === tag ? '' : tag;
  }

  get filteredLinhasAtivas(): LinhaDetails[] {
    return this.filterLinhasList(this.linhasAtivas, this.searchQueryAtivas, this.selectedTagAtivas);
  }

  get filteredLinhasInativas(): LinhaDetails[] {
    return this.filterLinhasList(this.linhasInativas, this.searchQueryInativas, this.selectedTagInativas);
  }

  filterLinhasList(linhas: LinhaDetails[], query: string, tag: string): LinhaDetails[] {
    if (!linhas) return [];
    let result = linhas;

    if (tag) {
      result = result.filter((linha) => {
        const hasIda = !!linha.rotas?.ida && (linha.rotas.ida.enderecos?.length ?? 0) > 0;
        const hasVolta = !!linha.rotas?.volta && (linha.rotas.volta.enderecos?.length ?? 0) > 0;
        switch (tag) {
          case 'ida':
            return hasIda;
          case 'volta':
            return hasVolta;
          case 'sem_itinerario':
            return !hasIda && !hasVolta;
          case 'com_veiculos':
            return (linha.assignedVehicles?.length || 0) > 0;
          default:
            return true;
        }
      });
    }

    const q = this.normalizeSearchText(query);
    if (!q) return result;

    const terms = q.split(' ').filter(Boolean);

    return result.filter((linha) => {
      const code = `${linha.codigo || ''} ${linha.atendimento || ''} ${linha.codigo || ''}-${linha.atendimento || ''}`;
      const partida = linha.partida || '';
      const chegada = linha.chegada || '';
      const nome = linha.nome || '';
      const statusLabel = this.getLinhaStatusLabel(linha);
      const idaPrefix = linha.rotas?.ida?.prefixo || '';
      const voltaPrefix = linha.rotas?.volta?.prefixo || '';
      const tagsText = [
        linha.rotas?.ida ? 'ida com ida' : '',
        linha.rotas?.volta ? 'volta com volta' : '',
        !linha.rotas?.ida && !linha.rotas?.volta ? 'sem itinerario' : '',
        linha.assignedVehicles?.length ? 'veiculos com veiculos' : '',
      ].join(' ');

      const searchableBlob = this.normalizeSearchText(
        `${code} ${partida} ${chegada} ${nome} ${statusLabel} ${idaPrefix} ${voltaPrefix} ${tagsText}`
      );

      return terms.every((term) => searchableBlob.includes(term));
    });
  }

  normalizeSearchText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.\-_/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  ensureTodasAsParadasLoaded(): void {
    if (this.todasAsParadas.length > 0) return;
    this.isLoadingParadas = true;
    this.linhaService.getParadas(3550308).subscribe({
      next: (paradas) => {
        this.todasAsParadas = paradas || [];
        this.filteredParadas = [...this.todasAsParadas];
        this.isLoadingParadas = false;
      },
      error: () => {
        this.isLoadingParadas = false;
      },
    });
  }

  refreshStoredLinhas(): void {
    const stored = this.linhaService.getStoredLinhas();
    this.linhasAtivas = stored.ativas;
    this.linhasInativas = stored.inativas;
  }

  toggleLinhaStatus(linha: LinhaDetails): void {
    this.linhaService.toggleLinhaStatus(linha);
    this.refreshStoredLinhas();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  // --- Step 1: Create Linha ---
  openCreateLinha(): void {
    this.activeStep = 'create_linha';
    this.linhaForm = {
      codigo: '',
      atendimento: '10',
      partida: '',
      chegada: '',
      descricao: '',
    };
    this.searchQuery = '';
    this.filteredParadas = [];
    this.ensureTodasAsParadasLoaded();
  }

  saveLinha(): void {
    if (!this.linhaForm.codigo || !this.linhaForm.partida || !this.linhaForm.chegada) {
      alert('Código, Local de Partida e Local de Chegada são obrigatórios.');
      return;
    }

    // Set concatenated description
    this.linhaForm.descricao = `${this.linhaForm.partida.trim()} - ${this.linhaForm.chegada.trim()}`;

    this.linhaService.saveLinha(this.linhaForm).subscribe(() => {
      this.showConfirmationModal = true;
    });
  }

  // --- Step 2: Confirmation Actions ---
  confirmAddRota(sentido: 'IDA' | 'VOLTA'): void {
    this.showConfirmationModal = false;
    this.itineraryForm.sentido = sentido;

    // Auto prefix naming
    if (sentido === 'IDA') {
      this.itineraryForm.prefixo = `${this.linhaForm.partida.trim()} - ${this.linhaForm.chegada.trim()}`;
    } else {
      this.itineraryForm.prefixo = `${this.linhaForm.chegada.trim()} - ${this.linhaForm.partida.trim()}`;
    }

    const matched = [...this.linhasAtivas, ...this.linhasInativas].find(
      (l) => l.codigo === this.linhaForm.codigo && l.atendimento === this.linhaForm.atendimento
    );
    this.selectedLinha = matched || {
      id: Date.now(),
      codigo: this.linhaForm.codigo,
      atendimento: this.linhaForm.atendimento,
      partida: this.linhaForm.partida,
      chegada: this.linhaForm.chegada,
      nome: this.linhaForm.descricao,
      descricao: this.linhaForm.descricao,
      status: 'inativa',
      rotas: {},
    };

    this.enderecos = [];
    this.searchQuery = '';
    this.filteredParadas = [];
    this.activeStep = 'edit_itinerary';
    this.ensureTodasAsParadasLoaded();
    this.takeSessionSnapshot();
  }

  confirmSkip(): void {
    this.showConfirmationModal = false;
    this.activeStep = 'list';
    this.loadLinhas(true);
  }

  confirmSkipRota(): void {
    this.confirmSkip();
  }

  // --- Modal View Details ---
  isClosingDetailsModal = false;

  openLinhaDetails(linha: LinhaDetails): void {
    this.selectedLinha = linha;
    this.showGeneralFleetDetails = false;
    this.showIdaFleetDetails = false;
    this.showVoltaFleetDetails = false;
    this.isClosingDetailsModal = false;
    this.showLinhaDetailsModal = true;
  }

  selectLinhaCard(linha: LinhaDetails): void {
    this.openLinhaDetails(linha);
  }

  closeDetailsModal(immediate: boolean = false): void {
    if (immediate) {
      this.showLinhaDetailsModal = false;
      this.isClosingDetailsModal = false;
      return;
    }
    if (this.isClosingDetailsModal) return;
    this.isClosingDetailsModal = true;
    setTimeout(() => {
      this.showLinhaDetailsModal = false;
      this.isClosingDetailsModal = false;
    }, 200);
  }

  editExistingItinerary(linha: LinhaDetails, sentido: 'IDA' | 'VOLTA'): void {
    this.closeDetailsModal(true);
    this.selectedLinha = linha;
    this.itineraryForm.sentido = sentido;

    this.linhaForm = {
      codigo: linha.codigo,
      atendimento: linha.atendimento,
      partida: linha.partida,
      chegada: linha.chegada,
      descricao: linha.descricao,
    };

    const rota = sentido === 'IDA' ? linha.rotas?.ida : linha.rotas?.volta;
    if (rota?.prefixo) {
      this.itineraryForm.prefixo = rota.prefixo;
    } else if (sentido === 'IDA') {
      this.itineraryForm.prefixo = `${linha.partida} - ${linha.chegada}`;
    } else {
      this.itineraryForm.prefixo = `${linha.chegada} - ${linha.partida}`;
    }

    this.enderecos = rota?.enderecos ? [...rota.enderecos] : [];
    this.searchQuery = '';
    this.filteredParadas = [];
    this.filteredItineraryStops = this.enderecos.map((endereco, index) => ({ endereco, index }));
    this.itineraryMode = 'view';
    this.activeStep = 'edit_itinerary';
    this.ensureTodasAsParadasLoaded();
    this.takeSessionSnapshot(rota?.rotaId || rota?.id, rota?.itinerarioId);
    this.startTelemetryPolling();
    setTimeout(() => this.initMapAndPlaces(), 120);
  }

  addNewItinerary(linha: LinhaDetails, sentido: 'IDA' | 'VOLTA'): void {
    this.closeDetailsModal(true);
    this.selectedLinha = linha;
    this.itineraryForm.sentido = sentido;

    this.linhaForm = {
      codigo: linha.codigo,
      atendimento: linha.atendimento,
      partida: linha.partida,
      chegada: linha.chegada,
      descricao: linha.descricao,
    };

    if (sentido === 'IDA') {
      this.itineraryForm.prefixo = `${linha.partida} - ${linha.chegada}`;
    } else {
      this.itineraryForm.prefixo = `${linha.chegada} - ${linha.partida}`;
    }

    this.enderecos = [];
    this.searchQuery = '';
    this.filteredParadas = [];
    this.filteredItineraryStops = [];
    this.itineraryMode = 'edit';
    this.activeStep = 'edit_itinerary';
    this.ensureTodasAsParadasLoaded();
    this.takeSessionSnapshot();
    this.startTelemetryPolling();
    setTimeout(() => this.initMapAndPlaces(), 120);
  }

  switchToEditMode(): void {
    this.itineraryMode = 'edit';
    const rota = this.itineraryForm.sentido === 'IDA' ? this.selectedLinha?.rotas?.ida : this.selectedLinha?.rotas?.volta;
    this.takeSessionSnapshot(rota?.rotaId || rota?.id, rota?.itinerarioId);
    this.searchQuery = '';
    this.showParadasDropdown = false;
    this.cdr.detectChanges();
  }

  exitItineraryView(): void {
    this.stopTelemetryPolling();
    this.cleanupVehicleMarkers();
    this.cleanupMap();
    this.activeStep = 'list';
    this.refreshStoredLinhas();
  }

  // --- Step 3: Itinerary Session Snapshot & Checklog Engine ---

  takeSessionSnapshot(rotaId?: number, itinerarioId?: number): void {
    this.currentRotaId = rotaId;
    this.currentItinerarioId = itinerarioId;
    this.initialSessionSnapshot = {
      prefixo: this.itineraryForm.prefixo,
      enderecos: JSON.parse(JSON.stringify(this.enderecos)),
      rotaId,
      itinerarioId,
    };
    this.currentChecklog = [];
  }

  calculateSessionChecklog(): ChecklogItem[] {
    if (!this.initialSessionSnapshot || this.activeStep !== 'edit_itinerary') {
      return [];
    }

    const items: ChecklogItem[] = [];
    const initialStops = this.initialSessionSnapshot.enderecos || [];
    const currentStops = this.enderecos || [];

    // 1. Prefixo alteration check
    const initPrefixo = (this.initialSessionSnapshot.prefixo || '').trim();
    const curPrefixo = (this.itineraryForm.prefixo || '').trim();
    if (initPrefixo !== curPrefixo) {
      items.push({
        id: 'prefix-change',
        type: 'prefix',
        title: 'Nome / Prefixo Alterado',
        detail: `De "${initPrefixo || 'Sem prefixo'}" para "${curPrefixo}"`,
        badge: 'Renomeado',
        color: 'blue',
      });
    }

    const isSameStop = (a: Endereco, b: Endereco): boolean => {
      if (a.id && b.id && a.id === b.id && a.id < 1000000000) return true;
      if (a.lat && b.lat && a.lng && b.lng) {
        return (
          Math.abs(Number(a.lat) - Number(b.lat)) < 0.0001 &&
          Math.abs(Number(a.lng) - Number(b.lng)) < 0.0001
        );
      }
      return false;
    };

    // 2. Added paradas
    currentStops.forEach((cur, curIdx) => {
      const existsInInitial = initialStops.some((init) => isSameStop(init, cur));
      if (!existsInInitial) {
        items.push({
          id: `add-${cur.id || curIdx}`,
          type: 'added',
          title: `+ Parada Adicionada: ${cur.nome || cur.endereco || 'Nova Parada'}`,
          detail: `Posição na rota: #${curIdx + 1}${cur.endereco ? ' (' + cur.endereco + ')' : ''}`,
          badge: '+ Adicionada',
          color: 'green',
          newIndex: curIdx + 1,
        });
      }
    });

    // 3. Removed paradas
    initialStops.forEach((init, initIdx) => {
      const existsInCurrent = currentStops.some((cur) => isSameStop(init, cur));
      if (!existsInCurrent) {
        items.push({
          id: `rem-${init.id || initIdx}`,
          type: 'removed',
          title: `- Parada Removida: ${init.nome || init.endereco || 'Parada Excluída'}`,
          detail: `Estava na posição #${initIdx + 1}${init.endereco ? ' (' + init.endereco + ')' : ''}`,
          badge: '- Removida',
          color: 'red',
          oldIndex: initIdx + 1,
        });
      }
    });

    // 4. Reordered paradas
    currentStops.forEach((cur, curIdx) => {
      const initIdx = initialStops.findIndex((init) => isSameStop(init, cur));
      if (initIdx !== -1 && initIdx !== curIdx) {
        items.push({
          id: `reorder-${cur.id || curIdx}`,
          type: 'reordered',
          title: `⇄ Parada Reordenada: ${cur.nome || cur.endereco || 'Parada'}`,
          detail: `Movida da posição #${initIdx + 1} para #${curIdx + 1}`,
          badge: '⇄ Reordenada',
          color: 'amber',
          oldIndex: initIdx + 1,
          newIndex: curIdx + 1,
        });
      }
    });

    return items;
  }

  hasUnsavedChanges(): boolean {
    if (this.activeStep !== 'edit_itinerary' || !this.initialSessionSnapshot) {
      return false;
    }
    return this.calculateSessionChecklog().length > 0;
  }

  // --- Leave / Warning & CanDeactivate Handlers ---

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (!this.hasUnsavedChanges()) {
      return true;
    }
    return new Promise<boolean>((resolve) => {
      this.pendingDeactivateResolver = resolve;
      this.openUnsavedWarningModal();
    });
  }

  cancelItineraryEdit(): void {
    const isNewItinerary = !this.initialSessionSnapshot?.rotaId &&
      !(this.itineraryForm.sentido === 'IDA' ? this.selectedLinha?.rotas?.ida : this.selectedLinha?.rotas?.volta);

    if (this.itineraryMode === 'edit') {
      if (this.hasUnsavedChanges()) {
        if (confirm('Deseja descartar as alterações e voltar ao modo de visualização?')) {
          if (this.initialSessionSnapshot) {
            this.enderecos = JSON.parse(JSON.stringify(this.initialSessionSnapshot.enderecos || []));
            this.itineraryForm.prefixo = this.initialSessionSnapshot.prefixo || this.itineraryForm.prefixo;
            this.currentChecklog = [];
            this.refreshMapAndRoute(false);
          }
          if (isNewItinerary) {
            this.exitItineraryView();
            return;
          }
          this.itineraryMode = 'view';
          this.searchQuery = '';
          this.showParadasDropdown = false;
          this.filteredItineraryStops = this.enderecos.map((endereco, index) => ({ endereco, index }));
          this.cdr.detectChanges();
        }
      } else {
        if (isNewItinerary) {
          this.exitItineraryView();
          return;
        }
        this.itineraryMode = 'view';
        this.searchQuery = '';
        this.showParadasDropdown = false;
        this.filteredItineraryStops = this.enderecos.map((endereco, index) => ({ endereco, index }));
        this.cdr.detectChanges();
      }
    } else {
      this.exitItineraryView();
    }
  }

  openUnsavedWarningModal(): void {
    this.currentChecklog = this.calculateSessionChecklog();
    this.showUnsavedWarningModal = true;
  }

  cancelUnsavedWarning(): void {
    this.showUnsavedWarningModal = false;
    if (this.pendingDeactivateResolver) {
      this.pendingDeactivateResolver(false);
      this.pendingDeactivateResolver = null;
    }
  }

  discardAndExit(): void {
    this.initialSessionSnapshot = null;
    this.showUnsavedWarningModal = false;
    this.stopTelemetryPolling();
    this.cleanupVehicleMarkers();
    this.cleanupMap();
    this.activeStep = 'list';
    this.refreshStoredLinhas();
    if (this.pendingDeactivateResolver) {
      this.pendingDeactivateResolver(true);
      this.pendingDeactivateResolver = null;
    }
  }

  saveFromWarning(): void {
    this.showUnsavedWarningModal = false;
    this.openSaveModal();
  }

  // --- Save Modal & Animations Workflow ---

  openSaveModal(): void {
    if (!this.selectedLinha) return;
    this.currentChecklog = this.calculateSessionChecklog();
    this.saveErrorMessage = '';
    this.saveSuccessState = false;
    this.isSavingItinerary = false;
    this.showSaveModal = true;
  }

  closeSaveModal(): void {
    if (this.isSavingItinerary) return;
    this.showSaveModal = false;
    this.saveSuccessState = false;
    this.saveErrorMessage = '';
  }

  confirmSaveItinerary(): void {
    if (!this.selectedLinha) return;
    this.isSavingItinerary = true;
    this.saveErrorMessage = '';

    this.linhaService
      .saveRotaItinerario(
        this.selectedLinha.codigo,
        this.selectedLinha.atendimento,
        this.itineraryForm.sentido,
        this.itineraryForm.prefixo,
        this.enderecos,
        this.currentRotaId,
        this.currentItinerarioId
      )
      .subscribe({
        next: () => {
          this.isSavingItinerary = false;
          this.saveSuccessState = true;
          this.cdr.detectChanges();

          // Wait for checkmark celebration animation before returning
          setTimeout(() => {
            this.initialSessionSnapshot = null;
            this.showSaveModal = false;
            this.saveSuccessState = false;
            this.cleanupMap();
            this.activeStep = 'list';
            this.loadLinhas(true);
            if (this.pendingDeactivateResolver) {
              this.pendingDeactivateResolver(true);
              this.pendingDeactivateResolver = null;
            }
            this.cdr.detectChanges();
          }, 1400);
        },
        error: (err) => {
          this.isSavingItinerary = false;
          this.saveErrorMessage =
            'Ocorreu um erro ao salvar o itinerário no servidor. Verifique os dados e tente novamente.';
          console.error('[RotasComponent] Erro ao salvar itinerário:', err);
          this.cdr.detectChanges();
        },
      });
  }

  // --- Google Maps Platform Integration ---

  async initMapAndPlaces(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    this.hasGoogleMapsApiKey = this.googleMapsService.hasApiKey();
    if (!this.hasGoogleMapsApiKey) {
      console.warn('[RotasComponent] Google Maps API key is not configured in enviroment.ts.');
      return;
    }

    this.isMapLoading = true;
    const loaded = await this.googleMapsService.load();
    this.isMapLoading = false;

    if (!loaded || typeof google === 'undefined' || !google.maps) {
      console.warn('[RotasComponent] Google Maps API failed to load.');
      return;
    }

    const mapCanvas = document.getElementById('google-map-canvas');
    if (!mapCanvas) {
      // Retry in case DOM was rendering
      setTimeout(() => this.initMapAndPlaces(), 150);
      return;
    }

    // Determine initial center
    let center = { lat: -23.5505, lng: -46.6333 }; // Default São Paulo
    const firstWithCoords = this.enderecos.find(
      (e) => e.lat && e.lng && (Math.abs(e.lat) > 0.0001 || Math.abs(e.lng) > 0.0001)
    );
    if (firstWithCoords) {
      center = { lat: Number(firstWithCoords.lat), lng: Number(firstWithCoords.lng) };
    }

    this.map = new google.maps.Map(mapCanvas, {
      center,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'transit',
          elementType: 'labels.icon',
          stylers: [{ visibility: 'on' }],
        },
      ],
    });

    this.routePolyline = new google.maps.Polyline({
      map: this.map,
      path: [],
      strokeColor: '#00b4d8',
      strokeWeight: 5,
      strokeOpacity: 0.9,
    });

    this.isMapInitialized = true;
    this.setupPlacesAutocomplete();
    this.setupMapClickListener();
    this.setupZoomListener();
    this.refreshMapAndRoute(true);
    this.renderVehicleMarkers();
  }

  setupZoomListener(): void {
    if (!this.map) return;
    this.map.addListener('zoom_changed', () => {
      this.updateWaypointVisibilityByZoom();
    });
    this.map.addListener('idle', () => {
      this.updateWaypointVisibilityByZoom();
    });
  }

  updateWaypointVisibilityByZoom(): void {
    if (!this.map || !this.mapMarkers || this.mapMarkers.length === 0) return;
    const zoom = this.map.getZoom();
    if (typeof zoom !== 'number') return;

    // When zooming out (< 14), remove ALL waypoints for the paradas so the route polyline is completely clear and unobstructed.
    // At zoom >= 15, show all paradas. At zoom 14, show only terminals (start and end).
    const showAll = this.showParadasMarkers && zoom >= 15;
    const showTerminals = this.showParadasMarkers && zoom >= 14;

    this.mapMarkers.forEach((m, idx) => {
      const isTerminal = idx === 0 || idx === this.mapMarkers.length - 1;
      let visible = false;

      if (!this.showParadasMarkers || zoom < 14) {
        visible = false;
      } else if (showAll) {
        visible = true;
      } else if (isTerminal && showTerminals) {
        visible = true;
      } else {
        visible = false;
      }

      m.setVisible(visible);
    });

    // Close any floating info window if waypoints are currently hidden
    if (this.currentInfoWindow && (!this.showParadasMarkers || zoom < 14)) {
      this.currentInfoWindow.close();
      this.currentInfoWindow = null;
      this.hasSelectedElementOnMap = false;
    }
  }

  toggleParadasMarkersVisibility(): void {
    this.showParadasMarkers = !this.showParadasMarkers;
    this.updateWaypointVisibilityByZoom();
    this.cdr.detectChanges();
  }

  getDestinoLabel(sentido?: string): string {
    const s = (sentido || this.itineraryForm.sentido || '').toUpperCase();
    if (!this.selectedLinha) return s;
    const isIda = s === 'IDA';
    const dest = isIda ? this.selectedLinha.chegada : this.selectedLinha.partida;
    if (dest && dest.trim()) {
      return dest.trim();
    }
    const rota = isIda ? this.selectedLinha.rotas?.ida : this.selectedLinha.rotas?.volta;
    if (rota?.prefixo && rota.prefixo.trim()) {
      return rota.prefixo.trim();
    }
    return s;
  }

  setupPlacesAutocomplete(): void {
    if (this.itineraryMode !== 'edit') {
      return;
    }
    if (!isPlatformBrowser(this.platformId) || typeof google === 'undefined' || !google.maps?.places) {
      return;
    }

    const input = document.getElementById('search-parada-input') as HTMLInputElement;
    if (!input) return;

    this.autocomplete = new google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: 'br' },
      fields: ['formatted_address', 'geometry', 'name', 'address_components'],
    });

    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete.getPlace();
      if (!place || !place.geometry || !place.geometry.location) {
        return;
      }

      let cep = '';
      for (const comp of place.address_components || []) {
        if (comp.types?.includes('postal_code')) {
          cep = comp.long_name;
        }
      }

      const newEndereco: Endereco = {
        id: Date.now(),
        nome: place.name || place.formatted_address || 'Nova Parada',
        endereco: place.formatted_address || place.name || '',
        cep,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        ordem: this.enderecos.length,
      };

      this.ngZone.run(() => {
        this.enderecos.push(newEndereco);
        this.searchQuery = '';
        input.value = '';
        this.showParadasDropdown = false;
        this.refreshMapAndRoute(false);
        this.cdr.detectChanges();
        this.scrollToEndOfAddressesList();
      });
    });
  }

  setupMapClickListener(): void {
    if (!this.map) return;

    if (isPlatformBrowser(this.platformId)) {
      const mapCanvas = document.getElementById('google-map-canvas');
      if (mapCanvas) {
        mapCanvas.oncontextmenu = (e) => {
          if (this.hasSelectedElementOnMap || this.currentInfoWindow) {
            e.preventDefault();
            this.unselectMapElement();
          }
        };
      }
    }

    this.map.addListener('click', async (event: any) => {
      // If a parada/marker info is currently selected, left click deselects it without adding a new parada!
      if (this.hasSelectedElementOnMap || this.currentInfoWindow) {
        this.unselectMapElement();
        return;
      }

      // In view mode, clicking on the map is read-only (does not add stops)
      if (this.itineraryMode !== 'edit') {
        return;
      }

      if (!event.latLng) return;
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      const geo = await this.googleMapsService.reverseGeocode(lat, lng);
      const newEndereco: Endereco = {
        id: Date.now(),
        nome: geo?.name || `Parada ${this.enderecos.length + 1}`,
        endereco: geo?.formattedAddress || `Coord: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        cep: geo?.cep || '',
        lat,
        lng,
        ordem: this.enderecos.length,
      };

      this.ngZone.run(() => {
        this.enderecos.push(newEndereco);
        this.refreshMapAndRoute(false);
        this.cdr.detectChanges();
        this.scrollToEndOfAddressesList();
      });
    });

    this.map.addListener('rightclick', () => {
      this.unselectMapElement();
    });
  }

  unselectMapElement(): void {
    this.ngZone.run(() => {
      if (this.currentInfoWindow) {
        this.currentInfoWindow.close();
        this.currentInfoWindow = null;
      }
      this.hasSelectedElementOnMap = false;
      this.cdr.detectChanges();
    });
  }

  private scrollToEndOfAddressesList(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      const list = document.querySelector('.addresses-list');
      if (list) {
        list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  }

  refreshMapAndRoute(immediate: boolean = false): void {
    if (!this.map || !isPlatformBrowser(this.platformId)) return;
    this.renderMarkers();
    if (immediate) {
      this.executeRouteCalculation();
    } else {
      this.routeUpdateSubject.next(true);
    }
  }

  async executeRouteCalculation(): Promise<void> {
    if (!this.map || !isPlatformBrowser(this.platformId) || typeof google === 'undefined') {
      return;
    }

    const validStops = this.enderecos
      .filter((e) => e.lat && e.lng && (Math.abs(e.lat) > 0.0001 || Math.abs(e.lng) > 0.0001))
      .map((e) => ({ lat: Number(e.lat), lng: Number(e.lng) }));

    if (validStops.length >= 2) {
      this.isCalculatingRoute = true;
      try {
        const result = await this.googleMapsService.calculateDirections(validStops);
        this.ngZone.run(() => {
          if (result && this.routePolyline) {
            this.routePolyline.setPath(result.fullPath);
            this.routeMetrics = result;
          }
          this.cdr.detectChanges();
        });
      } catch (err) {
        console.warn('[RotasComponent] Error calculating multi-chunk route:', err);
      } finally {
        this.ngZone.run(() => {
          this.isCalculatingRoute = false;
          this.cdr.detectChanges();
        });
      }
    } else {
      if (this.routePolyline) {
        this.routePolyline.setPath([]);
      }
      this.routeMetrics = null;
      this.isCalculatingRoute = false;
      this.cdr.detectChanges();
    }
  }

  renderMarkers(): void {
    if (!this.map || typeof google === 'undefined') return;

    for (const m of this.mapMarkers) {
      m.setMap(null);
    }
    this.mapMarkers = [];

    const bounds = new google.maps.LatLngBounds();
    let countValid = 0;

    this.enderecos.forEach((end, idx) => {
      if (end.lat && end.lng && (Math.abs(end.lat) > 0.0001 || Math.abs(end.lng) > 0.0001)) {
        countValid++;
        const pos = { lat: Number(end.lat), lng: Number(end.lng) };
        bounds.extend(pos);

        const isOrigin = idx === 0;
        const isDestination = idx === this.enderecos.length - 1 && this.enderecos.length > 1;
        const pinColor = isOrigin ? '#10b981' : isDestination ? '#ef4444' : '#00b4d8';

        const marker = new google.maps.Marker({
          position: pos,
          map: this.map,
          title: `${idx + 1}. ${end.nome || end.endereco}`,
          label: {
            text: (idx + 1).toString(),
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '11px',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 13,
            fillColor: pinColor,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="font-family: sans-serif; font-size: 12px; color: #1e293b; padding: 4px;">
            <strong style="color: ${pinColor}">#${idx + 1} ${isOrigin ? '(Partida)' : isDestination ? '(Chegada)' : 'Parada'}</strong><br/>
            <strong>${end.nome}</strong><br/>
            <span style="color: #64748b;">${end.endereco}</span>
          </div>`,
        });

        marker.addListener('click', () => {
          this.ngZone.run(() => {
            if (this.currentInfoWindow && this.currentInfoWindow !== infoWindow) {
              this.currentInfoWindow.close();
            }
            this.currentInfoWindow = infoWindow;
            this.hasSelectedElementOnMap = true;
            infoWindow.open(this.map, marker);
            this.cdr.detectChanges();
          });
        });

        marker.addListener('rightclick', () => {
          this.unselectMapElement();
        });

        infoWindow.addListener('closeclick', () => {
          this.ngZone.run(() => {
            this.hasSelectedElementOnMap = false;
            this.currentInfoWindow = null;
            this.cdr.detectChanges();
          });
        });

        this.mapMarkers.push(marker);
      }
    });

    if (countValid > 0) {
      if (countValid === 1) {
        this.map.setCenter(bounds.getCenter());
        this.map.setZoom(15);
      } else {
        this.map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }
    }
    this.updateWaypointVisibilityByZoom();
  }

  focusStopOnMap(index: number): void {
    const end = this.enderecos[index];
    if (end && end.lat && end.lng && this.map) {
      this.showParadasMarkers = true;
      if (this.mapMarkers[index]) {
        this.mapMarkers[index].setVisible(true);
      }
      this.map.panTo({ lat: Number(end.lat), lng: Number(end.lng) });
      this.map.setZoom(16);
      if (this.mapMarkers[index]) {
        google.maps.event.trigger(this.mapMarkers[index], 'click');
      }
    }
  }

  // --- Live Vehicle Telemetry & SVG Bus Markers ---

  startTelemetryPolling(): void {
    this.stopTelemetryPolling();
    this.loadTrackedVehicles();
    this.telemetryInterval = setInterval(() => {
      if (this.activeStep === 'edit_itinerary') {
        this.loadTrackedVehicles();
      }
    }, 10000);
  }

  stopTelemetryPolling(): void {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
  }

  cleanupVehicleMarkers(): void {
    for (const m of this.vehicleMarkers) {
      m.setMap(null);
    }
    this.vehicleMarkers = [];
  }

  loadTrackedVehicles(): void {
    if (!this.selectedLinha) return;

    // Query active telemetria without restricting linhaId so all live vehicles from operator are returned
    this.telemetriaService.getVeiculosAtivos().subscribe({
      next: (telemetriaList) => {
        let vehiclesWithGps: TelemetriaVeiculo[] = [];

        if (telemetriaList && telemetriaList.length > 0) {
          const selCodigo = (this.selectedLinha?.codigo || '').trim().toLowerCase();
          const selCleanNum = selCodigo.replace(/\D/g, '');
          const selId = this.selectedLinha?.id;

          vehiclesWithGps = telemetriaList.filter((t) => {
            // Must have real GPS coordinates
            if (!t.latitude && !t.longitude) return false;
            if (Math.abs(t.latitude) < 0.0001 && Math.abs(t.longitude) < 0.0001) return false;

            // Match with current line by ID or line code
            const tCodigo = (t.linhaCodigo || '').trim().toLowerCase();
            const tCleanNum = tCodigo.replace(/\D/g, '');

            const matchLine =
              (t.linhaId && selId && Number(t.linhaId) === Number(selId)) ||
              (t.linhaId && selCleanNum && Number(t.linhaId) === Number(selCleanNum)) ||
              (tCodigo && selCodigo && (tCodigo === selCodigo || selCodigo.includes(tCodigo) || tCodigo.includes(selCodigo))) ||
              (tCleanNum && selCleanNum && tCleanNum === selCleanNum);

            return matchLine;
          });
        }

        // Strictly real telemetria only - never generate fake driver positions
        this.trackedVehicles = vehiclesWithGps;
        if (this.isMapInitialized && this.map) {
          this.renderVehicleMarkers();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[RotasComponent] Erro ao carregar telemetria:', err);
      },
    });
  }

  focusVehicleOnMap(v: TelemetriaVeiculo): void {
    if (!this.map || !v.latitude || !v.longitude) return;
    const pos = { lat: Number(v.latitude), lng: Number(v.longitude) };
    this.map.panTo(pos);
    this.map.setZoom(16);

    const marker = this.vehicleMarkers.find((m: any) => {
      const p = m.getPosition();
      return p && Math.abs(p.lat() - Number(v.latitude)) < 0.0001 && Math.abs(p.lng() - Number(v.longitude)) < 0.0001;
    });

    if (marker) {
      google.maps.event.trigger(marker, 'click');
    }
  }

  private getBusMarkerIcon(sentido?: string): any {
    const isVolta = sentido === 'VOLTA';
    const pinColor = isVolta ? '#7c3aed' : '#2563eb';
    const darkPinColor = isVolta ? '#5b21b6' : '#1d4ed8';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 54" width="46" height="54">
        <defs>
          <filter id="busShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.38" />
          </filter>
        </defs>
        <!-- Marker Pin Body -->
        <path d="M23 2 C12 2 3 11 3 22 C3 34 23 52 23 52 C23 52 43 34 43 22 C43 11 34 2 23 2 Z"
              fill="${pinColor}" stroke="#ffffff" stroke-width="2.5" filter="url(#busShadow)" />
        <!-- Inner Badge -->
        <circle cx="23" cy="21" r="14" fill="${darkPinColor}" />
        <!-- Crisp Bus Silhouette -->
        <g fill="#ffffff">
          <rect x="15" y="12" width="16" height="15" rx="2.5" ry="2.5" />
          <rect x="16.5" y="15" width="13" height="5" rx="1" ry="1" fill="${darkPinColor}" />
          <rect x="18" y="13" width="10" height="1.2" rx="0.5" fill="#fbbf24" />
          <circle cx="17.8" cy="22.5" r="1.2" fill="#fef08a" />
          <circle cx="28.2" cy="22.5" r="1.2" fill="#fef08a" />
          <rect x="20.5" y="22.8" width="5" height="0.8" rx="0.4" fill="${darkPinColor}" />
          <rect x="16" y="27" width="2.5" height="1.8" rx="0.6" fill="#334155" />
          <rect x="27.5" y="27" width="2.5" height="1.8" rx="0.6" fill="#334155" />
          <rect x="13.8" y="16.5" width="1" height="2" rx="0.5" fill="#ffffff" />
          <rect x="31.2" y="16.5" width="1" height="2" rx="0.5" fill="#ffffff" />
        </g>
      </svg>
    `;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(42, 50),
      anchor: new google.maps.Point(21, 50),
    };
  }

  renderVehicleMarkers(): void {
    if (!this.map || typeof google === 'undefined') return;

    this.cleanupVehicleMarkers();

    this.trackedVehicles.forEach((v) => {
      if (!v.latitude || !v.longitude || (Math.abs(v.latitude) < 0.0001 && Math.abs(v.longitude) < 0.0001)) {
        return;
      }

      const pos = { lat: Number(v.latitude), lng: Number(v.longitude) };
      const marker = new google.maps.Marker({
        position: pos,
        map: this.map,
        title: `Ônibus ${v.placa || ''} - ${v.motoristaNome || 'Motorista'}`,
        icon: this.getBusMarkerIcon(v.sentido),
        zIndex: 999,
      });

      const isVolta = v.sentido === 'VOLTA';
      const badgeBg = isVolta ? '#f3e8ff' : '#dbeafe';
      const badgeColor = isVolta ? '#6b21a8' : '#1e40af';
      const statusParada = v.statusParadaAtual ? `<div><strong>🚏 Próxima Parada:</strong> ${v.statusParadaAtual}</div>` : '';
      const formattedVel = (v.velocidade && v.velocidade > 0) ? `${Math.round(v.velocidade)} km/h` : 'Parado';

      const infoContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #0f172a; padding: 6px 4px; min-width: 210px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 700; color: #1e293b; font-size: 14px;">
              🚍 ${v.placa || 'Veículo'}
            </span>
            <span style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 9999px;">
              Destino: ${this.getDestinoLabel(v.sentido)}
            </span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px; color: #334155;">
            <div><strong>👤 Motorista:</strong> ${v.motoristaNome || 'Não informado'}</div>
            <div><strong>⚡ Velocidade:</strong> ${formattedVel}</div>
            ${v.linhaCodigo ? `<div><strong>🔢 Linha:</strong> ${v.linhaCodigo}</div>` : ''}
            ${statusParada}
            ${v.ultimaAtualizacao ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">🕒 Atualizado: ${v.ultimaAtualizacao}</div>` : ''}
          </div>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: infoContent,
      });

      marker.addListener('mouseover', () => {
        this.ngZone.run(() => {
          if (this.currentInfoWindow && this.currentInfoWindow !== infoWindow) {
            this.currentInfoWindow.close();
          }
          this.currentInfoWindow = infoWindow;
          this.hasSelectedElementOnMap = true;
          infoWindow.open(this.map, marker);
          this.cdr.detectChanges();
        });
      });

      marker.addListener('click', () => {
        this.ngZone.run(() => {
          if (this.currentInfoWindow && this.currentInfoWindow !== infoWindow) {
            this.currentInfoWindow.close();
          }
          this.currentInfoWindow = infoWindow;
          this.hasSelectedElementOnMap = true;
          infoWindow.open(this.map, marker);
          this.cdr.detectChanges();
        });
      });

      this.vehicleMarkers.push(marker);
    });
  }

  isStopMatch(endereco: Endereco, index: number): boolean {
    if (!this.searchQuery || !this.searchQuery.trim()) return false;
    const q = this.searchQuery.trim().toLowerCase();
    const nome = (endereco.nome || '').toLowerCase();
    const addr = (endereco.endereco || '').toLowerCase();
    const num = String(index + 1);
    return nome.includes(q) || addr.includes(q) || num === q;
  }

  selectAndFocusItineraryStop(item: { endereco: Endereco; index: number }): void {
    this.focusStopOnMap(item.index);
    this.showParadasDropdown = false;
  }

  cleanupMap(): void {
    this.stopTelemetryPolling();
    this.cleanupVehicleMarkers();

    for (const m of this.mapMarkers) {
      m.setMap(null);
    }
    this.mapMarkers = [];

    if (this.routePolyline) {
      this.routePolyline.setMap(null);
      this.routePolyline = null;
    }

    if (this.autocomplete && typeof google !== 'undefined') {
      google.maps.event.clearInstanceListeners(this.autocomplete);
      this.autocomplete = null;
    }

    if (isPlatformBrowser(this.platformId)) {
      document.querySelectorAll('.pac-container').forEach((el) => el.remove());
    }

    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
      this.currentInfoWindow = null;
    }
    this.hasSelectedElementOnMap = false;

    this.map = null;
    this.isMapInitialized = false;
    this.isCalculatingRoute = false;
    this.routeMetrics = null;
  }

  // --- Paradas Manipulation & Search ---

  async addCustomEndereco(): Promise<void> {
    if (this.itineraryMode !== 'edit') {
      if (this.filteredItineraryStops.length > 0) {
        this.selectAndFocusItineraryStop(this.filteredItineraryStops[0]);
      }
      return;
    }

    const raw = this.searchQuery.trim() || 'Nova Parada';
    let nome = raw;
    let endereco = raw;

    const lastComma = raw.lastIndexOf(',');
    if (lastComma > 0) {
      nome = raw.substring(0, lastComma).trim();
      const resto = raw.substring(lastComma + 1).trim();
      endereco = `${nome}, ${resto}`;
    }

    let lat = 0;
    let lng = 0;
    let cep = '';

    if (this.googleMapsService.isApiLoaded() && typeof google !== 'undefined') {
      try {
        const geocoder = new google.maps.Geocoder();
        const geoResult = await new Promise<any>((resolve) => {
          geocoder.geocode({ address: raw + ', São Paulo, SP, Brasil' }, (res: any, status: string) => {
            if (status === 'OK' && res && res.length > 0) resolve(res[0]);
            else resolve(null);
          });
        });

        if (geoResult) {
          lat = geoResult.geometry.location.lat();
          lng = geoResult.geometry.location.lng();
          endereco = geoResult.formatted_address || endereco;
          for (const comp of geoResult.address_components || []) {
            if (comp.types?.includes('postal_code')) {
              cep = comp.long_name;
              break;
            }
          }
        }
      } catch (err) {
        console.warn('Geocoding lookup error:', err);
      }
    }

    const newEndereco: Endereco = {
      id: Date.now(),
      nome,
      endereco,
      cep,
      lat,
      lng,
      ordem: this.enderecos.length,
    };

    this.enderecos.push(newEndereco);
    this.searchQuery = '';
    this.filteredParadas = [];
    this.showParadasDropdown = false;
    this.refreshMapAndRoute(false);
  }

  selectAndAddParada(p: any): void {
    const name = p.logradouro || 'Parada';
    const address = `${p.logradouro || ''}, ${p.numero || ''}`;
    const cep = p.cep || '';
    const lat = Array.isArray(p.latLong) && p.latLong.length >= 2 ? p.latLong[0] : (p.latitude || 0);
    const lng = Array.isArray(p.latLong) && p.latLong.length >= 2 ? p.latLong[1] : (p.longitude || 0);

    const newEndereco: Endereco = {
      id: p.paradaId || p.id || Date.now(),
      nome: name,
      endereco: address,
      cep,
      lat: Number(lat),
      lng: Number(lng),
      ordem: this.enderecos.length,
    };

    this.enderecos.push(newEndereco);
    this.searchQuery = '';
    this.filteredParadas = [];
    this.showParadasDropdown = false;
    this.refreshMapAndRoute(false);
  }

  removeEndereco(index: number): void {
    this.enderecos.splice(index, 1);
    this.updateOrdem();
    this.refreshMapAndRoute(false);
  }

  onDragStart(event: DragEvent, index: number): void {
    this.draggedIndex = index;
    this.dragOverIndex = null;
    this.dropPosition = null;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    if (this.draggedIndex === null || this.draggedIndex === index) {
      this.dragOverIndex = null;
      this.dropPosition = null;
      return;
    }

    const targetElement = event.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const position: 'above' | 'below' = offsetY < rect.height / 2 ? 'above' : 'below';

    this.dragOverIndex = index;
    this.dropPosition = position;
  }

  onDragLeave(event: DragEvent, index: number): void {
    const targetElement = event.currentTarget as HTMLElement;
    if (!targetElement.contains(event.relatedTarget as Node)) {
      if (this.dragOverIndex === index) {
        this.dragOverIndex = null;
        this.dropPosition = null;
      }
    }
  }

  onDragEnd(): void {
    this.draggedIndex = null;
    this.dragOverIndex = null;
    this.dropPosition = null;
  }

  getTargetDisplayOrder(hoverIndex: number, position: 'above' | 'below' | null): number {
    if (this.draggedIndex === null) return hoverIndex + 1;
    let targetIndex = position === 'below' ? hoverIndex + 1 : hoverIndex;
    if (this.draggedIndex < targetIndex) {
      targetIndex--;
    }
    return targetIndex + 1;
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    if (this.draggedIndex !== null && this.draggedIndex !== dropIndex) {
      let targetIndex = this.dropPosition === 'below' ? dropIndex + 1 : dropIndex;
      if (this.draggedIndex < targetIndex) {
        targetIndex--;
      }

      if (this.draggedIndex !== targetIndex) {
        const draggedItem = this.enderecos[this.draggedIndex];
        this.enderecos.splice(this.draggedIndex, 1);
        this.enderecos.splice(targetIndex, 0, draggedItem);
        this.updateOrdem();
        this.refreshMapAndRoute(false);
      }
    }
    this.draggedIndex = null;
    this.dragOverIndex = null;
    this.dropPosition = null;
  }

  updateOrdem(): void {
    this.enderecos.forEach((endereco, index) => {
      endereco.ordem = index;
    });
  }

  filterParadas(): void {
    if (this.itineraryMode === 'view') {
      this.showParadasDropdown = true;
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) {
        this.filteredItineraryStops = this.enderecos.map((endereco, index) => ({ endereco, index }));
      } else {
        this.filteredItineraryStops = this.enderecos
          .map((endereco, index) => ({ endereco, index }))
          .filter((item) => {
            const nome = (item.endereco.nome || '').toLowerCase();
            const addr = (item.endereco.endereco || '').toLowerCase();
            const pos = String(item.index + 1);
            return nome.includes(q) || addr.includes(q) || pos === q;
          });
      }
      return;
    }

    this.showParadasDropdown = true;
    const q = this.searchQuery.trim();
    if (!q) {
      this.googlePredictions = [];
      this.googleMapsService.resetSessionToken();
      if (this.todasAsParadas.length === 0) {
        this.linhaService.getParadas(3550308).subscribe((paradas) => {
          this.todasAsParadas = paradas || [];
          this.filteredParadas = [...this.todasAsParadas];
        });
      } else {
        this.filteredParadas = [...this.todasAsParadas];
      }
      return;
    }

    // 1. Filter local registered stops from database
    this.linhaService.getParadas(3550308, q).subscribe((paradas) => {
      this.filteredParadas = paradas || [];
    });

    // 2. Query Google Maps Places Autocomplete predictions (300ms debounce)
    clearTimeout(this.searchDebounceTimeout);
    this.searchDebounceTimeout = setTimeout(async () => {
      if (q.length >= 2 && this.googleMapsService.hasApiKey()) {
        this.isLoadingPredictions = true;
        try {
          this.googlePredictions = await this.googleMapsService.getPlacePredictions(q);
        } catch (err) {
          console.warn('Google autocomplete predictions error:', err);
          this.googlePredictions = [];
        } finally {
          this.isLoadingPredictions = false;
        }
      } else {
        this.googlePredictions = [];
      }
    }, 300);
  }

  async selectGooglePrediction(pred: any): Promise<void> {
    this.showParadasDropdown = false;
    this.searchQuery = '';
    this.googlePredictions = [];

    try {
      const place = await this.googleMapsService.getPlaceDetails(pred.place_id);
      if (!place || !place.geometry || !place.geometry.location) {
        return;
      }

      let routeName = '';
      let streetNumber = '';
      let cep = '';

      for (const comp of place.address_components || []) {
        if (comp.types?.includes('route')) {
          routeName = comp.long_name;
        } else if (comp.types?.includes('street_number')) {
          streetNumber = comp.long_name;
        } else if (comp.types?.includes('postal_code')) {
          cep = comp.long_name;
        }
      }

      const mainText = pred.structured_formatting?.main_text || place.name || routeName || 'Parada';
      const displayName = routeName ? (streetNumber ? `${routeName}, ${streetNumber}` : routeName) : mainText;
      const fullAddress = place.formatted_address || displayName;

      const loc = place.geometry.location;
      const latVal = typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat);
      const lngVal = typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng);

      const newEndereco: Endereco = {
        id: Date.now(), // Numeric ID > 1,000,000,000 signals backend to insert new T_PARADA
        nome: displayName,
        endereco: fullAddress,
        cep,
        lat: latVal,
        lng: lngVal,
        ordem: this.enderecos.length,
      };

      this.ngZone.run(() => {
        this.enderecos.push(newEndereco);
        this.refreshMapAndRoute(false);
        this.cdr.detectChanges();
        this.scrollToEndOfAddressesList();
      });
    } catch (err) {
      console.warn('[RotasComponent] Error selecting Google Place prediction:', err);
    }
  }

  openParadasDropdown(): void {
    if (this.itineraryMode === 'view') {
      this.filterParadas();
      this.showParadasDropdown = true;
      return;
    }

    if (this.todasAsParadas.length === 0) {
      this.linhaService.getParadas(3550308).subscribe((paradas) => {
        this.todasAsParadas = paradas || [];
        this.filteredParadas = [...this.todasAsParadas];
        this.showParadasDropdown = true;
      });
    } else {
      this.filteredParadas = [...this.todasAsParadas];
      this.showParadasDropdown = true;
    }
  }

  closeParadasDropdown(): void {
    setTimeout(() => {
      this.showParadasDropdown = false;
    }, 250);
  }
}
