import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Program } from '../../core/models/program.models';
import { ProgramService } from '../../core/services/program.service';
import { UserProgramService } from '../../core/services/user-program.service';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [
    CommonModule,
    ErrorMessageComponent,
    LoadingStateComponent,
    PageShellComponent
  ],
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.css'
})
export class ProgramsComponent implements OnInit {
  readonly betaTeasers: Record<string, string[]> = {
    'foco-real-21-dias': [
      'Bloque de 25 minutos sin interrupciones',
      'Lista de distracciones evitadas'
    ],
    'vida-activa-30-dias': [
      'Caminata exploratoria sin celular',
      'Buscar un lugar nuevo cerca de ti'
    ],
    'control-21-dias': [
      '10 minutos de aburrimiento voluntario',
      'Pausa consciente antes de desbloquear el celular'
    ]
  };

  readonly trainingMap: Record<string, string> = {
    'reset-dopamina-14-dias': 'Rompe el consumo automático y recupera foco.',
    'foco-real-21-dias': 'Entrenas trabajo profundo y reducción de interrupciones.',
    'vida-activa-30-dias': 'Entrenas movimiento, exploración y acción fuera de pantalla.',
    'control-21-dias': 'Entrenas control de impulsos y tolerancia al aburrimiento.'
  };

  readonly whyMap: Record<string, string> = {
    'reset-dopamina-14-dias': 'Cambia scroll pasivo por acciones reales diarias.',
    'foco-real-21-dias': 'Refuerza bloques largos sin recompensa inmediata.',
    'vida-activa-30-dias': 'Reduce fricción para salir y explorar tu entorno.',
    'control-21-dias': 'Reduce la dependencia a recompensas inmediatas.'
  };

  readonly programs = signal<Program[]>([]);
  readonly loading = signal(true);
  readonly startLoading = signal<string | null>(null);
  readonly interestLoading = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly feedbackByProgramId = signal<Record<string, string>>({});
  readonly catalogTitle = signal('Programas');
  readonly catalogSubtitle = signal('Elige cómo quieres seguir avanzando.');
  readonly activeProgramStatus = signal<'NONE' | 'ACTIVE' | 'COMPLETED' | 'UNKNOWN'>('UNKNOWN');

  constructor(
    private readonly programService: ProgramService,
    private readonly userProgramService: UserProgramService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    forkJoin({
      programs: this.programService.getPrograms(),
      activeProgram: this.userProgramService.getActiveProgram().pipe(
        catchError(() => of({ userProgram: null, message: 'No active program' }))
      )
    }).subscribe({
      next: ({ programs, activeProgram }) => {
        this.programs.set(programs);
        this.syncCatalogContext(activeProgram.userProgram?.status ?? null);
      },
      error: (error: Error) => this.errorMessage.set(error.message),
      complete: () => this.loading.set(false)
    });
  }

  startProgram(programId: string): void {
    this.startLoading.set(programId);
    this.errorMessage.set(null);

    this.userProgramService.startProgram(programId).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (error: Error) => {
        if (error.message.includes('activo') || error.message.toLowerCase().includes('active program')) {
          this.errorMessage.set('Ya tienes un programa activo');
          void this.router.navigate(['/dashboard']);
          return;
        }
        this.errorMessage.set(error.message);
        this.startLoading.set(null);
      },
      complete: () => this.startLoading.set(null)
    });
  }

  goToDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }

  primaryProgram(): Program | null {
    return this.programs().find((program) => program.accessType === 'FREE') ?? null;
  }

  lockedPrograms(): Program[] {
    return this.programs().filter((program) => program.accessType === 'LOCKED_BETA');
  }

  enterProgram(program: Program): void {
    if (program.accessType === 'FREE') {
      if (this.isFreeProgramActive(program)) {
        this.goToDashboard();
        return;
      }

      this.startProgram(program.id);
      return;
    }

    this.registerInterest(program.id);
  }

  canStart(program: Program): boolean {
    return program.accessType === 'FREE' && this.activeProgramStatus() !== 'ACTIVE';
  }

  isFreeProgramActive(program: Program): boolean {
    return program.accessType === 'FREE' && this.activeProgramStatus() === 'ACTIVE';
  }

  isFreeProgramCompleted(program: Program): boolean {
    return program.accessType === 'FREE' && this.activeProgramStatus() === 'COMPLETED';
  }

  teasersFor(program: Program): string[] {
    return this.betaTeasers[program.slug] ?? [];
  }

  trainingFor(program: Program): string {
    return this.trainingMap[program.slug] ?? 'Acción real, menos estímulo rápido y más foco sostenido.';
  }

  whyFor(program: Program): string {
    return this.whyMap[program.slug] ?? 'Convierte intención en una acción concreta.';
  }

  registerInterest(programId: string): void {
    this.interestLoading.set(programId);
    this.errorMessage.set(null);
    this.feedbackByProgramId.update((current) => ({ ...current, [programId]: '' }));

    this.programService.registerInterest(programId).subscribe({
      next: (response) => {
        this.feedbackByProgramId.update((current) => ({
          ...current,
          [programId]: 'Listo. Te avisaremos cuando esté disponible.'
        }));
        this.programs.update((programs) =>
          programs.map((program) =>
            program.id === response.programId
              ? { ...program, betaInterestCount: response.betaInterestCount }
              : program
          )
        );
      },
      error: (error: Error) => {
        const message = error.message.toLowerCase().includes('interest already registered')
          ? 'Ya registraste tu interés.'
          : error.message;
        this.feedbackByProgramId.update((current) => ({
          ...current,
          [programId]: message
        }));
        this.interestLoading.set(null);
      },
      complete: () => this.interestLoading.set(null)
    });
  }

  private syncCatalogContext(status: 'ACTIVE' | 'COMPLETED' | null): void {
    if (status === 'ACTIVE') {
      this.activeProgramStatus.set('ACTIVE');
      this.catalogTitle.set('Programas');
      this.catalogSubtitle.set('Ya estás en un programa. Estos son los siguientes niveles disponibles en beta.');
      return;
    }

    if (status === 'COMPLETED') {
      this.activeProgramStatus.set('COMPLETED');
      this.catalogTitle.set('Siguiente nivel disponible');
      this.catalogSubtitle.set('Terminaste el primer reto. Los próximos niveles se están afinando con usuarios reales.');
      return;
    }

    this.activeProgramStatus.set('NONE');
    this.catalogTitle.set('Elige un programa para comenzar');
    this.catalogSubtitle.set('Empieza con una misión real. Nada de feeds, likes o ruido.');
  }
}
