import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/graph', pathMatch: 'full' },
  { path: 'graph', loadComponent: () => import('./components/dependency-graph/dependency-graph.component').then(m => m.DependencyGraphComponent) },
  { path: '**', redirectTo: '/graph' }
];
