import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { User } from '../../models/userLiteResponse.model';
import { LoginService } from '../../services/login.service';
import { LinhaService } from '../../services/linha.service';
import { MockRota as Rota, MockEndereco as Endereco } from '../../mock-data/mock-data';

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

  showEditView: boolean = false;
  isEditMode: boolean = false;
  isCreateMode: boolean = false;
  selectedRota: Rota | null = null;

  rotasAtivas: Rota[] = [];
  rotasInativas: Rota[] = [];

  // Edit mode data
  enderecos: Endereco[] = [];
  searchQuery: string = '';
  draggedIndex: number | null = null;

  // Metadata form values
  editRouteForm = {
    codigo: '',
    nome: '',
    descricao: '',
    status: 'ativa' as 'ativa' | 'inativa'
  };

  // Bus stops search database
  todasAsParadas: any[] = [];
  filteredParadas: any[] = [];

  constructor(
    private loginService: LoginService,
    private linhaService: LinhaService
  ) {}

  ngOnInit(): void {
    this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    this.loadRotas();
    this.loadTodasAsParadas();
  }

  loadRotas(): void {
    this.linhaService.getRotasAtivas().subscribe((data) => (this.rotasAtivas = data));
    this.linhaService.getRotasInativas().subscribe((data) => (this.rotasInativas = data));
  }

  loadTodasAsParadas(): void {
    this.linhaService.getParadas(3550308).subscribe((paradas) => {
      this.todasAsParadas = paradas || [];
      this.filteredParadas = [];
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  createNewRota(): void {
    this.isCreateMode = true;
    this.isEditMode = false;
    this.showEditView = true;
    this.selectedRota = null;
    this.enderecos = [];
    this.editRouteForm = {
      codigo: '',
      nome: '',
      descricao: '',
      status: 'ativa'
    };
    this.searchQuery = '';
    this.filteredParadas = [];
  }

  viewRota(rota: Rota): void {
    this.isCreateMode = false;
    this.isEditMode = false;
    this.showEditView = true;
    this.selectedRota = rota;
    this.enderecos = [];
    this.editRouteForm = {
      codigo: rota.codigo,
      nome: rota.nome,
      descricao: rota.descricao,
      status: rota.status as 'ativa' | 'inativa'
    };
    this.searchQuery = '';
    this.filteredParadas = [];

    // Fetch stops dynamically from backend itinerary endpoint, falling back to local mocks
    const atendimento = rota.codigo === '372F' || rota.codigo === '1178' || rota.codigo === '3301' || rota.codigo === '9051' || rota.codigo === '8000' ? '10' : '1';
    this.linhaService.getItinerarioForLine(rota.codigo, atendimento, 3550308).subscribe((paradas) => {
      if (paradas && paradas.length > 0) {
        this.enderecos = paradas;
      } else {
        this.enderecos = [...rota.enderecos];
      }
    });
  }

  enableEditMode(): void {
    this.isEditMode = true;
    if (this.selectedRota) {
      this.editRouteForm = {
        codigo: this.selectedRota.codigo,
        nome: this.selectedRota.nome,
        descricao: this.selectedRota.descricao,
        status: this.selectedRota.status as 'ativa' | 'inativa'
      };
    }
  }

  closeEditView(): void {
    this.showEditView = false;
    this.isEditMode = false;
    this.isCreateMode = false;
    this.selectedRota = null;
    this.enderecos = [];
    this.searchQuery = '';
    this.filteredParadas = [];
  }

  addEndereco(): void {
    this.addCustomEndereco();
  }

  addCustomEndereco(): void {
    const name = this.searchQuery.trim() || 'Nova Parada';
    const newEndereco: Endereco = {
      id: Date.now(),
      nome: name,
      endereco: 'Logradouro, número',
      lat: 0,
      lng: 0,
      ordem: this.enderecos.length,
    };
    this.enderecos.push(newEndereco);
    this.searchQuery = '';
    this.filteredParadas = [];
  }

  selectAndAddParada(p: any): void {
    const name = p.logradouro || 'Parada';
    const address = `${p.logradouro || ''}, ${p.numero || ''}`;
    const lat = Array.isArray(p.latLong) && p.latLong.length >= 2 ? p.latLong[0] : 0;
    const lng = Array.isArray(p.latLong) && p.latLong.length >= 2 ? p.latLong[1] : 0;

    const newEndereco: Endereco = {
      id: p.paradaId || Date.now(),
      nome: name,
      endereco: address,
      lat: lat,
      lng: lng,
      ordem: this.enderecos.length,
    };
    this.enderecos.push(newEndereco);
    this.searchQuery = '';
    this.filteredParadas = [];
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

  saveRota(): void {
    if (!this.editRouteForm.codigo || !this.editRouteForm.nome) {
      alert('Código da linha e Nome da linha são obrigatórios.');
      return;
    }

    if (this.isCreateMode) {
      const newId = Date.now();
      const newRota: Rota = {
        id: newId,
        nome: this.editRouteForm.nome,
        codigo: this.editRouteForm.codigo,
        descricao: this.editRouteForm.descricao || 'Nova rota criada pelo sistema',
        distancia: '12.5 km',
        duracao: '45 min',
        veiculos: 0,
        status: this.editRouteForm.status,
        enderecos: [...this.enderecos],
      };
      this.linhaService.saveRota(newRota).subscribe(() => {
        this.loadRotas();
        this.closeEditView();
      });
    } else if (this.selectedRota) {
      const updated: Rota = {
        ...this.selectedRota,
        nome: this.editRouteForm.nome,
        codigo: this.editRouteForm.codigo,
        descricao: this.editRouteForm.descricao,
        status: this.editRouteForm.status,
        enderecos: [...this.enderecos],
      };
      this.linhaService.saveRota(updated).subscribe(() => {
        this.loadRotas();
        this.closeEditView();
      });
    }
  }

  searchAddress(): void {
    this.filterParadas();
  }

  filterParadas(): void {
    const q = (this.searchQuery || '').toLowerCase().trim();
    if (!q) {
      this.filteredParadas = [];
      return;
    }
    this.filteredParadas = this.todasAsParadas.filter((p) => {
      const logradouro = (p.logradouro || '').toLowerCase();
      const numero = String(p.numero || '').toLowerCase();
      return logradouro.includes(q) || numero.includes(q);
    });
  }
}
