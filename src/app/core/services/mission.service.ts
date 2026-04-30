import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { CompleteMissionPayload, FailMissionPayload, MissionExecution, RecordMoodPayload } from '../models/mission.models';

@Injectable({ providedIn: 'root' })
export class MissionService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  completeToday(payload: CompleteMissionPayload): Observable<MissionExecution> {
    return this.http.post<MissionExecution>(`${this.apiUrl}${API_ENDPOINTS.missions.complete}`, payload);
  }

  failToday(payload: FailMissionPayload): Observable<MissionExecution> {
    return this.http.post<MissionExecution>(`${this.apiUrl}${API_ENDPOINTS.missions.fail}`, payload);
  }

  recordMood(payload: RecordMoodPayload): Observable<unknown> {
    return this.http.post(`${this.apiUrl}${API_ENDPOINTS.missions.mood}`, payload);
  }
}
