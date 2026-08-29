import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { User } from '../../models/userLiteResponse.model';
import { LoginService } from '../../services/login.service';
import { MotoristaService } from '../../services/motorista.service';
import { VeiculoService } from '../../services/veiculo.service';
import { LinhaService } from '../../services/linha.service';
import {
  MockMotorista as Motorista,
  MockHorarioMotorista as HorarioMotorista,
  MOCK_VEICULOS_DISPONIVEIS as VEICULOS_DISPONIVEIS,
  MOCK_LINHAS_DISPONIVEIS as LINHAS_DISPONIVEIS,
} from '../../mock-data/mock-data';

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
}

interface Linha {
  id: string;
  nome: string;
}

interface ScheduleBlock {
  type: 'schedule';
  veiculoPlaca: string;
  veiculoModelo: string;
  rotaNome: string;
  start: number;
  end: number;
  duration: number;
}

@Component({
  selector: 'app-motorista',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './motorista.component.html',
  styleUrls: ['./motorista.component.scss'],
})
export class MotoristaComponent implements OnInit {
  sidebarOpen: boolean = true;
  showSidebarContent: boolean = true;
  currentUser: User | null = null;
  companyLogo: string = 'assets/viacaoGatoPreto.png';

  isLoading: boolean = true;
  motoristas: Motorista[] = [];
  veiculosDisponiveis: Veiculo[] = VEICULOS_DISPONIVEIS;
  linhasDisponiveis: Linha[] = LINHAS_DISPONIVEIS;

  showAddModal = false;
  showEditModal = false;
  showAddHorarioModal = false;
  showEditHorarioModal = false;
  selectedMotorista: Motorista | null = null;
  selectedDay: string = 'SEG';
  editingHorarioIndex: number = -1;

  errorMessage: string = '';
  isSaving: boolean = false;

  newMotorista = {
    nome: '',
    cpf: '',
    telefone: '',
  };

  horarioForm = {
    veiculoId: '',
    rotaId: '',
    startTime: '06:00',
    endTime: '14:00',
    days: [] as string[],
  };

