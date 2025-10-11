import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  isTransitioning: boolean = false;

  constructor(private router: Router) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    console.log('Login clicked', {
      email: this.email,
      password: this.password,
    });

    this.isTransitioning = true;

    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 800);
  }
}
