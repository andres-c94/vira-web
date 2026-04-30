import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SuggestionsService } from '../../../core/services/suggestions.service';

@Component({
  selector: 'app-suggestion-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './suggestion-modal.component.html',
  styleUrl: './suggestion-modal.component.css'
})
export class SuggestionModalComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly suggestionsService = inject(SuggestionsService);
  readonly loading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    type: ['IDEA' as const, [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(800)]],
    email: ['', [Validators.email]]
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.suggestionsService.modalOpen()) {
      this.close();
    }
  }

  close(): void {
    this.suggestionsService.closeModal();
    this.errorMessage.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.suggestionsService
      .sendSuggestion({
        type: raw.type,
        message: raw.message.trim(),
        email: raw.email.trim() ? raw.email.trim() : null
      })
        .subscribe({
        next: () => {
          this.successMessage.set('Gracias. Esto ayuda a mejorar VIRA.');
          this.form.reset({
            type: 'IDEA',
            message: '',
            email: ''
          });
          this.form.markAsPristine();
        },
        error: () => {
          this.errorMessage.set('No se pudo enviar. Intenta de nuevo.');
        },
        complete: () => this.loading.set(false)
      });
  }
}
