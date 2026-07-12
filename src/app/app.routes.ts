import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./screens/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./screens/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./screens/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'rotas',
    redirectTo: 'linhas',
    pathMatch: 'full',
  },
  {
    path: 'linhas',
    loadComponent: () =>
      import('./screens/rotas/rotas.component').then((m) => m.RotasComponent),
  },
  {
    path: 'veiculos',
    loadComponent: () =>
      import('./screens/veiculos/veiculos.component').then(
        (m) => m.VeiculosComponent
      ),
  },
  {
    path: 'motoristas',
    loadComponent: () =>
      import('./screens/motorista/motorista.component').then(
        (m) => m.MotoristaComponent
      ),
  },
];
