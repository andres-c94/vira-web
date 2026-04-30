import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ProgressSummary } from '../models/progress.models';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getSummary(): Observable<ProgressSummary> {
    return this.http.get<ProgressSummary>(`${this.apiUrl}${API_ENDPOINTS.progress.summary}`);
  }
}
