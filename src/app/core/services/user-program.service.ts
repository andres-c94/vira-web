import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ActiveUserProgramResponse, UserProgram } from '../models/program.models';

@Injectable({ providedIn: 'root' })
export class UserProgramService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  startProgram(programId: string): Observable<UserProgram> {
    return this.http.post<UserProgram>(`${this.apiUrl}${API_ENDPOINTS.userPrograms.start}`, { programId });
  }

  getActiveProgram(): Observable<ActiveUserProgramResponse> {
    return this.http.get<unknown>(`${this.apiUrl}${API_ENDPOINTS.userPrograms.active}`).pipe(
      map((response) => {
        const value = response as Record<string, unknown> | null;

        if (value?.['program'] === null) {
          return {
            userProgram: null,
            message: String(value['message'] ?? 'No active program')
          };
        }

        if (value && 'id' in value) {
          const userProgram = value as unknown as UserProgram;
          return {
            userProgram,
            message: typeof value['message'] === 'string' ? value['message'] : undefined
          };
        }

        return {
          userProgram: null,
          message: 'No active program'
        };
      })
    );
  }
}
