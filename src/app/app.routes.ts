import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'graph', loadComponent: () => import('./components/dependency-graph/dependency-graph.component').then(m => m.DependencyGraphComponent) },
  { path: 'service/new', loadComponent: () => import('./components/service-form/service-form.component').then(m => m.ServiceFormComponent) },
  { path: 'service/:id/edit', loadComponent: () => import('./components/service-form/service-form.component').then(m => m.ServiceFormComponent) },
  { path: '**', redirectTo: '/dashboard' }
];
