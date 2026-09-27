import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { LoginService } from '../services/login.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private loginService: LoginService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.loginService.isAuthenticated()) {
      return true;
    }
    this.loginService.logout();
    return this.router.createUrlTree(['/login']);
  }
}
