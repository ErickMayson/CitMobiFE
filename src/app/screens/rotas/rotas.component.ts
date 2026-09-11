import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { User } from '../../models/userLiteResponse.model';
import { LoginService } from '../../services/login.service';
import { LinhaService, LinhaDetails, LinhaAssignedVehicle } from '../../services/linha.service';
import { MockEndereco as Endereco } from '../../mock-data/mock-data';

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
export class RotasComponent implements OnInit {
  // Sidebar
  sidebarOpen: boolean = true;
  showSidebarContent: boolean = true;
  currentUser: User | null = null;
  companyLogo: string = 'assets/viacaoGatoPreto.png';

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
  todasAsParadas: any[] = [];
  showParadasDropdown: boolean = false;
  draggedIndex: number | null = null;

  constructor(
    private loginService: LoginService,
    private linhaService: LinhaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    this.loadLinhas();
    setTimeout(() => (this.showSidebarContent = true), 100);
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
        this.activeStep = 'list';
        this.loadLinhas(true);
      });
  }

  cancelItineraryEdit(): void {
    this.activeStep = 'list';
    this.refreshStoredLinhas();
  }

  addCustomEndereco(): void {
    const raw = this.searchQuery.trim() || 'Nova Parada';
    let nome = raw;
    let endereco = raw;

    const lastComma = raw.lastIndexOf(',');
    if (lastComma > 0) {
      nome = raw.substring(0, lastComma).trim();
      const resto = raw.substring(lastComma + 1).trim();
      endereco = `${nome}, ${resto}`;
    }

    const newEndereco: Endereco = {
      id: Date.now(),
      nome,
      endereco,
      cep: '',
      lat: 0,
      lng: 0,
      ordem: this.enderecos.length,
    };
    this.enderecos.push(newEndereco);
    this.searchQuery = '';
    this.filteredParadas = [];
    this.showParadasDropdown = false;
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
  }

  removeEndereco(index: number): void {
    this.enderecos.splice(index, 1);
    this.updateOrdem();
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
    }
    this.draggedIndex = null;
  }

  updateOrdem(): void {
    this.enderecos.forEach((endereco, index) => {
      endereco.ordem = index;
    });
  }

  filterParadas(): void {
    const q = this.searchQuery.trim();
    if (!q) {
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
    this.linhaService.getParadas(3550308, q).subscribe((paradas) => {
      this.filteredParadas = paradas || [];
    });
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
    }, 150);
  }
}
