import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
    data: { authMode: 'register' }
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
    data: { authMode: 'login' }
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
    data: { authMode: 'register' }
  },
  {
    path: 'programs',
    canActivate: [authGuard],
    loadComponent: () => import('./features/programs/programs.component').then((m) => m.ProgramsComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'mission',
    canActivate: [authGuard],
    loadComponent: () => import('./features/mission-detail/mission-detail.component').then((m) => m.MissionDetailComponent)
  },
  {
    path: 'mission/complete',
    canActivate: [authGuard],
    loadComponent: () => import('./features/complete-mission/complete-mission.component').then((m) => m.CompleteMissionComponent)
  },
  {
    path: 'mission/fail',
    canActivate: [authGuard],
    loadComponent: () => import('./features/fail-mission/fail-mission.component').then((m) => m.FailMissionComponent)
  },
  {
    path: 'progress',
    canActivate: [authGuard],
    loadComponent: () => import('./features/progress/progress.component').then((m) => m.ProgressComponent)
  },
  {
    path: 'actividad',
    canActivate: [authGuard],
    loadComponent: () => import('./features/activity/activity-page.component').then((m) => m.ActivityPageComponent)
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
