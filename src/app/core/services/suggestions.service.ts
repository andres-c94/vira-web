import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface SuggestionPayload {
  type: 'IDEA' | 'PROBLEM' | 'IMPROVEMENT' | 'OTHER';
  message: string;
  email?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SuggestionsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly modalOpenState = signal(false);

  readonly modalOpen = computed(() => this.modalOpenState());

  openModal(): void {
    this.modalOpenState.set(true);
  }

  closeModal(): void {
    this.modalOpenState.set(false);
  }

  sendSuggestion(payload: SuggestionPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}${API_ENDPOINTS.suggestions.create}`, payload);
  }
}
