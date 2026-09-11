import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { User } from '../../models/userLiteResponse.model';
import { Motorista, HorarioMotorista } from '../../models/motorista.model';
import { LoginService } from '../../services/login.service';
import { MotoristaService } from '../../services/motorista.service';
import { VeiculoService } from '../../services/veiculo.service';
import { LinhaService } from '../../services/linha.service';
import { formatCpf, formatPhone, formatOnlyNumbers, abbreviateName } from '../../utils/mask.utils';
import { AbbreviateNamePipe } from '../../pipes/abbreviate-name.pipe';
import { Operador } from '../../models/operador.model';
import { OperadorService } from '../../services/operador.service';

interface VeiculoItem {
  id: string | number;
  placa: string;
  modelo: string;
}

interface LinhaItem {
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
  imports: [CommonModule, FormsModule, SidebarComponent, AbbreviateNamePipe],
  templateUrl: './motorista.component.html',
  styleUrls: ['./motorista.component.scss'],
})
export class MotoristaComponent implements OnInit {
  sidebarOpen: boolean = true;
  showSidebarContent: boolean = true;
  currentUser: User | null = null;
  companyLogo: string = 'assets/viacaoGatoPreto.png';

  isLoading: boolean = false;
  isLoadingVeiculosLinhas: boolean = false;
  private veiculosLinhasLoaded: boolean = false;

  motoristas: Motorista[] = [];
  veiculosDisponiveis: VeiculoItem[] = [];
  linhasDisponiveis: LinhaItem[] = [];
  operadoresDisponiveis: Operador[] = [];

  showAddModal = false;
  showEditModal = false;
  showAddHorarioModal = false;
  showEditHorarioModal = false;
  showTransferModal = false;

  selectedMotorista: Motorista | null = null;
  selectedMotoristaForTransfer: Motorista | null = null;
  targetOperadorId: number | null = null;
  selectedDay: string = this.getCurrentDayCode();
  editingHorarioIndex: number = -1;

  errorMessage: string = '';
  horarioErrorMessage: string = '';
  transferErrorMessage: string = '';
  isSaving: boolean = false;
  isTransferring: boolean = false;

  newMotorista = {
    nome: '',
    cpf: '',
    cnhNumero: '',
    cnhValidade: '',
    telefone: '',
  };

  get isAdmin(): boolean {
    return this.loginService.isAdmin();
  }

