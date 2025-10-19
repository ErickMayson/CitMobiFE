import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { User } from '../../models/userLiteResponse.model';
import { LoginService } from '../../services/login.service';

interface Rota {
  id: number;
  nome: string;
  codigo: string;
  descricao: string;
  distancia: string;
  duracao: string;
  veiculos: number;
  status: 'ativa' | 'inativa';
  enderecos: Endereco[];
}

interface Endereco {
  id: number;
  nome: string;
  endereco: string;
  lat: number;
  lng: number;
  ordem: number;
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

  showEditView: boolean = false;
  isEditMode: boolean = false;
  isCreateMode: boolean = false;
  selectedRota: Rota | null = null;

  constructor(private loginService: LoginService) {}

  // Mock data - replace with API calls
  rotasAtivas: Rota[] = [
    {
      id: 1,
      nome: 'Linha 001 - Centro/Bairro A',
      codigo: '001',
      descricao: 'Rota principal do centro',
      distancia: '12.5 km',
      duracao: '45 min',
      veiculos: 8,
      status: 'ativa',
      enderecos: [],
    },
    {
      id: 2,
      nome: 'Linha 002 - Aeroporto/Centro',
      codigo: '002',
      descricao: 'Conexão aeroporto',
      distancia: '18.2 km',
      duracao: '35 min',
      veiculos: 5,
      status: 'ativa',
      enderecos: [],
    },
    {
      id: 3,
      nome: 'Linha 003 - Zona Norte/Sul',
      codigo: '003',
      descricao: 'Ligação norte-sul',
      distancia: '22.8 km',
      duracao: '55 min',
      veiculos: 12,
      status: 'ativa',
      enderecos: [],
    },
  ];

  rotasInativas: Rota[] = [
    {
      id: 4,
      nome: 'Linha 004 - Terminal A/B',
      codigo: '004',
      descricao: 'Rota entre terminais',
      distancia: '8.5 km',
      duracao: '25 min',
      veiculos: 0,
      status: 'inativa',
      enderecos: [],
    },
    {
      id: 5,
      nome: 'Linha 005 - Circular',
      codigo: '005',
      descricao: 'Rota circular centro',
      distancia: '15.0 km',
      duracao: '50 min',
      veiculos: 0,
      status: 'inativa',
      enderecos: [],
    },
  ];

  // Edit mode data
  enderecos: Endereco[] = [];
  searchQuery: string = '';
  draggedIndex: number | null = null;

  ngOnInit(): void {
    this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
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
  }

  viewRota(rota: Rota): void {
    this.isCreateMode = false;
    this.isEditMode = false;
    this.showEditView = true;
    this.selectedRota = rota;
    this.enderecos = [...rota.enderecos];
  }

  enableEditMode(): void {
    this.isEditMode = true;
  }

  closeEditView(): void {
    this.showEditView = false;
    this.isEditMode = false;
    this.isCreateMode = false;
    this.selectedRota = null;
    this.enderecos = [];
  }

  addEndereco(): void {
    const newEndereco: Endereco = {
      id: Date.now(),
      nome: 'Novo Endereço',
      endereco: '',
      lat: 0,
      lng: 0,
      ordem: this.enderecos.length,
    };
    this.enderecos.push(newEndereco);
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
    // TODO: Implement save logic
    console.log('Saving rota...', this.enderecos);
    this.closeEditView();
  }

  searchAddress(): void {
    // TODO: Implement Google Places API search
    console.log('Searching for:', this.searchQuery);
  }
}
