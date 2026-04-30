import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardResponse } from '../../core/models/dashboard.models';
import { DashboardService } from '../../core/services/dashboard.service';
import { failureReasonLabel } from '../../shared/utils/failure-reason-label.util';
import { difficultyLabel } from '../../shared/utils/difficulty-label.util';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-mission-detail',
  standalone: true,
  imports: [
    CommonModule,
    AppButtonComponent,
    EmptyStateComponent,
    ErrorMessageComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    PageShellComponent
  ],
  templateUrl: './mission-detail.component.html',
  styleUrl: './mission-detail.component.css'
})
export class MissionDetailComponent implements OnInit {
  readonly missionWhyMap: Record<number, { why: string; benefit: string }> = {
    1: {
      why: 'Caminar sin mirar el celular reduce estímulos constantes y entrena atención sobre el entorno.',
      benefit: 'Más calma, más presencia y menos impulso de revisar pantalla.'
    },
    2: {
      why: 'Leer sin distracciones obliga a sostener atención durante más tiempo que el contenido corto.',
      benefit: 'Mejor concentración y mayor tolerancia al esfuerzo mental.'
    },
    3: {
      why: 'Sentarte sin hacer nada entrena tolerancia al aburrimiento, una habilidad debilitada por el scroll infinito.',
      benefit: 'Menos necesidad de estímulo constante.'
    },
    4: {
      why: 'Trabajar en una tarea pendiente sin redes fortalece el hábito de ejecutar aunque no haya recompensa inmediata.',
      benefit: 'Más control sobre tus decisiones y menos procrastinación.'
    },
    5: {
      why: 'Salir sin usar el celular rompe la asociación automática entre pausa y pantalla.',
      benefit: 'Más conexión con el entorno y menos dependencia del estímulo digital.'
    },
    6: {
      why: 'Escribir sobre tu consumo digital convierte un hábito automático en algo visible.',
      benefit: 'Mayor conciencia y mejores decisiones.'
    },
    7: {
      why: 'Observar activamente entrena atención voluntaria en lugar de atención capturada por algoritmos.',
      benefit: 'Más presencia y mejor control del foco.'
    },
    8: {
      why: 'Buscar un grupo local transforma intención en posibilidad concreta de acción social.',
      benefit: 'Más opciones reales fuera de la pantalla.'
    },
    9: {
      why: 'Guardar o contactar un grupo reduce fricción para actuar después.',
      benefit: 'Menos excusas y más probabilidad de salir.'
    },
    10: {
      why: 'El foco profundo entrena trabajo sostenido sin interrupciones rápidas.',
      benefit: 'Mejor productividad y mayor capacidad de concentración.'
    },
    11: {
      why: 'Hablar con alguien fuera de tu círculo rompe la comodidad pasiva y entrena exposición social.',
      benefit: 'Más confianza y menos aislamiento.'
    },
    12: {
      why: 'Pasar tiempo fuera sin contenido corto reduce la dependencia a recompensas inmediatas.',
      benefit: 'Más autonomía y menos ansiedad por revisar el celular.'
    },
    13: {
      why: 'Planear una actividad real convierte deseo abstracto en una acción concreta.',
      benefit: 'Más dirección y menos improvisación vacía.'
    },
    14: {
      why: 'Ejecutar una actividad fuera de casa cierra el ciclo: pasar de intención a experiencia real.',
      benefit: 'Más evidencia de que puedes actuar sin depender de la pantalla.'
    }
  };

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly dashboard = signal<DashboardResponse | null>(null);

  difficultyLabel = difficultyLabel;
  failureReasonLabel = failureReasonLabel;

  constructor(
    private readonly dashboardService: DashboardService,
    public readonly router: Router
  ) {}

  ngOnInit(): void {
    this.dashboardService.getToday().subscribe({
      next: (response) => this.dashboard.set(response),
      error: (error: Error) => this.errorMessage.set(error.message),
      complete: () => this.loading.set(false)
    });
  }

  missionWhy(dayNumber?: number): { why: string; benefit: string } {
    if (!dayNumber) {
      return {
        why: 'Esta misión busca reducir estímulos rápidos y reforzar acción real.',
        benefit: 'Más foco, más control y menos consumo pasivo.'
      };
    }

    return this.missionWhyMap[dayNumber] ?? {
      why: 'Esta misión busca reducir estímulos rápidos y reforzar acción real.',
      benefit: 'Más foco, más control y menos consumo pasivo.'
    };
  }
}
