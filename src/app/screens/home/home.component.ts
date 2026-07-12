import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { DashboardService } from '../../services/dashboard.service';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  sidebarOpen: boolean = true;
  username: string = 'João';
  companyId: string = '33';
  companyName: string = 'Viação Gato Preto LTDA';
  companyLogo: string = 'assets/viacaoGatoPreto.png';
  showSidebarContent: boolean = false;
  showMainContent: boolean = false;

  stats: any = {
    motoristasAtivos: 0,
    veiculosAtivos: 0,
    linhasEmOperacao: 0,
    coberturaTotal: '0 km',
  };

  routesByDay: any[] = [];
  maxRoutesValue: number = 0;
  vehicleStatus: any[] = [];
  driversByShift: any[] = [];
  recentActivity: any[] = [];
  routesByHour: any[] = [];
  maxRoutesHourValue: number = 0;
  passengerCapacityByHour: any[] = [];
  maxPassengerCapacity: number = 0;
  vehiclesByRoute: any[] = [];
  maxVehiclesByRoute: number = 0;
  reserveVehiclesByHour: any[] = [];
  maxReserveVehicles: number = 0;
  vehicleIncidents: any[] = [];

  constructor(
    private dashboardService: DashboardService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    // Load user information
    this.loginService.currentUser.subscribe((user) => {
      if (user) {
        this.username = user.nome;
        this.companyName = user.operador?.razaoSocial || 'Viação Gato Preto LTDA';
      }
    });

    // Fetch dashboard stats & metrics from service
    this.dashboardService.getStats().subscribe((data) => (this.stats = data));

    this.dashboardService.getLinhasByDay().subscribe((data) => {
      this.routesByDay = data;
      this.maxRoutesValue = Math.max(...this.routesByDay.map((d) => d.value), 1);
    });

    this.dashboardService.getVehicleStatus().subscribe((data) => (this.vehicleStatus = data));
    this.dashboardService.getDriversByShift().subscribe((data) => (this.driversByShift = data));
    this.dashboardService.getRecentActivity().subscribe((data) => (this.recentActivity = data));

    this.dashboardService.getLinhasByHour().subscribe((data) => {
      this.routesByHour = data;
      this.maxRoutesHourValue = Math.max(...this.routesByHour.map((d) => d.value), 1);
    });

    this.dashboardService.getPassengerCapacityByHour().subscribe((data) => {
      this.passengerCapacityByHour = data;
      this.maxPassengerCapacity = Math.max(...this.passengerCapacityByHour.map((d) => d.value), 1);
    });

    this.dashboardService.getVehiclesByLinha().subscribe((data) => {
      this.vehiclesByRoute = data;
      this.maxVehiclesByRoute = Math.max(...this.vehiclesByRoute.map((r) => r.vehicles), 1);
    });

    this.dashboardService.getReserveVehiclesByHour().subscribe((data) => {
      this.reserveVehiclesByHour = data;
      this.maxReserveVehicles = Math.max(...this.reserveVehiclesByHour.map((d) => d.value), 1);
    });

    this.dashboardService.getVehicleIncidents().subscribe((data) => (this.vehicleIncidents = data));

    setTimeout(() => {
      this.showSidebarContent = true;
    }, 200);

    setTimeout(() => {
      this.showMainContent = true;
    }, 400);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  getIncidentTotal(): number {
    return this.vehicleIncidents.reduce(
      (sum, incident) => sum + incident.count,
      0
    );
  }
}

