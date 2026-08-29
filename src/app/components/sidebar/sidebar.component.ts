import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoginService } from '../../services/login.service';
import { User } from '../../models/userLiteResponse.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = true;
  @Input() showContent: boolean = false;
  @Input() username: string = '';
  @Input() companyName: string = 'Viação Gato Preto LTDA';
  @Input() companyLogo: string = 'assets/viacaoGatoPreto.png';
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  private userSubscription?: Subscription;
  private currentUser: User | null = null;

  constructor(
    private router: Router,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  get displayUsername(): string {
    const rawName =
      this.username?.trim() ||
      this.currentUser?.nome ||
      this.currentUser?.login ||
      'João';

    // Format to title case for first name or clean display
    const firstName = rawName.split(' ')[0];
    if (firstName.toUpperCase() === firstName) {
      return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }
    return firstName;
  }

  get displayCompanyName(): string {
    return (
      this.companyName ||
      this.currentUser?.operador?.razaoSocial ||
      'Viação Gato Preto LTDA'
    );
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  onToggle(): void {
    this.toggleSidebar.emit();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  onLogout(): void {
    this.loginService.logout();
    this.logout.emit();
    this.router.navigate(['/login']);
  }
}
