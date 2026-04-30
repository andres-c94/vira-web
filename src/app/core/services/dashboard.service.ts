import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { DashboardResponse } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getToday(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.apiUrl}${API_ENDPOINTS.dashboard.today}`);
  }
}
