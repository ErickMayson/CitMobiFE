import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../models/userLiteResponse.model';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  login: string = '';
  senha: string = '';
  showPassword: boolean = false;
  isTransitioning: boolean = false;
  errorMessage: string = '';

  constructor(private loginService: LoginService, private router: Router) {
    this.loginService.currentUser.subscribe((user: User | null) => {
      if (user) {
        this.router.navigate(['/home'], { replaceUrl: true });
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    this.isTransitioning = true;
    this.errorMessage = '';

    this.loginService.login(this.login, this.senha).subscribe({
      next: (user: User) => {
        setTimeout(() => {
          this.router.navigate(['/home'], { replaceUrl: true });
        }, 800);
      },
      error: (err) => {
        this.errorMessage = 'Login failed. Check your credentials.';
        this.isTransitioning = false;
      },
      complete: () => {},
    });
  }
}