  get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newMotorista.cpf = formatCpf(input.value);
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newMotorista.telefone = formatPhone(input.value);
  }

  horarioForm = {
    veiculoId: '' as string | number,
    rotaId: '' as string | number,
    startTime: '06:00',
    endTime: '14:00',
    days: [] as string[],
    pausaInicio: '',
    pausaFim: '',
  };

  statusOrder = ['EM ATENDIMENTO', 'ATIVO', 'AGUARDANDO', 'PAUSA', 'FORA DE TURNO', 'INATIVO'];

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
    private operadorService: OperadorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });
    this.loadMotoristas();
    this.loadOperadores();
    setTimeout(() => (this.showSidebarContent = true), 100);
  }

  loadOperadores(): void {
    this.operadorService.getOperadores().subscribe({
      next: (ops) => {
        this.operadoresDisponiveis = ops || [];
      },
      error: () => {
        this.operadoresDisponiveis = [];
      },
    });
  }

  ensureVeiculosAndLinhasLoaded(): void {
    if (this.veiculosLinhasLoaded) return;
    this.isLoadingVeiculosLinhas = true;

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
        this.veiculosLinhasLoaded = true;
        this.isLoadingVeiculosLinhas = false;
      },
      error: () => {
        this.veiculosLinhasLoaded = true;
        this.isLoadingVeiculosLinhas = false;
      },
    });
  }

  checkQueryParamsForSelection(): void {
    this.route.queryParams.subscribe((params) => {
      const targetSearch = params['search'] || params['nome'] || params['cpf'];
      if (targetSearch && this.motoristas.length > 0) {
        const normTarget = targetSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const found = this.motoristas.find((m) => {
          const normName = (m.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const normCpf = (m.cpf || '').replace(/\D/g, '');
          const targetDigits = targetSearch.replace(/\D/g, '');
          return (normName && normName.includes(normTarget)) || (targetDigits && normCpf.includes(targetDigits));
        });
        if (found) {
          setTimeout(() => this.openEditModal(found), 150);
        }
      }
    });
  }

  loadMotoristas(forceRefresh: boolean = false): void {
    this.isLoading = true;
    this.motoristaService.getMotoristas(forceRefresh).subscribe({
      next: (data) => {
        this.motoristas = data || [];
        this.sortMotoristas();
        this.isLoading = false;
        this.checkQueryParamsForSelection();
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
      const indexA = this.statusOrder.indexOf(a.status);
      const indexB = this.statusOrder.indexOf(b.status);
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'EM ATENDIMENTO':
      case 'ATIVO':
        return 'status-active';
      case 'AGUARDANDO':
        return 'status-waiting';
      case 'PAUSA':
        return 'status-pause';
      case 'FORA DE TURNO':
      case 'INATIVO':
        return 'status-off';
      default:
        return 'status-off';
    }
  }

  isCnhExpired(validade?: string): boolean {
    if (!validade) return false;
    const exp = new Date(validade + 'T00:00:00');
    if (isNaN(exp.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return exp.getTime() < today.getTime();
  }

  isCnhExpiringSoon(validade?: string): boolean {
    if (!validade) return false;
    const exp = new Date(validade + 'T00:00:00');
    if (isNaN(exp.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = exp.getTime() - today.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
  }

  getCurrentHorario(motorista: Motorista): HorarioMotorista | null {
    if (!motorista.horarios || motorista.horarios.length === 0) return null;
    return motorista.horarios[0];
  }

  // CRUD Motorista
  openAddModal(): void {
    this.errorMessage = '';
    this.isSaving = false;
    this.newMotorista = {
      nome: '',
      cpf: '',
      cnhNumero: '',
      cnhValidade: '',
      telefone: '',
    };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.errorMessage = '';
    this.isSaving = false;
    this.newMotorista = {
      nome: '',
      cpf: '',
      cnhNumero: '',
      cnhValidade: '',
      telefone: '',
    };
  }

  handleAddMotorista(): void {
    this.errorMessage = '';
    if (
      !this.newMotorista.nome ||
      !this.newMotorista.cpf ||
      !this.newMotorista.cnhNumero ||
      !this.newMotorista.cnhValidade ||
      !this.newMotorista.telefone
    ) {
      this.errorMessage = 'Preencha todos os campos obrigatórios (incluindo CNH e validade).';
      return;
    }

    const cleanCpf = formatOnlyNumbers(this.newMotorista.cpf);
    if (cleanCpf.length !== 11) {
      this.errorMessage = 'CPF inválido. Certifique-se de digitar os 11 dígitos.';
      return;
    }

    if (this.newMotorista.cnhNumero.trim().length > 20) {
      this.errorMessage = 'Número da CNH deve ter no máximo 20 caracteres.';
      return;
    }

    this.isSaving = true;
    const motorista: Partial<Motorista> = {
      nome: this.newMotorista.nome.trim(),
      cpf: cleanCpf,
      cnhNumero: this.newMotorista.cnhNumero.trim(),
      cnhValidade: this.newMotorista.cnhValidade,
      telefone: this.newMotorista.telefone.trim(),
      status: 'FORA DE TURNO',
      horarios: [],
    };

    this.motoristaService.addMotorista(motorista).subscribe({
      next: () => {
        this.isSaving = false;
        this.loadMotoristas(true);
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

  openEditModal(motorista: Motorista): void {
    this.selectedMotorista = JSON.parse(JSON.stringify(motorista));
    this.showEditModal = true;
    this.selectedDay = this.getCurrentDayCode();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedMotorista = null;
  }

  handleSaveEdit(): void {
    if (this.selectedMotorista) {
      if (!this.selectedMotorista.nome || !this.selectedMotorista.cnhNumero || !this.selectedMotorista.cnhValidade) {
        alert('Preencha os campos obrigatórios da CNH e Nome.');
        return;
      }

      this.motoristaService.updateMotorista(this.selectedMotorista).subscribe({
        next: () => {
          this.loadMotoristas(true);
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

  handleDeleteMotorista(event: Event, motorista: Motorista): void {
    event.stopPropagation();
    if (confirm(`Deseja realmente inativar o motorista ${motorista.nome}?`)) {
      this.motoristaService.deleteMotorista(motorista.id).subscribe({
        next: () => {
          this.loadMotoristas(true);
          if (this.selectedMotorista?.id === motorista.id) {
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

  // Operator Transfer
  openTransferModal(event: Event, motorista: Motorista): void {
    event.stopPropagation();
    this.selectedMotoristaForTransfer = motorista;
    this.targetOperadorId = null;
    this.transferErrorMessage = '';
    this.isTransferring = false;
    this.showTransferModal = true;
  }

  closeTransferModal(): void {
    this.showTransferModal = false;
    this.selectedMotoristaForTransfer = null;
    this.targetOperadorId = null;
    this.transferErrorMessage = '';
    this.isTransferring = false;
  }

  handleConfirmTransfer(): void {
    if (!this.selectedMotoristaForTransfer) return;
    if (!this.targetOperadorId) {
      this.transferErrorMessage = 'Selecione a operadora de destino.';
      return;
    }

    if (this.selectedMotoristaForTransfer.operadorId === Number(this.targetOperadorId)) {
      this.transferErrorMessage = 'O motorista já está vinculado a esta operadora.';
      return;
    }

    this.isTransferring = true;
    this.transferErrorMessage = '';

    this.motoristaService
      .transferDriverOperator(this.selectedMotoristaForTransfer.id, Number(this.targetOperadorId))
      .subscribe({
        next: () => {
          this.isTransferring = false;
          this.loadMotoristas(true);
          this.closeTransferModal();
          if (this.showEditModal) {
            this.closeEditModal();
          }
        },
        error: (err) => {
          this.isTransferring = false;
          this.transferErrorMessage =
            err?.error?.message ||
            err?.error?.error ||
            'Erro ao transferir motorista para nova operadora.';
        },
      });
  }

  abbreviateName(name: string | null | undefined): string {
    return abbreviateName(name);
  }

  getInitials(name: string): string {
    if (!name) return 'M';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  // CRUD Horário with Split-Shift Validation
  openAddHorarioModal(): void {
    this.horarioErrorMessage = '';
    this.horarioForm = {
      veiculoId: '',
      rotaId: '',
      startTime: '06:00',
      endTime: '14:00',
      days: [],
      pausaInicio: '',
      pausaFim: '',
    };
    this.showAddHorarioModal = true;
    this.ensureVeiculosAndLinhasLoaded();
  }

  closeAddHorarioModal(): void {
    this.showAddHorarioModal = false;
    this.horarioErrorMessage = '';
  }

  openEditHorarioModal(index: number): void {
    const horario = this.selectedMotorista?.horarios[index];
    if (horario) {
      this.horarioErrorMessage = '';
      this.horarioForm = {
        veiculoId: horario.veiculoId,
        rotaId: horario.rotaId,
        startTime: horario.startTime,
        endTime: horario.endTime,
        days: [...horario.days],
        pausaInicio: horario.pausaInicio || '',
        pausaFim: horario.pausaFim || '',
      };
      this.editingHorarioIndex = index;
      this.showEditHorarioModal = true;
      this.ensureVeiculosAndLinhasLoaded();
    }
  }

  closeEditHorarioModal(): void {
    this.showEditHorarioModal = false;
    this.editingHorarioIndex = -1;
    this.horarioErrorMessage = '';
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

  private validateHorarioForm(excludeIndex: number = -1): boolean {
    this.horarioErrorMessage = '';

    if (
      !this.horarioForm.veiculoId ||
      !this.horarioForm.rotaId ||
      !this.horarioForm.startTime ||
      !this.horarioForm.endTime ||
      this.horarioForm.days.length === 0
    ) {
      this.horarioErrorMessage = 'Preencha todos os campos e selecione ao menos um dia da semana.';
      return false;
    }

    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const startMin = toMinutes(this.horarioForm.startTime);
    const endMin = toMinutes(this.horarioForm.endTime);

    if (startMin >= endMin) {
      this.horarioErrorMessage = 'O horário de início deve ser anterior ao horário de término.';
      return false;
    }

    // Split-Shift overlap check against existing schedules for the selected driver
    if (this.selectedMotorista?.horarios) {
      for (let i = 0; i < this.selectedMotorista.horarios.length; i++) {
        if (i === excludeIndex) continue;
        const other = this.selectedMotorista.horarios[i];
        const sharedDay = other.days.some((d) => this.horarioForm.days.includes(d));
        if (sharedDay) {
          const otherStart = toMinutes(other.startTime);
          const otherEnd = toMinutes(other.endTime);

          const hasOverlap = Math.max(startMin, otherStart) < Math.min(endMin, otherEnd);
          if (hasOverlap) {
            this.horarioErrorMessage = `Conflito de escala: Já existe turno entre ${other.startTime} e ${other.endTime} em dias coincidentes.`;
            return false;
          }
        }
      }
    }

    return true;
  }

  handleAddHorario(): void {
    if (!this.selectedMotorista || !this.validateHorarioForm()) {
      return;
    }

    const veiculo = this.veiculosDisponiveis.find(
      (v) => String(v.id) === String(this.horarioForm.veiculoId) || v.placa === this.horarioForm.veiculoId
    );
    const linha = this.linhasDisponiveis.find(
      (l) => String(l.id) === String(this.horarioForm.rotaId)
    );

    const newHorario: HorarioMotorista = {
      veiculoId: veiculo?.id || this.horarioForm.veiculoId,
      veiculoPlaca: veiculo?.placa || String(this.horarioForm.veiculoId),
      veiculoModelo: veiculo?.modelo || 'Padrão',
      rotaId: linha?.id || this.horarioForm.rotaId,
      rotaNome: linha?.nome || String(this.horarioForm.rotaId),
      startTime: this.horarioForm.startTime,
      endTime: this.horarioForm.endTime,
      days: [...this.horarioForm.days],
      pausaInicio: this.horarioForm.pausaInicio || undefined,
      pausaFim: this.horarioForm.pausaFim || undefined,
    };

    if (!this.selectedMotorista.horarios) {
      this.selectedMotorista.horarios = [];
    }
    this.selectedMotorista.horarios.push(newHorario);
    this.closeAddHorarioModal();
  }

  handleEditHorario(): void {
    if (
      !this.selectedMotorista ||
      this.editingHorarioIndex < 0 ||
      !this.validateHorarioForm(this.editingHorarioIndex)
    ) {
      return;
    }

    const veiculo = this.veiculosDisponiveis.find(
      (v) => String(v.id) === String(this.horarioForm.veiculoId) || v.placa === this.horarioForm.veiculoId
    );
    const linha = this.linhasDisponiveis.find(
      (l) => String(l.id) === String(this.horarioForm.rotaId)
    );

    this.selectedMotorista.horarios[this.editingHorarioIndex] = {
      veiculoId: veiculo?.id || this.horarioForm.veiculoId,
      veiculoPlaca: veiculo?.placa || String(this.horarioForm.veiculoId),
      veiculoModelo: veiculo?.modelo || 'Padrão',
      rotaId: linha?.id || this.horarioForm.rotaId,
      rotaNome: linha?.nome || String(this.horarioForm.rotaId),
      startTime: this.horarioForm.startTime,
      endTime: this.horarioForm.endTime,
      days: [...this.horarioForm.days],
      pausaInicio: this.horarioForm.pausaInicio || undefined,
      pausaFim: this.horarioForm.pausaFim || undefined,
    };
    this.closeEditHorarioModal();
  }

  removeHorario(index: number): void {
    if (this.selectedMotorista && this.selectedMotorista.horarios) {
      this.selectedMotorista.horarios.splice(index, 1);
    }
  }

  // Schedule visualization
  selectDay(day: string): void {
    this.selectedDay = day;
  }

  getScheduleBlocks(): ScheduleBlock[] {
    if (!this.selectedMotorista || !this.selectedMotorista.horarios) return [];

    const blocks: ScheduleBlock[] = [];

    this.selectedMotorista.horarios
      .filter((h) => h.days && h.days.includes(this.selectedDay))
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
      const indexA = this.statusOrder.indexOf(a.status);
      const indexB = this.statusOrder.indexOf(b.status);
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  formatCPF(cpf: string): string {
    return formatCpf(cpf);
  }

  formatPhone(phone: string): string {
    return formatPhone(phone);
  }
}
