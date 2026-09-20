import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { User } from '../../models/userLiteResponse.model';
import { LoginService } from '../../services/login.service';
import { LinhaService, LinhaDetails, LinhaAssignedVehicle } from '../../services/linha.service';
import { Endereco } from '../../models/endereco.model';
import { GoogleMapsService, RouteCalculationResult } from '../../services/google-maps.service';

declare const google: any;

export interface LinhaTag {
  label: string;
  type: 'danger' | 'warning' | 'info' | 'amber' | 'success';
  icon: string;
  tooltip?: string;
}

@Component({
  selector: 'app-rotas',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './rotas.component.html',
  styleUrls: ['./rotas.component.scss'],
})
export class RotasComponent implements OnInit, OnDestroy {
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

  // Loading States
  isLoadingLinhas: boolean = false;
  isLoadingParadas: boolean = false;

  // Wizard and View Navigation State
  activeStep: 'list' | 'create_linha' | 'edit_itinerary' = 'list';
  showLinhaDetailsModal: boolean = false;
  showConfirmationModal: boolean = false;

  linhasAtivas: LinhaDetails[] = [];
  linhasInativas: LinhaDetails[] = [];
  selectedLinha: LinhaDetails | null = null;

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
  googlePredictions: any[] = [];
  isLoadingPredictions: boolean = false;
  todasAsParadas: any[] = [];
  showParadasDropdown: boolean = false;
  draggedIndex: number | null = null;
  private searchDebounceTimeout: any = null;

  constructor(
    private loginService: LoginService,
    private linhaService: LinhaService,
    private router: Router,
    private googleMapsService: GoogleMapsService,
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
      return 'AGUARDANDO ITINERARIO(IDA)';
    }
    if (hasIda && !hasVolta) {
      return 'AGUARDANDO ITINERARIO(VOLTA)';
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
      case 'AGUARDANDO ITINERARIO(IDA)':
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
      },
      error: () => {
        this.isLoadingLinhas = false;
      },
    });
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
  openLinhaDetails(linha: LinhaDetails): void {
    this.selectedLinha = linha;
    this.showGeneralFleetDetails = false;
    this.showIdaFleetDetails = false;
    this.showVoltaFleetDetails = false;
    this.showLinhaDetailsModal = true;
  }

  selectLinhaCard(linha: LinhaDetails): void {
    this.openLinhaDetails(linha);
  }

  closeDetailsModal(): void {
    this.showLinhaDetailsModal = false;
  }

  editExistingItinerary(linha: LinhaDetails, sentido: 'IDA' | 'VOLTA'): void {
    this.closeDetailsModal();
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
    this.activeStep = 'edit_itinerary';
    this.ensureTodasAsParadasLoaded();
    setTimeout(() => this.initMapAndPlaces(), 120);
  }

  addNewItinerary(linha: LinhaDetails, sentido: 'IDA' | 'VOLTA'): void {
    this.closeDetailsModal();
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
    this.activeStep = 'edit_itinerary';
    this.ensureTodasAsParadasLoaded();
    setTimeout(() => this.initMapAndPlaces(), 120);
  }

  // --- Step 3: Itinerary Editing Logic ---
  saveItinerary(): void {
    if (!this.selectedLinha) return;

    this.linhaService
      .saveRotaItinerario(
        this.selectedLinha.codigo,
        this.selectedLinha.atendimento,
        this.itineraryForm.sentido,
        this.itineraryForm.prefixo,
        this.enderecos
      )
      .subscribe(() => {
        this.cleanupMap();
        this.activeStep = 'list';
        this.loadLinhas(true);
      });
  }

  cancelItineraryEdit(): void {
    this.cleanupMap();
    this.activeStep = 'list';
    this.refreshStoredLinhas();
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
    this.refreshMapAndRoute(true);
  }

  setupPlacesAutocomplete(): void {
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
          break;
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

      this.enderecos.push(newEndereco);
      this.searchQuery = '';
      input.value = '';
      this.showParadasDropdown = false;
      this.refreshMapAndRoute(false);
    });
  }

  setupMapClickListener(): void {
    if (!this.map) return;

    this.map.addListener('click', async (event: any) => {
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

      this.enderecos.push(newEndereco);
      this.refreshMapAndRoute(false);
    });
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
        if (result && this.routePolyline) {
          this.routePolyline.setPath(result.fullPath);
          this.routeMetrics = result;
        }
      } catch (err) {
        console.warn('[RotasComponent] Error calculating multi-chunk route:', err);
      } finally {
        this.isCalculatingRoute = false;
      }
    } else {
      if (this.routePolyline) {
        this.routePolyline.setPath([]);
      }
      this.routeMetrics = null;
      this.isCalculatingRoute = false;
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
          infoWindow.open(this.map, marker);
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
  }

  focusStopOnMap(index: number): void {
    const end = this.enderecos[index];
    if (end && end.lat && end.lng && this.map) {
      this.map.panTo({ lat: Number(end.lat), lng: Number(end.lng) });
      this.map.setZoom(16);
      if (this.mapMarkers[index]) {
        google.maps.event.trigger(this.mapMarkers[index], 'click');
      }
    }
  }

  cleanupMap(): void {
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

    this.map = null;
    this.isMapInitialized = false;
    this.isCalculatingRoute = false;
    this.routeMetrics = null;
  }

  // --- Paradas Manipulation & Search ---

  async addCustomEndereco(): Promise<void> {
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

  onDragStart(index: number): void {
    this.draggedIndex = index;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    if (this.draggedIndex !== null && this.draggedIndex !== dropIndex) {
      const draggedItem = this.enderecos[this.draggedIndex];
      this.enderecos.splice(this.draggedIndex, 1);
      this.enderecos.splice(dropIndex, 0, draggedItem);
      this.updateOrdem();
      this.refreshMapAndRoute(false);
    }
    this.draggedIndex = null;
  }

  updateOrdem(): void {
    this.enderecos.forEach((endereco, index) => {
      endereco.ordem = index;
    });
  }

  filterParadas(): void {
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

      this.enderecos.push(newEndereco);
      this.refreshMapAndRoute(false);
    } catch (err) {
      console.warn('[RotasComponent] Error selecting Google Place prediction:', err);
    }
  }

  openParadasDropdown(): void {
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
