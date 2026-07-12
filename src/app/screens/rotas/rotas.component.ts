import { Component, OnInit, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { User } from '../../models/userLiteResponse.model';
import { LoginService } from '../../services/login.service';
import { LinhaService, LinhaDetails } from '../../services/linha.service';
import { MockEndereco as Endereco } from '../../mock-data/mock-data';

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
    descricao: ''
  };

  // Step 2 & 3: Itinerary Form State
  itineraryForm = {
    sentido: 'IDA' as 'IDA' | 'VOLTA',
    prefixo: ''
  };
  enderecos: Endereco[] = [];
  searchQuery: string = '';
  filteredParadas: any[] = [];
  todasAsParadas: any[] = [];
  showParadasDropdown: boolean = false;
  draggedIndex: number | null = null;

  constructor(
    private loginService: LoginService,
    private linhaService: LinhaService
  ) {
    afterNextRender(() => {
      this.loadLinhas();
      this.loadTodasAsParadas();
    });
  }

  ngOnInit(): void {
    this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    this.loadLinhas();
    this.loadTodasAsParadas();
  }

  loadLinhas(): void {
    this.linhaService.getLinhas().subscribe((data) => {
      if (data) {
        this.linhasAtivas = data.filter((l) => l.status === 'ativa');
        this.linhasInativas = data.filter((l) => l.status === 'inativa');
      }
    });
  }

  loadTodasAsParadas(): void {
    this.linhaService.getParadas(3550308).subscribe((paradas) => {
      this.todasAsParadas = paradas || [];
      this.filteredParadas = [];
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

    // Create temporary selectedLinha context
    this.selectedLinha = {
      id: Date.now(),
      codigo: this.linhaForm.codigo,
      atendimento: this.linhaForm.atendimento,
      partida: this.linhaForm.partida,
      chegada: this.linhaForm.chegada,
      nome: this.linhaForm.descricao,
      descricao: this.linhaForm.descricao,
      status: 'inativa',
      rotas: {}
    };}

  confirmSkipRota(): void {
    this.showConfirmationModal = false;
    this.activeStep = 'list';
    this.refreshStoredLinhas();
  }

  // --- Linha Cards Details & Actions ---
  selectLinhaCard(linha: LinhaDetails): void {
    this.selectedLinha = linha;
    this.showLinhaDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showLinhaDetailsModal = false;
    this.selectedLinha = null;
  }

  editExistingItinerary(linha: LinhaDetails, sentido: 'IDA' | 'VOLTA'): void {
    this.closeDetailsModal();
    this.selectedLinha = linha;
    this.itineraryForm.sentido = sentido;

    // Fill form context from Linha
    this.linhaForm = {
      codigo: linha.codigo,
      atendimento: linha.atendimento,
      partida: linha.partida,
      chegada: linha.chegada,
      descricao: linha.descricao,
    };

    if (sentido === 'IDA') {
      this.itineraryForm.prefixo = linha.rotas.ida?.prefixo || `${linha.partida} - ${linha.chegada}`;
      this.enderecos = linha.rotas.ida?.enderecos ? [...linha.rotas.ida.enderecos] : [];
    } else {
      this.itineraryForm.prefixo = linha.rotas.volta?.prefixo || `${linha.chegada} - ${linha.partida}`;
      this.enderecos = linha.rotas.volta?.enderecos ? [...linha.rotas.volta.enderecos] : [];
    }

    this.searchQuery = '';
    this.filteredParadas = [];
    this.activeStep = 'edit_itinerary';
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
        this.refreshStoredLinhas();
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
    const lat = Array.isArray(p.latLong) && p.latLong.length >= 2 ? p.latLong[0] : 0;
    const lng = Array.isArray(p.latLong) && p.latLong.length >= 2 ? p.latLong[1] : 0;

    const newEndereco: Endereco = {
      id: p.paradaId || Date.now(),
      nome: name,
      endereco: address,
      cep,
      lat: lat,
      lng: lng,
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
