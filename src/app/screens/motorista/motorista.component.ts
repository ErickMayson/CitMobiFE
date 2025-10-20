import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { User } from '../../models/userLiteResponse.model';
import { LoginService } from '../../services/login.service';

interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  status: 'EM ATENDIMENTO' | 'AGUARDANDO' | 'PAUSA' | 'FORA DE TURNO';
  horarios: HorarioMotorista[];
}

interface HorarioMotorista {
  veiculoId: string;
  veiculoPlaca: string;
  veiculoModelo: string;
  rotaId: string;
  rotaNome: string;
  startTime: string;
  endTime: string;
  days: string[];
}

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
}

interface Rota {
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

  motoristas: Motorista[] = [
    {
      id: 'M001',
      nome: 'João Silva',
      cpf: '123.456.789-00',
      telefone: '(11) 98765-4321',
      status: 'EM ATENDIMENTO',
      horarios: [
        {
          veiculoId: 'V001',
          veiculoPlaca: 'ABC-1234',
          veiculoModelo: 'Caio Millennium III',
          rotaId: 'R001',
          rotaNome: 'Linha 100 - Centro/Bairro',
          startTime: '06:00',
          endTime: '14:00',
          days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
        },
      ],
    },
    {
      id: 'M002',
      nome: 'Maria Santos',
      cpf: '987.654.321-00',
      telefone: '(11) 91234-5678',
      status: 'EM ATENDIMENTO',
      horarios: [
        {
          veiculoId: 'V002',
          veiculoPlaca: 'DEF-5678',
          veiculoModelo: 'Apache VIP V',
          rotaId: 'R002',
          rotaNome: 'Linha 200 - Expresso',
          startTime: '05:30',
          endTime: '13:30',
          days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'],
        },
      ],
    },
    {
      id: 'M003',
      nome: 'Pedro Oliveira',
      cpf: '456.789.123-00',
      telefone: '(11) 99876-5432',
      status: 'AGUARDANDO',
      horarios: [],
    },
    {
      id: 'M004',
      nome: 'Ana Costa',
      cpf: '321.654.987-00',
      telefone: '(11) 97654-3210',
      status: 'PAUSA',
      horarios: [
        {
          veiculoId: 'V001',
          veiculoPlaca: 'ABC-1234',
          veiculoModelo: 'Caio Millennium III',
          rotaId: 'R003',
          rotaNome: 'Linha 300 - Circular',
          startTime: '14:00',
          endTime: '22:00',
          days: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
        },
      ],
    },
    {
      id: 'M005',
      nome: 'Carlos Souza',
      cpf: '789.123.456-00',
      telefone: '(11) 96543-2109',
      status: 'FORA DE TURNO',
      horarios: [
        {
          veiculoId: 'V003',
          veiculoPlaca: 'GHI-9012',
          veiculoModelo: 'Caio Millennium III',
          rotaId: 'R004',
          rotaNome: 'Linha 400 - Terminal',
          startTime: '22:00',
          endTime: '06:00',
          days: ['DOM'],
        },
      ],
    },
  ];

  // Mock data para dropdowns
  veiculosDisponiveis: Veiculo[] = [
    { id: 'V001', placa: 'ABC-1234', modelo: 'Caio Millennium III' },
    { id: 'V002', placa: 'DEF-5678', modelo: 'Apache VIP V' },
    { id: 'V003', placa: 'GHI-9012', modelo: 'Caio Millennium III' },
    { id: 'V004', placa: 'JKL-3456', modelo: 'Apache VIP V' },
  ];

  rotasDisponiveis: Rota[] = [
    { id: 'R001', nome: 'Linha 100 - Centro/Bairro' },
    { id: 'R002', nome: 'Linha 200 - Expresso' },
    { id: 'R003', nome: 'Linha 300 - Circular' },
    { id: 'R004', nome: 'Linha 400 - Terminal' },
  ];

  showAddModal = false;
  showEditModal = false;
  showAddHorarioModal = false;
  showEditHorarioModal = false;
  selectedMotorista: Motorista | null = null;
  selectedDay: string = 'SEG';
  editingHorarioIndex: number = -1;

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

  constructor(private loginService: LoginService) {}

  ngOnInit(): void {
    this.sortMotoristas();
    this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });
    setTimeout(() => (this.showSidebarContent = true), 100);
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
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.newMotorista = { nome: '', cpf: '', telefone: '' };
  }

  handleAddMotorista(): void {
    if (
      this.newMotorista.nome &&
      this.newMotorista.cpf &&
      this.newMotorista.telefone
    ) {
      const motorista: Motorista = {
        id: `M${String(this.motoristas.length + 1).padStart(3, '0')}`,
        nome: this.newMotorista.nome,
        cpf: this.newMotorista.cpf,
        telefone: this.newMotorista.telefone,
        status: 'FORA DE TURNO',
        horarios: [],
      };

      this.motoristas.push(motorista);
      this.sortMotoristas();
      this.closeAddModal();
    }
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
      const index = this.motoristas.findIndex(
        (m) => m.id === this.selectedMotorista!.id
      );
      if (index !== -1) {
        this.motoristas[index] = this.selectedMotorista;
        this.sortMotoristas();
      }
    }
    this.closeEditModal();
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
      const rota = this.rotasDisponiveis.find(
        (r) => r.id === this.horarioForm.rotaId
      );

      if (veiculo && rota) {
        const newHorario: HorarioMotorista = {
          veiculoId: veiculo.id,
          veiculoPlaca: veiculo.placa,
          veiculoModelo: veiculo.modelo,
          rotaId: rota.id,
          rotaNome: rota.nome,
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
      const rota = this.rotasDisponiveis.find(
        (r) => r.id === this.horarioForm.rotaId
      );

      if (veiculo && rota) {
        this.selectedMotorista.horarios[this.editingHorarioIndex] = {
          veiculoId: veiculo.id,
          veiculoPlaca: veiculo.placa,
          veiculoModelo: veiculo.modelo,
          rotaId: rota.id,
          rotaNome: rota.nome,
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