  statusOrder = ['EM ATENDIMENTO', 'AGUARDANDO', 'PAUSA', 'FORA DE TURNO'];

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
    private loginService: LoginService,
    private motoristaService: MotoristaService,
    private veiculoService: VeiculoService,
    private linhaService: LinhaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });
    this.loadMotoristas();
    this.loadVeiculosAndLinhas();
    setTimeout(() => (this.showSidebarContent = true), 100);
  }

  loadVeiculosAndLinhas(): void {
    this.veiculoService.getVeiculos().subscribe({
      next: (veiculos) => {
        if (veiculos && veiculos.length > 0) {
          this.veiculosDisponiveis = veiculos.map((v) => ({
            id: v.id || v.plate,
            placa: v.plate,
            modelo: v.model,
          }));
        }
      },
      error: () => {},
    });

    this.linhaService.getLinhas().subscribe({
      next: (linhas) => {
        if (linhas && linhas.length > 0) {
          this.linhasDisponiveis = linhas.map((l) => ({
            id: `${l.codigo}-${l.atendimento}`,
            nome: l.descricao || `${l.codigo} - ${l.partida} / ${l.chegada}`,
          }));
        }
      },
      error: () => {},
    });
  }

  loadMotoristas(): void {
    this.isLoading = true;
    this.motoristaService.getMotoristas().subscribe({
      next: (data) => {
        this.motoristas = (data || []) as Motorista[];
        this.sortMotoristas();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401 || err.status === 403) {
          this.loginService.logout();
          this.router.navigate(['/login']);
        }
      },
    });
  }

  get sortedMotoristas(): Motorista[] {
    return [...this.motoristas].sort((a, b) => {
      return (
        this.statusOrder.indexOf(a.status) - this.statusOrder.indexOf(b.status)
      );
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'EM ATENDIMENTO':
        return 'status-active';
      case 'AGUARDANDO':
        return 'status-waiting';
      case 'PAUSA':
        return 'status-pause';
      case 'FORA DE TURNO':
        return 'status-off';
      default:
        return 'status-off';
    }
  }

  getCurrentHorario(motorista: Motorista): HorarioMotorista | null {
    if (motorista.horarios.length === 0) return null;
    return motorista.horarios[0];
  }

  // CRUD Motorista
  openAddModal(): void {
    this.errorMessage = '';
    this.isSaving = false;
    this.newMotorista = { nome: '', cpf: '', telefone: '' };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.errorMessage = '';
    this.isSaving = false;
    this.newMotorista = { nome: '', cpf: '', telefone: '' };
  }

  handleAddMotorista(): void {
    this.errorMessage = '';
    if (!this.newMotorista.nome || !this.newMotorista.cpf || !this.newMotorista.telefone) {
      this.errorMessage = 'Preencha todos os campos obrigatórios.';
      return;
    }

    const cleanCpf = this.newMotorista.cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      this.errorMessage = 'CPF inválido. Certifique-se de digitar os 11 dígitos.';
      return;
    }

    this.isSaving = true;
    const motorista: Motorista = {
      id: `M${String(this.motoristas.length + 1).padStart(3, '0')}`,
      nome: this.newMotorista.nome,
      cpf: this.newMotorista.cpf,
      telefone: this.newMotorista.telefone,
      status: 'FORA DE TURNO',
      horarios: [],
    };

    this.motoristaService.addMotorista(motorista).subscribe({
      next: () => {
        this.isSaving = false;
        this.loadMotoristas();
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
            'Erro ao cadastrar motorista no servidor. Verifique os dados e tente novamente.';
        }
      },
    });
  }

  openEditModal(motorista: Motorista): void {
    this.selectedMotorista = JSON.parse(JSON.stringify(motorista));
    this.showEditModal = true;
    this.selectedDay = 'SEG';
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedMotorista = null;
  }

  handleSaveEdit(): void {
    if (this.selectedMotorista) {
      this.motoristaService.updateMotorista(this.selectedMotorista).subscribe({
        next: () => {
          this.loadMotoristas();
          this.closeEditModal();
        },
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            this.loginService.logout();
            this.router.navigate(['/login']);
          }
        }
      });
    }
  }

  handleDeleteMotorista(event: Event, motorista: Motorista): void {
    event.stopPropagation();
    if (confirm(`Deseja realmente inativar o motorista ${motorista.nome}?`)) {
      this.motoristaService.deleteMotorista(motorista.id).subscribe({
        next: () => {
          this.loadMotoristas();
          if (this.selectedMotorista?.id === motorista.id) {
            this.closeEditModal();
          }
        },
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            this.loginService.logout();
            this.router.navigate(['/login']);
          }
        }
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return 'M';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }


  // CRUD Horário
  openAddHorarioModal(): void {
    this.horarioForm = {
      veiculoId: '',
      rotaId: '',
      startTime: '06:00',
      endTime: '14:00',
      days: [],
    };
    this.showAddHorarioModal = true;
  }

  closeAddHorarioModal(): void {
    this.showAddHorarioModal = false;
  }

  openEditHorarioModal(index: number): void {
    const horario = this.selectedMotorista?.horarios[index];
    if (horario) {
      this.horarioForm = {
        veiculoId: horario.veiculoId,
        rotaId: horario.rotaId,
        startTime: horario.startTime,
        endTime: horario.endTime,
        days: [...horario.days],
      };
      this.editingHorarioIndex = index;
      this.showEditHorarioModal = true;
    }
  }

  closeEditHorarioModal(): void {
    this.showEditHorarioModal = false;
    this.editingHorarioIndex = -1;
  }

  toggleHorarioDay(day: string): void {
    const index = this.horarioForm.days.indexOf(day);
    if (index > -1) {
      this.horarioForm.days.splice(index, 1);
    } else {
      this.horarioForm.days.push(day);
    }
  }

  isHorarioDaySelected(day: string): boolean {
    return this.horarioForm.days.includes(day);
  }

  handleAddHorario(): void {
    if (
      this.selectedMotorista &&
      this.horarioForm.veiculoId &&
      this.horarioForm.rotaId &&
      this.horarioForm.startTime &&
      this.horarioForm.endTime &&
      this.horarioForm.days.length > 0
    ) {
      const veiculo = this.veiculosDisponiveis.find(
        (v) => v.id === this.horarioForm.veiculoId
      );
      const linha = this.linhasDisponiveis.find(
        (l) => l.id === this.horarioForm.rotaId
      );

      if (veiculo && linha) {
        const newHorario: HorarioMotorista = {
          veiculoId: veiculo.id,
          veiculoPlaca: veiculo.placa,
          veiculoModelo: veiculo.modelo,
          rotaId: linha.id,
          rotaNome: linha.nome,
          startTime: this.horarioForm.startTime,
          endTime: this.horarioForm.endTime,
          days: [...this.horarioForm.days],
        };
        this.selectedMotorista.horarios.push(newHorario);
        this.closeAddHorarioModal();
      }
    }
  }

  handleEditHorario(): void {
    if (
      this.selectedMotorista &&
      this.editingHorarioIndex >= 0 &&
      this.horarioForm.veiculoId &&
      this.horarioForm.rotaId &&
      this.horarioForm.startTime &&
      this.horarioForm.endTime &&
      this.horarioForm.days.length > 0
    ) {
      const veiculo = this.veiculosDisponiveis.find(
        (v) => v.id === this.horarioForm.veiculoId
      );
      const linha = this.linhasDisponiveis.find(
        (l) => l.id === this.horarioForm.rotaId
      );

      if (veiculo && linha) {
        this.selectedMotorista.horarios[this.editingHorarioIndex] = {
          veiculoId: veiculo.id,
          veiculoPlaca: veiculo.placa,
          veiculoModelo: veiculo.modelo,
          rotaId: linha.id,
          rotaNome: linha.nome,
          startTime: this.horarioForm.startTime,
          endTime: this.horarioForm.endTime,
          days: [...this.horarioForm.days],
        };
        this.closeEditHorarioModal();
      }
    }
  }

  removeHorario(index: number): void {
    if (this.selectedMotorista) {
      this.selectedMotorista.horarios.splice(index, 1);
    }
  }

  // Schedule visualization
  selectDay(day: string): void {
    this.selectedDay = day;
  }

  getScheduleBlocks(): ScheduleBlock[] {
    if (!this.selectedMotorista) return [];

    const blocks: ScheduleBlock[] = [];

    this.selectedMotorista.horarios
      .filter((h) => h.days.includes(this.selectedDay))
      .forEach((horario) => {
        const start = parseInt(horario.startTime.split(':')[0]);
        const end = parseInt(horario.endTime.split(':')[0]);
        blocks.push({
          type: 'schedule',
          veiculoPlaca: horario.veiculoPlaca,
          veiculoModelo: horario.veiculoModelo,
          rotaNome: horario.rotaNome,
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

  private sortMotoristas(): void {
    this.motoristas.sort((a, b) => {
      return (
        this.statusOrder.indexOf(a.status) - this.statusOrder.indexOf(b.status)
      );
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  formatCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  formatPhone(phone: string): string {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
}
