import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import {
  LeaderboardProfile,
  LeaderboardResponse,
  UpdateLeaderboardProfilePayload
} from '../models/leaderboard.models';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getMyLeaderboardProfile(): Observable<LeaderboardProfile> {
    return this.http.get<LeaderboardProfile>(`${this.apiUrl}${API_ENDPOINTS.leaderboard.me}`);
  }

  updateMyLeaderboardProfile(payload: UpdateLeaderboardProfilePayload): Observable<LeaderboardProfile> {
    return this.http.patch<LeaderboardProfile>(`${this.apiUrl}${API_ENDPOINTS.leaderboard.me}`, payload);
  }

  getGlobalLeaderboard(): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${this.apiUrl}${API_ENDPOINTS.leaderboard.global}`);
  }
}
