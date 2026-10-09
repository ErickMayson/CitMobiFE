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
import { LinhaService, LinhaDetails } from '../../services/linha.service';
import { TelemetriaService } from '../../services/telemetria.service';
import { TelemetriaVeiculo, ViagemAtiva } from '../../models/telemetria.model';
import { formatCpf, formatPhone, formatOnlyNumbers, abbreviateName } from '../../utils/mask.utils';
import {
  formatTransitLocation,
  abbreviateTransitLocation,
  expandTransitLocation,
} from '../../utils/transit.utils';
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
  tooltip?: string;
  isGoing?: boolean;
  isActiveNow?: boolean;
}

import { TransitLocationPipe, AbbreviateTransitPipe } from '../../pipes/transit-location.pipe';

@Component({
  selector: 'app-motorista',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, AbbreviateNamePipe, TransitLocationPipe, AbbreviateTransitPipe],
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
  linhasList: LinhaDetails[] = [];
  veiculosAtivosList: TelemetriaVeiculo[] = [];
  viagensAtivasList: ViagemAtiva[] = [];

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

  // Dynamic Search & Filter State
  searchQuery: string = '';
  isSearchOpen: boolean = false;
  selectedStatusFilter: string = '';

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
    private telemetriaService: TelemetriaService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });
    this.loadMotoristas();
    this.loadOperadores();
    this.ensureVeiculosAndLinhasLoaded();
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
    if (this.veiculosLinhasLoaded) {
      this.refreshTelemetry();
      return;
    }
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
        this.linhasList = linhas || [];
        if (linhas && linhas.length > 0) {
          this.linhasDisponiveis = linhas.map((l) => ({
            id: `${l.codigo}-${l.atendimento}`,
            nome: this.formatLinhaFullName(l),
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

    this.refreshTelemetry();
  }

  refreshTelemetry(): void {
    this.telemetriaService.getVeiculosAtivos().subscribe({
      next: (veiculos) => (this.veiculosAtivosList = veiculos || []),
      error: () => {},
    });

    this.telemetriaService.getViagensAtivas().subscribe({
      next: (viagens) => (this.viagensAtivasList = viagens || []),
      error: () => {},
    });
  }

  checkQueryParamsForSelection(): void {
    this.route.queryParams.subscribe((params) => {
      const targetSearch = params['search'] || params['nome'] || params['cpf'];
      if (targetSearch && this.motoristas.length > 0) {
        this.searchQuery = targetSearch;
        this.isSearchOpen = true;
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

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.isSearchOpen) {
      setTimeout(() => {
        const input = document.getElementById('search-motoristas-input') as HTMLInputElement;
        if (input) input.focus();
      }, 50);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedStatusFilter = '';
  }

  setStatusFilter(status: string): void {
    this.selectedStatusFilter = this.selectedStatusFilter === status ? '' : status;
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

  get filteredMotoristas(): Motorista[] {
    if (!this.motoristas) return [];
    let result = this.sortedMotoristas;

    if (this.selectedStatusFilter) {
      result = result.filter((m) => {
        if (this.selectedStatusFilter === 'EXPIRING_CNH') {
          return this.isCnhExpired(m.cnhValidade) || this.isCnhExpiringSoon(m.cnhValidade);
        }
        return m.status === this.selectedStatusFilter;
      });
    }

    const q = this.normalizeSearchText(this.searchQuery);
    if (!q) return result;

    const terms = q.split(' ').filter(Boolean);
    const cleanDigits = this.searchQuery.replace(/\D/g, '');

    return result.filter((m) => {
      const name = m.nome || '';
      const cpf = m.cpf || '';
      const cnh = m.cnhNumero || '';
      const telefone = m.telefone || '';
      const status = m.status || '';
      const operador = m.operadorNome || '';
      const schedulesInfo = (m.horarios || []).map((h) => `${h.veiculoPlaca || ''} ${h.veiculoModelo || ''} ${h.rotaNome || ''}`).join(' ');

      const searchableBlob = this.normalizeSearchText(
        `${name} ${cpf} ${cnh} ${telefone} ${status} ${operador} ${schedulesInfo}`
      );

      const matchesTerms = terms.every((term) => searchableBlob.includes(term));
      const matchesCpfDigits = cleanDigits.length > 0 && cpf.replace(/\D/g, '').includes(cleanDigits);

      return matchesTerms || matchesCpfDigits;
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
    this.ensureVeiculosAndLinhasLoaded();
    this.refreshTelemetry();
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

  findLinha(horario: HorarioMotorista): LinhaDetails | undefined {
    if (!this.linhasList || this.linhasList.length === 0) return undefined;

    const rotaIdStr = String(horario.rotaId || '').trim();
    const rotaNomeStr = String(horario.rotaNome || '').trim();
    const cleanPlaca = String(horario.veiculoPlaca || '').replace(/\D/g, '').toUpperCase();

    // 1. Direct match by id or codigo-atendimento
    let found = this.linhasList.find((l) =>
      String(l.id) === rotaIdStr ||
      `${l.codigo}-${l.atendimento}`.toLowerCase() === rotaIdStr.toLowerCase() ||
      l.codigo.toLowerCase() === rotaIdStr.toLowerCase()
    );
    if (found) return found;

    // 2. Match by route name containing line code
    found = this.linhasList.find((l) => {
      const cleanCode = l.codigo.replace(/\D/g, '');
      if (!cleanCode) return false;
      const regex = new RegExp(`(^|\\D)${cleanCode}(\\D|$)`, 'i');
      return regex.test(rotaNomeStr) || rotaNomeStr.includes(l.codigo);
    });
    if (found) return found;

    // 3. Match by vehicle plate assigned to line
    if (cleanPlaca) {
      found = this.linhasList.find((l) =>
        l.assignedVehicles?.some((v) => v.plate.replace(/\D/g, '').toUpperCase() === cleanPlaca)
      );
      if (found) return found;
    }

    return undefined;
  }

  formatLocationName(name: string, mode: 'full' | 'short' | 'standard' = 'standard'): string {
    return formatTransitLocation(name, { mode });
  }

  abbreviateLocationName(name: string): string {
    return abbreviateTransitLocation(name);
  }

  private getShortLocationName(name: string): string {
    if (!name) return '';
    return name
      .replace(/^(Term\.|Terminal|Praça|Praca|Pça\.|Pca\.|Metrô|Metro)\s+/i, '')
      .trim();
  }

  private extractDestination(prefixo: string): string {
    if (!prefixo) return '';
    if (prefixo.includes(' - ')) {
      const parts = prefixo.split(' - ');
      return parts[parts.length - 1].trim();
    }
    if (prefixo.includes('/')) {
      const parts = prefixo.split('/');
      return parts[parts.length - 1].trim();
    }
    return prefixo.trim();
  }

  formatLinhaFullName(l: LinhaDetails): string {
    const code = `${l.codigo}-${l.atendimento || '10'}`;

    if (l.partida && l.chegada) {
      const part = this.formatLocationName(l.partida);
      const cheg = this.formatLocationName(l.chegada);
      return `${code} - ${part} - ${cheg}`;
    }

    if (l.descricao) {
      if (l.descricao.includes('-')) {
        const parts = l.descricao.split('-');
        const part = this.formatLocationName(parts[0]);
        const cheg = this.formatLocationName(parts[1]);
        return `${code} - ${part} - ${cheg}`;
      }
      if (l.descricao.toLowerCase().startsWith(l.codigo.toLowerCase())) {
        return l.descricao;
      }
      return `${code} - ${this.formatLocationName(l.descricao)}`;
    }

    return `Linha ${code}`;
  }

  getCurrentDirectionInfo(horario: HorarioMotorista): {
    isGoing: boolean;
    sentido?: 'IDA' | 'VOLTA';
    destination?: string;
    shortDestination?: string;
    displayLabel?: string;
    englishLabel?: string;
  } {
    const linha = this.findLinha(horario);
    if (!linha) {
      return { isGoing: false };
    }

    const status = this.selectedMotorista?.status;
    const isDriverActiveStatus = status === 'EM ATENDIMENTO' || status === 'ATIVO';

    const todayCode = this.getCurrentDayCode();
    const isToday = horario.days && horario.days.includes(todayCode);

    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = (horario.startTime || '00:00').split(':').map(Number);
    const [eh, em] = (horario.endTime || '23:59').split(':').map(Number);
    const startMin = sh * 60 + (sm || 0);
    const endMin = eh * 60 + (em || 0);
    const isWithinShift = isToday && curMin >= startMin && curMin <= endMin;

    let sentido: 'IDA' | 'VOLTA' | undefined;
    const cleanPlaca = (horario.veiculoPlaca || '').replace(/\D/g, '').toUpperCase();
    const driverId = this.selectedMotorista?.id;
    const driverName = (this.selectedMotorista?.nome || '').toLowerCase().trim();

    // 1. Check active trip
    const activeTrip = this.viagensAtivasList.find((v) => {
      const vPlaca = (v.veiculoPlaca || '').replace(/\D/g, '').toUpperCase();
      const vMotorista = (v.motoristaNome || '').toLowerCase().trim();
      const matchDriver = (driverId && v.usuarioId === driverId) || (driverName && vMotorista.includes(driverName));
      const matchPlate = cleanPlaca && vPlaca === cleanPlaca;
      return v.status === 'EM_ANDAMENTO' && (matchDriver || matchPlate);
    });

    if (activeTrip?.sentido) {
      sentido = activeTrip.sentido;
    }

    // 2. Check live telemetry
    if (!sentido) {
      const liveTel = this.veiculosAtivosList.find((t) => {
        const tPlaca = (t.placa || '').replace(/\D/g, '').toUpperCase();
        const tMotorista = (t.motoristaNome || '').toLowerCase().trim();
        const matchPlate = cleanPlaca && tPlaca === cleanPlaca;
        const matchDriver = driverName && tMotorista.includes(driverName);
        return matchPlate || matchDriver;
      });
      if (liveTel?.sentido) {
        sentido = liveTel.sentido;
      }
    }

    // Only pinpoint direction if verified from telemetry or active trips. Do NOT guess direction.
    if (!sentido) {
      return { isGoing: false };
    }

    // Destination determination
    let destRaw = '';
    if (sentido === 'IDA') {
      destRaw = linha.chegada || (linha.rotas?.ida?.prefixo ? this.extractDestination(linha.rotas.ida.prefixo) : '') || '';
      if (!destRaw && linha.descricao?.includes('-')) {
        destRaw = linha.descricao.split('-')[1]?.trim() || '';
      }
    } else {
      destRaw = linha.partida || (linha.rotas?.volta?.prefixo ? this.extractDestination(linha.rotas.volta.prefixo) : '') || '';
      if (!destRaw && linha.descricao?.includes('-')) {
        destRaw = linha.descricao.split('-')[0]?.trim() || '';
      }
    }

    const destination = this.formatLocationName(destRaw || (sentido === 'IDA' ? 'Ida' : 'Volta'));
    const shortDestination = this.getShortLocationName(destination);
    const lineCode = `${linha.codigo}-${linha.atendimento || '10'}`;

    return {
      isGoing: true,
      sentido,
      destination,
      shortDestination,
      displayLabel: `${lineCode} - ${destination}`,
      englishLabel: `${lineCode} - ${destination}`,
    };
  }

  getFormattedHorarioRota(horario: HorarioMotorista): string {
    const linha = this.findLinha(horario);
    if (linha) {
      return this.formatLinhaFullName(linha);
    }
    const raw = horario.rotaNome || '';
    if (raw.startsWith('Linha ') && raw.includes('-')) {
      return raw.replace('Linha ', '').trim();
    }
    return raw || 'Linha Operacional';
  }

  getHorarioDirectionBadge(horario: HorarioMotorista): string | null {
    const dirInfo = this.getCurrentDirectionInfo(horario);
    if (!dirInfo.isGoing || !dirInfo.destination) return null;
    return `Indo para: ${dirInfo.destination}`;
  }

  // Schedule visualization
  selectDay(day: string): void {
    this.selectedDay = day;
  }

  getScheduleBlocks(): ScheduleBlock[] {
    if (!this.selectedMotorista || !this.selectedMotorista.horarios) return [];

    const blocks: ScheduleBlock[] = [];
    const isViewingToday = this.selectedDay === this.getCurrentDayCode();

    this.selectedMotorista.horarios
      .filter((h) => h.days && h.days.includes(this.selectedDay))
      .forEach((horario) => {
        const start = parseInt(horario.startTime.split(':')[0], 10);
        const end = parseInt(horario.endTime.split(':')[0], 10);
        const duration = Math.max(1, end - start);
        const fullLineName = this.getFormattedHorarioRota(horario);
        const dirInfo = isViewingToday ? this.getCurrentDirectionInfo(horario) : { isGoing: false };

        let displayRoute = fullLineName;
        if (dirInfo.isGoing && dirInfo.displayLabel) {
          displayRoute = dirInfo.displayLabel;
        }

        // If timeline block is narrow (duration <= 3 hours), abbreviate transit terms
        // (e.g. "Praça" -> "Pça.", "Avenida" -> "Av.", "Hospital" -> "Hosp.") so it fits cleanly
        if (duration <= 3) {
          displayRoute = abbreviateTransitLocation(displayRoute);
        }

        const now = new Date();
        const curMin = now.getHours() * 60 + now.getMinutes();
        const [sh, sm] = (horario.startTime || '00:00').split(':').map(Number);
        const [eh, em] = (horario.endTime || '23:59').split(':').map(Number);
        const startMin = sh * 60 + (sm || 0);
        const endMin = eh * 60 + (em || 0);
        const isWithinShift = isViewingToday && curMin >= startMin && curMin <= endMin;

        const cleanPlaca = (horario.veiculoPlaca || '').replace(/\D/g, '').toUpperCase();
        const driverId = this.selectedMotorista?.id;
        const driverName = (this.selectedMotorista?.nome || '').toLowerCase().trim();

        const hasActiveTrip = this.viagensAtivasList.some((v) => {
          const vPlaca = (v.veiculoPlaca || '').replace(/\D/g, '').toUpperCase();
          const vMotorista = (v.motoristaNome || '').toLowerCase().trim();
          const matchDriver = (driverId && v.usuarioId === driverId) || (driverName && vMotorista.includes(driverName));
          const matchPlate = cleanPlaca && vPlaca === cleanPlaca;
          return v.status === 'EM_ANDAMENTO' && (matchDriver || matchPlate);
        });

        const status = this.selectedMotorista?.status;
        const isDriverActiveStatus = status === 'EM ATENDIMENTO' || status === 'ATIVO';

        const isActiveNow = isViewingToday && (hasActiveTrip || (isDriverActiveStatus && isWithinShift));

        const tooltip = `${horario.veiculoPlaca} (${horario.veiculoModelo || 'Padrão'}) • ${fullLineName} (${horario.startTime} - ${horario.endTime})${dirInfo.isGoing ? ' • Indo para: ' + dirInfo.destination : ''} [${isActiveNow ? 'Ativo' : 'Inativo'}]`;

        blocks.push({
          type: 'schedule',
          veiculoPlaca: horario.veiculoPlaca,
          veiculoModelo: horario.veiculoModelo,
          rotaNome: displayRoute,
          start,
          end,
          duration,
          tooltip,
          isGoing: dirInfo.isGoing,
          isActiveNow,
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
