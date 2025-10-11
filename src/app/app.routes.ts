import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./screens/login/login.component').then((m) => m.LoginComponent),
  },
];
